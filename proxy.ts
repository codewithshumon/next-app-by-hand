import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
}

async function getTokenPayload(request: NextRequest): Promise<TokenPayload | null> {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getTokenPayload(request);

  // Public routes
  const publicPaths = ["/login", "/register", "/api/auth/login", "/api/auth/register"];
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (token && (pathname === "/login" || pathname === "/register")) {
      const dest = token.roles.includes("admin") ? "/admin" : "/";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  // Static assets
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // Home page is public
  if (pathname === "/") return NextResponse.next();

  // Admin routes - require admin role
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/users")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!token.roles.includes("admin")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Protected customer routes
  const protectedPaths = ["/profile"];
  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
