import { saveStory } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

export function StoryForm({
  story,
}: {
  story?: {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    body: string;
    category: string;
    status: string;
    authorName: string | null;
    featuredImageUrl: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    involvesMinors: boolean;
    safeguardingReviewed: boolean;
  };
}) {
  return (
    <form action={saveStory} className="mt-6 grid max-w-3xl gap-4">
      {story ? <input type="hidden" name="id" value={story.id} /> : null}
      <Field label="Title" name="title">
        <TextInput id="title" name="title" defaultValue={story?.title} required />
      </Field>
      <Field label="Web address" name="slug">
        <TextInput id="slug" name="slug" defaultValue={story?.slug} required />
      </Field>
      <Field label="Category" name="category">
        <Select id="category" name="category" defaultValue={story?.category ?? "stories_of_change"}>
          <option value="stories_of_change">Stories of Change</option>
          <option value="news">News</option>
          <option value="events">Events</option>
          <option value="ambassador_stories">Ambassador Stories</option>
          <option value="community_stories">Community Stories</option>
          <option value="campaigns">Campaigns</option>
        </Select>
      </Field>
      <Field label="Status" name="status">
        <Select id="status" name="status" defaultValue={story?.status ?? "draft"}>
          <option value="draft">Draft</option>
          <option value="preview">Preview</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
      </Field>
      <Field label="Excerpt" name="excerpt">
        <TextArea id="excerpt" name="excerpt" defaultValue={story?.excerpt} required />
      </Field>
      <Field label="Body" name="body">
        <RichTextEditor name="body" defaultValue={story?.body} />
      </Field>
      <Field label="Author name" name="authorName">
        <TextInput id="authorName" name="authorName" defaultValue={story?.authorName ?? ""} />
      </Field>
      <Field label="SEO title" name="seoTitle">
        <TextInput id="seoTitle" name="seoTitle" defaultValue={story?.seoTitle ?? ""} />
      </Field>
      <Field label="SEO description" name="seoDescription">
        <TextArea id="seoDescription" name="seoDescription" defaultValue={story?.seoDescription ?? ""} />
      </Field>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="involvesMinors"
          defaultChecked={story?.involvesMinors}
          className="mt-1"
        />
        <span>This story involves children or other people who need safeguarding protection.</span>
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="safeguardingReviewed"
          defaultChecked={story?.safeguardingReviewed}
          className="mt-1"
        />
        <span>
          A safeguarding review has been completed. Required before publishing any story that involves
          children or vulnerable people.
        </span>
      </label>
      <Button type="submit">Save story</Button>
    </form>
  );
}
