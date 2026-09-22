"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { ambassadors, volunteerOpportunities } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { CACHE_TAGS, revalidateContent } from "@/lib/cache";
import { decryptField } from "@/lib/crypto";
import { assignVolunteerRole, unassignVolunteerRole } from "@/lib/volunteer-slots";

export async function toggleVolunteerRole(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/get-involved/volunteer");
  const opportunityId = String(formData.get("opportunityId") ?? "");
  const intent = String(formData.get("intent") ?? "apply");
  if (!opportunityId) return;

  const db = getDb();
  const [role] = await db
    .select()
    .from(volunteerOpportunities)
    .where(eq(volunteerOpportunities.id, opportunityId))
    .limit(1);
  if (!role) return;

  const [profile] = user.ambassadorId
    ? await db.select().from(ambassadors).where(eq(ambassadors.id, user.ambassadorId)).limit(1)
    : [];

  if (intent === "unapply") {
    await unassignVolunteerRole(role.id, user.id);
  } else {
    const result = await assignVolunteerRole({
      opportunitySlug: role.slug,
      userId: user.id,
      fullName: profile?.fullName ?? user.name,
      email: user.email,
      phone: decryptField(profile?.whatsapp ?? profile?.phone) ?? null,
      country: profile?.country ?? profile?.nationality ?? "Unspecified",
    });
    if (!result.ok) {
      const suggest = result.suggestions.map((item) => item.slug).join(",");
      revalidateContent(CACHE_TAGS.volunteers);
      redirect(`/dashboard/get-involved?notice=role-full&suggest=${encodeURIComponent(suggest)}`);
    }
  }

  revalidateContent(CACHE_TAGS.volunteers);
  revalidatePath("/dashboard", "layout");
  revalidatePath("/get-involved/volunteer");
  revalidatePath("/admin/volunteers");
}
