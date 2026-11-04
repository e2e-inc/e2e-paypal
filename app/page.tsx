import { Button } from "@/components/ui/button";
import { formatUsd, ITEM } from "@/lib/item";

export default function CheckoutPage() {
  return (
    <main className="flex flex-1 flex-col justify-center py-e2e-8">
      <div className="mx-auto grid w-full max-w-312 items-center gap-e2e-8 px-e2e-3 md:px-e2e-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-e2e-10">
        <div>
          <p className="type-caption text-e2e-mint">PayPal example</p>
          <h1 className="mt-e2e-2 type-h1 text-e2e-off-white">
            PayPal checkout,
            <br />
            tested end to end
          </h1>
          <p className="mt-e2e-3 max-w-120 type-body-l text-e2e-neutral-400">
            a real PayPal payment in the sandbox, tested with e2e: in the browser, and against what PayPal recorded.
          </p>
          <p className="mt-e2e-4 type-caption text-e2e-neutral-500">
            log in as your sandbox buyer, or pay by card with 4772 1290 5653 3503, any future expiry, any cvv.
          </p>
        </div>

        <OrderPanel />
      </div>
    </main>
  );
}

function OrderPanel() {
  const total = formatUsd(ITEM.amount);

  return (
    <section
      aria-labelledby="order-heading"
      className="flex flex-col gap-e2e-3 border border-e2e-neutral-800 bg-e2e-neutral-800/40 p-e2e-3"
    >
      <h2 id="order-heading" className="type-caption text-e2e-neutral-500">
        your order
      </h2>
      <dl className="flex flex-col gap-e2e-2 type-body-m">
        <div className="flex justify-between gap-e2e-2 text-e2e-neutral-300">
          <dt>{ITEM.name}</dt>
          <dd>{total}</dd>
        </div>
        <div className="flex justify-between gap-e2e-2 border-t border-e2e-neutral-800 pt-e2e-2 text-e2e-off-white">
          <dt>total</dt>
          <dd data-testid="order-total">{total}</dd>
        </div>
      </dl>
      <form action="/checkout" method="post">
        <Button type="submit" className="w-full">
          pay with PayPal
        </Button>
      </form>
      <p className="type-body-s text-e2e-neutral-500">you pay on sandbox.paypal.com, PayPal&apos;s own page.</p>
    </section>
  );
}
