from app.modules.identity_access.domain.services.authorization import has_permission


def test_has_permission_true_when_present():
    assert has_permission({"User.View", "User.Create"}, "User.View") is True


def test_has_permission_false_when_absent():
    assert has_permission({"User.View"}, "User.Delete") is False


def test_has_permission_false_on_empty_set():
    assert has_permission(set(), "User.View") is False
