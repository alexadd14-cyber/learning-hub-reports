import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireSuperAdmin() {
  const session = await requireSession();
  if (session.user.role !== "super_admin") {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function requireBranchUser() {
  const session = await requireSession();
  if (!session.user.branchId && session.user.role !== "super_admin") {
    throw new Error("FORBIDDEN");
  }
  return session;
}
