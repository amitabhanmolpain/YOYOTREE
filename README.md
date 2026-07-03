# Scam URL/Message Checker

A phishing/scam detector for WhatsApp and SMS messages common in India. Paste a link or a message and get a Safe / Suspicious / Dangerous verdict with a one-line reason.

- `frontend/` — Next.js UI (built by a collaborator)
- `backend/` — Python + FastAPI detection engine (this is the part described below)

## What the backend checks

1. **URL Safety Check** — Google Safe Browsing API (malware/phishing feeds)
2. **Domain Age Check** — WHOIS lookup, flags domains registered under 30 days ago
3. **Brand Impersonation Check** — Levenshtein distance against ~20 commonly-impersonated Indian brands (SBI, Paytm, PhonePe, Amazon, LIC, etc.)
4. **Scam Message Text Check** — keyword/regex scoring for phishing language (KYC threats, OTP requests, lottery scams, urgency tactics)
5. **Verdict Engine** — combines all signals into Safe / Suspicious / Dangerous + a plain-English reason

## Running it locally

You need two terminals — one for the backend, one for the frontend.

### Backend (FastAPI)

```bash
cd backend
python -m venv venv
./venv/Scripts/activate   # on macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # optionally paste a Google Safe Browsing API key in here
uvicorn app.main:app --reload --port 8000
```

Runs at `http://localhost:8000`. Without a Safe Browsing API key, that one check is skipped gracefully — everything else still works.

### Frontend (Next.js)

```bash
cd frontend
npm install
cp .env.local.example .env.local   # points the UI at the backend
npm run dev
```

Open `http://localhost:3000`.
