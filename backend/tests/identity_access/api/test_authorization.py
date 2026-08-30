import jwt as pyjwt

from app.shared.config.settings import get_settings


async def test_protected_endpoint_without_header_returns_401(client):
    response = await client.get("/identity/users")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthenticated"


async def test_protected_endpoint_with_expired_token_returns_401(client):
    settings = get_settings()
    expired_token = pyjwt.encode(
        {
            "sub": "11111111-1111-1111-1111-111111111111",
            "email": "x@example.com",
            "roles": [],
            "permissions": [],
            "iat": 0,
            "exp": 1,
            "type": "access",
        },
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )

    response = await client.get("/identity/users", headers={"Authorization": f"Bearer {expired_token}"})

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "token_expired"


async def test_protected_endpoint_with_garbage_token_returns_401(client):
    response = await client.get("/identity/users", headers={"Authorization": "Bearer not-a-real-token"})
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthenticated"


async def test_valid_token_missing_permission_returns_403(customer_client):
    response = await customer_client.get("/identity/users")
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "insufficient_permissions"


async def test_valid_token_with_correct_permission_returns_200(admin_client):
    response = await admin_client.get("/identity/users")
    assert response.status_code == 200
