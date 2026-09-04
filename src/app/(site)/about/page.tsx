import { CmsPage } from "@/components/cms-page";
import { getPublishedPeople } from "@/lib/content/settings";
import { pageMetadata } from "@/lib/page-meta";
import { Badge, Card } from "@/components/ui/card";
import { Section } from "@/components/blocks/section";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return pageMetadata("about", "About");
}

export default async function AboutPage() {
  const people = await getPublishedPeople();
  return (
    <CmsPage slug="about">
      {people.length ? (
        <Section>
          <h2 className="font-display text-3xl">Leadership</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Profiles below are CMS entries. Replace placeholders with verified biographies before launch.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {people.map((person) => (
              <Card key={person.id} className="editorial-card p-5 transition hover:-translate-y-1">
                <Badge>{person.group}</Badge>
                <h3 className="mt-3 font-display text-xl">{person.name}</h3>
                <p className="text-sm text-accent">{person.position}</p>
                <p className="mt-3 text-sm text-muted">{person.bio}</p>
              </Card>
            ))}
          </div>
        </Section>
      ) : null}
    </CmsPage>
  );
}
