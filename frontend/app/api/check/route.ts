import { NextResponse } from "next/server";

// Simple brand mapping to check typosquatting
const TRUSTED_BRANDS = [
  { name: "SBI (State Bank of India)", domain: "sbi.co.in", keywords: ["sbi", "statebank"] },
  { name: "HDFC Bank", domain: "hdfcbank.com", keywords: ["hdfc"] },
  { name: "ICICI Bank", domain: "icicibank.com", keywords: ["icicibank", "icici"] },
  { name: "Amazon", domain: "amazon.com", keywords: ["amazon", "amzn"] },
  { name: "Netflix", domain: "netflix.com", keywords: ["netflix", "ntflx"] },
  { name: "India Post", domain: "indiapost.gov.in", keywords: ["indiapost", "speedpost", "post-office"] },
  { name: "FedEx", domain: "fedex.com", keywords: ["fedex", "fdx"] },
];

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid URL provided" }, { status: 400 });
    }

    // Clean URL for analysis
    let cleanUrl = url.trim().toLowerCase();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(cleanUrl);
    } catch {
      return NextResponse.json({
        verdict: "Dangerous",
        reason: "The format is not a valid URL or domain.",
        details: {
          safeBrowsing: "Failed",
          domainAge: "Unknown",
          typosquatMatch: "Invalid Domain structure",
          keywordsFound: ["invalid_format"],
        },
      });
    }

    const hostname = parsedUrl.hostname;
    const protocol = parsedUrl.protocol;

    let verdict: "Safe" | "Suspicious" | "Dangerous" = "Safe";
    let reason = "This link appears to be safe and leads to a recognized domain.";
    
    let safeBrowsing = "Clean";
    let domainAge = "Over 3 years old";
    let typosquatMatch = "None (Matches trusted domain)";
    const keywordsFound: string[] = [];

    // 1. Protocol check
    const isHttp = protocol === "http:";
    if (isHttp) {
      keywordsFound.push("unencrypted_http");
    }

    // 2. Suspicious TLD check
    const suspiciousTlds = [".xyz", ".club", ".top", ".ru", ".buzz", ".gq", ".cf", ".tk", ".ml", ".info", ".online", ".site"];
    const matchedTld = suspiciousTlds.find(tld => hostname.endsWith(tld));
    if (matchedTld) {
      verdict = "Suspicious";
      reason = `Uses a low-cost, high-risk top-level domain (${matchedTld}) frequently associated with spam and scam sites.`;
      domainAge = "Registered 5 days ago (Simulated)";
      typosquatMatch = "Potential generic registration";
      safeBrowsing = "Flagged by community feeds";
    }

    // 3. Typosquatting / Impersonation check
    let impersonatedBrand = "";
    for (const brand of TRUSTED_BRANDS) {
      // Check if hostname is NOT the trusted domain, but contains its keywords
      const isTrusted = hostname === brand.domain || hostname.endsWith("." + brand.domain);
      
      if (!isTrusted) {
        const containsKeyword = brand.keywords.some(kw => hostname.includes(kw));
        if (containsKeyword) {
          impersonatedBrand = brand.name;
          break;
        }
      }
    }

    if (impersonatedBrand) {
      verdict = "Dangerous";
      reason = `This link mimics ${impersonatedBrand} but does not lead to the official website (${TRUSTED_BRANDS.find(b => b.name === impersonatedBrand)?.domain}).`;
      typosquatMatch = `High match for ${impersonatedBrand} impersonation`;
      domainAge = "Registered 3 days ago (Simulated)";
      safeBrowsing = "Suspected Phishing Site";
      keywordsFound.push("typosquatting", "brand_impersonation");
    }

    // 4. Subdomain trickery (e.g. login.sbi.co.in.scamdomain.com)
    if (!impersonatedBrand) {
      const parts = hostname.split(".");
      // If sbi or amazon is embedded somewhere in the subdomains
      const hasEmbeddedBrand = TRUSTED_BRANDS.some(brand => {
        return parts.some((part, idx) => {
          // If the part is exactly the brand keyword but the domain is different
          const isNotMainDomain = idx < parts.length - 2;
          return isNotMainDomain && brand.keywords.includes(part);
        });
      });

      if (hasEmbeddedBrand) {
        verdict = "Dangerous";
        reason = "Uses deceptive subdomains to mimic a trusted brand's official web address.";
        typosquatMatch = "Deceptive subdomain structure detected";
        domainAge = "Registered 12 days ago (Simulated)";
        safeBrowsing = "Flagged for social engineering";
        keywordsFound.push("deceptive_subdomain");
      }
    }

    // 5. Shortener / Masking checks
    const shorteners = ["bit.ly", "tinyurl.com", "t.co", "cutt.ly", "is.gd", "rebrand.ly"];
    if (shorteners.includes(hostname)) {
      verdict = "Suspicious";
      reason = "Uses a URL shortener which masks the final landing page. Always exercise caution before clicking.";
      typosquatMatch = "Masked destination address";
      domainAge = "Domain proxy active";
      safeBrowsing = "URL redirection active";
      keywordsFound.push("url_shortener");
    }

    // Adjusting final details if Safe
    if (verdict === "Safe") {
      // If HTTP, make it suspicious
      if (isHttp) {
        verdict = "Suspicious";
        reason = "The connection is not secure (HTTP). Any data entered could be intercepted.";
        safeBrowsing = "Clean (but connection unencrypted)";
        domainAge = "Established domain";
        typosquatMatch = "None";
      }
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({
      verdict,
      reason,
      details: {
        safeBrowsing,
        domainAge,
        typosquatMatch,
        keywordsFound: keywordsFound.length > 0 ? keywordsFound : ["None"],
      },
    });
  } catch (error) {
    console.error("Error in check API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
