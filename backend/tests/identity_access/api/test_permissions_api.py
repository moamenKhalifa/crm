from uuid import uuid4


async def test_admin_can_create_and_list_permissions(admin_client):
    response = await admin_client.post("/identity/permissions", json={"code": "Ticket.Create"})
    assert response.status_code == 201, response.text

    listing = await admin_client.get("/identity/permissions")
    assert listing.status_code == 200
    assert any(p["code"] == "Ticket.Create" for p in listing.json())


async def test_create_permission_duplicate_code_returns_409(admin_client):
    await admin_client.post("/identity/permissions", json={"code": "Ticket.Update"})

    response = await admin_client.post("/identity/permissions", json={"code": "Ticket.Update"})

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "duplicate_permission"


async def test_get_permission_not_found_returns_404(admin_client):
    response = await admin_client.get(f"/identity/permissions/{uuid4()}")
    assert response.status_code == 404


async def test_update_and_delete_permission(admin_client):
    created = await admin_client.post("/identity/permissions", json={"code": "Ticket.Delete"})
    permission_id = created.json()["id"]

    updated = await admin_client.patch(
        f"/identity/permissions/{permission_id}", json={"description": "Delete a ticket"}
    )
    assert updated.status_code == 200
    assert updated.json()["description"] == "Delete a ticket"

    deleted = await admin_client.delete(f"/identity/permissions/{permission_id}")
    assert deleted.status_code == 204

    follow_up = await admin_client.get(f"/identity/permissions/{permission_id}")
    assert follow_up.status_code == 404


async def test_unauthorised_customer_cannot_create_permission(customer_client):
    response = await customer_client.post("/identity/permissions", json={"code": "Hack.All"})
    assert response.status_code == 403
