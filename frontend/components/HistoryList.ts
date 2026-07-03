"use client";

import React from "react";

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

interface HistoryListProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}

export default function HistoryList({ history, onSelect }: HistoryListProps) {
  if (history.length === 0) {
    return React.createElement(
      "div",
      { className: "history-empty" },
      React.createElement("p", { className: "terminal-dim" }, "// No recent scans in this session.")
    );
  }

  const truncateInput = (str: string, maxLen = 45) => {
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen) + "...";
  };

  return React.createElement(
    "div",
    { className: "history-section" },
    React.createElement(
      "div",
      { className: "history-header" },
      React.createElement("h3", { className: "section-title" }, "// RECENT SCAN LOGS"),
      React.createElement("span", { className: "history-count" }, `[${history.length}/5]`)
    ),
    React.createElement(
      "div",
      { className: "history-list" },
      history.map((item) => {
        let badgeClass = "hist-badge-safe";
        if (item.verdict === "Suspicious") badgeClass = "hist-badge-suspicious";
        if (item.verdict === "Dangerous") badgeClass = "hist-badge-dangerous";

        return React.createElement(
          "button",
          {
            key: item.id,
            onClick: () => onSelect(item),
            className: "history-item-btn",
            title: "Click to reload scan result",
          },
          React.createElement(
            "div",
            { className: "history-item-meta" },
            React.createElement("span", { className: `history-verdict-dot ${badgeClass}` }),
            React.createElement("span", { className: "history-type" }, `[${item.type}]`),
            React.createElement("span", { className: "history-input-preview" }, truncateInput(item.input))
          ),
          React.createElement("div", { className: "history-item-time" }, item.timestamp)
        );
      })
    )
  );
}
