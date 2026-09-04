import { CmsPage } from "@/components/cms-page";
import { pageMetadata } from "@/lib/page-meta";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return pageMetadata("home");
}

export default async function HomePage() {
  return <CmsPage slug="home" />;
}
