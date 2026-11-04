import { describe } from "@e2e-dev/web";
import { CaptureStatus, OrderStatus } from "@paypal/paypal-server-sdk";
import { type Agent, credentials, expect } from "e2e";

import { guestCard, PAYPAL_PAGE, skip, skipWithoutBuyer, test } from "./fixtures";

const PAID_CAPTURE = { status: CaptureStatus.Completed, amount: { currencyCode: "USD", value: "20.00" } };

const GUEST_CONTEXT =
  "Pay as a guest with a card, without logging in, and don't create a PayPal account. After Pay with Debit or Credit Card, PayPal sometimes first shows a Check out as a guest page that asks only for an email, and the card form comes after Continue to Payment.";

// PayPal's card form differs between runs, so the agent fills the fields this one shows.
const FILL_CARD_FORM =
  "fill in the card form, every field it shows: card number {number}, expiration date {expiry}, CVV {cvc}, first name {firstName}, last name {lastName}, street address {street}, city {city}, state {state}, ZIP code {zip}, phone number {phone}, and email {email}";

type Card = ReturnType<typeof guestCard>;

// Up to a filled card form, whichever version of PayPal's guest flow comes up.
async function fillCardForm(agent: Agent, card: Card) {
  await agent.act("open PayPal's card form to pay as a guest, giving the email {email} if PayPal asks for it first", {
    params: { email: card.email },
  });
  await agent.assert("PayPal shows a form for card details");

  await agent.act(FILL_CARD_FORM, { params: card });
  await agent.assert(`the card number field shows ${card.number} and the first name is ${card.firstName}`, {
    vision: true,
  });
}

// PayPal's checkout isn't built for automation, and its pages change between runs, so these tests retry.
describe("redirect checkout", { tags: ["redirect"], skip, retries: 2, timeout: 180_000 }, () => {
  test(
    "the sandbox buyer pays on PayPal's page and PayPal records it",
    { skip: skipWithoutBuyer },
    async ({ app, agent, browser, screen, paypal, startCheckout }) => {
      await app.open("/");
      const orderId = await startCheckout();
      // Screenshots stop once the password is filled, so the vision check comes first.
      await agent.assert("the page is PayPal's checkout, asking to log in or to pay with a card", { vision: true });

      const buyer = credentials.user("buyer");
      await agent.act("log in to PayPal with email {email} and password {password}", {
        params: { email: buyer.username, password: buyer.password },
      });
      await agent.assert("PayPal shows the buyer's ways to pay, a total of $20.00, and a Complete Purchase button");

      await agent.act("click Complete Purchase");
      await expect(screen.getByTestId("payment-status")).toHaveText("paid", { timeout: 30_000 });
      await expect(browser).toHaveURL(`/return?order_id=${orderId}`);

      const { result: order } = await paypal.getOrder({ id: orderId });
      expect(order.status).toBe(OrderStatus.Completed);
      expect(order.payer?.emailAddress).toBe(buyer.username);
      expect(order.purchaseUnits?.[0]?.payments?.captures?.[0]).toMatchObject(PAID_CAPTURE);
    },
  );

  test(
    "a guest pays by card on PayPal's page and PayPal records it",
    { agentContext: GUEST_CONTEXT },
    async ({ app, agent, browser, screen, paypal, startCheckout }) => {
      await app.open("/");
      const orderId = await startCheckout();
      const card = guestCard("pays");
      await fillCardForm(agent, card);

      await agent.act("pay with this card as a guest");
      await expect(screen.getByTestId("payment-status")).toHaveText("paid", { timeout: 45_000 });
      await expect(browser).toHaveURL(`/return?order_id=${orderId}`);

      const { result: order } = await paypal.getOrder({ id: orderId });
      expect(order.status).toBe(OrderStatus.Completed);
      expect(order.payer?.emailAddress).toBe(card.email.value);
      expect(order.purchaseUnits?.[0]?.payments?.captures?.[0]).toMatchObject(PAID_CAPTURE);
    },
  );

  test(
    "a card the bank refuses leaves the order unpaid",
    {
      agentContext: `${GUEST_CONTEXT} CCREJECT-REFUSED as the first name is a PayPal sandbox trigger that makes the bank refuse the card, so type it exactly as given. A refusal is the expected outcome: PayPal saying the card was declined, or our shop's page saying not paid.`,
    },
    async ({ app, agent, browser, screen, paypal, startCheckout }) => {
      await app.open("/");
      const orderId = await startCheckout();
      await fillCardForm(agent, guestCard("refused"));

      await agent.act("pay with this card as a guest");
      await agent.waitFor("PayPal says the card was declined, or the shop's page shows the payment result", {
        timeout: 45_000,
      });

      // PayPal refuses the card in one of two places, depending on which version of its card form it served.
      if (PAYPAL_PAGE.test(await browser.url())) {
        // On its own page, before approving the order: the shopper never comes back.
        await agent.assert("PayPal says the card was declined", { vision: true });
        expect((await paypal.getOrder({ id: orderId })).result.status).toBe(OrderStatus.PayerActionRequired);
        return;
      }

      // Or it approves the order and refuses our capture: /return offers another way to pay.
      await expect(screen.getByTestId("payment-status")).toHaveText("not paid", { timeout: 30_000 });
      await expect(screen.getByRole("link", "choose another way to pay")).toBeVisible();

      const { result: order } = await paypal.getOrder({ id: orderId });
      expect(order.status).toBe(OrderStatus.Approved);
      expect(order.purchaseUnits?.[0]?.payments?.captures).toBeUndefined();
    },
  );

  test("backing out of PayPal's page returns to the checkout unpaid", async ({
    app,
    agent,
    browser,
    screen,
    paypal,
    startCheckout,
  }) => {
    await app.open("/");
    const orderId = await startCheckout();

    // PayPal's link goes to cancel_url; the browser's back button would skip it.
    await agent.act("leave PayPal with the Cancel and return to e2e link");
    await expect(browser).toHaveURL(`/?token=${orderId}`);
    await expect(screen.getByRole("button", "pay with PayPal")).toBeVisible();

    expect((await paypal.getOrder({ id: orderId })).result.status).toBe(OrderStatus.PayerActionRequired);
  });
});
