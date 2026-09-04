import { saveProject } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/field";

export function ProjectForm({
  project,
}: {
  project?: {
    id: string;
    slug: string;
    title: string;
    focusArea: string;
    location: string;
    country: string;
    countryCode: string;
    challenge: string;
    actionsTaken: string;
    featuredImageUrl: string | null;
    status: string;
  };
}) {
  return (
    <form action={saveProject} className="mt-6 grid max-w-3xl gap-4">
      {project ? <input type="hidden" name="id" value={project.id} /> : null}
      <Field label="Title" name="title">
        <TextInput id="title" name="title" defaultValue={project?.title} required />
      </Field>
      <Field label="Web address" name="slug">
        <TextInput id="slug" name="slug" defaultValue={project?.slug} required />
      </Field>
      <Field label="Focus area" name="focusArea">
        <Select id="focusArea" name="focusArea" defaultValue={project?.focusArea ?? "education"}>
          <option value="education">Education</option>
          <option value="peacebuilding">Peacebuilding</option>
          <option value="community_development">Community development</option>
          <option value="youth_engagement">Youth engagement</option>
          <option value="dialogue">Dialogue</option>
          <option value="humanitarian_action">Humanitarian action</option>
        </Select>
      </Field>
      <Field label="Location" name="location">
        <TextInput id="location" name="location" defaultValue={project?.location} required />
      </Field>
      <Field label="Country" name="country">
        <TextInput id="country" name="country" defaultValue={project?.country} required />
      </Field>
      <Field label="Country code" name="countryCode" hint="Two-letter code, e.g. NG">
        <TextInput id="countryCode" name="countryCode" defaultValue={project?.countryCode} required />
      </Field>
      <Field label="The challenge" name="challenge">
        <TextArea id="challenge" name="challenge" className="min-h-40" defaultValue={project?.challenge} required />
      </Field>
      <Field label="Actions taken" name="actionsTaken">
        <TextArea
          id="actionsTaken"
          name="actionsTaken"
          className="min-h-40"
          defaultValue={project?.actionsTaken}
          required
        />
      </Field>
      <Field label="Image URL" name="featuredImageUrl">
        <TextInput id="featuredImageUrl" name="featuredImageUrl" defaultValue={project?.featuredImageUrl ?? ""} />
      </Field>
      <Field label="Status" name="status">
        <Select id="status" name="status" defaultValue={project?.status ?? "draft"}>
          <option value="draft">Draft</option>
          <option value="preview">Preview</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
      </Field>
      <Button type="submit">Save project</Button>
    </form>
  );
}
