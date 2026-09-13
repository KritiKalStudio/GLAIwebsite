import { StoryForm } from "@/components/admin/story-form";
import { requireAdmin } from "@/lib/admin";
import { listMediaLibrary } from "@/lib/content/media";

export const metadata = { title: "New story" };

export default async function NewStoryPage() {
  await requireAdmin("content");
  const media = await listMediaLibrary();
  return (
    <div>
      <h1 className="font-display text-3xl">New story</h1>
      <StoryForm media={media} />
    </div>
  );
}
