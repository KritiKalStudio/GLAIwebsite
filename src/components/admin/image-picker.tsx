"use client";

import { useState, useTransition } from "react";
import { uploadEmbeddedMedia } from "@/app/actions/admin";
import type { MediaChoice } from "@/lib/content/media";
import { cn } from "@/lib/cn";

async function compressImage(file: File, maxEdge = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  if (scale >= 1 && file.size < 400_000) return file;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) return file;
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}

export function ImagePicker({
  name,
  label,
  defaultValue,
  assets,
  shape = "rect",
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  assets: MediaChoice[];
  shape?: "rect" | "round";
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [library, setLibrary] = useState(assets);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-semibold text-ink">{label}</legend>
      <input type="hidden" name={name} value={url} />
      {url ? (
        shape === "round" ? (
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-24 w-24 rounded-full object-cover ring-2 ring-brand/10" />
            <button
              type="button"
              className="min-h-11 text-sm font-semibold text-accent"
              onClick={() => setUrl("")}
            >
              Remove picture
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-brand/10 bg-mist">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-36 w-full object-cover sm:h-44" />
          </div>
        )
      ) : (
        <p className="text-sm text-muted">No picture selected yet.</p>
      )}
      <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-dashed border-brand/25 bg-paper px-4 py-3 text-sm font-semibold text-brand">
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            start(async () => {
              try {
                const compressed = await compressImage(file);
                const fd = new FormData();
                fd.set("file", compressed);
                const uploaded = await uploadEmbeddedMedia(fd);
                setUrl(uploaded.url);
                setLibrary((prev) => [
                  {
                    id: uploaded.url,
                    url: uploaded.url,
                    filename: compressed.name,
                    thumbnailUrl: uploaded.thumbnailUrl ?? uploaded.url,
                  },
                  ...prev.filter((item) => item.url !== uploaded.url),
                ]);
                setError(null);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Upload failed.");
              }
            });
          }}
        />
        {pending ? "Uploading…" : "Upload from this device"}
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {library.length ? (
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Or choose from the library</p>
          <div className="mt-2 grid max-h-56 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-5">
            {library.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => setUrl(asset.url)}
                className={cn(
                  "overflow-hidden rounded-md border bg-mist",
                  url === asset.url ? "border-accent ring-2 ring-accent/40" : "border-brand/10",
                )}
                title={asset.filename}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.thumbnailUrl || asset.url}
                  alt=""
                  className="aspect-square h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </fieldset>
  );
}
