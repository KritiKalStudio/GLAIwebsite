"use client";

import { useEffect, useMemo, useState } from "react";
import { COUNTRIES } from "@/lib/countries";
import {
  isNigerianState,
  lgasForState,
  NIGERIA_STATES,
  NOT_APPLICABLE,
  zoneForState,
} from "@/lib/nigeria-locations";
import { RELIGION_OPTIONS, splitReligion } from "@/lib/religions";
import { Field, Select, TextInput } from "@/components/ui/field";

type Defaults = {
  nationality?: string;
  country?: string;
  stateOfOrigin?: string;
  localGovernment?: string;
  electoralWard?: string;
  pollingUnit?: string;
  religion?: string;
};

export function MembershipPlaceFields({ defaults }: { defaults?: Defaults }) {
  const [nationality, setNationality] = useState(defaults?.nationality || "Nigeria");
  const [country, setCountry] = useState(defaults?.country || "Nigeria");
  const [stateOfOrigin, setStateOfOrigin] = useState(defaults?.stateOfOrigin || "");
  const [localGovernment, setLocalGovernment] = useState(defaults?.localGovernment || "");
  const [electoralWard, setElectoralWard] = useState(defaults?.electoralWard || "");
  const [pollingUnit, setPollingUnit] = useState(defaults?.pollingUnit || "");
  const [wards, setWards] = useState<string[]>([]);
  const [pollingUnits, setPollingUnits] = useState<string[]>([]);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const religionParts = splitReligion(defaults?.religion);
  const [religion, setReligion] = useState(religionParts.selected);
  const [religionOther, setReligionOther] = useState(religionParts.other);

  const lgas = useMemo(() => lgasForState(stateOfOrigin), [stateOfOrigin]);
  const nigerian = isNigerianState(stateOfOrigin);
  const zone = zoneForState(stateOfOrigin);
  const showNigeriaPlace =
    stateOfOrigin !== NOT_APPLICABLE &&
    (nigerian || nationality === "Nigeria" || country === "Nigeria");

  useEffect(() => {
    if (!nigerian || !localGovernment || localGovernment === NOT_APPLICABLE) {
      setWards([]);
      return;
    }
    let cancelled = false;
    setWardsLoading(true);
    const params = new URLSearchParams({ state: stateOfOrigin, lga: localGovernment });
    fetch(`/api/locations/wards?${params}`)
      .then((response) => response.json())
      .then((data: { wards?: string[] }) => {
        if (cancelled) return;
        const next = [...new Set(data.wards ?? [])];
        setWards(next);
        setElectoralWard((current) => (current && next.includes(current) ? current : ""));
      })
      .catch(() => {
        if (!cancelled) setWards([]);
      })
      .finally(() => {
        if (!cancelled) setWardsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nigerian, stateOfOrigin, localGovernment]);

  useEffect(() => {
    if (!nigerian || !localGovernment || !electoralWard) {
      setPollingUnits([]);
      return;
    }
    let cancelled = false;
    setUnitsLoading(true);
    const params = new URLSearchParams({
      state: stateOfOrigin,
      lga: localGovernment,
      ward: electoralWard,
    });
    fetch(`/api/locations/polling-units?${params}`)
      .then((response) => response.json())
      .then((data: { pollingUnits?: string[] }) => {
        if (cancelled) return;
        const next = [...new Set(data.pollingUnits ?? [])];
        setPollingUnits(next);
        setPollingUnit((current) => (current && next.includes(current) ? current : ""));
      })
      .catch(() => {
        if (!cancelled) setPollingUnits([]);
      })
      .finally(() => {
        if (!cancelled) setUnitsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nigerian, stateOfOrigin, localGovernment, electoralWard]);

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
              setElectoralWard("");
              setPollingUnit("");
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
          <Select
            id="localGovernment"
            name="localGovernment"
            required
            value={localGovernment}
            onChange={(event) => {
              setLocalGovernment(event.target.value);
              setElectoralWard("");
              setPollingUnit("");
            }}
          >
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
      {showNigeriaPlace ? (
        <>
          <Field
            label="Geo-political zone"
            name="geoPoliticalZoneLabel"
            hint="Set automatically from the state you selected"
          >
            <input type="hidden" name="geoPoliticalZone" value={zone ?? ""} />
            <TextInput id="geoPoliticalZoneLabel" value={zone ?? ""} readOnly />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Electoral ward" name="electoralWard" hint="Optional">
              <Select
                id="electoralWard"
                name="electoralWard"
                value={electoralWard}
                disabled={wardsLoading || !localGovernment}
                onChange={(event) => {
                  setElectoralWard(event.target.value);
                  setPollingUnit("");
                }}
              >
                <option value="">{wardsLoading ? "Loading wards…" : "Prefer not to say"}</option>
                {electoralWard && !wards.includes(electoralWard) ? (
                  <option value={electoralWard}>{electoralWard}</option>
                ) : null}
                {wards.map((ward, index) => (
                  <option key={`ward-${index}-${ward}`} value={ward}>
                    {ward}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Polling unit" name="pollingUnit" hint="Optional">
              <Select
                id="pollingUnit"
                name="pollingUnit"
                value={pollingUnit}
                disabled={unitsLoading || !electoralWard}
                onChange={(event) => setPollingUnit(event.target.value)}
              >
                <option value="">
                  {unitsLoading ? "Loading polling units…" : electoralWard ? "Prefer not to say" : "Select a ward first"}
                </option>
                {pollingUnit && !pollingUnits.includes(pollingUnit) ? (
                  <option value={pollingUnit}>{pollingUnit}</option>
                ) : null}
                {pollingUnits.map((unit, index) => (
                  <option key={`pu-${index}-${unit}`} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </>
      ) : null}
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
