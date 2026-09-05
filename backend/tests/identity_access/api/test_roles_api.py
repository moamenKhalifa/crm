from uuid import uuid4


async def test_admin_can_create_and_list_roles(admin_client):
    response = await admin_client.post("/identity/roles", json={"name": "billing", "description": "Billing"})
    assert response.status_code == 201, response.text

    listing = await admin_client.get("/identity/roles")
    assert listing.status_code == 200
    assert any(r["name"] == "billing" for r in listing.json())


async def test_create_role_normalises_name_to_lowercase(admin_client):
    response = await admin_client.post("/identity/roles", json={"name": "Admin-Variant"})
    assert response.status_code == 201, response.text
    assert response.json()["name"] == "admin-variant"


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


async def test_list_roles_legacy_shape_still_returns_flat_array(admin_client):
    await admin_client.post("/identity/roles", json={"name": "legacy-role"})

    response = await admin_client.get("/identity/roles")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


async def test_list_roles_paged_returns_envelope_when_paged_true(admin_client):
    await admin_client.post("/identity/roles", json={"name": "paged-role"})

    response = await admin_client.get("/identity/roles?paged=true&limit=10&offset=0")

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"items", "total", "limit", "offset"}
    assert body["total"] >= 1
    assert body["limit"] == 10
    assert body["offset"] == 0


async def test_list_roles_search_matches_name_ilike(admin_client):
    await admin_client.post("/identity/roles", json={"name": "billing-team"})
    await admin_client.post("/identity/roles", json={"name": "support-team"})

    response = await admin_client.get("/identity/roles?paged=true&q=billing")
    names = [r["name"] for r in response.json()["items"]]
    assert "billing-team" in names
    assert "support-team" not in names


async def test_list_roles_sort_name_asc_and_desc(admin_client):
    await admin_client.post("/identity/roles", json={"name": "zzz-role"})
    await admin_client.post("/identity/roles", json={"name": "aaa-role"})

    asc = await admin_client.get("/identity/roles?paged=true&sort=name:asc")
    names_asc = [r["name"] for r in asc.json()["items"]]
    assert names_asc == sorted(names_asc)

    desc = await admin_client.get("/identity/roles?paged=true&sort=name:desc")
    names_desc = [r["name"] for r in desc.json()["items"]]
    assert names_desc == sorted(names_desc, reverse=True)


async def test_list_roles_filter_by_has_permission_id(admin_client):
    role = await admin_client.post("/identity/roles", json={"name": "perm-filter-role"})
    role_id = role.json()["id"]

    permission = await admin_client.post("/identity/permissions", json={"code": "Filter.Test"})
    permission_id = permission.json()["id"]

    await admin_client.put(f"/identity/roles/{role_id}/permissions", json={"permission_ids": [permission_id]})

    response = await admin_client.get(f"/identity/roles?paged=true&has_permission_id={permission_id}")
    assert response.status_code == 200
    ids = [r["id"] for r in response.json()["items"]]
    assert role_id in ids


async def test_list_roles_rejects_unknown_sort_column_with_400(admin_client):
    response = await admin_client.get("/identity/roles?paged=true&sort=unknown_column")
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "http_error"
