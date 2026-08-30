from uuid import uuid4

import jwt as pyjwt
import pytest

from app.modules.identity_access.domain.ports.tokens import TokenExpiredError, TokenInvalidError
from app.modules.identity_access.infrastructure.security.jwt_access_token import PyJWTAccessTokenIssuer

from ..fakes import FrozenClock

_SECRET = "s" * 32


def test_round_trip_with_frozen_clock():
    clock = FrozenClock()
    issuer = PyJWTAccessTokenIssuer(secret=_SECRET, algorithm="HS256", ttl_seconds=900, clock=clock)
    user_id = uuid4()

    token = issuer.encode(user_id=user_id, email="a@example.com", roles=["agent"], permissions=["User.View"])
    claims = issuer.decode(token)

    assert claims.user_id == user_id
    assert claims.email == "a@example.com"
    assert claims.roles == ["agent"]
    assert claims.permissions == ["User.View"]


def test_expired_token_raises():
    clock = FrozenClock()
    issuer = PyJWTAccessTokenIssuer(secret=_SECRET, algorithm="HS256", ttl_seconds=-1, clock=clock)
    token = issuer.encode(user_id=uuid4(), email="a@example.com", roles=[], permissions=[])

    with pytest.raises(TokenExpiredError):
        issuer.decode(token)


def test_tampered_token_raises():
    clock = FrozenClock()
    issuer = PyJWTAccessTokenIssuer(secret=_SECRET, algorithm="HS256", ttl_seconds=900, clock=clock)
    token = issuer.encode(user_id=uuid4(), email="a@example.com", roles=[], permissions=[])

    # Flip a character in the middle of the payload segment, not the last
    # character of the token: the trailing base64url character of a
    # 256-bit HMAC-SHA256 signature encodes 2 padding bits libpyjwt ignores,
    # so some substitutions there decode to an identical signature and the
    # tamper is (rarely, flakily) not detected. A middle-of-segment flip
    # always changes the decoded bytes.
    mid = len(token) // 2
    swapped_char = "A" if token[mid] != "A" else "B"
    tampered = token[:mid] + swapped_char + token[mid + 1 :]

    with pytest.raises(TokenInvalidError):
        issuer.decode(tampered)


def test_alg_none_rejected():
    clock = FrozenClock()
    issuer = PyJWTAccessTokenIssuer(secret=_SECRET, algorithm="HS256", ttl_seconds=900, clock=clock)

    forged = pyjwt.encode(
        {
            "sub": str(uuid4()),
            "email": "a@example.com",
            "roles": [],
            "permissions": [],
            "iat": 0,
            "exp": 9999999999,
            "type": "access",
        },
        key=None,
        algorithm="none",
    )
    with pytest.raises(TokenInvalidError):
        issuer.decode(forged)
