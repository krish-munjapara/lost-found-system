"""Sanitize API responses — strip sensitive fields."""

SENSITIVE_CHILD_FIELDS = {"encoding"}
SENSITIVE_USER_FIELDS = {"password"}


def sanitize_child(doc: dict | None, include_reporter: bool = False) -> dict | None:
    if not doc:
        return None
    out = dict(doc)
    for field in SENSITIVE_CHILD_FIELDS:
        out.pop(field, None)
    if not include_reporter:
        out.pop("reporter_email", None)
    return out


def sanitize_user(doc: dict | None) -> dict | None:
    if not doc:
        return None
    out = dict(doc)
    for field in SENSITIVE_USER_FIELDS:
        out.pop(field, None)
    return out
