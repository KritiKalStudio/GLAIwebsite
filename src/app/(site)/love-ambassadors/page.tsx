import { CmsPage } from "@/components/cms-page";
import { pageMetadata } from "@/lib/page-meta";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return pageMetadata("love-ambassadors", "Love Ambassadors");
}

export default async function LoveAmbassadorsPage() {
  return <CmsPage slug="love-ambassadors" />;
}
