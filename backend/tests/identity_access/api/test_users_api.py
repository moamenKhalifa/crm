from uuid import uuid4


async def test_admin_can_create_and_list_users(admin_client):
    response = await admin_client.post(
        "/identity/users",
        json={"email": "new-staff@example.com", "password": "Passw0rd!", "full_name": "New Staff"},
    )
    assert response.status_code == 201, response.text
    user_id = response.json()["id"]

    listing = await admin_client.get("/identity/users")
    assert listing.status_code == 200
    assert any(u["id"] == user_id for u in listing.json())


async def test_create_user_duplicate_email_returns_409(admin_client):
    payload = {"email": "dupstaff@example.com", "password": "Passw0rd!", "full_name": "A"}
    await admin_client.post("/identity/users", json=payload)

    response = await admin_client.post("/identity/users", json=payload)

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "duplicate_account"


async def test_create_user_missing_field_returns_422(admin_client):
    response = await admin_client.post(
        "/identity/users", json={"email": "incomplete@example.com", "password": "Passw0rd!"}
    )
    assert response.status_code == 422


async def test_get_user_not_found_returns_404(admin_client):
    response = await admin_client.get(f"/identity/users/{uuid4()}")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


async def test_update_user_full_name(admin_client):
    created = await admin_client.post(
        "/identity/users", json={"email": "upd@example.com", "password": "Passw0rd!", "full_name": "Before"}
    )
    user_id = created.json()["id"]

    response = await admin_client.patch(f"/identity/users/{user_id}", json={"full_name": "After"})

    assert response.status_code == 200
    assert response.json()["full_name"] == "After"


async def test_set_user_active_toggles(admin_client):
    created = await admin_client.post(
        "/identity/users", json={"email": "active@example.com", "password": "Passw0rd!", "full_name": "A"}
    )
    user_id = created.json()["id"]

    response = await admin_client.patch(f"/identity/users/{user_id}/active", json={"is_active": False})

    assert response.status_code == 200
    assert response.json()["is_active"] is False


async def test_delete_user(admin_client):
    created = await admin_client.post(
        "/identity/users", json={"email": "del@example.com", "password": "Passw0rd!", "full_name": "D"}
    )
    user_id = created.json()["id"]

    response = await admin_client.delete(f"/identity/users/{user_id}")
    assert response.status_code == 204

    follow_up = await admin_client.get(f"/identity/users/{user_id}")
    assert follow_up.status_code == 404


async def test_delete_user_not_found_returns_404(admin_client):
    response = await admin_client.delete(f"/identity/users/{uuid4()}")
    assert response.status_code == 404


async def test_assign_and_view_user_roles(admin_client):
    created = await admin_client.post(
        "/identity/users", json={"email": "roled@example.com", "password": "Passw0rd!", "full_name": "R"}
    )
    user_id = created.json()["id"]

    role = await admin_client.post("/identity/roles", json={"name": "billing"})
    role_id = role.json()["id"]

    assign = await admin_client.put(f"/identity/users/{user_id}/roles", json={"role_ids": [role_id]})
    assert assign.status_code == 200
    assert [r["id"] for r in assign.json()["roles"]] == [role_id]

    roles = await admin_client.get(f"/identity/users/{user_id}/roles")
    assert roles.status_code == 200
    assert [r["id"] for r in roles.json()] == [role_id]


async def test_assign_unknown_role_returns_404(admin_client):
    created = await admin_client.post(
        "/identity/users", json={"email": "badrole@example.com", "password": "Passw0rd!", "full_name": "R"}
    )
    user_id = created.json()["id"]

    response = await admin_client.put(f"/identity/users/{user_id}/roles", json={"role_ids": [str(uuid4())]})
    assert response.status_code == 404


async def test_unauthorised_customer_cannot_list_users(customer_client):
    response = await customer_client.get("/identity/users")
    assert response.status_code == 403
