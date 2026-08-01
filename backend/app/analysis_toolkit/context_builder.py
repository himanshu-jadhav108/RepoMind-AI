import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from app.core.logging import logger


class ContextBuilder:
    """
    Utility for building real source-code context for AI agents by reading,
    validating, and truncating target repository files.
    """

    def __init__(self, max_lines_per_file: int = 300, max_bytes_per_file: int = 50000) -> None:
        self.max_lines_per_file = max_lines_per_file
        self.max_bytes_per_file = max_bytes_per_file

    def read_file_content(self, repo_path: str, relative_path: str) -> Optional[str]:
        """
        Reads source code for a relative file path inside repo_path.
        Returns string content formatted or None if unreadable/binary/missing.
        """
        try:
            full_path = Path(repo_path) / relative_path
            if not full_path.exists() or not full_path.is_file():
                return None

            # Skip binary files or files > 1MB
            file_size = full_path.stat().st_size
            if file_size > 1_000_000:
                logger.warning(f"[ContextBuilder] Skipping oversized file '{relative_path}' ({file_size} bytes)")
                return None

            with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read(self.max_bytes_per_file + 1024)

            # Check for binary null bytes
            if "\x00" in content[:1024]:
                logger.debug(f"[ContextBuilder] Skipping binary file '{relative_path}'")
                return None

            lines = content.splitlines()
            if len(lines) > self.max_lines_per_file:
                lines = lines[: self.max_lines_per_file]
                lines.append(f"\n# [... TRUNCATED AT LINE {self.max_lines_per_file} FOR ANALYSIS ...] \n")

            return "\n".join(lines)

        except Exception as e:
            logger.warning(f"[ContextBuilder] Failed to read file '{relative_path}': {e}")
            return None

    def build_file_context(
        self, repo_path: str, target_files: List[str], max_files: int = 5
    ) -> Tuple[Dict[str, str], List[str]]:
        """
        Builds a map of {relative_path: content_string} for target files.
        Returns (contents_map, list_of_skipped_or_failed_files).
        """
        contents_map: Dict[str, str] = {}
        skipped_files: List[str] = []

        if not repo_path or not os.path.exists(repo_path):
            return contents_map, target_files

        for file_path in target_files[:max_files]:
            clean_path = file_path.strip().lstrip("/").lstrip("\\")
            content = self.read_file_content(repo_path, clean_path)
            if content:
                contents_map[clean_path] = content
            else:
                skipped_files.append(clean_path)

        return contents_map, skipped_files
