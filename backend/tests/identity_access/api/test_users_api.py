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


async def test_list_users_legacy_shape_still_returns_flat_array(admin_client):
    await admin_client.post(
        "/identity/users", json={"email": "legacy@example.com", "password": "Passw0rd!", "full_name": "Legacy"}
    )

    response = await admin_client.get("/identity/users")

    assert response.status_code == 200
    assert isinstance(response.json(), list)

    response_false = await admin_client.get("/identity/users?paged=false")
    assert response_false.status_code == 200
    assert isinstance(response_false.json(), list)


async def test_list_users_paged_returns_envelope_when_paged_true(admin_client):
    await admin_client.post(
        "/identity/users", json={"email": "paged@example.com", "password": "Passw0rd!", "full_name": "Paged"}
    )

    response = await admin_client.get("/identity/users?paged=true&limit=10&offset=0")

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"items", "total", "limit", "offset"}
    assert isinstance(body["items"], list)
    assert body["total"] >= 1
    assert body["limit"] == 10
    assert body["offset"] == 0


async def test_list_users_search_matches_full_name_and_email_ilike(admin_client):
    await admin_client.post(
        "/identity/users",
        json={"email": "jane.doe@example.com", "password": "Passw0rd!", "full_name": "Jane Doe"},
    )
    await admin_client.post(
        "/identity/users", json={"email": "other@example.com", "password": "Passw0rd!", "full_name": "Someone Else"}
    )

    by_name = await admin_client.get("/identity/users?paged=true&q=jane")
    assert by_name.status_code == 200
    names = [u["full_name"] for u in by_name.json()["items"]]
    assert "Jane Doe" in names
    assert "Someone Else" not in names

    by_email = await admin_client.get("/identity/users?paged=true&q=jane.doe")
    assert any(u["email"] == "jane.doe@example.com" for u in by_email.json()["items"])


async def test_list_users_sort_email_asc_and_desc(admin_client):
    await admin_client.post(
        "/identity/users", json={"email": "b@example.com", "password": "Passw0rd!", "full_name": "B"}
    )
    await admin_client.post(
        "/identity/users", json={"email": "a@example.com", "password": "Passw0rd!", "full_name": "A"}
    )

    asc = await admin_client.get("/identity/users?paged=true&sort=email:asc")
    emails_asc = [u["email"] for u in asc.json()["items"]]
    assert emails_asc == sorted(emails_asc)

    desc = await admin_client.get("/identity/users?paged=true&sort=email:desc")
    emails_desc = [u["email"] for u in desc.json()["items"]]
    assert emails_desc == sorted(emails_desc, reverse=True)


async def test_list_users_filter_by_is_active(admin_client):
    created = await admin_client.post(
        "/identity/users", json={"email": "inactive@example.com", "password": "Passw0rd!", "full_name": "Inactive"}
    )
    user_id = created.json()["id"]
    await admin_client.patch(f"/identity/users/{user_id}/active", json={"is_active": False})

    active_only = await admin_client.get("/identity/users?paged=true&is_active=true")
    assert all(u["is_active"] is True for u in active_only.json()["items"])
    assert not any(u["id"] == user_id for u in active_only.json()["items"])

    inactive_only = await admin_client.get("/identity/users?paged=true&is_active=false")
    assert any(u["id"] == user_id for u in inactive_only.json()["items"])
    assert all(u["is_active"] is False for u in inactive_only.json()["items"])


async def test_list_users_filter_by_role_id_repeatable(admin_client):
    created = await admin_client.post(
        "/identity/users", json={"email": "withrole@example.com", "password": "Passw0rd!", "full_name": "R"}
    )
    user_id = created.json()["id"]

    role = await admin_client.post("/identity/roles", json={"name": "paged-role-filter"})
    role_id = role.json()["id"]
    await admin_client.put(f"/identity/users/{user_id}/roles", json={"role_ids": [role_id]})

    response = await admin_client.get(f"/identity/users?paged=true&role_id={role_id}")
    assert response.status_code == 200
    ids = [u["id"] for u in response.json()["items"]]
    assert user_id in ids


async def test_list_users_rejects_unknown_sort_column_with_400(admin_client):
    response = await admin_client.get("/identity/users?paged=true&sort=hashed_password")
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "http_error"
