import LegalShell, { Section, P, UL } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Shipping & Delivery Policy — Frito AI",
  description: "Processing times, delivery estimates, charges, and tracking for Frito orders.",
};

export default function ShippingPage() {
  return (
    <LegalShell title="Shipping & Delivery Policy" updated="26 June 2026">
      <P>
        Products sold through Frito stores are made on demand and then shipped to you. Here&rsquo;s what to
        expect.
      </P>

      <Section title="1. Processing time">
        <P>
          Each order is printed and quality-checked before dispatch. Production typically takes{" "}
          <strong>2–5 business days</strong> before the order ships.
        </P>
      </Section>

      <Section title="2. Delivery time">
        <UL>
          <li>After dispatch, delivery within India usually takes <strong>3–7 business days</strong>, depending on your location.</li>
          <li>Total estimated time from order to delivery is approximately <strong>5–12 business days</strong>.</li>
          <li>Remote or non-metro pin codes may take longer.</li>
        </UL>
      </Section>

      <Section title="3. Shipping charges">
        <P>
          Shipping charges, if any, are shown clearly at checkout before payment. Any promotional free
          shipping will be reflected in your order total.
        </P>
      </Section>

      <Section title="4. Tracking">
        <P>
          Once your order ships, a tracking number is added to your order and shared with you so you
          can follow its progress to delivery.
        </P>
      </Section>

      <Section title="5. Serviceable areas">
        <P>
          We currently ship across <strong>India</strong>. International shipping is not yet available.
          Delivery is subject to courier serviceability at your pin code.
        </P>
      </Section>

      <Section title="6. Delays">
        <P>
          Estimated timelines are not guaranteed and may be affected by courier delays, weather, or
          other factors outside our control. If your order is significantly delayed, contact{" "}
          l.ankur89@gmail.com and we&rsquo;ll help track it down.
        </P>
      </Section>

      <Section title="7. Questions">
        <P>
          For any shipping question, reach us at l.ankur89@gmail.com or via our{" "}
          <a className="text-violet-600 hover:underline" href="/contact">Contact page</a>. See also our{" "}
          <a className="text-violet-600 hover:underline" href="/refunds">Refund &amp; Cancellation Policy</a>.
        </P>
      </Section>
    </LegalShell>
  );
}
