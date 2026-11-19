"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "@/app/dashboard/actions";

// The public pages are static (fast, and good for search), so they can't know who is looking. This checks for the
// Supabase login cookie in the browser after the page loads: no network call, and it doesn't pull the Supabase
// client into the homepage. It only decides which links to show. Every private page still checks the real
// session on the server, so a stale cookie just means the visitor lands on the sign-in form.
const hasLoginCookie = () =>
  document.cookie.split(";").some((c) => /^\s*sb-.+-auth-token(\.\d+)?=./.test(c));

export function useSignedIn(): boolean {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => setSignedIn(hasLoginCookie()), []);
  return signedIn;
}

export function NavSignIn() {
  const signedIn = useSignedIn();
  if (signedIn) {
    return (
      <form action={signOut} style={{ display: "contents" }}>
        <button type="submit" className="signin signoutbtn">Sign out</button>
      </form>
    );
  }
  return <Link href="/login?mode=signin" className="signin">Sign in</Link>;
}

export function NavCta() {
  const signedIn = useSignedIn();
  return signedIn ? (
    <Link href="/dashboard" className="listbtn">Your dashboard</Link>
  ) : (
    <Link href="/login" className="listbtn">Build your Channel</Link>
  );
}
