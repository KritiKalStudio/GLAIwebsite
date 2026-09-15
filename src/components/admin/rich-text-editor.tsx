"use client";

import { useRef, useState } from "react";
import { Bold, ImagePlus, Italic, Link2, List, ListOrdered, Upload, Video } from "lucide-react";
import { uploadEmbeddedMedia } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { editorHtml } from "@/lib/rich-text";

export function RichTextEditor({ name, defaultValue = "" }: { name: string; defaultValue?: string }) {
  const editor = useRef<HTMLDivElement>(null);
  const upload = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(() => editorHtml(defaultValue));
  const [busy, setBusy] = useState(false);
  const sync = () => setValue(editor.current?.innerHTML ?? "");
  const command = (commandName: string, commandValue?: string) => { editor.current?.focus(); document.execCommand(commandName, false, commandValue); sync(); };
  const insertLink = () => { const href = window.prompt("Paste the link URL"); if (href) command("createLink", href); };
  const insertVideo = () => { const href = window.prompt("Paste a YouTube video URL"); if (!href) return; const embed = href.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/"); command("insertHTML", `<iframe src="${embed}" title="Embedded video" allowfullscreen></iframe><p><br></p>`); };
  const uploadFile = async (file?: File) => {
    if (!file) return; setBusy(true);
    try { const data = new FormData(); data.set("file", file); const result = await uploadEmbeddedMedia(data); command("insertHTML", `<img src="${result.url}" alt="${file.name.replace(/[<>"]/g, "")}"><p><br></p>`); }
    catch (error) { window.alert(error instanceof Error ? error.message : "The image could not be uploaded."); }
    finally { setBusy(false); if (upload.current) upload.current.value = ""; }
  };
  return <div className="overflow-hidden rounded-xl border border-brand/15 bg-paper shadow-sm">
    <div className="flex flex-wrap gap-1 border-b border-brand/10 bg-mist/70 p-2">
      <Tool label="Bold" onClick={() => command("bold")}><Bold size={16} /></Tool><Tool label="Italic" onClick={() => command("italic")}><Italic size={16} /></Tool>
      <Tool label="Bulleted list" onClick={() => command("insertUnorderedList")}><List size={16} /></Tool><Tool label="Numbered list" onClick={() => command("insertOrderedList")}><ListOrdered size={16} /></Tool>
      <Tool label="Insert link" onClick={insertLink}><Link2 size={16} /></Tool><Tool label="Insert YouTube video" onClick={insertVideo}><Video size={16} /></Tool>
      <Tool label="Upload and insert image" onClick={() => upload.current?.click()} disabled={busy}>{busy ? <Upload className="animate-pulse" size={16} /> : <ImagePlus size={16} />}</Tool>
      <input ref={upload} type="file" accept="image/*" className="sr-only" onChange={(event) => uploadFile(event.target.files?.[0])} />
    </div>
    <div ref={editor} contentEditable suppressContentEditableWarning onInput={sync} data-placeholder="Write the story. Images and videos can be placed anywhere." className="prose-editor min-h-80 max-w-none p-5 text-base leading-8 outline-none" dangerouslySetInnerHTML={{ __html: value }} />
    <input type="hidden" name={name} value={value} />
  </div>;
}

function Tool({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return <Button type="button" variant="ghost" size="sm" flat className="h-9 w-9 rounded-md p-0" aria-label={label} title={label} onClick={onClick} disabled={disabled}>{children}</Button>;
}
