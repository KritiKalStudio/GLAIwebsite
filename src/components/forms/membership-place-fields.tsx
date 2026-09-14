"use client";

import { useMemo, useState } from "react";
import { COUNTRIES } from "@/lib/countries";
import { lgasForState, NIGERIA_STATES, NOT_APPLICABLE } from "@/lib/nigeria-locations";
import { RELIGION_OPTIONS, splitReligion } from "@/lib/religions";
import { Field, Select, TextInput } from "@/components/ui/field";

type Defaults = {
  nationality?: string;
  country?: string;
  stateOfOrigin?: string;
  localGovernment?: string;
  religion?: string;
};

export function MembershipPlaceFields({ defaults }: { defaults?: Defaults }) {
  const [nationality, setNationality] = useState(defaults?.nationality || "Nigeria");
  const [country, setCountry] = useState(defaults?.country || "Nigeria");
  const [stateOfOrigin, setStateOfOrigin] = useState(defaults?.stateOfOrigin || "");
  const [localGovernment, setLocalGovernment] = useState(defaults?.localGovernment || "");
  const religionParts = splitReligion(defaults?.religion);
  const [religion, setReligion] = useState(religionParts.selected);
  const [religionOther, setReligionOther] = useState(religionParts.other);

  const lgas = useMemo(() => lgasForState(stateOfOrigin), [stateOfOrigin]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nationality" name="nationality">
          <Select
            id="nationality"
            name="nationality"
            required
            value={nationality}
            onChange={(event) => setNationality(event.target.value)}
          >
            <option value="" disabled>
              Select nationality
            </option>
            {nationality && !COUNTRIES.some((item) => item.name === nationality) ? (
              <option value={nationality}>{nationality}</option>
            ) : null}
            {COUNTRIES.map((item) => (
              <option key={`nat-${item.code}`} value={item.name}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Country" name="country" hint="Where you currently live">
          <Select
            id="country"
            name="country"
            required
            value={country}
            onChange={(event) => setCountry(event.target.value)}
          >
            <option value="" disabled>
              Select country
            </option>
            {country && !COUNTRIES.some((item) => item.name === country) ? (
              <option value={country}>{country}</option>
            ) : null}
            {COUNTRIES.map((item) => (
              <option key={`co-${item.code}`} value={item.name}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="State of origin" name="stateOfOrigin">
          <Select
            id="stateOfOrigin"
            name="stateOfOrigin"
            required
            value={stateOfOrigin}
            onChange={(event) => {
              const next = event.target.value;
              setStateOfOrigin(next);
              const nextLgas = lgasForState(next);
              setLocalGovernment((current) => (nextLgas.includes(current) ? current : ""));
            }}
          >
            <option value="" disabled>
              Select state
            </option>
            <option value={NOT_APPLICABLE}>{NOT_APPLICABLE}</option>
            {stateOfOrigin &&
            stateOfOrigin !== NOT_APPLICABLE &&
            !NIGERIA_STATES.some((state) => state.name === stateOfOrigin) ? (
              <option value={stateOfOrigin}>{stateOfOrigin}</option>
            ) : null}
            {NIGERIA_STATES.map((state) => (
              <option key={state.name} value={state.name}>
                {state.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Local government" name="localGovernment">
          <Select id="localGovernment" name="localGovernment" required value={localGovernment} onChange={(event) => setLocalGovernment(event.target.value)}>
            <option value="" disabled>
              Select LGA
            </option>
            {localGovernment && !lgas.includes(localGovernment) ? (
              <option value={localGovernment}>{localGovernment}</option>
            ) : null}
            {lgas.map((lga) => (
              <option key={lga} value={lga}>
                {lga}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Religion" name="religion">
        <Select
          id="religion"
          name="religion"
          required
          value={religion}
          onChange={(event) => setReligion(event.target.value)}
        >
          <option value="" disabled>
            Select religion
          </option>
          {RELIGION_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </Field>
      {religion === "Other" ? (
        <Field label="Please specify religion" name="religionOther">
          <TextInput
            id="religionOther"
            name="religionOther"
            required
            value={religionOther}
            onChange={(event) => setReligionOther(event.target.value)}
          />
        </Field>
      ) : null}
    </>
  );
}
