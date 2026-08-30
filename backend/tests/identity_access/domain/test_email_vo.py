import pytest

from app.modules.identity_access.domain.errors import InvalidEmailError
from app.modules.identity_access.domain.value_objects.email import Email


def test_accepts_valid_email():
    assert str(Email("foo@example.com")) == "foo@example.com"


def test_rejects_malformed_email():
    with pytest.raises(InvalidEmailError):
        Email("not-an-email")


def test_normalises_case_and_whitespace():
    assert str(Email("  Foo@Example.COM  ")) == "foo@example.com"
