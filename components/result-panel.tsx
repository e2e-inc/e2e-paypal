export type ResultRow = { label: string; value: string; mono?: boolean };

type ResultPanelProps = { status: string; detail: string; rows?: ResultRow[]; pending?: boolean };

// No test id while pending: the fallback and the streamed result can briefly coexist.
export function ResultPanel({ status, detail, rows = [], pending = false }: ResultPanelProps) {
  return (
    <section
      aria-labelledby="result-heading"
      className="flex flex-col gap-e2e-1 border border-e2e-neutral-800 bg-e2e-neutral-800/40 p-e2e-3"
    >
      <h1 id="result-heading" className="type-caption text-e2e-neutral-500">
        payment
      </h1>
      <p data-testid={pending ? undefined : "payment-status"} className="mt-e2e-1 type-h3 text-e2e-off-white">
        {status}
      </p>
      <p className="type-body-m text-e2e-neutral-300">{detail}</p>
      {rows.length > 0 && (
        <dl className="mt-e2e-2 flex flex-col gap-e2e-1 border-t border-e2e-neutral-800 pt-e2e-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-e2e-2">
              <dt className="shrink-0 type-caption text-e2e-neutral-500">{row.label}</dt>
              <dd
                className={
                  row.mono ? "truncate type-code-s text-e2e-neutral-300" : "truncate type-body-s text-e2e-neutral-300"
                }
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
