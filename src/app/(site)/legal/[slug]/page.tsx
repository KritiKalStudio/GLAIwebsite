import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LegalBody } from "@/components/blocks/page-sections";
import { isLegalSlug, legalPages } from "@/lib/content/legal";

export function generateStaticParams() {
  return Object.keys(legalPages).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isLegalSlug(slug)) return { title: "Legal" };
  const page = legalPages[slug];
  return { title: page.title, description: page.description };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isLegalSlug(slug)) notFound();
  const page = legalPages[slug];
  return <LegalBody heading={page.title} body={page.body} />;
}
