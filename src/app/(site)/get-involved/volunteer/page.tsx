import { CopySection, PageHero } from "@/components/blocks/page-sections";
import { Section } from "@/components/blocks/section";
import { Button, ButtonLink } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import { getPublishedOpportunitiesWithSlots } from "@/lib/content/volunteers";
import { toggleVolunteerRole } from "@/app/actions/volunteers";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { volunteerApplications } from "@/db/schema";

export const metadata = {
  title: "Volunteer",
  description: "Give time to dialogues, civic education, actions, and documentation.",
};

export default async function VolunteerPage() {
  const [opportunities, user] = await Promise.all([getPublishedOpportunitiesWithSlots(), getSessionUser()]);
  const myApps =
    user && !user.roleSlug
      ? await getDb()
          .select()
          .from(volunteerApplications)
          .where(
            and(
              eq(volunteerApplications.userId, user.id),
              inArray(volunteerApplications.status, ["accepted", "applied"]),
            ),
          )
      : [];
  const applied = new Set(myApps.map((row) => row.opportunityId));

  return (
    <>
      <PageHero
        kicker="Volunteer"
        headline="The work needs people in the room, not only on a list."
        subheadline="Open roles are listed below. Members can apply from their dashboard. Visitors sign up first, and the role is assigned if a slot remains."
        primary={{ href: user ? "/dashboard" : "/signup", label: user ? "Open dashboard" : "Become a member" }}
      />
      <CopySection heading="How volunteering works">
        <p>
          Each role has a limited number of slots. When you apply, a slot is held for you. You can un-apply at any time
          from your dashboard, which frees the slot for someone else.
        </p>
      </CopySection>
      <Section>
        <h2 className="font-display text-2xl sm:text-3xl">Open roles</h2>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2">
          {opportunities.map((role) => {
            const mine = applied.has(role.id);
            return (
              <li key={role.id} className="rounded-lg border border-brand/10 bg-paper p-4 sm:p-5">
                <h3 className="font-display text-base sm:text-xl">{role.title}</h3>
                <p className="mt-2 text-sm text-muted">{role.description}</p>
                <p className="mt-2 text-xs text-accent">
                  {role.remaining} of {role.slots} slots open
                  {role.location ? ` · ${role.location}` : ""}
                </p>
                <div className="mt-4">
                  {user && !user.roleSlug ? (
                    <form action={toggleVolunteerRole}>
                      <input type="hidden" name="opportunityId" value={role.id} />
                      <input type="hidden" name="intent" value={mine ? "unapply" : "apply"} />
                      <Button
                        type="submit"
                        size="sm"
                        className="w-full sm:w-auto"
                        disabled={!mine && role.remaining <= 0}
                      >
                        {mine ? "Un-apply" : role.remaining <= 0 ? "Full" : "Apply"}
                      </Button>
                    </form>
                  ) : (
                    <ButtonLink href={`/signup?role=${encodeURIComponent(role.slug)}`} size="sm" className="w-full sm:w-auto">
                      Sign up for this role
                    </ButtonLink>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Section>
    </>
  );
}
