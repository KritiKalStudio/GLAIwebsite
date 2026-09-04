import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/blocks/block-renderer";
import { getPublishedPage } from "@/lib/content/pages";

export async function CmsPage({
  slug,
  children,
}: {
  slug: string;
  children?: React.ReactNode;
}) {
  const page = await getPublishedPage(slug);
  if (!page) notFound();
  return (
    <>
      <BlockRenderer blocks={page.blocks} />
      {children}
    </>
  );
}
