import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { StoryForm } from "@/components/admin/story-form";
import { getDb } from "@/db";
import { stories } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function EditStoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("content");
  const { id } = await params;
  const [story] = await getDb().select().from(stories).where(eq(stories.id, id)).limit(1);
  if (!story) notFound();
  return (
    <div>
      <h1 className="font-display text-3xl">Edit story</h1>
      <StoryForm story={story} />
    </div>
  );
}
