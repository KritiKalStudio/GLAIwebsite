"use client";

import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";

export function PageRichContentForm({ pageId, blockId, body, action }: { pageId: string; blockId?: string; body: string; action: (formData: FormData) => Promise<void> }) {
  return <form action={action} className="grid gap-4">
    <input type="hidden" name="pageId" value={pageId} />
    {blockId ? <input type="hidden" name="blockId" value={blockId} /> : null}
    <div><p className="text-sm font-semibold text-ink">Rich page content</p><p className="mt-1 text-xs text-muted">Place images or YouTube videos directly in this page. Images upload to R2 and appear in the media library.</p></div>
    <RichTextEditor name="body" defaultValue={body} />
    <Button type="submit" className="w-fit">Save page content</Button>
  </form>;
}
