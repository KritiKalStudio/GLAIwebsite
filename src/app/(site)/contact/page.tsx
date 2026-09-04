import { CmsPage } from "@/components/cms-page";
import { ContactForm } from "@/components/forms/contact-form";
import { Section } from "@/components/blocks/section";
import { getSiteSettings } from "@/lib/content/settings";
import { pageMetadata } from "@/lib/page-meta";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return pageMetadata("contact", "Contact");
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  return (
    <CmsPage slug="contact">
      <Section id="contact-form" className="grid gap-10 lg:grid-cols-2">
        <div className="editorial-card h-fit bg-brand p-6 text-paper lg:sticky lg:top-32">
          <p className="eyebrow text-sunshine">Direct details</p>
          <h2 className="mt-3 font-display text-3xl">Start the conversation.</h2>
          <ul className="mt-6 space-y-4 text-sm text-paper/75">
            <li>{settings?.contact.email}</li>
            <li>Press: {settings?.contact.pressEmail}</li>
            <li>{settings?.contact.phone}</li>
            <li>{settings?.contact.address}</li>
          </ul>
        </div>
        <ContactForm />
      </Section>
    </CmsPage>
  );
}
