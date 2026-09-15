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
        <div className="grid gap-5 lg:grid-cols-2 lg:gap-10">
          <div className="h-fit rounded-lg bg-brand p-4 text-paper sm:rounded-[1.1rem] sm:p-6 lg:sticky lg:top-32">
            <p className="eyebrow text-sunshine">Direct details</p>
            <h2 className="mt-2 font-display text-xl sm:mt-3 sm:text-3xl">Start the conversation.</h2>
            <ul className="mt-4 space-y-3 text-sm text-paper/75 sm:mt-6 sm:space-y-4">
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
