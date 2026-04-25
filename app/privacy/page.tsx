import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — BittsQuiz",
};

export default function PrivacyPage() {
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen" style={{ background: "var(--background, #0d0a22)" }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors mb-8 inline-block">
          ← Back
        </Link>

        <h1 className="text-2xl font-bold text-white/90 mb-1" style={{ fontFamily: "var(--font-grotesk, sans-serif)" }}>
          Privacy Policy
        </h1>
        <p className="text-xs text-gray-500 mb-8">Last updated: {year}</p>

        <div className="space-y-6 text-sm text-white/60 leading-relaxed">
          <section>
            <h2 className="text-white/80 font-semibold mb-2">1. What We Collect</h2>
            <p>
              When you sign in with Google, we receive your name, email address, and profile picture from Google OAuth.
              We store your quiz attempt history, scores, earned coins, quizlet (character) collection, streak data,
              and any feedback you submit. We also store your notification preferences and push subscription tokens
              if you enable browser notifications.
            </p>
          </section>

          <section>
            <h2 className="text-white/80 font-semibold mb-2">2. How We Use It</h2>
            <p>
              Your data is used solely to operate BittsQuiz — to award coins, track progress, display leaderboards,
              manage your quizlet collection, and send in-app notifications. Your email is used to send a one-time
              welcome alert to the site administrator; we do not send marketing emails.
            </p>
          </section>

          <section>
            <h2 className="text-white/80 font-semibold mb-2">3. Data Storage</h2>
            <p>
              All account and game data is stored in a PostgreSQL database hosted on Neon (neon.tech). Data is
              transmitted over HTTPS and is not shared with or sold to any third parties.
            </p>
          </section>

          <section>
            <h2 className="text-white/80 font-semibold mb-2">4. Cookies & Local Storage</h2>
            <p>
              We use a session cookie to keep you signed in (managed by NextAuth.js). Your app preferences —
              such as sidebar state, music settings, and the daily splash screen flag — are stored in your
              browser's localStorage and never sent to our servers.
            </p>
          </section>

          <section>
            <h2 className="text-white/80 font-semibold mb-2">5. Analytics</h2>
            <p>
              We use Vercel Analytics and Speed Insights to collect anonymous, aggregated page-view and
              performance data. No personally identifiable information is included in these analytics reports.
            </p>
          </section>

          <section>
            <h2 className="text-white/80 font-semibold mb-2">6. Third-Party Services</h2>
            <p>
              BittsQuiz uses Google OAuth for authentication, Pusher Channels for real-time multiplayer,
              and Vercel for hosting. Each of these services operates under their own privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-white/80 font-semibold mb-2">7. Your Rights</h2>
            <p>
              You may request deletion of your account and associated data at any time by contacting the
              administrator through the in-app feedback form. Upon deletion, your quiz history, coins,
              quizlets, and profile data will be permanently removed.
            </p>
          </section>

          <section>
            <h2 className="text-white/80 font-semibold mb-2">8. Children</h2>
            <p>
              BittsQuiz is intended for school-age users and above. We do not knowingly collect data from
              children under 13 without appropriate consent. If you believe a minor's data has been collected
              improperly, contact us via the feedback form.
            </p>
          </section>

          <section>
            <h2 className="text-white/80 font-semibold mb-2">9. Changes</h2>
            <p>
              We may update this policy from time to time. Continued use of BittsQuiz after changes constitutes
              acceptance of the revised policy.
            </p>
          </section>
        </div>

        <p className="text-xs text-gray-600 mt-10">
          © {year} BittsQuiz ·{" "}
          <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
        </p>
      </div>
    </div>
  );
}
