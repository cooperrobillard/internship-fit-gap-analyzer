/** Hosted prototype notice and deployment stack — shared by landing and dashboard. */

export function HostedPrototypeNotice() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
      <p className="font-medium text-amber-950">Hosted prototype</p>
      <p className="mt-2 text-amber-900/90">
        This deployment is a <strong>portfolio prototype</strong>, not mature
        production SaaS. The analyzer is <strong>rule-based</strong> (keyword
        taxonomy, not AI), and dashboard analysis requires Clerk authentication
        at the application route.
      </p>
      <p className="mt-2 text-amber-900/90">
        Vercel forwards analysis requests to the Render backend with a
        server-only shared secret, and basic input-size, safe-error, and abuse
        controls are in place. That does <strong>not</strong> equal a formal
        security audit, penetration test, or absolute security guarantee.
      </p>
      <p className="mt-2 text-amber-900/90">
        Please still avoid unusually sensitive resume or job text. The product
        save path stores structured results and metadata rather than raw pasted
        text, but platform/service logging cannot be guaranteed absent.
      </p>
    </div>
  );
}

const deploymentRows = [
  { layer: "Frontend", platform: "Vercel (Next.js)" },
  { layer: "Analysis API", platform: "Render (FastAPI)" },
  { layer: "Database", platform: "Supabase (Postgres)" },
  { layer: "Authentication", platform: "Clerk" },
  { layer: "Status", platform: "Limited public-beta / portfolio prototype" },
] as const;

export function DeploymentStatusSection() {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-zinc-900">Deployment status</h3>
      <p className="mt-2 text-sm text-zinc-600">
        Current hosted stack for this prototype:
      </p>
      <dl className="mt-4 space-y-2 text-sm">
        {deploymentRows.map((row) => (
          <div
            key={row.layer}
            className="flex flex-wrap gap-x-3 gap-y-1 rounded-md bg-zinc-50 px-3 py-2"
          >
            <dt className="font-medium text-zinc-800">{row.layer}</dt>
            <dd className="text-zinc-600">{row.platform}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
