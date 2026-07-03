"use client";

import React, { useState } from "react";

interface VerdictCardProps {
  verdict: "Safe" | "Suspicious" | "Dangerous";
  reason: string;
  details: {
    safeBrowsing: string;
    domainAge: string;
    typosquatMatch: string;
    keywordsFound: string[];
  };
}

export default function VerdictCard({ verdict, reason, details }: VerdictCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getVerdictTheme = () => {
    switch (verdict) {
      case "Safe":
        return {
          class: "verdict-safe",
          label: "✓ Safe",
          icon: "🛡️",
        };
      case "Suspicious":
        return {
          class: "verdict-suspicious",
          label: "⚠ Suspicious",
          icon: "⚠️",
        };
      case "Dangerous":
        return {
          class: "verdict-dangerous",
          label: "☠ Dangerous",
          icon: "🚫",
        };
    }
  };

  const theme = getVerdictTheme();

  return React.createElement(
    "div",
    { className: `verdict-container ${theme.class}` },
    React.createElement(
      "div",
      { className: "verdict-header" },
      React.createElement(
        "div",
        { className: "verdict-badge" },
        React.createElement("span", { className: "verdict-icon" }, theme.icon),
        React.createElement("span", { className: "verdict-text" }, theme.label)
      ),
      React.createElement("div", { className: "verdict-time" }, "Scan Complete")
    ),
    React.createElement(
      "div",
      { className: "verdict-reason" },
      React.createElement("p", null, reason)
    ),
    React.createElement(
      "div",
      { className: "details-section" },
      React.createElement(
        "button",
        {
          onClick: () => setIsOpen(!isOpen),
          className: "details-toggle-btn",
          "aria-expanded": isOpen,
        },
        React.createElement("span", null, "Analysis Parameters"),
        React.createElement("span", { className: `details-arrow ${isOpen ? "open" : ""}` }, "▼")
      ),
      isOpen
        ? React.createElement(
            "div",
            { className: "details-content-wrapper" },
            React.createElement(
              "div",
              { className: "details-grid" },
              React.createElement(
                "div",
                { className: "detail-item" },
                React.createElement("div", { className: "detail-label" }, "Safe Browsing Status"),
                React.createElement("div", { className: "detail-value" }, details.safeBrowsing)
              ),
              React.createElement(
                "div",
                { className: "detail-item" },
                React.createElement("div", { className: "detail-label" }, "Domain/Source Age"),
                React.createElement("div", { className: "detail-value" }, details.domainAge)
              ),
              React.createElement(
                "div",
                { className: "detail-item" },
                React.createElement("div", { className: "detail-label" }, "Typosquatting Check"),
                React.createElement("div", { className: "detail-value" }, details.typosquatMatch)
              ),
              React.createElement(
                "div",
                { className: "detail-item" },
                React.createElement("div", { className: "detail-label" }, "Threat Markers Found"),
                React.createElement(
                  "div",
                  { className: "detail-value keywords-tags" },
                  details.keywordsFound.map((kw, idx) =>
                    React.createElement("span", { key: idx, className: "keyword-tag" }, kw)
                  )
                )
              )
            )
          )
        : null
    )
  );
}
