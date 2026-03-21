import { NextResponse } from "next/server";

import { auth } from "./lib/auth";

const publicPaths = ["/login", "/signup", "/onboarding"];

export default auth(async (request) => {
  const { nextUrl } = request;
  const { pathname } = nextUrl;

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (!request.auth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/onboarding")) {
    return NextResponse.next();
  }

  const profileResponse = await fetch(new URL("/api/profile", request.url), {
    headers: {
      cookie: request.headers.get("cookie") ?? "",
    },
  });

  if (profileResponse.status === 404) {
    return NextResponse.redirect(new URL("/onboarding/step-1", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
