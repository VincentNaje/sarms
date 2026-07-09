"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 5;

export type LoginResult = {
  error?: string;
  lockedUntil?: string;
};

export async function login(
  _prevState: LoginResult | undefined,
  formData: FormData
): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  const admin = createAdminClient();

  const { data: existing, error: selectError } = await admin
    .from("login_attempts")
    .select("*")
    .eq("identifier", email)
    .maybeSingle();

  if (selectError) {
    console.error("login_attempts SELECT failed:", selectError);
  }

  const now = new Date();

  if (existing?.locked_until && new Date(existing.locked_until) > now) {
    return {
      error: "Too many failed attempts. Please try again later.",
      lockedUntil: existing.locked_until,
    };
  }

  const supabase = await createClient();
  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!authError) {
    if (existing) {
      const { error: deleteError } = await admin
        .from("login_attempts")
        .delete()
        .eq("identifier", email);
      if (deleteError) console.error("login_attempts DELETE failed:", deleteError);
    }
    redirect("/dashboard");
  }

  const windowExpired =
    existing &&
    now.getTime() - new Date(existing.first_attempt_at).getTime() >
      WINDOW_MINUTES * 60 * 1000;

  const nextCount = !existing || windowExpired ? 1 : existing.attempt_count + 1;
  const shouldLock = nextCount >= MAX_ATTEMPTS;
  const lockedUntil = shouldLock
    ? new Date(now.getTime() + WINDOW_MINUTES * 60 * 1000).toISOString()
    : null;

  const { error: upsertError } = await admin.from("login_attempts").upsert(
    {
      identifier: email,
      attempt_count: nextCount,
      first_attempt_at:
        !existing || windowExpired ? now.toISOString() : existing.first_attempt_at,
      last_attempt_at: now.toISOString(),
      locked_until: lockedUntil,
    },
    { onConflict: "identifier" }
  );

  if (upsertError) {
    console.error("login_attempts UPSERT failed:", upsertError);
    return {
      error:
        "Invalid email or password. (Rate limit tracking failed — check server logs.)",
    };
  }

  if (shouldLock) {
    return {
      error: "Too many failed attempts. Please try again later.",
      lockedUntil: lockedUntil!,
    };
  }

  const remaining = MAX_ATTEMPTS - nextCount;
  return {
    error: `Invalid email or password. ${remaining} attempt${
      remaining === 1 ? "" : "s"
    } remaining.`,
  };
}