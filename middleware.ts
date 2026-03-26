import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/login(.*)", "/signup(.*)"]);

export default clerkMiddleware(
  async (auth, request: NextRequest) => {
    if (isPublicRoute(request)) {
      return NextResponse.next();
    }

    const { userId } = auth();
    const isApiRoute = request.nextUrl.pathname.startsWith("/api");
    if (!userId) {
      if (isApiRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (isApiRoute || request.nextUrl.pathname.startsWith("/onboarding")) {
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
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
