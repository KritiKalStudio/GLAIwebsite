import { config } from "dotenv";
config({ path: ".env.local" });

import { getSql } from "@/db";

const sql = getSql();

async function roleExists(name: string) {
  const rows = await sql<{ exists: boolean }[]>`
    select exists(select 1 from pg_roles where rolname = ${name}) as exists
  `;
  return Boolean(rows[0]?.exists);
}

async function main() {
  const groups = await sql<
    { name: string; position: string; n: number }[]
  >`select name, position, count(*)::int as n from people group by 1, 2 order by n desc, name`;
  console.log("people before dedupe:");
  for (const row of groups) console.log(`  ${row.n}× ${row.name} — ${row.position}`);

  const deleted = await sql`
    delete from people
    where id in (
      select id from (
        select id,
          row_number() over (partition by name, position order by created_at asc, id asc) as rn
        from people
      ) d
      where rn > 1
    )
    returning id
  `;
  console.log(`deleted ${deleted.count} duplicate leader row(s)`);

  await sql.unsafe(`
    do $$ begin
      if not exists (
        select 1 from pg_constraint where conname = 'people_name_position'
      ) then
        alter table people add constraint people_name_position unique (name, position);
      end if;
    end $$;
  `);
  console.log("people unique (name, position) is in place");

  await sql`
    update people set
      name = 'Dr. Eniola Biodun',
      bio = 'PhD in Public Policy, with 20 years of experience in governance and nonprofit leadership. Dr. Biodun has served on multiple boards and is committed to advancing civic engagement and social responsibility.',
      responsibility = 'Governance and fiduciary oversight',
      "group" = 'board',
      sort_order = 1,
      status = 'published',
      updated_at = now()
    where position = 'Chair, Board of Trustees'
  `;
  await sql`
    update people set
      name = 'Engr. Usman Abubakar',
      bio = 'Engr. Usman Abubakar is the Executive Director of GLAI, with over 15 years of experience in project management and organizational development. He is dedicated to driving the organization''s mission and ensuring its strategic goals are met.',
      responsibility = 'Strategy, programs, and institutional partnerships',
      "group" = 'executive',
      sort_order = 2,
      status = 'published',
      updated_at = now()
    where position = 'Executive Director'
  `;
  console.log("leader biographies updated from seed");

  const tables = await sql<{ table: string; rls: boolean }[]>`
    select c.relname as table, c.relrowsecurity as rls
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
    order by 1
  `;
  console.log(`public tables: ${tables.length}`);

  const hasAnon = await roleExists("anon");
  const hasAuthenticated = await roleExists("authenticated");
  const policyRoles = [hasAnon ? "anon" : null, hasAuthenticated ? "authenticated" : null]
    .filter(Boolean)
    .join(", ");

  for (const table of tables) {
    await sql.unsafe(`alter table public.${quoteIdent(table.table)} enable row level security`);
    if (policyRoles) {
      await sql.unsafe(`
        do $$ begin
          create policy deny_anon_authenticated on public.${quoteIdent(table.table)}
            for all to ${policyRoles}
            using (false) with check (false);
        exception
          when duplicate_object then null;
        end $$;
      `);
    }
  }

  if (hasAnon || hasAuthenticated) {
    const targets = [hasAnon ? "anon" : null, hasAuthenticated ? "authenticated" : null]
      .filter(Boolean)
      .join(", ");
    await sql.unsafe(`revoke all on all tables in schema public from ${targets}`);
    await sql.unsafe(`revoke all on all sequences in schema public from ${targets}`);
    await sql.unsafe(`revoke all on all routines in schema public from ${targets}`);
    await sql.unsafe(`alter default privileges in schema public revoke all on tables from ${targets}`);
    await sql.unsafe(`alter default privileges in schema public revoke all on sequences from ${targets}`);
  }
  await sql.unsafe(`revoke all on all tables in schema public from public`);
  await sql.unsafe(`revoke all on all sequences in schema public from public`);

  const fns = await sql<{ name: string; args: string }[]>`
    select p.proname as name, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
  `;
  for (const fn of fns) {
    const ident = `${quoteIdent(fn.name)}(${fn.args})`;
    await sql.unsafe(`alter function public.${ident} set search_path = public, pg_temp`);
    console.log(`set search_path on public.${ident}`);
  }

  const after = await sql<{ table: string; rls: boolean; policies: number }[]>`
    select c.relname as table, c.relrowsecurity as rls, count(p.policyname)::int as policies
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_policies p on p.schemaname = 'public' and p.tablename = c.relname
    where n.nspname = 'public' and c.relkind = 'r'
    group by c.relname, c.relrowsecurity
    order by 1
  `;
  const missingRls = after.filter((row) => !row.rls);
  const missingPolicy = after.filter((row) => row.policies === 0);
  console.log(`RLS enabled: ${after.filter((row) => row.rls).length}/${after.length}`);
  if (missingRls.length) console.log("still missing RLS:", missingRls.map((row) => row.table).join(", "));
  if (missingPolicy.length) console.log("tables with no policy:", missingPolicy.map((row) => row.table).join(", "));

  const people = await sql<{ name: string; position: string }[]>`
    select name, position from people order by sort_order, name
  `;
  console.log("people after:");
  for (const person of people) console.log(`  ${person.name} — ${person.position}`);

  const grants = await sql<{ grantee: string; table_name: string; privilege_type: string }[]>`
    select grantee, table_name, privilege_type
    from information_schema.role_table_grants
    where table_schema = 'public'
      and grantee in ('anon', 'authenticated', 'PUBLIC')
    order by 1, 2, 3
  `;
  console.log(`anon/authenticated/PUBLIC table grants remaining: ${grants.length}`);
  for (const grant of grants.slice(0, 20)) {
    console.log(`  ${grant.grantee} ${grant.privilege_type} on ${grant.table_name}`);
  }

  const views = await sql<{ name: string }[]>`
    select table_name as name from information_schema.views where table_schema = 'public'
  `;
  console.log(`public views: ${views.length}${views.length ? " " + views.map((v) => v.name).join(", ") : ""}`);

  const extensions = await sql<{ extname: string; nspname: string }[]>`
    select e.extname, n.nspname
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where n.nspname = 'public'
  `;
  console.log("extensions in public:", extensions.map((row) => row.extname).join(", ") || "none");
}

function quoteIdent(value: string) {
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) {
    throw new Error(`Refusing to quote unsafe identifier: ${value}`);
  }
  return value;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
