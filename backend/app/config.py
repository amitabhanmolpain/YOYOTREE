import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    google_safe_browsing_api_key: str | None = os.getenv("GOOGLE_SAFE_BROWSING_API_KEY") or None
    cors_origins: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
        if origin.strip()
    ]
    twilio_account_sid: str | None = os.getenv("TWILIO_ACCOUNT_SID") or None
    twilio_auth_token: str | None = os.getenv("TWILIO_AUTH_TOKEN") or None
    twilio_whatsapp_number: str = os.getenv("TWILIO_WHATSAPP_NUMBER") or "whatsapp:+14155238886"

settings = Settings()
