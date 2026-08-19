import concurrent.futures
import os
import re
import shutil
import tempfile
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from git import Repo
from git.exc import GitCommandError, GitError

from app.core.config import settings
from app.core.exceptions import RepositoryNotFoundException, UnprocessableRepoException
from app.core.logging import logger

# Strict regex pattern for public GitHub repository HTTPS URLs to prevent SSRF
GITHUB_URL_PATTERN = re.compile(
    r"^https:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(?:\.git)?\/?$"
)


def clean_github_url(repo_url: str) -> str:
    """Sanitizes raw input GitHub URLs, stripping tree/blob paths, query strings, and whitespace."""
    if not repo_url:
        return repo_url
    url = repo_url.strip().split("?")[0].split("#")[0]
    match = re.search(r"github\.com/([^/]+)/([^/]+)", url, re.IGNORECASE)
    if match:
        owner = match.group(1)
        repo_name = match.group(2)
        if repo_name.endswith(".git"):
            repo_name = repo_name[:-4]
        return f"https://github.com/{owner}/{repo_name}"
    return url


LANGUAGE_EXTENSIONS = {
    ".py": "Python",
    ".js": "JavaScript",
    ".ts": "TypeScript",
    ".tsx": "TypeScript (React)",
    ".jsx": "JavaScript (React)",
    ".go": "Go",
    ".java": "Java",
    ".cpp": "C++",
    ".c": "C",
    ".h": "C/C++ Header",
    ".rs": "Rust",
    ".pyi": "Python Stub",
    ".json": "JSON",
    ".md": "Markdown",
    ".yml": "YAML",
    ".yaml": "YAML",
    ".dockerfile": "Dockerfile",
}


def _is_permanent_clone_error(err_str: str) -> bool:
    """
    Detects errors that will never succeed on retry (404, private repo, auth failure, invalid repo).
    """
    err_lower = err_str.lower()
    permanent_patterns = [
        "not found",
        "repository not found",
        "could not read username",
        "authentication failed",
        "permission denied",
        "invalid repository",
        "does not exist",
        "remote error: uploadpack: not our ref",
        "fatal: remote error: access denied",
    ]
    return any(p in err_lower for p in permanent_patterns)


def _is_transient_clone_error(err_str: str) -> bool:
    """
    Detects transient network / socket / server-side errors that should be retried.
    """
    err_lower = err_str.lower()
    transient_patterns = [
        "could not resolve host",
        "failed to connect",
        "connection timed out",
        "operation timed out",
        "connection reset",
        "connection refused",
        "early eof",
        "hung up unexpectedly",
        "unexpected disconnect",
        "rpc failed",
        "network is unreachable",
        "temporary failure in name resolution",
        "ssl",
        "tls",
        "gnutls",
        "handshake",
        "502",
        "503",
        "504",
        "bad gateway",
        "service unavailable",
    ]
    return any(p in err_lower for p in transient_patterns)


class GitIngestionService:
    """
    Handles cloning GitHub repositories using GitPython, walking the file tree,
    and classifying file types and language mix.
    Includes security hardening: URL validation (SSRF prevention), wall-clock timeouts,
    transient retry logic, and max repository size limits.
    """

    def __init__(
        self,
        workspace_base_dir: Optional[str] = None,
        clone_timeout_sec: float = 60.0,
        max_repo_size_bytes: Optional[int] = None,
        max_files_to_analyze: Optional[int] = None,
    ) -> None:
        self.workspace_base_dir = workspace_base_dir or tempfile.gettempdir()
        self.clone_timeout_sec = clone_timeout_sec
        default_size_bytes = getattr(settings, "REPO_MAX_SIZE_MB", 75) * 1024 * 1024
        self.max_repo_size_bytes = max_repo_size_bytes if max_repo_size_bytes is not None else default_size_bytes
        self.max_files_to_analyze = max_files_to_analyze if max_files_to_analyze is not None else getattr(settings, "MAX_FILES_TO_ANALYZE", 3000)
        self._scan_cache: Dict[str, Dict] = {}

    def validate_repo_url(self, repo_url: str) -> None:
        """Validates that repo_url matches standard public GitHub HTTPS format."""
        target_url = clean_github_url(repo_url)
        if not target_url or not GITHUB_URL_PATTERN.match(target_url):
            raise UnprocessableRepoException(
                f"Invalid repository URL format: '{repo_url}'. Only public GitHub HTTPS URLs (e.g. https://github.com/owner/repo) are allowed."
            )

    def _walk_repository(self, repo_path: str) -> Dict:
        """
        Executes a single os.walk pass to sum file sizes and build file metadata.
        Enforces max_repo_size_bytes early mid-walk and caps analyzed file count.
        """
        if repo_path in self._scan_cache:
            return self._scan_cache[repo_path]

        path_obj = Path(repo_path)
        if not path_obj.exists():
            raise UnprocessableRepoException(f"Repository path '{repo_path}' does not exist.")

        files_list: List[Dict] = []
        language_counts: Dict[str, int] = {}
        total_size_bytes = 0

        # Directories to ignore during scanning
        ignored_dirs = {".git", "node_modules", ".venv", "venv", "__pycache__", "dist", "build", ".next", "vendor", "target", ".cache"}

        for root, dirs, files in os.walk(repo_path):
            # Exclude ignored directories in-place
            dirs[:] = [d for d in dirs if d not in ignored_dirs and not d.startswith(".")]

            for file_name in files:
                full_path = Path(root) / file_name
                rel_path = full_path.relative_to(path_obj).as_posix()

                ext = full_path.suffix.lower()
                language = LANGUAGE_EXTENSIONS.get(ext, "Other")
                language_counts[language] = language_counts.get(language, 0) + 1

                try:
                    file_size = full_path.stat().st_size
                except OSError:
                    file_size = 0

                total_size_bytes += file_size

                if total_size_bytes > self.max_repo_size_bytes:
                    actual_mb = total_size_bytes / (1024 * 1024)
                    limit_mb = self.max_repo_size_bytes // (1024 * 1024)
                    raise UnprocessableRepoException(
                        f"Repository size ({actual_mb:.1f} MB) exceeds maximum allowed limit of {limit_mb} MB. "
                        f"Please analyze a smaller repository."
                    )

                # Cap files_list at max_files_to_analyze (Option b: forgiving cap after noise filter)
                if len(files_list) < self.max_files_to_analyze:
                    files_list.append(
                        {
                            "path": rel_path,
                            "name": file_name,
                            "extension": ext,
                            "language": language,
                            "size_bytes": file_size,
                        }
                    )

        if not files_list:
            raise UnprocessableRepoException(f"Repository at '{repo_path}' contains no analyzable files.")

        if len(files_list) == self.max_files_to_analyze:
            logger.warning(
                f"Repository file count exceeded cap of {self.max_files_to_analyze}. "
                f"Analyzed top {self.max_files_to_analyze} files."
            )

        primary_language = max(language_counts, key=language_counts.get) if language_counts else "Unknown"

        result = {
            "total_files": len(files_list),
            "total_size_bytes": total_size_bytes,
            "primary_language": primary_language,
            "language_breakdown": language_counts,
            "files": files_list,
        }
        self._scan_cache[repo_path] = result
        return result

    def check_repo_size(self, repo_path: str) -> int:
        """Calculates total size of cloned directory and verifies size and file-count limits."""
        res = self._walk_repository(repo_path)
        return res["total_size_bytes"]

    def clone_repository(
        self,
        repo_url: str,
        max_retries: int = 1,
        retry_delay_sec: float = 2.0,
    ) -> Tuple[str, str]:
        """
        Clones a public repo into a temporary workspace directory with security validation,
        bounded transient retry logic (2 total attempts with 2s delay), timeout handling,
        and size limit checks. Returns (cloned_path, commit_sha).
        """
        target_url = clean_github_url(repo_url)
        self.validate_repo_url(target_url)

        max_attempts = 1 + max(0, max_retries)

        for attempt in range(1, max_attempts + 1):
            temp_dir = None
            try:
                temp_dir = tempfile.mkdtemp(prefix="repomind_clone_", dir=self.workspace_base_dir)
                logger.info(
                    f"Cloning repository '{target_url}' (Attempt {attempt}/{max_attempts}, Timeout: {self.clone_timeout_sec}s)"
                )

                def _do_clone():
                    return Repo.clone_from(target_url, temp_dir, depth=1, single_branch=True)

                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(_do_clone)
                    repo = future.result(timeout=self.clone_timeout_sec)

                commit_sha = repo.head.commit.hexsha if repo and repo.head else "unknown"

                # Enforce max directory size check (single-pass walk)
                self.check_repo_size(temp_dir)

                return temp_dir, commit_sha

            except concurrent.futures.TimeoutError:
                if temp_dir:
                    self.cleanup(temp_dir)
                logger.error(
                    f"Clone timed out after {self.clone_timeout_sec}s for '{repo_url}' (Attempt {attempt}/{max_attempts})"
                )
                if attempt < max_attempts:
                    logger.info(f"Retrying clone in {retry_delay_sec}s...")
                    time.sleep(retry_delay_sec)
                    continue
                raise UnprocessableRepoException(
                    f"Cloning repository '{repo_url}' exceeded the {self.clone_timeout_sec}s wall-clock timeout."
                )

            except Exception as e:
                if temp_dir:
                    self.cleanup(temp_dir)

                if isinstance(e, UnprocessableRepoException):
                    # Size check failure or URL format error — never retry
                    raise e

                raw_err_msg = ""
                if isinstance(e, GitCommandError):
                    raw_err_msg = str(e.stderr) if e.stderr else str(e)
                else:
                    raw_err_msg = str(e)

                # Branch 1: Permanent failure (404 / Private / Auth / Bad URL) -> Fail fast without retrying
                if _is_permanent_clone_error(raw_err_msg):
                    logger.error(f"Clone failed with permanent repository error for '{repo_url}': {raw_err_msg}")
                    raise RepositoryNotFoundException(
                        message=f"Repository '{repo_url}' was not found or is private. Please ensure the repository is public and the URL is correct.",
                        details={"raw_error": raw_err_msg},
                    )

                # Branch 2: Transient network/connection error -> Retry if attempts remain
                if attempt < max_attempts and (
                    _is_transient_clone_error(raw_err_msg) or isinstance(e, (GitError, OSError, ConnectionError))
                ):
                    logger.warning(
                        f"Git clone attempt {attempt}/{max_attempts} for '{target_url}' encountered transient network issue ({raw_err_msg}). Retrying in {retry_delay_sec}s..."
                    )
                    time.sleep(retry_delay_sec)
                    continue

                # Branch 3: All retries exhausted or non-retryable error
                logger.error(f"Failed to clone repository '{repo_url}' after {attempt} attempt(s): {raw_err_msg}")
                if _is_transient_clone_error(raw_err_msg):
                    raise UnprocessableRepoException(
                        f"Unable to reach GitHub to clone '{repo_url}' due to network/connectivity issues after {attempt} attempt(s). Please try again in a few moments."
                    )
                else:
                    raise RepositoryNotFoundException(
                        message=f"Failed to clone repository '{repo_url}'. Ensure the URL is valid, public, and accessible.",
                        details={"raw_error": raw_err_msg},
                    )

    def scan_repository(self, repo_path: str) -> Dict:
        """
        Walks the repository directory tree and gathers file statistics and language breakdown.
        """
        return self._walk_repository(repo_path)

    @staticmethod
    def read_file_lines(
        repo_path: str,
        relative_file_path: str,
        line_start: int = 1,
        line_end: int = 60,
        max_lines: int = 400,
    ) -> str:
        """
        Safely reads a bounded line range from a file inside an already-cloned repo.
        Guards against path traversal (e.g. '../../etc/passwd') by resolving the final
        path and confirming it stays within repo_path. Returns "" if unreadable so
        callers can fall back gracefully instead of crashing the request.
        """
        base = Path(repo_path).resolve()
        target = (base / relative_file_path).resolve()

        # Path traversal guard: target must remain inside the cloned repo root.
        if base not in target.parents and target != base:
            logger.warning(f"[read_file_lines] Rejected out-of-tree path: '{relative_file_path}'")
            return ""

        if not target.exists() or not target.is_file():
            logger.warning(f"[read_file_lines] File not found: '{target}'")
            return ""

        # Guard against binary/huge files.
        try:
            if target.stat().st_size > 2_000_000:
                return ""
            text = target.read_text(encoding="utf-8", errors="ignore")
        except OSError as e:
            logger.warning(f"[read_file_lines] Failed to read '{target}': {e}")
            return ""

        lines = text.splitlines()
        if not lines:
            return ""

        start_idx = max(0, line_start - 1)
        end_idx = min(len(lines), max(start_idx + 1, line_end))
        # Cap total lines returned regardless of requested range, to bound LLM token cost.
        if end_idx - start_idx > max_lines:
            end_idx = start_idx + max_lines

        return "\n".join(lines[start_idx:end_idx])

    def cleanup(self, repo_path: str) -> None:
        """Removes temporary repository clone directory safely and clears scan cache."""
        if repo_path:
            self._scan_cache.pop(repo_path, None)
            if os.path.exists(repo_path):
                try:
                    shutil.rmtree(repo_path, ignore_errors=True)
                    logger.info(f"Cleaned up clone workspace: '{repo_path}'")
                except Exception as e:
                    logger.warning(f"Failed to cleanup temp workspace '{repo_path}': {str(e)}")
