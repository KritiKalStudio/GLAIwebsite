import { CmsPage } from "@/components/cms-page";
import { pageMetadata } from "@/lib/page-meta";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return pageMetadata("our-work", "Our Work");
}

export default async function OurWorkPage() {
  return <CmsPage slug="our-work" />;
}
