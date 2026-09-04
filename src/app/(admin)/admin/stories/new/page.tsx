import { StoryForm } from "@/components/admin/story-form";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "New story" };

export default async function NewStoryPage() {
  await requireAdmin("content");
  return (
    <div>
      <h1 className="font-display text-3xl">New story</h1>
      <StoryForm />
    </div>
  );
}
