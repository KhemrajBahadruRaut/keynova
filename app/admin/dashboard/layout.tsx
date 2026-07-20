import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/auth/session";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") redirect("/admin");

  return children;
}
