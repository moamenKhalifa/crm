import pytest

from app.modules.identity_access.domain.value_objects.role_name import RoleName


def test_normalises_case_and_whitespace():
    assert str(RoleName("  Admin  ")) == "admin"


def test_rejects_empty_string():
    with pytest.raises(ValueError):
        RoleName("")


def test_rejects_whitespace_only():
    with pytest.raises(ValueError):
        RoleName("   ")
