import LegalShell, { Section, P, UL } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Terms & Conditions — Frito AI",
  description: "The terms governing your use of Frito AI.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms & Conditions" updated="26 June 2026">
      <P>
        These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your access to and use of Frito AI
        (&ldquo;Frito&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), a platform operated by{" "}
        Digital Brew Marketing, located at Plot No. 39A, Trimulgiri, Hyderabad, Telangana 500015, India.
        By creating an account or using the platform, you agree to these Terms.
      </P>

      <Section title="1. What Frito does">
        <P>
          Frito lets you create and run a direct-to-consumer apparel brand. Our AI helps generate a
          brand identity, product designs, and an online storefront. Products are manufactured on
          demand and fulfilled through our production and logistics partners. We also facilitate
          payment collection through our third-party payment processor.
        </P>
      </Section>

      <Section title="2. Eligibility & accounts">
        <UL>
          <li>You must be at least 18 years old and able to enter a binding contract.</li>
          <li>You are responsible for the accuracy of your account information and for keeping your credentials secure.</li>
          <li>You are responsible for all activity that occurs under your account.</li>
        </UL>
      </Section>

      <Section title="3. Your content and designs">
        <P>
          You retain ownership of the brand names, artwork, and content you create or upload
          (&ldquo;Your Content&rdquo;). You grant Frito a licence to host, display, reproduce, and print
          Your Content solely to operate your store and fulfil orders. You represent that Your
          Content does not infringe any third party&rsquo;s intellectual property, publicity, or other
          rights, and is not unlawful, hateful, or obscene.
        </P>
      </Section>

      <Section title="4. Acceptable use">
        <UL>
          <li>Do not use Frito for any unlawful, fraudulent, or infringing purpose.</li>
          <li>Do not sell prohibited, counterfeit, or restricted goods.</li>
          <li>Do not attempt to disrupt, reverse-engineer, or gain unauthorised access to the platform.</li>
        </UL>
      </Section>

      <Section title="5. Orders, pricing & payments">
        <P>
          Prices for products are shown in Indian Rupees (INR) and are inclusive of applicable taxes
          unless stated otherwise. Sales on Frito-hosted storefronts are processed through Frito&rsquo;s
          payment infrastructure via our payment partner; Frito does not store full card details.
        </P>
      </Section>

      <Section title="6. Your earnings & payouts">
        <UL>
          <li>For each completed sale, you earn the difference between your selling price and the applicable production, platform, and payment-processing fees (your &ldquo;Earnings&rdquo;).</li>
          <li>Earnings accrue to your Frito earnings balance and are paid out to your registered bank account on a periodic payout cycle, after a reasonable buffer for cancellations, returns, and chargebacks.</li>
          <li>Payouts require valid bank account details and tax information (such as PAN). Amounts may be adjusted for refunds and chargebacks, and taxes may be deducted at source where required by law.</li>
          <li>Frito may withhold or delay payouts where fraud, abuse, or a breach of these Terms is suspected, or where required by law.</li>
        </UL>
      </Section>

      <Section title="7. Fulfilment & shipping">
        <P>
          Orders are produced on demand and shipped by our logistics partners. Delivery timelines are
          estimates. See our <a className="text-violet-600 hover:underline" href="/shipping">Shipping &amp; Delivery Policy</a> and{" "}
          <a className="text-violet-600 hover:underline" href="/refunds">Refund &amp; Cancellation Policy</a> for details.
        </P>
      </Section>

      <Section title="8. Platform fees & plans">
        <P>
          Some features are offered on paid subscription plans. Fees, inclusions, and billing cycles
          are shown at the point of purchase. Subscription fees are non-refundable except where
          required by law or expressly stated.
        </P>
      </Section>

      <Section title="9. Intellectual property">
        <P>
          The Frito platform, its software, branding, and content (excluding Your Content) are owned
          by us or our licensors and are protected by law. We grant you a limited, non-exclusive,
          non-transferable right to use the platform per these Terms.
        </P>
      </Section>

      <Section title="10. Disclaimers & limitation of liability">
        <P>
          The platform is provided &ldquo;as is&rdquo; without warranties of any kind. To the maximum extent
          permitted by law, Frito is not liable for any indirect, incidental, or consequential
          damages, and our total liability for any claim is limited to the amount you paid to Frito in
          the three months preceding the claim.
        </P>
      </Section>

      <Section title="11. Indemnity">
        <P>
          You agree to indemnify and hold Frito harmless from claims arising out of Your Content, your
          products, or your breach of these Terms.
        </P>
      </Section>

      <Section title="12. Termination">
        <P>
          You may stop using Frito at any time. We may suspend or terminate access for breach of these
          Terms or misuse of the platform.
        </P>
      </Section>

      <Section title="13. Governing law">
        <P>
          These Terms are governed by the laws of India. Courts at Hyderabad, India shall have
          exclusive jurisdiction.
        </P>
      </Section>

      <Section title="14. Changes & contact">
        <P>
          We may update these Terms from time to time; material changes will be posted on this page.
          Questions? Contact us at l.ankur89@gmail.com or via our{" "}
          <a className="text-violet-600 hover:underline" href="/contact">Contact page</a>.
        </P>
      </Section>
    </LegalShell>
  );
}
