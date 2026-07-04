from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import settings
from .services.domain_age import check_domain_age
from .services.safe_browsing import check_url_safety
from .services.text_scam import check_text_for_scam_patterns, extract_urls
from .services.typosquat import check_typosquatting
from .services.verdict import build_text_verdict, build_url_verdict
from .services.store import get_result, save_result
from .services.whatsapp import send_whatsapp_reply

app = FastAPI(title="Scam URL/Message Checker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Cap how many links inside a pasted message get a full URL analysis
# (each one triggers a live WHOIS + Safe Browsing lookup).
MAX_URLS_PER_MESSAGE = 3


class UrlCheckRequest(BaseModel):
    url: str


class TextCheckRequest(BaseModel):
    text: str


class CheckDetails(BaseModel):
    safeBrowsing: str
    domainAge: str
    typosquatMatch: str
    keywordsFound: list[str]


class CheckResponse(BaseModel):
    verdict: str
    reason: str
    details: CheckDetails


def _normalize_url(raw_url: str) -> str:
    raw_url = raw_url.strip()
    if not raw_url.startswith(("http://", "https://")):
        raw_url = "https://" + raw_url
    return raw_url


def _analyze_url(raw_url: str) -> CheckResponse:
    normalized = _normalize_url(raw_url)
    hostname = urlparse(normalized).hostname

    if not hostname:
        return CheckResponse(
            verdict="Dangerous",
            reason="The input is not a valid URL or domain.",
            details=CheckDetails(
                safeBrowsing="Not checked (invalid URL)",
                domainAge="Unknown",
                typosquatMatch="Unknown",
                keywordsFound=["invalid_format"],
            ),
        )

    is_http = urlparse(normalized).scheme == "http"
    safe_browsing = check_url_safety(normalized)
    domain_age = check_domain_age(hostname)
    typosquat = check_typosquatting(hostname)

    result = build_url_verdict(safe_browsing, domain_age, typosquat, is_http)

    keywords_found = []
    if safe_browsing["flagged"]:
        keywords_found.extend(threat.lower() for threat in safe_browsing["threats"])
    if typosquat["is_impersonation"]:
        keywords_found.append("brand_impersonation")
    if domain_age["is_new"]:
        keywords_found.append("new_domain")
    if is_http:
        keywords_found.append("unencrypted_http")
    if not keywords_found:
        keywords_found.append("None")

    return CheckResponse(
        verdict=result["verdict"],
        reason=result["reason"],
        details=CheckDetails(
            safeBrowsing=safe_browsing["status_text"],
            domainAge=domain_age["status_text"],
            typosquatMatch=typosquat["status_text"],
            keywordsFound=keywords_found,
        ),
    )


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/check-url", response_model=CheckResponse)
def check_url(payload: UrlCheckRequest):
    if not payload.url or not payload.url.strip():
        raise HTTPException(status_code=400, detail="Invalid URL provided")
    return _analyze_url(payload.url)


def _analyze_text(text: str) -> CheckResponse:
    text_result = check_text_for_scam_patterns(text)
    urls_in_text = extract_urls(text)[:MAX_URLS_PER_MESSAGE]
    url_responses = [_analyze_url(url) for url in urls_in_text]

    result = build_text_verdict(
        text_result,
        [{"verdict": r.verdict, "score": {"Safe": 0, "Suspicious": 3, "Dangerous": 6}[r.verdict]} for r in url_responses],
    )

    keywords_found = list(dict.fromkeys(text_result["matched_keywords"])) or ["None"]

    if url_responses:
        worst = max(url_responses, key=lambda r: {"Safe": 0, "Suspicious": 1, "Dangerous": 2}[r.verdict])
        safe_browsing_text = worst.details.safeBrowsing
        domain_age_text = worst.details.domainAge
        typosquat_text = worst.details.typosquatMatch
    else:
        safe_browsing_text = "N/A (no links in message)"
        domain_age_text = "N/A (no links in message)"
        typosquat_text = "N/A (no links in message)"

    return CheckResponse(
        verdict=result["verdict"],
        reason=result["reason"],
        details=CheckDetails(
            safeBrowsing=safe_browsing_text,
            domainAge=domain_age_text,
            typosquatMatch=typosquat_text,
            keywordsFound=keywords_found,
        ),
    )


@app.post("/check-text", response_model=CheckResponse)
def check_text(payload: TextCheckRequest):
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Invalid text provided")
    return _analyze_text(payload.text)


@app.post("/whatsapp-webhook")
async def whatsapp_webhook(request: Request):
    form = await request.form()
    incoming_msg = form.get("Body")
    sender = form.get("From")  # e.g. "whatsapp:+91XXXXXXXXXX"

    if not incoming_msg or not incoming_msg.strip() or not sender:
        return Response(content="<Response></Response>", media_type="text/xml")

    result = _analyze_text(incoming_msg)
    result_id = save_result(result.dict())

    website_url = f"{settings.website_url}/result/{result_id}"
    reply_text = f"Verdict: {result.verdict}\nView full details: {website_url}"

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>{reply_text}</Message>
</Response>"""

    return Response(content=twiml, media_type="text/xml")


@app.get("/api/result/{result_id}")
async def get_result_api(result_id: str):
    result = get_result(result_id)
    if not result:
        return {"error": "Result not found"}
    return result
