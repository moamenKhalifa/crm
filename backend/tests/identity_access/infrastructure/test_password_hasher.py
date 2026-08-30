from app.modules.identity_access.infrastructure.security.password_hasher import PasslibBcryptHasher


def _hasher() -> PasslibBcryptHasher:
    return PasslibBcryptHasher(rounds=4)  # low cost factor — fast in tests


def test_hash_never_equals_plaintext():
    hashed = _hasher().hash("Passw0rd!")
    assert hashed != "Passw0rd!"


def test_verify_true_for_correct_password():
    hasher = _hasher()
    hashed = hasher.hash("Passw0rd!")
    assert hasher.verify("Passw0rd!", hashed) is True


def test_verify_false_for_wrong_password():
    hasher = _hasher()
    hashed = hasher.hash("Passw0rd!")
    assert hasher.verify("WrongPass1", hashed) is False


def test_different_hashes_for_same_password():
    hasher = _hasher()
    first = hasher.hash("Passw0rd!")
    second = hasher.hash("Passw0rd!")
    assert first != second  # bcrypt salts each hash independently
