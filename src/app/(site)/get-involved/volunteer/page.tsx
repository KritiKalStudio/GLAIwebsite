import { CmsPage } from "@/components/cms-page";
import { VolunteerForm } from "@/components/forms/volunteer-form";
import { Section } from "@/components/blocks/section";
import { getPublishedOpportunities } from "@/lib/content/volunteers";
import { pageMetadata } from "@/lib/page-meta";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return pageMetadata("get-involved/volunteer", "Volunteer");
}

export default async function VolunteerPage() {
  const opportunities = await getPublishedOpportunities();
  return (
    <CmsPage slug="get-involved/volunteer">
      <Section id="apply">
        <h2 className="font-display text-3xl">Open roles</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {opportunities.map((role) => (
            <li key={role.id} className="rounded-lg border border-brand/10 bg-paper p-5">
              <h3 className="font-display text-xl">{role.title}</h3>
              <p className="mt-2 text-sm text-muted">{role.description}</p>
              {role.location ? <p className="mt-2 text-xs text-accent">{role.location}</p> : null}
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <VolunteerForm opportunities={opportunities} />
        </div>
      </Section>
    </CmsPage>
  );
}
