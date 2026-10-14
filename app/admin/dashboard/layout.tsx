import { redirect } from "next/navigation";
import { AntdRegistry } from "@ant-design/nextjs-registry";

import { getAdminSession } from "@/lib/auth/session";

import AdminShell from "./_components/AdminShell";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") redirect("/admin");

  return (
    <AntdRegistry>
      <AdminShell adminEmail={session.email}>{children}</AdminShell>
    </AntdRegistry>
  );
}
