import { CmsPage } from "@/components/cms-page";
import { pageMetadata } from "@/lib/page-meta";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return pageMetadata(`legal/${slug}`, slug);
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CmsPage slug={`legal/${slug}`} />;
}
