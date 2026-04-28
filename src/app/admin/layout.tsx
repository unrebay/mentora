import { redirect } from "next/navigation";
import { getAuthUser, ADMIN_EMAIL } from "@/lib/admin";

/** Hard server-side gate — only ADMIN_EMAIL can access /admin/* */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    redirect("/");
  }
  return <>{children}</>;
}
