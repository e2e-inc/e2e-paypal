import { CaptureStatus, OrderStatus, type Order } from "@paypal/paypal-server-sdk";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { ResultPanel } from "@/components/result-panel";
import { buttonClassName } from "@/components/ui/button";
import { formatUsd, fromPayPalValue } from "@/lib/item";
import { checkoutUrl, getOrders, refusedStatus } from "@/lib/paypal";

export default function ReturnPage({ searchParams }: PageProps<"/return">) {
  return (
    <main className="flex flex-1 flex-col justify-center px-e2e-3 py-e2e-8 md:px-e2e-6">
      <div className="mx-auto flex w-full max-w-105 flex-col gap-e2e-2">
        <Suspense fallback={<ResultPanel pending status="checking…" detail="asking PayPal about this payment." />}>
          <PaymentResult searchParams={searchParams} />
        </Suspense>
        <Link href="/" className={buttonClassName("outline", "w-full")}>
          back to checkout
        </Link>
      </div>
    </main>
  );
}

async function PaymentResult({ searchParams }: Pick<PageProps<"/return">, "searchParams">) {
  const { order_id: orderId } = await searchParams;
  if (typeof orderId !== "string") {
    return <ResultPanel status="no payment" detail="PayPal sends you here after you pay." />;
  }

  // Prerendering can resolve searchParams; PayPal must only be asked per request.
  await connection();
  const order = await getOrder(orderId);
  if (!order?.id) {
    return <ResultPanel status="not found" detail="PayPal has no order with this id." />;
  }

  const orderRow = { label: "order", value: order.id, mono: true };

  // Approved on PayPal's page, but the capture was declined. PayPal's advice: let the shopper pay another way.
  if (order.status === OrderStatus.Approved) {
    return (
      <>
        <ResultPanel
          status="not paid"
          detail="PayPal couldn't take the payment. nothing was charged."
          rows={[orderRow]}
        />
        <a href={checkoutUrl(order.id)} className={buttonClassName("primary", "w-full")}>
          choose another way to pay
        </a>
      </>
    );
  }

  if (order.status !== OrderStatus.Completed) {
    return (
      <ResultPanel
        status="not paid"
        detail="this order wasn't approved on PayPal."
        rows={[orderRow, { label: "PayPal status", value: order.status ?? "unknown", mono: true }]}
      />
    );
  }

  const capture = order.purchaseUnits?.[0]?.payments?.captures?.[0];
  const amount = formatUsd(fromPayPalValue(capture?.amount?.value ?? "0"));
  const paidBy = order.payer?.emailAddress ? ` by ${order.payer.emailAddress}` : "";
  const captureRow = { label: "capture", value: capture?.id ?? "none", mono: true };

  if (capture?.status === CaptureStatus.Pending) {
    const reason = capture.statusDetails?.reason?.toLowerCase().replaceAll("_", " ") ?? "no reason given";
    return (
      <ResultPanel
        status="pending"
        detail={`PayPal is holding ${amount}${paidBy}: ${reason}.`}
        rows={[orderRow, captureRow]}
      />
    );
  }

  if (capture?.status !== CaptureStatus.Completed) {
    return (
      <ResultPanel
        status="not paid"
        detail="PayPal has no completed payment for this order."
        rows={[orderRow, { label: "PayPal status", value: capture?.status ?? "no capture", mono: true }]}
      />
    );
  }

  return <ResultPanel status="paid" detail={`${amount} paid${paidBy}.`} rows={[orderRow, captureRow]} />;
}

async function getOrder(id: string): Promise<Order | null> {
  try {
    return (await getOrders().getOrder({ id })).result;
  } catch (error) {
    if (refusedStatus(error) === 404) return null;
    throw error;
  }
}
