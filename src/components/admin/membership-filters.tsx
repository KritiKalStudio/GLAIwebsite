"use client";

import { useRouter } from "next/navigation";
import { Field, Select } from "@/components/ui/field";
import type { MembershipPlaceFilter } from "@/lib/admin/membership-place";
import { zoneForState } from "@/lib/nigeria-locations";

type Options = {
  countries: { countryCode: string; country: string; total: number }[];
  zones: string[];
  states: string[];
  lgas: string[];
  wards: string[];
  pollingUnits: string[];
};

function hrefFor(next: Partial<MembershipPlaceFilter>) {
  const params = new URLSearchParams();
  if (next.countryCode) params.set("country", next.countryCode);
  if (next.zone) params.set("zone", next.zone);
  if (next.state) params.set("state", next.state);
  if (next.lga) params.set("lga", next.lga);
  if (next.ward) params.set("ward", next.ward);
  if (next.pu) params.set("pu", next.pu);
  const query = params.toString();
  return query ? `/admin/membership?${query}` : "/admin/membership";
}

export function MembershipFilters({
  filter,
  options,
}: {
  filter: MembershipPlaceFilter;
  options: Options;
}) {
  const router = useRouter();
  const nigerian = filter.countryCode === "NG";

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Country" name="country">
        <Select
          id="country"
          value={filter.countryCode}
          onChange={(event) => router.push(hrefFor({ countryCode: event.target.value }))}
        >
          <option value="">All countries</option>
          {options.countries.map((row) => (
            <option key={row.countryCode} value={row.countryCode}>
              {row.country} ({row.total})
            </option>
          ))}
        </Select>
      </Field>
      {nigerian ? (
        <>
          <Field label="Geo-political zone" name="zone">
            <Select
              id="zone"
              value={filter.zone}
              onChange={(event) =>
                router.push(hrefFor({ countryCode: "NG", zone: event.target.value }))
              }
            >
              <option value="">All zones</option>
              {options.zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="State / region" name="state">
            <Select
              id="state"
              value={filter.state}
              onChange={(event) => {
                const state = event.target.value;
                router.push(
                  hrefFor({
                    countryCode: "NG",
                    zone: zoneForState(state) ?? filter.zone,
                    state,
                  }),
                );
              }}
            >
              <option value="">All states</option>
              {options.states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="LGA" name="lga">
            <Select
              id="lga"
              value={filter.lga}
              disabled={!filter.state}
              onChange={(event) =>
                router.push(
                  hrefFor({
                    countryCode: "NG",
                    zone: filter.zone,
                    state: filter.state,
                    lga: event.target.value,
                  }),
                )
              }
            >
              <option value="">{filter.state ? "All LGAs" : "Select a state first"}</option>
              {options.lgas.map((lga) => (
                <option key={lga} value={lga}>
                  {lga}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Electoral ward" name="ward">
            <Select
              id="ward"
              value={filter.ward}
              disabled={!filter.lga}
              onChange={(event) =>
                router.push(
                  hrefFor({
                    countryCode: "NG",
                    zone: filter.zone,
                    state: filter.state,
                    lga: filter.lga,
                    ward: event.target.value,
                  }),
                )
              }
            >
              <option value="">{filter.lga ? "All wards" : "Select an LGA first"}</option>
              {options.wards.map((ward, index) => (
                <option key={`ward-${index}-${ward}`} value={ward}>
                  {ward}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Polling unit" name="pu">
            <Select
              id="pu"
              value={filter.pu}
              disabled={!filter.ward}
              onChange={(event) =>
                router.push(
                  hrefFor({
                    countryCode: "NG",
                    zone: filter.zone,
                    state: filter.state,
                    lga: filter.lga,
                    ward: filter.ward,
                    pu: event.target.value,
                  }),
                )
              }
            >
              <option value="">{filter.ward ? "All polling units" : "Select a ward first"}</option>
              {options.pollingUnits.map((unit, index) => (
                <option key={`pu-${index}-${unit}`} value={unit}>
                  {unit}
                </option>
              ))}
            </Select>
          </Field>
        </>
      ) : null}
    </div>
  );
}
