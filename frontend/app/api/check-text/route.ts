import { NextResponse } from "next/server";

// Common scam keyword categories
const SCAM_CATEGORIES = [
  {
    name: "Financial Urgency / KYC Threat",
    keywords: ["kyc", "pan card", "pan-card", "blocked", "suspended", "account update", "electricity bill", "power cut", "disconnection", "yono sbi", "verify your card"],
    severity: 2, // high risk
  },
  {
    name: "Lottery & Rewards",
    keywords: ["lottery", "crore", "lakh", "cashback", "won", "prize", "winner", "lucky draw", "gift card", "spin the wheel", "scratch card"],
    severity: 1.5,
  },
  {
    name: "Unsolicited Job Offer",
    keywords: ["work from home", "part time job", "part-time", "earn money", "daily salary", "telegram task", "youtube subscribe", "like video", "daily wage"],
    severity: 1.5,
  },
  {
    name: "Urgent/Threatening Language",
    keywords: ["immediately", "action required", "court order", "arrest warrant", "cbse", "customs clearance", "tax refund", "final notice", "strictly prohibited"],
    severity: 1,
  },
];

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Invalid text provided" }, { status: 400 });
    }

    const cleanText = text.trim().toLowerCase();
    
    let verdict: "Safe" | "Suspicious" | "Dangerous" = "Safe";
    let reason = "This message does not contain typical scam keywords or urgent solicitation flags.";
    
    let safeBrowsing = "Clean";
    let domainAge = "N/A (Message check)";
    let typosquatMatch = "N/A";
    const keywordsFound: string[] = [];

    // 1. Detect if any URL exists in the text
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urlsInText = text.match(urlRegex) || [];
    const hasUrls = urlsInText.length > 0;

    // 2. Score scam indicators
    let scamScore = 0;
    const categoryMatches: string[] = [];

    for (const cat of SCAM_CATEGORIES) {
      const matched = cat.keywords.filter(keyword => cleanText.includes(keyword));
      if (matched.length > 0) {
        scamScore += matched.length * cat.severity;
        categoryMatches.push(cat.name);
        matched.forEach(kw => keywordsFound.push(kw));
      }
    }

    // Adjust score if a link is also present in a suspicious text
    if (hasUrls && scamScore > 0) {
      scamScore += 2; // Link combined with spam words is extremely dangerous
    }

    // 3. Determine verdict
    if (scamScore >= 4) {
      verdict = "Dangerous";
      reason = `Highly suspicious keywords found relating to ${categoryMatches.join(" and ")}.${hasUrls ? " Message also contains links, which is standard in phishing attacks." : ""}`;
      safeBrowsing = "Red Flag content detected";
    } else if (scamScore >= 1) {
      verdict = "Suspicious";
      reason = `Contains words commonly used in unsolicited offers or urgent requests. ${hasUrls ? "Contains links which should not be clicked blindly." : "Stay cautious."}`;
      safeBrowsing = "Potential spam content";
    } else if (hasUrls) {
      verdict = "Suspicious";
      reason = "Message contains links. Although no obvious scam keywords were found, verify the sender's identity before clicking.";
      safeBrowsing = "Contains URL redirect";
    }

    // If keywords list is empty
    if (keywordsFound.length === 0) {
      keywordsFound.push("None");
    }

    // Set specific values for details fields
    if (verdict === "Dangerous") {
      typosquatMatch = hasUrls ? "Link contains questionable text markers" : "Potential social engineering scam";
      domainAge = hasUrls ? "Requires individual URL analysis" : "N/A";
    } else if (verdict === "Suspicious") {
      typosquatMatch = hasUrls ? "Pasted links should be verified" : "None";
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
        keywordsFound,
      },
    });
  } catch (error) {
    console.error("Error in check-text API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
