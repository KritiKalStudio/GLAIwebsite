import Link from "next/link";
import { notFound } from "next/navigation";
import { Kicker, Section } from "@/components/blocks/section";
import { AmbassadorDirectoryTable, PlaceCountsTable } from "@/components/network-directory";
import { getCountryCounts, getDirectoryAmbassadors } from "@/lib/content/ambassadors";
import {
  getDirectoryAtPlace,
  getNigeriaLgaCounts,
  getNigeriaPollingUnitCounts,
  getNigeriaStateCounts,
  getNigeriaWardCounts,
  getNigeriaZoneCounts,
  getPlaceMemberTotal,
  type CountRow,
  type NetworkPlaceFilter,
} from "@/lib/content/network";
import { getProjectsByCountry } from "@/lib/content/programs";
import { findPollingUnitBySlug, findWardBySlug } from "@/lib/nigeria-gazetteer";
import {
  findLgaBySlug,
  findStateBySlug,
  slugifyPlace,
  zoneForState,
  zoneFromSlug,
} from "@/lib/nigeria-locations";

type Crumb = { label: string; href: string };

function crumbsFor(parts: { country: string; code: string; zone?: string; state?: string; lga?: string; ward?: string; pollingUnit?: string }): Crumb[] {
  const crumbs: Crumb[] = [
    { label: "All countries", href: "/love-ambassadors/network" },
    { label: parts.country, href: `/love-ambassadors/network/${parts.code}` },
  ];
  const base = `/love-ambassadors/network/${parts.code}`;
  if (parts.zone) {
    crumbs.push({ label: parts.zone, href: `${base}/${slugifyPlace(parts.zone)}` });
  }
  if (parts.zone && parts.state) {
    crumbs.push({ label: parts.state, href: `${base}/${slugifyPlace(parts.zone)}/${slugifyPlace(parts.state)}` });
  }
  if (parts.zone && parts.state && parts.lga) {
    crumbs.push({
      label: parts.lga,
      href: `${base}/${slugifyPlace(parts.zone)}/${slugifyPlace(parts.state)}/${slugifyPlace(parts.lga)}`,
    });
  }
  if (parts.zone && parts.state && parts.lga && parts.ward) {
    crumbs.push({
      label: parts.ward,
      href: `${base}/${slugifyPlace(parts.zone)}/${slugifyPlace(parts.state)}/${slugifyPlace(parts.lga)}/${slugifyPlace(parts.ward)}`,
    });
  }
  if (parts.zone && parts.state && parts.lga && parts.ward && parts.pollingUnit) {
    crumbs.push({
      label: parts.pollingUnit,
      href: `${base}/${slugifyPlace(parts.zone)}/${slugifyPlace(parts.state)}/${slugifyPlace(parts.lga)}/${slugifyPlace(parts.ward)}/${slugifyPlace(parts.pollingUnit)}`,
    });
  }
  return crumbs;
}

export default async function CountryNetworkPage({
  params,
}: {
  params: Promise<{ country: string; place?: string[] }>;
}) {
  const { country, place = [] } = await params;
  const code = country.toUpperCase();
  const [counts, projects] = await Promise.all([getCountryCounts(), getProjectsByCountry(code)]);
  const summary = counts.find((row) => row.countryCode === code);
  if (!summary) notFound();
  if (place.length && code !== "NG") notFound();
  if (place.length > 5) notFound();

  if (code !== "NG") {
    const directory = await getDirectoryAmbassadors(code);
    return (
      <Section>
        <Kicker>Network</Kicker>
        <h1 className="mt-3 font-display text-2xl sm:text-4xl">{summary.country}</h1>
        <p className="mt-3 text-muted">
          {summary.total} approved ambassadors counted. {directory.length} appear by name with consent.
        </p>
        <div className="mt-8">
          <AmbassadorDirectoryTable rows={directory} showCountry={false} />
        </div>
        {projects.length ? (
          <>
            <h2 className="mt-12 font-display text-2xl">Projects in this country</h2>
            <ul className="mt-4 space-y-2">
              {projects.map((project) => (
                <li key={project.id}>
                  <Link className="text-brand underline" href={`/impact/${project.slug}`}>
                    {project.title}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <p className="mt-10">
          <Link href="/love-ambassadors/network" className="text-sm text-accent">
            ← All countries
          </Link>
        </p>
      </Section>
    );
  }

  const zone = place[0] ? zoneFromSlug(place[0]) : null;
  if (place[0] && !zone) notFound();
  const state = place[1] ? findStateBySlug(place[1]) : null;
  if (place[1] && (!state || zoneForState(state.name) !== zone)) notFound();
  const lga = place[2] && state ? findLgaBySlug(state.name, place[2]) : null;
  if (place[2] && !lga) notFound();
  const ward = place[3] && state && lga ? await findWardBySlug(state.name, lga, place[3]) : null;
  if (place[3] && !ward) notFound();
  const pollingUnit =
    place[4] && state && lga && ward ? await findPollingUnitBySlug(state.name, lga, ward, place[4]) : null;
  if (place[4] && !pollingUnit) notFound();

  const filter: NetworkPlaceFilter = {
    countryCode: "NG",
    zone: zone ?? undefined,
    state: state?.name,
    lga: lga ?? undefined,
    ward: ward ?? undefined,
    pollingUnit: pollingUnit ?? undefined,
  };

  let childRows: CountRow[] = [];
  let childNoun = "places";
  let childEmpty = "No places to list.";
  let childPlaceholder = "Search places";
  let heading = summary.country;
  const pathBase = `/love-ambassadors/network/NG`;

  if (!zone) {
    childRows = await getNigeriaZoneCounts();
    childNoun = "zones";
    childEmpty = "No geo-political zones listed yet.";
    childPlaceholder = "Search zones";
    heading = "Nigeria";
  } else if (!state) {
    childRows = await getNigeriaStateCounts(zone);
    childNoun = "states";
    childEmpty = "No states in this zone.";
    childPlaceholder = "Search states";
    heading = zone;
  } else if (!lga) {
    childRows = await getNigeriaLgaCounts(state.name);
    childNoun = "local government areas";
    childEmpty = "No local government areas in this state.";
    childPlaceholder = "Search LGAs";
    heading = state.name;
  } else if (!ward) {
    childRows = await getNigeriaWardCounts(state.name, lga);
    childNoun = "electoral wards";
    childEmpty = "No members have named an electoral ward in this LGA yet.";
    childPlaceholder = "Search wards";
    heading = lga;
  } else if (!pollingUnit) {
    childRows = await getNigeriaPollingUnitCounts(state.name, lga, ward);
    childNoun = "polling units";
    childEmpty = "No members have named a polling unit in this ward yet.";
    childPlaceholder = "Search polling units";
    heading = ward;
  } else {
    heading = pollingUnit;
  }

  childRows = [...childRows].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  const [total, directory] = await Promise.all([
    getPlaceMemberTotal(filter),
    getDirectoryAtPlace(filter),
  ]);
  const crumbs = crumbsFor({
    country: summary.country,
    code,
    zone: zone ?? undefined,
    state: state?.name,
    lga: lga ?? undefined,
    ward: ward ?? undefined,
    pollingUnit: pollingUnit ?? undefined,
  });
  const hrefFor = (row: CountRow) => {
    const segments = [pathBase];
    if (zone) segments.push(slugifyPlace(zone));
    else return `${pathBase}/${row.slug}`;
    if (state) segments.push(slugifyPlace(state.name));
    else return `${segments.join("/")}/${row.slug}`;
    if (lga) segments.push(slugifyPlace(lga));
    else return `${segments.join("/")}/${row.slug}`;
    if (ward) segments.push(slugifyPlace(ward));
    else return `${segments.join("/")}/${row.slug}`;
    return `${segments.join("/")}/${row.slug}`;
  };

  return (
    <Section>
      <Kicker>Network</Kicker>
      <nav className="mt-3 text-sm text-muted">
        {crumbs.map((crumb, index) => (
          <span key={crumb.href}>
            {index > 0 ? <span className="px-1.5">/</span> : null}
            {index === crumbs.length - 1 ? (
              <span className="text-ink">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-accent hover:underline">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
      <h1 className="mt-3 font-display text-2xl sm:text-4xl">{heading}</h1>
      <p className="mt-3 text-muted">
        {total} approved ambassador{total === 1 ? "" : "s"} counted. {directory.length} appear by name with consent.
      </p>
      {!pollingUnit ? (
        <div className="mt-8">
          <h2 className="font-display text-xl sm:text-2xl">
            {zone
              ? state
                ? lga
                  ? ward
                    ? "Polling units with members"
                    : "Electoral wards with members"
                  : "Local government areas"
                : "States"
              : "Geo-political zones"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {lga
              ? "Only places with at least one counted ambassador are listed here."
              : "Every zone, state, and LGA is listed, including those with no ambassadors yet."}
          </p>
          <div className="mt-4">
            <PlaceCountsTable
              rows={childRows.map((row) => ({ ...row, href: hrefFor(row) }))}
              empty={childEmpty}
              summaryNoun={childNoun}
              filterPlaceholder={childPlaceholder}
            />
          </div>
        </div>
      ) : null}
      <h2 className="mt-12 font-display text-xl sm:text-2xl">Consenting ambassadors here</h2>
      <div className="mt-4">
        <AmbassadorDirectoryTable rows={directory} showCountry={false} />
      </div>
      {!place.length && projects.length ? (
        <>
          <h2 className="mt-12 font-display text-2xl">Projects in this country</h2>
          <ul className="mt-4 space-y-2">
            {projects.map((project) => (
              <li key={project.id}>
                <Link className="text-brand underline" href={`/impact/${project.slug}`}>
                  {project.title}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </Section>
  );
}
