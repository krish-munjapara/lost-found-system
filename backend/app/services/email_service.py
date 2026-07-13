"""Email delivery — SMTP with console fallback."""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import (
    APP_NAME,
    EMAIL_ENABLED,
    FRONTEND_URL,
    SMTP_FROM,
    SMTP_HOST,
    SMTP_PASSWORD,
    SMTP_PORT,
    SMTP_USER,
)


def _send_email(to_email: str, subject: str, html_body: str, text_body: str) -> bool:
    if not EMAIL_ENABLED:
        print(f"\n📧 [EMAIL — console mode]\nTo: {to_email}\nSubject: {subject}\n{text_body}\n")
        return True

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, [to_email], msg.as_string())
        return True
    except Exception as exc:
        print(f"❌ Email send failed: {exc}")
        return False


def send_password_reset_email(to_email: str, token: str) -> bool:
    link = f"{FRONTEND_URL}/reset-password?token={token}"
    subject = f"{APP_NAME} — Reset Your Password"
    text = f"Reset your password: {link}\nThis link expires in 30 minutes."
    html = f"<p>Reset your password:</p><p><a href='{link}'>{link}</a></p>"
    return _send_email(to_email, subject, html, text)


def send_verification_email(to_email: str, token: str) -> bool:
    link = f"{FRONTEND_URL}/verify-email?token={token}"
    subject = f"{APP_NAME} — Verify Your Email"
    text = f"Verify your email: {link}"
    html = f"<p>Verify your email:</p><p><a href='{link}'>{link}</a></p>"
    return _send_email(to_email, subject, html, text)


def send_match_notification_email(to_email: str, title: str, message: str) -> bool:
    subject = f"{APP_NAME} — {title}"
    html = f"<p>{message}</p><p><a href='{FRONTEND_URL}/matches'>View Matches</a></p>"
    return _send_email(to_email, subject, html, message)
