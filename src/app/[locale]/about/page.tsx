import { redirect } from "next/navigation";

export const dynamic = "force-static";

// /ru/about и /en/about → /<locale>/dashboard/about
// Раньше прямой URL давал 404; теперь корректный 308 redirect.
export default function AboutRedirect({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/dashboard/about`);
}
