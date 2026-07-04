"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import VerdictCard from "../../../components/VerdictCard";

interface ResultData {
  verdict: "Safe" | "Suspicious" | "Dangerous";
  reason: string;
  details: {
    safeBrowsing: string;
    domainAge: string;
    typosquatMatch: string;
    keywordsFound: string[];
  };
}

export default function ResultPage() {
  const params = useParams();
  const id = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<ResultData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchResult = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${apiBaseUrl}/api/result/${id}`);
        if (!response.ok) {
          throw new Error("Failed to retrieve result.");
        }
        const data = await response.json();
        if (data.error) {
          setErrorMessage(data.error);
        } else {
          setResult(data);
        }
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err.message || "An unexpected network error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();
  }, [id]);

  const goHomeButton = React.createElement(
    "div",
    { style: { display: "flex", justifyContent: "center", marginTop: "24px" } },
    React.createElement(
      "a",
      {
        href: "/",
        className: "submit-btn",
        style: {
          textDecoration: "none",
          textAlign: "center",
          display: "inline-block",
          width: "auto",
          padding: "12px 24px",
        },
      },
      "🔍 Scan Another Link or Message"
    )
  );

  return React.createElement(
    "main",
    { className: "app-container" },
    React.createElement(
      "header",
      { className: "app-header" },
      React.createElement("div", { className: "header-cyber-tag" }, "// SECURE SYSTEM //"),
      React.createElement("h1", { className: "app-title" }, "SHIELD Scanner"),
      React.createElement(
        "p",
        { className: "app-subtitle" },
        `Detailed scan verdict report for ID: ${id || ""}`
      )
    ),
    React.createElement(
      "section",
      { className: "dashboard-card", "aria-label": "Scan Result Panel" },
      isLoading
        ? React.createElement(
            "div",
            { className: "spinner-container" },
            React.createElement("div", {
              className: "cyber-spinner",
              role: "status",
              "aria-label": "Loading result",
            }),
            React.createElement("span", { className: "spinner-text" }, "RETRIEVING REPORT FROM SECURE ARCHIVE...")
          )
        : errorMessage
        ? React.createElement(
            "div",
            {
              style: {
                color: "var(--verdict-dangerous)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.95rem",
                textAlign: "center",
                padding: "20px",
              },
            },
            `[ERROR] ${errorMessage}`
          )
        : result
        ? React.createElement(VerdictCard, {
            verdict: result.verdict,
            reason: result.reason,
            details: result.details,
          })
        : null,
      !isLoading ? goHomeButton : null
    ),
    React.createElement(
      "footer",
      { className: "app-footer" },
      React.createElement(
        "p",
        { className: "footer-note" },
        React.createElement("strong", null, "⚠️ Disclaimer: "),
        "This tool helps identify suspicious links/messages but is not 100% guaranteed — stay cautious. Always double check directly with bank officials or trusted domains before sharing credentials."
      )
    )
  );
}
