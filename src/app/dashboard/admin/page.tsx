// Redirects to the new standalone admin panel
import { redirect } from "next/navigation";

export default function OldAdminRedirect() {
  redirect("/admin");
}
