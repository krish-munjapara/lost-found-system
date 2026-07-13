from app.utils.passwords import hash_password, verify_password


def test_short_password_round_trip():
    password = "CorrectHorseBatteryStaple"
    hashed = hash_password(password)
    assert verify_password(password, hashed) is True
    assert verify_password("wrong-password", hashed) is False


def test_long_password_round_trip():
    password = "A" * 100
    hashed = hash_password(password)
    assert verify_password(password, hashed) is True
    assert verify_password("A" * 99, hashed) is False


def test_legacy_truncated_password_verification():
    password = "legacy-password-that-is-longer-than-bcrypt-limit"
    hashed = hash_password(password[:72])
    assert verify_password(password[:72], hashed) is True
    assert verify_password(password, hashed) is True
