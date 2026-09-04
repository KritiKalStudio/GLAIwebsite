import { Button, ButtonLink } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Field, TextInput } from "@/components/ui/field";
import { Kicker, Section } from "@/components/blocks/section";

export const metadata = { title: "Style guide" };

const tokens = [
  ["canvas", "bg-canvas"],
  ["brand", "bg-brand"],
  ["accent", "bg-accent"],
  ["hope", "bg-hope"],
  ["sunshine", "bg-sunshine"],
  ["mist", "bg-mist"],
];

export default function StyleGuidePage() {
  return (
    <>
      <Section className="bg-mist">
        <Kicker>Stage 2</Kicker>
        <h1 className="mt-3 font-display text-4xl">Design system</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Tokens live in CSS variables. Components use token utilities, not raw hex values.
        </p>
      </Section>
      <Section>
        <h2 className="font-display text-2xl">Colour tokens</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {tokens.map(([name, cls]) => (
            <div key={name} className="w-28">
              <div className={`h-16 rounded-md border border-brand/10 ${cls}`} />
              <p className="mt-1 text-xs">{name}</p>
            </div>
          ))}
        </div>
        <h2 className="mt-12 font-display text-2xl">Buttons</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="sunshine">Donate</Button>
          <ButtonLink href="/" variant="ghost">
            Ghost link
          </ButtonLink>
        </div>
        <h2 className="mt-12 font-display text-2xl">Card and badge</h2>
        <Card className="mt-4 max-w-sm p-5">
          <Badge>Program</Badge>
          <h3 className="mt-3 font-display text-xl">Love in Action</h3>
          <p className="mt-2 text-sm text-muted">Sample card using paper, brand, and muted tokens.</p>
        </Card>
        <h2 className="mt-12 font-display text-2xl">Form field</h2>
        <div className="mt-4 max-w-sm">
          <Field label="Sample input" name="sample">
            <TextInput id="sample" name="sample" placeholder="Keyboard focus has a teal ring" />
          </Field>
        </div>
      </Section>
    </>
  );
}
