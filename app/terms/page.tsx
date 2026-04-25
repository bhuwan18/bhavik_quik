import Link from "next/link";

export const metadata = {
  title: "Terms of Service — BittsQuiz",
};

export default function TermsPage() {
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen" style={{ background: "var(--background, #0d0a22)" }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors mb-8 inline-block">
          ← Back
        </Link>

        <h1 className="text-2xl font-bold text-white/90 mb-1" style={{ fontFamily: "var(--font-grotesk, sans-serif)" }}>
          Terms of Service
        </h1>
        <p className="text-xs text-gray-500 mb-8">Last updated: {year}</p>

        <div className="space-y-6 text-sm text-white/60 leading-relaxed">
          <section>
            <h2 className="text-white/80 font-semibold mb-2">1. Acceptance</h2>
            <p>
              By creating an account or using BittsQuiz, you agree to these Terms of Service. If you do not
              agree, do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-white/80 font-semibold mb-2">2. Eligibility</h2>
            <p>
              BittsQuiz is open to all users. School-domain accounts (e.g. <code className="text-white/40 text-xs">@oberoi-is.net</code>)
              are subject to additional usage restrictions during school hours as determined by the school administration.
            </p>
          </section>

          <section>
            <h2 className="text-white/80 font-semibold mb-2">3. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Exploit bugs, glitches, or unintended mechanics to gain coins or quizlets unfairly</li>
              <li>Use automated scripts, bots, or any tools to manipulate scores or quiz attempts</li>
              <li>Share account credentials or allow others to use your account</li>
              <li>Attempt to access or modify other users' data</li>
              <li>Submit false or misleading payment information</li>
              <li>Harass other users through the trading, feed, or feedback systems</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white/80 font-semibold mb-2">4. Virtual Items & Currency</h2>
            <p>
              Coins, quizlets, and all other in-game items are virtual and have no real-world monetary value.
              They cannot be exchanged for real money. All purchases (Pro/Max memberships, coin packs) are
              for digital access only and are non-refundable except at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-white/80 font-semibold mb-2">5. Memberships & Payments</h2>
            <p>
              Pro and Max memberships grant enhanced features for the duration of the subscription period.
              Payments are processed manually via UPI. Membership benefits expire at the end of the paid
              period and do not auto-renew unless explicitly renewed. We reserve the right to adjust
              pricing or benefits with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="text-white/80 font-semibold mb-2">6. Account Suspension</h2>
            <p>
              We reserve the right to lock or terminate any account that violates these terms, engages in
              cheating, or disrupts the experience for other users — without prior notice and without refund
              of any paid membership.
            </p>
          </section>

          <section>
            <h2 className="text-white/80 font-semibold mb-2">7. Service Availability</h2>
            <p>
              BittsQuiz is provided "as is." We make no guarantees about uptime, data retention, or
              uninterrupted access. We are not liable for any loss of progress, coins, or quizlets
              resulting from outages, bugs, or maintenance.
            </p>
          </section>

          <section>
            <h2 className="text-white/80 font-semibold mb-2">8. User Content</h2>
            <p>
              Any feedback, comments, or content you submit through BittsQuiz may be reviewed by administrators.
              Do not include personal information or confidential content in feedback submissions.
            </p>
          </section>

          <section>
            <h2 className="text-white/80 font-semibold mb-2">9. Changes</h2>
            <p>
              We may update these terms at any time. Continued use of BittsQuiz after updates means you accept
              the revised terms.
            </p>
          </section>
        </div>

        <p className="text-xs text-gray-600 mt-10">
          © {year} BittsQuiz ·{" "}
          <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
