import { config } from "dotenv";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";

config({ path: ".env.local" });

import { getDb, getSql } from "@/db";
import { ambassadors, ngPollingUnits, ngWards } from "@/db/schema";
import {
  canonicalLgaName,
  canonicalStateName,
  titleCasePlace,
  zoneForState,
} from "@/lib/nigeria-locations";

const DATA_DIR = path.join(process.cwd(), "data", "inec");
const SOURCE = {
  states:
    "https://raw.githubusercontent.com/stradox4u/inec-polling-units/main/statesAndLgas.json",
  cleaned:
    "https://raw.githubusercontent.com/stradox4u/inec-polling-units/main/cleanedData.json",
};

type LgaRow = { id: string; name: string; abbreviation: string };
type StateRow = { state_id: number; lgas: LgaRow[] };
type WardNode = { name?: string; pollingUnits?: { name?: string; delimitation?: string; abbreviation?: string }[] };

async function loadJson<T>(fileName: string, url: string): Promise<T> {
  const localCandidates = [
    path.join(DATA_DIR, fileName),
    path.join(process.cwd(), "tmp-inec", fileName),
  ];
  for (const candidate of localCandidates) {
    try {
      return JSON.parse(await readFile(candidate, "utf8")) as T;
    } catch {
      // try the next location or download
    }
  }
  await mkdir(DATA_DIR, { recursive: true });
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not download ${url}: ${response.status}`);
  }
  const text = await response.text();
  const dest = path.join(DATA_DIR, fileName);
  await writeFile(dest, text);
  return JSON.parse(text) as T;
}

function lgaBucket(stateData: Record<string, Record<string, WardNode>> | undefined, lga: LgaRow) {
  if (!stateData) return undefined;
  return stateData[lga.id] ?? stateData[String(Number(lga.id))] ?? stateData[lga.abbreviation];
}

async function insertBatches<T extends Record<string, unknown>>(
  label: string,
  rows: T[],
  write: (chunk: T[]) => Promise<unknown>,
) {
  const size = 1000;
  for (let i = 0; i < rows.length; i += size) {
    await write(rows.slice(i, i + size));
    if (i === 0 || (i / size) % 10 === 0 || i + size >= rows.length) {
      console.log(`  ${label}: ${Math.min(i + size, rows.length)} / ${rows.length}`);
    }
  }
}

async function ensureLocationSchema() {
  const sql = getSql();
  await sql`
    ALTER TABLE ambassadors
      ADD COLUMN IF NOT EXISTS geo_political_zone text,
      ADD COLUMN IF NOT EXISTS electoral_ward text,
      ADD COLUMN IF NOT EXISTS polling_unit text
  `;
  await sql`CREATE INDEX IF NOT EXISTS ambassadors_country_code_idx ON ambassadors (country_code)`;
  await sql`CREATE INDEX IF NOT EXISTS ambassadors_place_idx ON ambassadors (country_code, geo_political_zone, state_of_origin, local_government)`;
  await sql`
    CREATE TABLE IF NOT EXISTS ng_wards (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      state_name text NOT NULL,
      lga_name text NOT NULL,
      name text NOT NULL,
      code text NOT NULL DEFAULT '',
      CONSTRAINT ng_wards_unique UNIQUE (state_name, lga_name, name)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS ng_wards_lookup_idx ON ng_wards (state_name, lga_name)`;
  await sql`
    CREATE TABLE IF NOT EXISTS ng_polling_units (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      state_name text NOT NULL,
      lga_name text NOT NULL,
      ward_name text NOT NULL,
      name text NOT NULL,
      code text NOT NULL DEFAULT '',
      CONSTRAINT ng_polling_units_unique UNIQUE (state_name, lga_name, ward_name, name, code)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS ng_polling_units_lookup_idx ON ng_polling_units (state_name, lga_name, ward_name)`;
}

async function main() {
  console.log("Ensuring location tables…");
  await ensureLocationSchema();
  console.log("Loading INEC gazetteer…");
  const states = await loadJson<Record<string, StateRow>>("statesAndLgas.json", SOURCE.states);
  const cleaned = await loadJson<Record<string, Record<string, Record<string, WardNode>>>>(
    "cleanedData.json",
    SOURCE.cleaned,
  );

  const wardRows: { stateName: string; lgaName: string; name: string; code: string }[] = [];
  const puRows: {
    stateName: string;
    lgaName: string;
    wardName: string;
    name: string;
    code: string;
  }[] = [];
  const unmatched = { states: new Set<string>(), lgas: new Set<string>() };
  const seenWards = new Set<string>();
  const seenUnits = new Set<string>();

  for (const [rawState, stateRow] of Object.entries(states)) {
    const stateName = canonicalStateName(rawState);
    if (!stateName) {
      unmatched.states.add(rawState);
      continue;
    }
    const stateData = cleaned[String(stateRow.state_id)] ?? cleaned[rawState];
    for (const lga of stateRow.lgas) {
      const lgaName = canonicalLgaName(stateName, lga.name);
      if (!lgaName) {
        unmatched.lgas.add(`${stateName} / ${lga.name}`);
        continue;
      }
      const wards = lgaBucket(stateData, lga);
      if (!wards) continue;
      for (const [wardId, ward] of Object.entries(wards)) {
        const wardName = titleCasePlace(ward.name || "").trim();
        if (!wardName) continue;
        const wardKey = `${stateName}|${lgaName}|${wardName}`;
        if (!seenWards.has(wardKey)) {
          seenWards.add(wardKey);
          wardRows.push({ stateName, lgaName, name: wardName, code: String(wardId) });
        }
        for (const unit of ward.pollingUnits ?? []) {
          const puName = titleCasePlace(unit.name || "").trim();
          if (!puName) continue;
          const code = (unit.delimitation || unit.abbreviation || "").trim();
          const puKey = `${stateName}|${lgaName}|${wardName}|${puName}|${code}`;
          if (seenUnits.has(puKey)) continue;
          seenUnits.add(puKey);
          puRows.push({ stateName, lgaName, wardName, name: puName, code });
        }
      }
    }
  }

  console.log(`Prepared ${wardRows.length} wards and ${puRows.length} polling units`);
  if (unmatched.states.size) console.log("Unmatched states:", [...unmatched.states].join(", "));
  if (unmatched.lgas.size) {
    console.log(`Unmatched LGAs (${unmatched.lgas.size}):`);
    for (const row of [...unmatched.lgas].slice(0, 20)) console.log("  ", row);
  }

  const db = getDb();
  console.log("Checking existing gazetteer rows…");
  const existingWards = await db
    .select({ stateName: ngWards.stateName, lgaName: ngWards.lgaName, name: ngWards.name })
    .from(ngWards);
  const wardKeys = new Set(existingWards.map((row) => `${row.stateName}|${row.lgaName}|${row.name}`));
  const newWards = wardRows.filter((row) => !wardKeys.has(`${row.stateName}|${row.lgaName}|${row.name}`));
  console.log(`  wards already loaded: ${existingWards.length}; inserting ${newWards.length}`);

  const existingUnits = await db
    .select({
      stateName: ngPollingUnits.stateName,
      lgaName: ngPollingUnits.lgaName,
      wardName: ngPollingUnits.wardName,
      name: ngPollingUnits.name,
      code: ngPollingUnits.code,
    })
    .from(ngPollingUnits);
  const unitKeys = new Set(
    existingUnits.map((row) => `${row.stateName}|${row.lgaName}|${row.wardName}|${row.name}|${row.code}`),
  );
  const newUnits = puRows.filter(
    (row) => !unitKeys.has(`${row.stateName}|${row.lgaName}|${row.wardName}|${row.name}|${row.code}`),
  );
  console.log(`  polling units already loaded: ${existingUnits.length}; inserting ${newUnits.length}`);

  if (newWards.length) {
    console.log("Inserting wards…");
    await insertBatches("wards", newWards, (chunk) => db.insert(ngWards).values(chunk).onConflictDoNothing());
  }
  if (newUnits.length) {
    console.log("Inserting polling units…");
    await insertBatches("polling units", newUnits, (chunk) =>
      db.insert(ngPollingUnits).values(chunk).onConflictDoNothing(),
    );
  }

  const nigerians = await db
    .select({
      id: ambassadors.id,
      stateOfOrigin: ambassadors.stateOfOrigin,
      geoPoliticalZone: ambassadors.geoPoliticalZone,
    })
    .from(ambassadors);
  for (const row of nigerians) {
    const zone = zoneForState(row.stateOfOrigin);
    if (!zone || row.geoPoliticalZone === zone) continue;
    await db.update(ambassadors).set({ geoPoliticalZone: zone, updatedAt: new Date() }).where(eq(ambassadors.id, row.id));
  }

  const samples: { email: string; fullName: string; state: string; lga: string }[] = [
    { email: "ada.okonkwo@example.org", fullName: "Ada Okonkwo", state: "Lagos", lga: "Ikeja" },
    { email: "ibrahim.bello@example.org", fullName: "Ibrahim Bello", state: "Kano", lga: "Kano Municipal" },
    { email: "chioma.eze@example.org", fullName: "Chioma Eze", state: "Enugu", lga: "Enugu North" },
  ];
  for (const sample of samples) {
    const [ward] = await db
      .select()
      .from(ngWards)
      .where(and(eq(ngWards.stateName, sample.state), eq(ngWards.lgaName, sample.lga)))
      .limit(1);
    const [unit] = ward
      ? await db
          .select()
          .from(ngPollingUnits)
          .where(
            and(
              eq(ngPollingUnits.stateName, sample.state),
              eq(ngPollingUnits.lgaName, sample.lga),
              eq(ngPollingUnits.wardName, ward.name),
            ),
          )
          .limit(1)
      : [];
    const place = {
      country: "Nigeria",
      countryCode: "NG" as const,
      nationality: "Nigeria",
      stateOfOrigin: sample.state,
      localGovernment: sample.lga,
      geoPoliticalZone: zoneForState(sample.state),
      electoralWard: ward?.name ?? null,
      pollingUnit: unit?.name ?? null,
      region: sample.state,
      updatedAt: new Date(),
    };
    const updated = await db
      .update(ambassadors)
      .set(place)
      .where(eq(ambassadors.email, sample.email))
      .returning({ id: ambassadors.id });
    if (!updated[0]) {
      await db.insert(ambassadors).values({
        fullName: sample.fullName,
        email: sample.email,
        whyJoin: "Seeded Nigerian location sample.",
        status: "active",
        consentToDirectory: true,
        principlesAgreedAt: new Date(),
        ...place,
      });
    }
  }

  console.log("Nigerian location gazetteer is ready.");
  await getSql().end({ timeout: 5 });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
