"use client";

import { useState } from "react";
import type { EventCustomField } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";

type DraftField = {
  id: string;
  label: string;
  kind: "text" | "choice";
  multiple: boolean;
  required: boolean;
  optionsText: string;
};

function toDraft(field: EventCustomField): DraftField {
  return {
    id: field.id,
    label: field.label,
    kind: field.kind,
    multiple: field.multiple,
    required: field.required,
    optionsText: field.options.join("\n"),
  };
}

function newId() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function EventFieldsEditor({ initial }: { initial: EventCustomField[] }) {
  const [fields, setFields] = useState<DraftField[]>(() => initial.map(toDraft));

  function update(id: string, patch: Partial<DraftField>) {
    setFields((current) => current.map((field) => (field.id === id ? { ...field, ...patch } : field)));
  }

  function add(kind: "text" | "single" | "multi") {
    setFields((current) => [
      ...current,
      {
        id: newId(),
        label: "",
        kind: kind === "text" ? "text" : "choice",
        multiple: kind === "multi",
        required: false,
        optionsText: "",
      },
    ]);
  }

  function move(id: string, direction: -1 | 1) {
    setFields((current) => {
      const index = current.findIndex((field) => field.id === id);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= current.length) return current;
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item);
      return copy;
    });
  }

  const payload: EventCustomField[] = fields.map((field) => ({
    id: field.id,
    label: field.label,
    kind: field.kind,
    multiple: field.kind === "choice" && field.multiple,
    required: field.required,
    options:
      field.kind === "choice"
        ? field.optionsText
            .split("\n")
            .map((option) => option.trim())
            .filter(Boolean)
        : [],
  }));

  return (
    <div className="space-y-3 rounded-lg border border-brand/10 bg-mist/40 p-4">
      <input type="hidden" name="customFields" value={JSON.stringify(payload)} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">Guest questions</h2>
          <p className="mt-1 text-sm text-muted">
            Add free-text or choice questions. Guests answer these when they RSVP. Name and email are always collected.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => add("text")}>
            Free text
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => add("single")}>
            Single choice
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => add("multi")}>
            Multiple choice
          </Button>
        </div>
      </div>
      {fields.length === 0 ? <p className="text-sm text-muted">No extra questions yet.</p> : null}
      {fields.map((field, index) => (
        <div key={field.id} className="grid gap-3 rounded-md border border-brand/10 bg-paper p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span>
              {field.kind === "text" ? "Free text" : field.multiple ? "Multiple choice" : "Single choice"} · {index + 1}
            </span>
            <span className="flex gap-2">
              <button type="button" className="underline" onClick={() => move(field.id, -1)}>
                Up
              </button>
              <button type="button" className="underline" onClick={() => move(field.id, 1)}>
                Down
              </button>
              <button
                type="button"
                className="text-danger underline"
                onClick={() => setFields((current) => current.filter((item) => item.id !== field.id))}
              >
                Remove
              </button>
            </span>
          </div>
          <Field label="Question" name={`label-${field.id}`}>
            <TextInput
              id={`label-${field.id}`}
              value={field.label}
              onChange={(event) => update(field.id, { label: event.target.value })}
            />
          </Field>
          {field.kind === "choice" ? (
            <Field label="Choices" name={`options-${field.id}`} hint="One choice on each line. At least two.">
              <TextArea
                id={`options-${field.id}`}
                className="min-h-24"
                value={field.optionsText}
                onChange={(event) => update(field.id, { optionsText: event.target.value })}
              />
            </Field>
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(event) => update(field.id, { required: event.target.checked })}
            />
            Required
          </label>
        </div>
      ))}
    </div>
  );
}
