import { PageHero } from "@/components/blocks/page-sections";
import { ContactForm } from "@/components/forms/contact-form";
import { Section } from "@/components/blocks/section";
import { getSiteSettings } from "@/lib/content/settings";

export const metadata = {
  title: "Contact",
  description: "Write to GLAI — public, press, partnership, or safeguarding.",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <PageHero
        kicker="Contact"
        headline="We read what you send."
        subheadline="Use the form for general, press, partnership, and safeguarding messages. Do not include payment-card details in email."
        primary={{ href: "#contact-form", label: "Send a message" }}
      />
      <Section id="contact-form">
        <div className="grid gap-10 lg:grid-cols-2">
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
        </div>
      </Section>
    </>
  );
}
