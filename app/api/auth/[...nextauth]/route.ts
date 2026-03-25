import type { NextRequest } from "next/server";

import { handlers } from "../../../../lib/auth";

export const runtime = "nodejs";

const normalizeAuthUrl = (request: NextRequest) => {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (!host) return;
  const resolved = `${proto}://${host}`;
  process.env.NEXTAUTH_URL = resolved;
  process.env.AUTH_URL = resolved;
};

export async function GET(request: NextRequest) {
  normalizeAuthUrl(request);
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  normalizeAuthUrl(request);
  return handlers.POST(request);
}
