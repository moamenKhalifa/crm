"""Architectural guard: protects the Onion boundary before business code lands.

Walks the Identity & Access module's `domain/` and `application/` packages
and fails if any file imports `sqlalchemy`, `fastapi`, or the module's own
`infrastructure/` package.
"""

import ast
from pathlib import Path

FORBIDDEN_TOP_LEVEL_MODULES = {"sqlalchemy", "fastapi"}
FORBIDDEN_PREFIX = "app.modules.identity_access.infrastructure"

MODULE_ROOT = Path(__file__).resolve().parents[1] / "app" / "modules" / "identity_access"
GUARDED_LAYERS = [MODULE_ROOT / "domain", MODULE_ROOT / "application"]


def _imported_module_names(tree: ast.Module) -> list[str]:
    names: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            names.extend(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            names.append(node.module)
    return names


def test_no_forbidden_imports_in_domain_and_application():
    violations: list[str] = []

    for layer_root in GUARDED_LAYERS:
        for path in layer_root.rglob("*.py"):
            tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
            for name in _imported_module_names(tree):
                top_level = name.split(".")[0]
                if top_level in FORBIDDEN_TOP_LEVEL_MODULES or name.startswith(FORBIDDEN_PREFIX):
                    violations.append(f"{path.relative_to(MODULE_ROOT.parent.parent.parent)}: {name}")

    assert not violations, f"Forbidden imports found in domain/application layers: {violations}"
