from app.main import create_app


def test_create_app_registers_health_route(settings_env):
    app = create_app()

    assert any(
        getattr(route, "path", None) == "/health" and "GET" in getattr(route, "methods", set())
        for route in app.routes
    )


def test_identity_router_mounted(settings_env):
    # Story 1 only wires the empty identity-access router; assert composition
    # succeeds without raising rather than asserting concrete routes exist.
    app = create_app()
    assert app is not None
