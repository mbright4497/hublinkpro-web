"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/supabase/env";

const clip = (v: FormDataEntryValue | null, n: number) => String(v ?? "").trim().slice(0, n);

export async function sendMessage(formData: FormData) {
  // Honeypot: real people never fill this hidden field. Pretend success.
  if (clip(formData.get("company_site"), 200)) redirect("/contact?sent=1");

  const name = clip(formData.get("name"), 120);
  const email = clip(formData.get("email"), 200);
  const message = clip(formData.get("message"), 4000);
  const source = clip(formData.get("source"), 200) || null;

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/contact?error=1");

  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("contact_messages")
    .insert({ name, email, message, source_path: source });
  if (error) redirect("/contact?error=1");

  // Best-effort email alert. The message is already saved, so a failure never blocks the visitor.
  if (process.env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "HubLinkPro <login@hublinkpro.com>",
          to: [process.env.CONTACT_NOTIFY_EMAIL || ADMIN_EMAIL],
          reply_to: email,
          subject: `New HubLinkPro message from ${name}`,
          text: `From: ${name} <${email}>\n\n${message}\n\n(Also saved in the admin inbox.)`,
        }),
      });
    } catch (e) {
      console.error("[HLP-CONTACT] email error", String(e));
    }
  }

  redirect("/contact?sent=1");
}
