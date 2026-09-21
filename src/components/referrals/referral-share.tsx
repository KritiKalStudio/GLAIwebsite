"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="shrink-0"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? "Copied" : label}
    </Button>
  );
}

export function ReferralShare({ code, link }: { code: string; link: string }) {
  return (
    <div className="mt-4 space-y-3">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Your code</p>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1 truncate rounded-md bg-mist px-3 py-2 font-display text-xl tracking-wide text-ink">{code}</p>
          <CopyButton value={code} label="Copy code" />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Your link</p>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1 truncate rounded-md bg-mist px-3 py-2 text-sm text-ink">{link}</p>
          <CopyButton value={link} label="Copy link" />
        </div>
      </div>
    </div>
  );
}
