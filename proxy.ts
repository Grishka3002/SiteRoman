import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader) {
    const [scheme, value] = authHeader.split(" ");

    if (scheme === "Basic" && value) {
      const decoded = atob(value);
      const [inputUser, inputPassword] = decoded.split(":");

      if (inputUser === username && inputPassword === password) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="admin"',
    },
  });
}

export const config = {
  matcher: ["/admin/:path*"],
};
