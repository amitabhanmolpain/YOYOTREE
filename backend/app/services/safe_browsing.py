import requests

from ..config import settings

SAFE_BROWSING_URL = "https://safebrowsing.googleapis.com/v4/threatMatches:find"


def check_url_safety(url: str) -> dict:
    """Query Google Safe Browsing for known malware/phishing URLs.

    Returns dict: flagged (bool), threats (list[str]), status_text (str).
    Degrades gracefully (flagged=False) if no API key is configured or the
    API call fails, so the rest of the pipeline still runs.
    """
    if not settings.google_safe_browsing_api_key:
        return {"flagged": False, "threats": [], "status_text": "Not checked (no API key configured)"}

    body = {
        "client": {"clientId": "message-phishing-detector", "clientVersion": "1.0.0"},
        "threatInfo": {
            "threatTypes": [
                "MALWARE",
                "SOCIAL_ENGINEERING",
                "UNWANTED_SOFTWARE",
                "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": url}],
        },
    }

    try:
        response = requests.post(
            SAFE_BROWSING_URL,
            params={"key": settings.google_safe_browsing_api_key},
            json=body,
            timeout=5,
        )
        response.raise_for_status()
        matches = response.json().get("matches", [])
        if matches:
            threats = sorted({match.get("threatType", "UNKNOWN") for match in matches})
            return {"flagged": True, "threats": threats, "status_text": f"Flagged: {', '.join(threats)}"}
        return {"flagged": False, "threats": [], "status_text": "Clean (no known threats)"}
    except requests.RequestException:
        return {"flagged": False, "threats": [], "status_text": "Check unavailable (API error)"}
