import { withAuth } from "next-auth/middleware";

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
