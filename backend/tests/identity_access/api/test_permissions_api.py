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


async def test_list_permissions_legacy_shape_still_returns_flat_array(admin_client):
    await admin_client.post("/identity/permissions", json={"code": "Legacy.View"})

    response = await admin_client.get("/identity/permissions")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


async def test_list_permissions_paged_returns_envelope_when_paged_true(admin_client):
    await admin_client.post("/identity/permissions", json={"code": "Paged.View"})

    response = await admin_client.get("/identity/permissions?paged=true&limit=10&offset=0")

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"items", "total", "limit", "offset"}
    assert body["total"] >= 1
    assert body["limit"] == 10
    assert body["offset"] == 0


async def test_list_permissions_search_matches_code_ilike(admin_client):
    await admin_client.post("/identity/permissions", json={"code": "Billing.View"})
    await admin_client.post("/identity/permissions", json={"code": "Support.View"})

    response = await admin_client.get("/identity/permissions?paged=true&q=billing")
    codes = [p["code"] for p in response.json()["items"]]
    assert "Billing.View" in codes
    assert "Support.View" not in codes


async def test_list_permissions_sort_code_asc_and_desc(admin_client):
    await admin_client.post("/identity/permissions", json={"code": "Zzz.View"})
    await admin_client.post("/identity/permissions", json={"code": "Aaa.View"})

    asc = await admin_client.get("/identity/permissions?paged=true&sort=code:asc")
    codes_asc = [p["code"] for p in asc.json()["items"]]
    assert codes_asc == sorted(codes_asc)

    desc = await admin_client.get("/identity/permissions?paged=true&sort=code:desc")
    codes_desc = [p["code"] for p in desc.json()["items"]]
    assert codes_desc == sorted(codes_desc, reverse=True)


async def test_list_permissions_rejects_unknown_sort_column_with_400(admin_client):
    response = await admin_client.get("/identity/permissions?paged=true&sort=description")
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "http_error"
