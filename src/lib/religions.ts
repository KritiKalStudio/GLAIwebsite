export const RELIGION_OPTIONS = [
  "African Traditional Religions",
  "Christianity",
  "Islam",
  "Other",
] as const;

export type ReligionOption = (typeof RELIGION_OPTIONS)[number];

export function resolveReligion(selected: string, otherText: string) {
  const choice = selected.trim();
  if (choice === "Other") {
    return otherText.trim();
  }
  return choice;
}

export function splitReligion(value: string | null | undefined) {
  const current = (value ?? "").trim();
  if (!current) return { selected: "", other: "" };
  if ((RELIGION_OPTIONS as readonly string[]).includes(current) && current !== "Other") {
    return { selected: current, other: "" };
  }
  return { selected: "Other", other: current === "Other" ? "" : current };
}
