import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = ["/login", "/signup", "/onboarding"];

export default async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const { pathname } = nextUrl;

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
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
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
