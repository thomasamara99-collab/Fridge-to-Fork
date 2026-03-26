import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/login(.*)", "/signup(.*)"]);

export default clerkMiddleware(
  async (auth, request: NextRequest) => {
    if (isPublicRoute(request)) {
      return NextResponse.next();
    }

    const { userId } = auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (request.nextUrl.pathname.startsWith("/onboarding")) {
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
  },
  { signInUrl: "/login", signUpUrl: "/signup" },
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
