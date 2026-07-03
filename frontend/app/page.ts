"use client";

import React, { useState, useEffect } from "react";
import VerdictCard from "../components/VerdictCard";
import HistoryList from "../components/HistoryList";

interface HistoryItem {
  id: string;
  input: string;
  type: "URL" | "Message";
  verdict: "Safe" | "Suspicious" | "Dangerous";
  reason: string;
  details: {
    safeBrowsing: string;
    domainAge: string;
    typosquatMatch: string;
    keywordsFound: string[];
  };
  timestamp: string;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"URL" | "Message">("URL");
  const [autoDetect, setAutoDetect] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    verdict: "Safe" | "Suspicious" | "Dangerous";
    reason: string;
    details: {
      safeBrowsing: string;
      domainAge: string;
      typosquatMatch: string;
      keywordsFound: string[];
    };
  } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const checkIsUrl = (text: string): boolean => {
    const trimmed = text.trim().toLowerCase();
    if (!trimmed) return false;

    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("www.")
    ) {
      return true;
    }

    if (!trimmed.includes(" ") && trimmed.includes(".")) {
      const parts = trimmed.split(".");
      const tld = parts[parts.length - 1];
      if (tld.length >= 2 && tld.length <= 6 && /^[a-z]+$/.test(tld)) {
        return true;
      }
    }

    if (trimmed.includes("http://") || trimmed.includes("https://")) {
      return true;
    }

    return false;
  };

  useEffect(() => {
    if (!autoDetect || !input.trim()) return;

    const isUrl = checkIsUrl(input);
    setMode(isUrl ? "URL" : "Message");
  }, [input, autoDetect]);

  const handleModeChange = (newMode: "URL" | "Message") => {
    setMode(newMode);
    setAutoDetect(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedInput = input.trim();
    if (!trimmedInput) {
      setErrorMessage("Please enter a link or message to check.");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const endpoint = mode === "URL" ? `${apiBaseUrl}/check-url` : `${apiBaseUrl}/check-text`;
      const payload = mode === "URL" ? { url: trimmedInput } : { text: trimmedInput };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Validation scan failed. Please try again.");
      }

      const data = await response.json();

      if (data.error) {
        setErrorMessage(data.error);
        setIsLoading(false);
        return;
      }

      setResult(data);

      const now = new Date();
      const timestamp = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        input: trimmedInput,
        type: mode,
        verdict: data.verdict,
        reason: data.reason,
        details: data.details,
        timestamp,
      };

      setHistory((prevHistory) => {
        const filtered = prevHistory.filter((item) => item.input !== trimmedInput);
        return [newHistoryItem, ...filtered].slice(0, 5);
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An unexpected network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setInput(item.input);
    setMode(item.type);
    setAutoDetect(false);
    setResult({
      verdict: item.verdict,
      reason: item.reason,
      details: item.details,
    });
    setErrorMessage("");
  };

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
        "Instantly check if a WhatsApp message or link is a scam or secure."
      )
    ),
    React.createElement(
      "section",
      { className: "dashboard-card", "aria-label": "Scam Scanner Panel" },
      React.createElement(
        "form",
        { onSubmit: handleSubmit, className: "form-group" },
        React.createElement(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: "8px" } },
          React.createElement(
            "div",
            { className: "toggle-container" },
            React.createElement(
              "button",
              {
                type: "button",
                className: `toggle-btn ${mode === "URL" ? "active" : ""}`,
                onClick: () => handleModeChange("URL"),
              },
              "🌐 Check URL"
            ),
            React.createElement(
              "button",
              {
                type: "button",
                className: `toggle-btn ${mode === "Message" ? "active" : ""}`,
                onClick: () => handleModeChange("Message"),
              },
              "💬 Check Message"
            )
          ),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "6px",
                paddingRight: "4px",
              },
            },
            React.createElement(
              "label",
              {
                htmlFor: "autoDetectToggle",
                style: {
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-dim)",
                  cursor: "pointer",
                },
              },
              "Auto-detect type"
            ),
            React.createElement("input", {
              id: "autoDetectToggle",
              type: "checkbox",
              checked: autoDetect,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setAutoDetect(e.target.checked),
              style: {
                cursor: "pointer",
                accentColor: "var(--accent-green)",
              },
            }),
            autoDetect
              ? React.createElement("span", { className: "autodetect-badge" }, "Auto")
              : null
          )
        ),
        React.createElement(
          "div",
          { className: "input-wrapper" },
          React.createElement("textarea", {
            value: input,
            onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value),
            className: "cyber-textarea",
            placeholder:
              mode === "URL"
                ? "Paste link here (e.g. sbi-login-portal.net, amazon.claim-prize.top)..."
                : "Paste text message here (e.g. 'Congratulations! You won 1 Crore lottery...')",
            "aria-label": "Input field for link or message to inspect",
          })
        ),
        errorMessage
          ? React.createElement(
              "div",
              {
                style: {
                  color: "var(--verdict-dangerous)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                },
              },
              `[ERROR] ${errorMessage}`
            )
          : null,
        React.createElement(
          "button",
          {
            type: "submit",
            className: "submit-btn",
            disabled: isLoading || !input.trim(),
          },
          isLoading ? "Analyzing..." : "🔍 Check Now"
        )
      ),
      isLoading
        ? React.createElement(
            "div",
            { className: "spinner-container" },
            React.createElement("div", {
              className: "cyber-spinner",
              role: "status",
              "aria-label": "Loading verification",
            }),
            React.createElement("span", { className: "spinner-text" }, "RUNNING ANALYTICAL PROTOCOLS...")
          )
        : null,
      result && !isLoading
        ? React.createElement(VerdictCard, {
            verdict: result.verdict,
            reason: result.reason,
            details: result.details,
          })
        : null
    ),
    React.createElement(
      "section",
      { className: "dashboard-card", "aria-label": "Session History logs" },
      React.createElement(HistoryList, { history: history, onSelect: handleSelectHistory })
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
