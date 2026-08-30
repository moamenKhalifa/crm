from uuid import uuid4


async def test_admin_can_create_and_list_roles(admin_client):
    response = await admin_client.post("/identity/roles", json={"name": "billing", "description": "Billing"})
    assert response.status_code == 201, response.text

    listing = await admin_client.get("/identity/roles")
    assert listing.status_code == 200
    assert any(r["name"] == "billing" for r in listing.json())


async def test_create_role_duplicate_name_returns_409(admin_client):
    await admin_client.post("/identity/roles", json={"name": "duped"})

    response = await admin_client.post("/identity/roles", json={"name": "duped"})

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "duplicate_role"


async def test_get_role_not_found_returns_404(admin_client):
    response = await admin_client.get(f"/identity/roles/{uuid4()}")
    assert response.status_code == 404


async def test_update_and_delete_role(admin_client):
    created = await admin_client.post("/identity/roles", json={"name": "temp"})
    role_id = created.json()["id"]

    updated = await admin_client.patch(f"/identity/roles/{role_id}", json={"description": "Updated"})
    assert updated.status_code == 200
    assert updated.json()["description"] == "Updated"

    deleted = await admin_client.delete(f"/identity/roles/{role_id}")
    assert deleted.status_code == 204

    follow_up = await admin_client.get(f"/identity/roles/{role_id}")
    assert follow_up.status_code == 404


async def test_assign_and_remove_role_permissions(admin_client):
    role = await admin_client.post("/identity/roles", json={"name": "with-perms"})
    role_id = role.json()["id"]

    permission = await admin_client.post("/identity/permissions", json={"code": "Ticket.View"})
    permission_id = permission.json()["id"]

    assign = await admin_client.put(
        f"/identity/roles/{role_id}/permissions", json={"permission_ids": [permission_id]}
    )
    assert assign.status_code == 200

    perms = await admin_client.get(f"/identity/roles/{role_id}/permissions")
    assert perms.status_code == 200
    assert [p["id"] for p in perms.json()] == [permission_id]

    remove = await admin_client.request(
        "DELETE", f"/identity/roles/{role_id}/permissions", json={"permission_ids": [permission_id]}
    )
    assert remove.status_code == 200

    perms_after = await admin_client.get(f"/identity/roles/{role_id}/permissions")
    assert perms_after.json() == []


async def test_assign_unknown_permission_returns_404(admin_client):
    role = await admin_client.post("/identity/roles", json={"name": "bad-perm-role"})
    role_id = role.json()["id"]

    response = await admin_client.put(
        f"/identity/roles/{role_id}/permissions", json={"permission_ids": [str(uuid4())]}
    )
    assert response.status_code == 404


async def test_unauthorised_customer_cannot_create_role(customer_client):
    response = await customer_client.post("/identity/roles", json={"name": "hack"})
    assert response.status_code == 403
