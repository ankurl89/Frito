import LegalShell, { Section, P, UL } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Privacy Policy — Frito AI",
  description: "How Frito AI collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="26 June 2026">
      <P>
        This Privacy Policy explains how Frito AI (&ldquo;Frito&rdquo;, &ldquo;we&rdquo;), operated by{" "}
        Digital Brew Marketing, collects, uses, and protects information when you use our
        platform and when customers buy from stores built on Frito.
      </P>

      <Section title="1. Information we collect">
        <UL>
          <li><strong>Account information</strong> — name, email, phone, and login credentials of brand owners.</li>
          <li><strong>Brand &amp; store data</strong> — the brand details, designs, products, and settings you create.</li>
          <li><strong>Customer order information</strong> — name, email, phone, and shipping address provided at checkout to fulfil orders.</li>
          <li><strong>Payment information</strong> — payments are processed by our payment partner (Razorpay). We receive confirmation and reference identifiers but do <strong>not</strong> store full card numbers or CVV.</li>
          <li><strong>Usage data</strong> — device, browser, and interaction data collected via cookies and similar technologies to operate and improve the service.</li>
        </UL>
      </Section>

      <Section title="2. How we use information">
        <UL>
          <li>To create and operate your brand, store, and the platform.</li>
          <li>To process and fulfil orders, including production and shipping.</li>
          <li>To process payments and prevent fraud.</li>
          <li>To provide support, send service communications, and improve our products.</li>
          <li>To comply with legal obligations.</li>
        </UL>
      </Section>

      <Section title="3. How we share information">
        <P>We share information only as needed to run the service:</P>
        <UL>
          <li><strong>Production &amp; logistics partners</strong> — to print, pack, and ship orders.</li>
          <li><strong>Payment processor</strong> — to collect payments and settle funds.</li>
          <li><strong>Service providers</strong> — hosting, analytics, and communications vendors bound by confidentiality.</li>
          <li><strong>Legal</strong> — where required by law or to protect rights and safety.</li>
        </UL>
        <P>We do not sell your personal information.</P>
      </Section>

      <Section title="4. Cookies">
        <P>
          We use cookies and similar technologies to keep you signed in, remember your cart, and
          understand usage. You can control cookies through your browser settings; some features may
          not work without them.
        </P>
      </Section>

      <Section title="5. Data security & retention">
        <P>
          We use reasonable technical and organisational measures to protect information. We retain
          information for as long as needed to provide the service and meet legal, accounting, or
          reporting requirements.
        </P>
      </Section>

      <Section title="6. Your rights">
        <P>
          Subject to applicable law, you may request access to, correction of, or deletion of your
          personal information by contacting us. We will respond within a reasonable time.
        </P>
      </Section>

      <Section title="7. Children">
        <P>Frito is not intended for use by anyone under 18, and we do not knowingly collect their data.</P>
      </Section>

      <Section title="8. Changes & contact">
        <P>
          We may update this policy; material changes will be posted here. For privacy questions,
          contact l.ankur89@gmail.com or see our{" "}
          <a className="text-violet-600 hover:underline" href="/contact">Contact page</a>.
        </P>
      </Section>
    </LegalShell>
  );
}
