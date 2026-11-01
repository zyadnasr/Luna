import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const requestedNext = url.searchParams.get("next") ?? "/admin";
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/admin";
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  } else if (tokenHash && (type === "invite" || type === "recovery")) {
    const supabase = await createClient();
    await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
