"use client";

import { useState } from "react";

export default function ShareChannel({
  url,
  name,
  variant = "button",
}: {
  url: string;
  name: string;
  variant?: "button" | "bar";
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: name, text: `${name} on HubLinkPro`, url });
        return;
      }
    } catch {
      return; // user cancelled the share sheet
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  return (
    <button type="button" onClick={share} className={variant === "bar" ? "abtn" : "btn-ghost"}>
      {copied ? "✓ Link copied" : variant === "bar" ? "↗ Share" : "↗ Share this Channel"}
    </button>
  );
}
