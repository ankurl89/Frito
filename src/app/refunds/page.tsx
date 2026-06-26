import LegalShell, { Section, P, UL } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Refund & Cancellation Policy — Frito AI",
  description: "Cancellations, returns, replacements, and refunds for orders placed on Frito stores.",
};

export default function RefundsPage() {
  return (
    <LegalShell title="Refund & Cancellation Policy" updated="26 June 2026">
      <P>
        This policy covers orders placed through stores built on Frito AI. Because products are
        printed on demand specifically for each order, the following terms apply.
      </P>

      <Section title="1. Order cancellation">
        <UL>
          <li>You may cancel an order for a <strong>full refund within 2 hours</strong> of placing it, provided it has not yet entered production.</li>
          <li>Once an item enters production, it cannot be cancelled, as it is custom-made to order.</li>
          <li>To cancel, email l.ankur89@gmail.com with your order number as soon as possible.</li>
        </UL>
      </Section>

      <Section title="2. Damaged, defective, or wrong items">
        <P>
          We stand behind the quality of every product. If your item arrives damaged, defective, or
          is not what you ordered (wrong size, design, or product), we will replace it or refund it at
          no cost to you.
        </P>
        <UL>
          <li>Report the issue within <strong>7 days</strong> of delivery.</li>
          <li>Email l.ankur89@gmail.com with your order number and clear photos of the item and any packaging.</li>
          <li>Once verified, we will arrange a free replacement or a full refund.</li>
        </UL>
      </Section>

      <Section title="3. Returns & exchanges (change of mind)">
        <P>
          As items are custom-printed on demand, we are generally unable to accept returns or
          exchanges for reasons of change of mind, incorrect size selection, or buyer&rsquo;s remorse. Please
          review the size guide and product details carefully before ordering.
        </P>
      </Section>

      <Section title="4. Refund method & timeline">
        <UL>
          <li>Approved refunds are issued to the <strong>original payment method</strong> via our payment processor.</li>
          <li>Refunds are typically processed within <strong>5–7 business days</strong> of approval; the time for funds to reflect depends on your bank or card issuer.</li>
          <li>Shipping charges are non-refundable except where the item was damaged, defective, or incorrect.</li>
        </UL>
      </Section>

      <Section title="5. How to reach us">
        <P>
          For any cancellation or refund request, contact l.ankur89@gmail.com or use our{" "}
          <a className="text-violet-600 hover:underline" href="/contact">Contact page</a>. Please include your
          order number so we can help quickly.
        </P>
      </Section>
    </LegalShell>
  );
}
