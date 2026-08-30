import pytest

from app.modules.identity_access.domain.errors import WeakPasswordError
from app.modules.identity_access.domain.value_objects.password import RawPassword


def test_accepts_valid_password():
    RawPassword("Passw0rd!")  # must not raise


def test_rejects_too_short():
    with pytest.raises(WeakPasswordError):
        RawPassword("Ab1")


def test_rejects_missing_digit():
    with pytest.raises(WeakPasswordError):
        RawPassword("NoDigitsHere")


def test_rejects_missing_letter():
    with pytest.raises(WeakPasswordError):
        RawPassword("12345678")


def test_rejects_over_72_bytes():
    with pytest.raises(WeakPasswordError):
        RawPassword("a1" * 40)  # 80 bytes
