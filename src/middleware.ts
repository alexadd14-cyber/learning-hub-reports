import { withAuth } from "next-auth/middleware";
import { DEMO_MODE } from "@/lib/demo";

export default withAuth(
  function middleware() {
    // Access decisions handled by authorized callback below.
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        if (pathname.startsWith("/login")) return true;
        if (pathname.startsWith("/api/auth")) return true;

        // Demo mode: only the admin area stays protected; the report
        // generator and its API routes are open so they can be demoed
        // without signing in.
        if (DEMO_MODE) {
          if (pathname.startsWith("/admin")) return false;
          return true;
        }

        if (!token) return false;

        if (pathname.startsWith("/admin")) {
          return token.role === "super_admin";
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/", "/admin/:path*", "/api/catalog", "/api/generate", "/api/analyze-marking"],
};
