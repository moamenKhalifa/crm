async def test_register_happy_path_no_password_in_body(client):
    response = await client.post(
        "/identity/auth/register",
        json={"email": "reg@example.com", "password": "Passw0rd!", "full_name": "Reg User"},
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert "hashed_password" not in body
    assert "password" not in body
    assert body["email"] == "reg@example.com"


async def test_register_duplicate_returns_409(client):
    payload = {"email": "dup@example.com", "password": "Passw0rd!", "full_name": "Dup"}
    await client.post("/identity/auth/register", json=payload)

    response = await client.post("/identity/auth/register", json=payload)

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "duplicate_account"


async def test_register_invalid_email_returns_422(client):
    response = await client.post(
        "/identity/auth/register",
        json={"email": "not-an-email", "password": "Passw0rd!", "full_name": "X"},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_failed"


async def test_register_weak_password_returns_422(client):
    response = await client.post(
        "/identity/auth/register",
        json={"email": "weak@example.com", "password": "weak", "full_name": "X"},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_failed"


async def test_login_happy_path_returns_tokens(client):
    payload = {"email": "login@example.com", "password": "Passw0rd!", "full_name": "Login"}
    await client.post("/identity/auth/register", json=payload)

    response = await client.post(
        "/identity/auth/login", json={"email": payload["email"], "password": payload["password"]}
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["token_type"] == "Bearer"


async def test_login_wrong_password_returns_401(client):
    payload = {"email": "wrongpw@example.com", "password": "Passw0rd!", "full_name": "X"}
    await client.post("/identity/auth/register", json=payload)

    response = await client.post(
        "/identity/auth/login", json={"email": payload["email"], "password": "WrongPass1"}
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_credentials"


async def test_login_unknown_email_returns_same_error(client):
    response = await client.post(
        "/identity/auth/login", json={"email": "ghost@example.com", "password": "Passw0rd!"}
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_credentials"


async def test_refresh_happy_path_rotates(client):
    payload = {"email": "refresh@example.com", "password": "Passw0rd!", "full_name": "X"}
    await client.post("/identity/auth/register", json=payload)
    login = await client.post(
        "/identity/auth/login", json={"email": payload["email"], "password": payload["password"]}
    )
    tokens = login.json()

    response = await client.post("/identity/auth/refresh", json={"refresh_token": tokens["refresh_token"]})

    assert response.status_code == 200, response.text
    assert response.json()["refresh_token"] != tokens["refresh_token"]


async def test_reused_refresh_returns_401_revoked(client):
    payload = {"email": "reuse@example.com", "password": "Passw0rd!", "full_name": "X"}
    await client.post("/identity/auth/register", json=payload)
    login = await client.post(
        "/identity/auth/login", json={"email": payload["email"], "password": payload["password"]}
    )
    tokens = login.json()
    await client.post("/identity/auth/refresh", json={"refresh_token": tokens["refresh_token"]})

    replay = await client.post("/identity/auth/refresh", json={"refresh_token": tokens["refresh_token"]})

    assert replay.status_code == 401
    assert replay.json()["error"]["code"] == "revoked_refresh_token"


async def test_logout_returns_204_and_subsequent_refresh_returns_401(client):
    payload = {"email": "logout@example.com", "password": "Passw0rd!", "full_name": "X"}
    await client.post("/identity/auth/register", json=payload)
    login = await client.post(
        "/identity/auth/login", json={"email": payload["email"], "password": payload["password"]}
    )
    tokens = login.json()

    logout = await client.post(
        "/identity/auth/logout",
        json={"refresh_token": tokens["refresh_token"]},
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert logout.status_code == 204

    refresh = await client.post("/identity/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert refresh.status_code == 401
