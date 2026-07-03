import re

from ..brands import TRUSTED_BRANDS

# Below this length, small edit distances are too likely to be
# coincidental (e.g. "go.in" vs "jio" is 2 edits apart but meaningless).
MIN_LABEL_LENGTH_FOR_FUZZY_FLAG = 4
MIN_TOKEN_LENGTH_FOR_EXACT_FLAG = 3
MAX_SUSPICIOUS_DISTANCE = 2

TOKEN_SPLIT_RE = re.compile(r"[^a-z0-9]+")


def levenshtein(a: str, b: str) -> int:
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)

    previous_row = list(range(len(b) + 1))
    for i, char_a in enumerate(a, start=1):
        current_row = [i] + [0] * len(b)
        for j, char_b in enumerate(b, start=1):
            cost = 0 if char_a == char_b else 1
            current_row[j] = min(
                previous_row[j] + 1,  # deletion
                current_row[j - 1] + 1,  # insertion
                previous_row[j - 1] + cost,  # substitution
            )
        previous_row = current_row
    return previous_row[-1]


def _registrable_label(domain: str) -> str:
    return domain.split(".")[0] if domain else domain


def _candidate_labels(full_label: str) -> set[str]:
    """Whole label plus its hyphen/digit-separated words.

    Catches both classic typosquats ("paytnn" vs "paytm") and the more
    common "brand + extra words" scam pattern ("sbi-login-verify.top").
    """
    tokens = {token for token in TOKEN_SPLIT_RE.split(full_label) if token}
    tokens.add(full_label)
    return tokens


def check_typosquatting(hostname: str) -> dict:
    """Compare a domain against known brands via Levenshtein distance.

    Returns dict: matched_brand (str|None), distance (int|None),
    is_impersonation (bool), status_text (str).
    """
    hostname = hostname.lower().strip()
    if hostname.startswith("www."):
        hostname = hostname[4:]

    for brand in TRUSTED_BRANDS:
        if hostname == brand["domain"] or hostname.endswith("." + brand["domain"]):
            return {
                "matched_brand": None,
                "distance": None,
                "is_impersonation": False,
                "status_text": "None (matches trusted domain)",
            }

    candidates = _candidate_labels(_registrable_label(hostname))

    best_brand = None
    best_distance = None
    best_candidate = None
    for brand in TRUSTED_BRANDS:
        brand_label = _registrable_label(brand["domain"])
        for candidate in candidates:
            min_length = (
                MIN_TOKEN_LENGTH_FOR_EXACT_FLAG if candidate == brand_label else MIN_LABEL_LENGTH_FOR_FUZZY_FLAG
            )
            if len(candidate) < min_length:
                continue
            distance = levenshtein(candidate, brand_label)
            if distance > MAX_SUSPICIOUS_DISTANCE:
                continue
            if best_distance is None or distance < best_distance:
                best_distance = distance
                best_brand = brand
                best_candidate = candidate

    if best_brand is None:
        return {"matched_brand": None, "distance": None, "is_impersonation": False, "status_text": "None"}

    if best_distance == 0:
        status_text = (
            f"Contains the brand name \"{best_candidate}\" but the domain does not belong to "
            f"{best_brand['name']} ({best_brand['domain']})"
        )
    else:
        status_text = (
            f"High similarity to {best_brand['name']} ({best_brand['domain']}) "
            f"— edit distance {best_distance}"
        )

    return {
        "matched_brand": best_brand["name"],
        "distance": best_distance,
        "is_impersonation": True,
        "status_text": status_text,
    }
