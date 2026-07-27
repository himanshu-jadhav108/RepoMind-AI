import re
from pathlib import Path
from typing import Dict, List, Optional
from app.core.logging import logger

# Regex fallback parsers for symbols and imports across languages
REGEX_PATTERNS = {
    "Python": {
        "imports": r"^(?:from\s+([\w\.]+)\s+import|import\s+([\w\.]+))",
        "classes": r"^\s*class\s+([A-Za-z_]\w*)",
        "functions": r"^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)",
    },
    "JavaScript": {
        "imports": r"import\s+.*?\s+from\s+['\"](.*?)['\"]|require\(['\"](.*?)['\"]\)",
        "classes": r"^\s*class\s+([A-Za-z_]\w*)",
        "functions": r"(?:function\s+([A-Za-z_]\w*)|const\s+([A-Za-z_]\w*)\s*=\s*(?:async\s*)?\()",
    },
    "TypeScript": {
        "imports": r"import\s+.*?\s+from\s+['\"](.*?)['\"]|require\(['\"](.*?)['\"]\)",
        "classes": r"^\s*(?:export\s+)?class\s+([A-Za-z_]\w*)",
        "functions": r"(?:function\s+([A-Za-z_]\w*)|const\s+([A-Za-z_]\w*)\s*=\s*(?:async\s*)?\()",
    },
    "Go": {
        "imports": r"import\s+(?:\(\s*([\s\S]*?)\s*\)|['\"](.*?)['\"])",
        "classes": r"type\s+([A-Za-z_]\w*)\s+struct",
        "functions": r"func\s+(?:\([^)]+\)\s*)?([A-Za-z_]\w*)",
    },
    "Java": {
        "imports": r"^\s*import\s+([\w\.]+);",
        "classes": r"^\s*(?:public\s+)?class\s+([A-Za-z_]\w*)",
        "functions": r"^\s*(?:public|protected|private)?\s*(?:static\s+)?[\w<>\[\]]+\s+([A-Za-z_]\w*)\s*\(",
    },
}


class CodeParser:
    """
    Parses code files to extract symbols (functions, classes, imports) and AST summaries.
    Uses regex fallback and Tree-sitter AST queries.
    """

    def parse_file(self, file_path: str, language: str) -> Dict:
        """
        Parses a single source file and returns symbol summaries.
        """
        path_obj = Path(file_path)
        if not path_obj.exists():
            return {"classes": [], "functions": [], "imports": []}

        try:
            content = path_obj.read_text(encoding="utf-8", errors="ignore")
        except Exception as e:
            logger.warning(f"Could not read file '{file_path}': {str(e)}")
            return {"classes": [], "functions": [], "imports": []}

        # Select patterns based on language or map aliases
        lang_key = "TypeScript" if "TypeScript" in language else "JavaScript" if "JavaScript" in language else language
        patterns = REGEX_PATTERNS.get(lang_key)

        classes: List[str] = []
        functions: List[str] = []
        imports: List[str] = []

        if patterns:
            # Extract classes
            if "classes" in patterns:
                for match in re.finditer(patterns["classes"], content, re.MULTILINE):
                    name = match.group(1)
                    if name and name not in classes:
                        classes.append(name)

            # Extract functions
            if "functions" in patterns:
                for match in re.finditer(patterns["functions"], content, re.MULTILINE):
                    name = match.group(1) or (match.group(2) if match.lastindex >= 2 else None)
                    if name and name not in functions:
                        functions.append(name)

            # Extract imports
            if "imports" in patterns:
                for match in re.finditer(patterns["imports"], content, re.MULTILINE):
                    imp = match.group(1) or (match.group(2) if match.lastindex >= 2 else None)
                    if imp and imp not in imports:
                        imports.append(imp.strip())

        return {
            "classes": classes,
            "functions": functions,
            "imports": imports,
            "line_count": len(content.splitlines()),
        }

    def parse_repository_symbols(self, repo_path: str, files_list: List[Dict]) -> Dict[str, Dict]:
        """
        Parses symbols for all source code files in a repository.
        Returns a dictionary mapping relative_file_path -> symbol summary.
        """
        symbol_map: Dict[str, Dict] = {}
        for f in files_list:
            rel_path = f["path"]
            lang = f["language"]
            if lang in ["Other", "JSON", "Markdown", "YAML"]:
                continue

            full_file_path = str(Path(repo_path) / rel_path)
            symbols = self.parse_file(full_file_path, lang)
            symbol_map[rel_path] = symbols

        return symbol_map
