import concurrent.futures
import os
import re
import shutil
import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from git import Repo

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


class GitIngestionService:
    """
    Handles cloning GitHub repositories using GitPython, walking the file tree,
    and classifying file types and language mix.
    Includes security hardening: URL validation (SSRF prevention), wall-clock timeouts,
    and max repository size limits.
    """

    def __init__(
        self,
        workspace_base_dir: Optional[str] = None,
        clone_timeout_sec: float = 60.0,
        max_repo_size_bytes: int = 500 * 1024 * 1024,
    ) -> None:
        self.workspace_base_dir = workspace_base_dir or tempfile.gettempdir()
        self.clone_timeout_sec = clone_timeout_sec
        self.max_repo_size_bytes = max_repo_size_bytes

    def validate_repo_url(self, repo_url: str) -> None:
        """Validates that repo_url matches standard public GitHub HTTPS format."""
        target_url = clean_github_url(repo_url)
        if not target_url or not GITHUB_URL_PATTERN.match(target_url):
            raise UnprocessableRepoException(
                f"Invalid repository URL format: '{repo_url}'. Only public GitHub HTTPS URLs (e.g. https://github.com/owner/repo) are allowed."
            )

    def check_repo_size(self, repo_path: str) -> int:
        """Calculates total size of cloned directory and verifies it is under max_repo_size_bytes."""
        total_size = 0
        for root, _, files in os.walk(repo_path):
            for f in files:
                try:
                    total_size += os.path.getsize(os.path.join(root, f))
                except OSError:
                    pass
        if total_size > self.max_repo_size_bytes:
            mb_limit = self.max_repo_size_bytes // (1024 * 1024)
            mb_actual = total_size // (1024 * 1024)
            raise UnprocessableRepoException(
                f"Repository size ({mb_actual} MB) exceeds maximum allowed threshold of {mb_limit} MB."
            )
        return total_size

    def clone_repository(self, repo_url: str) -> Tuple[str, str]:
        """
        Clones a public repo into a temporary workspace directory with security validation,
        timeout handling, and size limit checks. Returns (cloned_path, commit_sha).
        """
        target_url = clean_github_url(repo_url)
        self.validate_repo_url(target_url)

        temp_dir = None
        try:
            temp_dir = tempfile.mkdtemp(prefix="repomind_clone_", dir=self.workspace_base_dir)
            logger.info(f"Cloning repository '{target_url}' into '{temp_dir}' (Timeout: {self.clone_timeout_sec}s)")

            def _do_clone():
                return Repo.clone_from(target_url, temp_dir, depth=1, single_branch=True)

            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(_do_clone)
                repo = future.result(timeout=self.clone_timeout_sec)

            commit_sha = repo.head.commit.hexsha if repo and repo.head else "unknown"

            # Enforce max directory size check
            self.check_repo_size(temp_dir)

            return temp_dir, commit_sha
        except concurrent.futures.TimeoutError:
            if temp_dir:
                self.cleanup(temp_dir)
            logger.error(f"Clone timed out after {self.clone_timeout_sec} seconds for '{repo_url}'")
            raise UnprocessableRepoException(
                f"Cloning repository '{repo_url}' exceeded the {self.clone_timeout_sec}s wall-clock timeout."
            )
        except Exception as e:
            if temp_dir:
                self.cleanup(temp_dir)
            if isinstance(e, UnprocessableRepoException):
                raise e
            logger.error(f"Failed to clone repository '{repo_url}': {str(e)}")
            raise RepositoryNotFoundException(
                message=f"Failed to clone repository '{repo_url}'. Ensure URL is public and valid.",
                details={"raw_error": str(e)},
            )

    def scan_repository(self, repo_path: str) -> Dict:
        """
        Walks the repository directory tree and gathers file statistics and language breakdown.
        """
        path_obj = Path(repo_path)
        if not path_obj.exists():
            raise UnprocessableRepoException(f"Repository path '{repo_path}' does not exist.")

        files_list: List[Dict] = []
        language_counts: Dict[str, int] = {}
        total_size_bytes = 0

        # Directories to ignore during scanning
        ignored_dirs = {".git", "node_modules", ".venv", "venv", "__pycache__", "dist", "build", ".next"}

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

        primary_language = max(language_counts, key=language_counts.get) if language_counts else "Unknown"

        return {
            "total_files": len(files_list),
            "total_size_bytes": total_size_bytes,
            "primary_language": primary_language,
            "language_breakdown": language_counts,
            "files": files_list,
        }

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

    @staticmethod
    def cleanup(repo_path: str) -> None:
        """Removes temporary repository clone directory safely."""
        if repo_path and os.path.exists(repo_path):
            try:
                shutil.rmtree(repo_path, ignore_errors=True)
                logger.info(f"Cleaned up clone workspace: '{repo_path}'")
            except Exception as e:
                logger.warning(f"Failed to cleanup temp workspace '{repo_path}': {str(e)}")
