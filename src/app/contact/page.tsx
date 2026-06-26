import LegalShell, { Section, P } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Contact Us — Frito AI",
  description: "Get in touch with the Frito AI team.",
};

export default function ContactPage() {
  return (
    <LegalShell title="Contact Us" updated="26 June 2026">
      <P>
        We&rsquo;re here to help. Reach us using the details below and we&rsquo;ll get back to you as soon as we
        can.
      </P>

      <Section title="Customer support">
        <P>
          Email: l.ankur89@gmail.com<br />
          Phone: +91 98855 19947<br />
          Hours: Monday–Saturday, 10:00–18:00 IST
        </P>
      </Section>

      <Section title="Business details">
        <P>
          Legal entity: Digital Brew Marketing<br />
          Registered address: Plot No. 39A, Trimulgiri, Hyderabad, Telangana 500015, India<br />
          GSTIN: 36AFXPL5678K1ZD
        </P>
      </Section>

      <Section title="Order help">
        <P>
          For questions about a specific order — cancellations, refunds, or delivery — please include
          your order number. See our{" "}
          <a className="text-violet-600 hover:underline" href="/refunds">Refund &amp; Cancellation Policy</a> and{" "}
          <a className="text-violet-600 hover:underline" href="/shipping">Shipping &amp; Delivery Policy</a>.
        </P>
      </Section>
    </LegalShell>
  );
}
