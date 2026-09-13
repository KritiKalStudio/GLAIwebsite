import dns from "node:dns";

let patched = false;

/**
 * Windows Node dns.lookup() returns ENOTFOUND for IPv6-only hosts
 * (Supabase direct db.*.supabase.co has AAAA, no A). Patch lookup to
 * fall back to resolve6 so postgres.js and drizzle-kit can connect.
 */
export function patchIpv6Dns() {
  if (patched) return;
  patched = true;

  const original = dns.lookup.bind(dns);

  dns.lookup = ((
    hostname: string,
    options?: unknown,
    callback?: unknown,
  ) => {
    const cb = (
      typeof options === "function" ? options : callback
    ) as
      | ((err: NodeJS.ErrnoException | null, address: string, family: number) => void)
      | ((
          err: NodeJS.ErrnoException | null,
          addresses: dns.LookupAddress[],
        ) => void)
      | undefined;
    const opts = (typeof options === "function" ? {} : options) as
      | dns.LookupOptions
      | undefined;

    const isSupabaseDirect =
      typeof hostname === "string" &&
      hostname.startsWith("db.") &&
      hostname.endsWith(".supabase.co");
    const isSupabasePooler =
      typeof hostname === "string" &&
      hostname.includes("pooler.supabase.com");

    if (typeof cb !== "function") {
      return original(hostname, options as never, callback as never);
    }

    if (!isSupabaseDirect && isSupabasePooler) {
      const maxAttempts = 4;
      const attempt = (n: number) => {
        original(hostname, options as never, ((err: NodeJS.ErrnoException | null, ...rest: unknown[]) => {
          const retryable =
            err &&
            (err.code === "ENOTFOUND" || err.code === "EAI_AGAIN" || err.code === "ETIMEOUT" || err.code === "ENODATA");
          if (retryable && n < maxAttempts) {
            setTimeout(() => attempt(n + 1), 250 * n);
            return;
          }
          (cb as (...args: unknown[]) => void)(err, ...rest);
        }) as never);
      };
      attempt(1);
      return;
    }

    if (!isSupabaseDirect) {
      return original(hostname, options as never, callback as never);
    }

    dns.resolve6(hostname, (err, addresses) => {
      if (err || !addresses[0]) {
        return original(hostname, options as never, callback as never);
      }
      const all = Boolean(opts && "all" in opts && opts.all);
      if (all) {
        (
          cb as (
            err: NodeJS.ErrnoException | null,
            addresses: dns.LookupAddress[],
          ) => void
        )(null, [{ address: addresses[0], family: 6 }]);
        return;
      }
      (
        cb as (
          err: NodeJS.ErrnoException | null,
          address: string,
          family: number,
        ) => void
      )(null, addresses[0], 6);
    });
  }) as typeof dns.lookup;
}

patchIpv6Dns();
