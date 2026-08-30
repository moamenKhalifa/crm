import pytest

from app.modules.identity_access.application.use_cases.register_customer import (
    RegisterCustomer,
    RegisterCustomerCommand,
)
from app.modules.identity_access.domain.errors import (
    DuplicateAccountError,
    InvalidEmailError,
    WeakPasswordError,
)

from ..fakes import FakePasswordHasher, FakeUserRepository, FrozenClock


def _use_case() -> RegisterCustomer:
    return RegisterCustomer(FakeUserRepository(), FakePasswordHasher(), FrozenClock())


async def test_register_customer_success():
    result = await _use_case().execute(
        RegisterCustomerCommand(email="new@example.com", password="Passw0rd!", full_name="New Person")
    )
    assert result.email == "new@example.com"
    assert result.is_customer is True
    assert result.roles == []


async def test_register_customer_duplicate_email():
    repo = FakeUserRepository()
    use_case = RegisterCustomer(repo, FakePasswordHasher(), FrozenClock())
    await use_case.execute(
        RegisterCustomerCommand(email="dup@example.com", password="Passw0rd!", full_name="A")
    )

    with pytest.raises(DuplicateAccountError):
        await use_case.execute(
            RegisterCustomerCommand(email="dup@example.com", password="Passw0rd!", full_name="B")
        )


async def test_register_customer_invalid_email():
    with pytest.raises(InvalidEmailError):
        await _use_case().execute(
            RegisterCustomerCommand(email="not-an-email", password="Passw0rd!", full_name="A")
        )


async def test_register_customer_weak_password():
    with pytest.raises(WeakPasswordError):
        await _use_case().execute(
            RegisterCustomerCommand(email="weak@example.com", password="weak", full_name="A")
        )
