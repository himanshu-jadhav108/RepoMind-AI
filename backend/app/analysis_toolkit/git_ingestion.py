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
        if not repo_url or not GITHUB_URL_PATTERN.match(repo_url.strip()):
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
        self.validate_repo_url(repo_url)

        temp_dir = tempfile.mkdtemp(prefix="repomind_clone_", dir=self.workspace_base_dir)
        logger.info(f"Cloning repository '{repo_url}' into '{temp_dir}' (Timeout: {self.clone_timeout_sec}s)")

        def _do_clone():
            return Repo.clone_from(repo_url, temp_dir, depth=1)

        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(_do_clone)
                repo = future.result(timeout=self.clone_timeout_sec)

            commit_sha = repo.head.commit.hexsha if repo.head else "unknown"

            # Enforce max directory size check
            self.check_repo_size(temp_dir)

            return temp_dir, commit_sha
        except concurrent.futures.TimeoutError:
            self.cleanup(temp_dir)
            logger.error(f"Clone timed out after {self.clone_timeout_sec} seconds for '{repo_url}'")
            raise UnprocessableRepoException(
                f"Cloning repository '{repo_url}' exceeded the {self.clone_timeout_sec}s wall-clock timeout."
            )
        except Exception as e:
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
    def cleanup(repo_path: str) -> None:
        """Removes temporary repository clone directory safely."""
        if repo_path and os.path.exists(repo_path):
            try:
                shutil.rmtree(repo_path, ignore_errors=True)
                logger.info(f"Cleaned up clone workspace: '{repo_path}'")
            except Exception as e:
                logger.warning(f"Failed to cleanup temp workspace '{repo_path}': {str(e)}")
