from app.modules.identity_access.infrastructure.security.refresh_token_service import (
    SecretsRefreshTokenIssuer,
)

from ..fakes import FrozenClock


def _issuer() -> SecretsRefreshTokenIssuer:
    return SecretsRefreshTokenIssuer(ttl_seconds=1000, clock=FrozenClock())


def test_token_entropy_at_least_64_chars():
    issued = _issuer().issue()
    assert len(issued.plaintext) >= 64


def test_hash_is_deterministic():
    issuer = _issuer()
    plaintext = "some-token-value"
    assert issuer.hash(plaintext) == issuer.hash(plaintext)


def test_plaintext_not_stored_as_hash():
    issued = _issuer().issue()
    assert issued.plaintext != issued.token_hash
