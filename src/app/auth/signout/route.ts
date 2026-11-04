import { NextResponse, type NextRequest } from "next/server";
import { savedLocale } from "@/lib/i18n/core";
import { localePath } from "@/lib/i18n/paths";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL(localePath("/login", savedLocale(request)), request.nextUrl.origin), {
    status: 303,
  });
}
