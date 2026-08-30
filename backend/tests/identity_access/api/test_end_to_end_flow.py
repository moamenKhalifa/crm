async def test_full_authentication_and_authorization_flow(admin_client):
    """Exercises the full AC-15 flow in one test: admin creates a user, assigns
    a role with a permission, the user logs in, calls a protected API,
    refreshes past token issuance, calls it again, then logs out — after
    which the used refresh token can no longer mint new tokens."""
    role = await admin_client.post("/identity/roles", json={"name": "e2e-agent"})
    role_id = role.json()["id"]

    # `admin_client` already seeds `User.View` et al. via the bootstrap admin
    # role — look up the existing one rather than creating a duplicate.
    permissions = await admin_client.get("/identity/permissions")
    permission_id = next(p["id"] for p in permissions.json() if p["code"] == "User.View")

    await admin_client.put(f"/identity/roles/{role_id}/permissions", json={"permission_ids": [permission_id]})

    created = await admin_client.post(
        "/identity/users",
        json={"email": "e2e@example.com", "password": "Passw0rd!", "full_name": "E2E User"},
    )
    user_id = created.json()["id"]

    await admin_client.put(f"/identity/users/{user_id}/roles", json={"role_ids": [role_id]})

    login = await admin_client.post(
        "/identity/auth/login", json={"email": "e2e@example.com", "password": "Passw0rd!"}
    )
    assert login.status_code == 200, login.text
    tokens = login.json()

    protected = await admin_client.get(
        "/identity/users", headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )
    assert protected.status_code == 200  # e2e-agent role grants User.View

    refreshed = await admin_client.post(
        "/identity/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert refreshed.status_code == 200
    new_tokens = refreshed.json()

    protected_again = await admin_client.get(
        "/identity/users", headers={"Authorization": f"Bearer {new_tokens['access_token']}"}
    )
    assert protected_again.status_code == 200

    logout = await admin_client.post(
        "/identity/auth/logout",
        json={"refresh_token": new_tokens["refresh_token"]},
        headers={"Authorization": f"Bearer {new_tokens['access_token']}"},
    )
    assert logout.status_code == 204

    refresh_after_logout = await admin_client.post(
        "/identity/auth/refresh", json={"refresh_token": new_tokens["refresh_token"]}
    )
    assert refresh_after_logout.status_code == 401
