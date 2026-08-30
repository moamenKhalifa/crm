async def test_health_ok_when_db_unreachable(client, monkeypatch):
    async def fake_check_database() -> bool:
        return False

    monkeypatch.setattr("app.shared.api.health.check_database", fake_check_database)

    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "unreachable"}


async def test_health_ok_when_db_reachable(client, monkeypatch):
    async def fake_check_database() -> bool:
        return True

    monkeypatch.setattr("app.shared.api.health.check_database", fake_check_database)

    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}
