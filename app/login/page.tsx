"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showAdmin, setShowAdmin] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [testError, setTestError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) router.replace("/dashboard");
  }, [session, router]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAdminError("");
    const result = await signIn("admin-credentials", {
      username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setAdminError("Invalid username or password.");
    } else {
      router.replace("/dashboard");
    }
  };

  const handleTestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTestError("");
    const result = await signIn("test-credentials", {
      username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setTestError("Invalid test credentials.");
    } else {
      router.replace("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "var(--main-bg)" }}>
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-yellow-600/6 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-md w-full">
        {/* Logo */}
        <div className="text-center">
          <div className="text-7xl mb-4 float-anim inline-block">⚡</div>
          <h1 className="text-5xl font-black text-white tracking-tight">
            Bitts<span className="text-[var(--accent)]">Quiz</span>
          </h1>
          <p className="mt-3 text-gray-400 text-lg font-medium">
            Quiz. Collect. Conquer.
          </p>
        </div>

        {/* Feature list */}
        <div className="w-full rounded-2xl p-6 space-y-3 border"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {[
            { icon: "🧠", text: "Answer quizzes across 10 categories" },
            { icon: "🪙", text: "Earn coins for every correct answer" },
            { icon: "🎴", text: "Open packs to collect rare Quizlets" },
            { icon: "⚔️", text: "Compete in multiplayer game modes" },
            { icon: "🏆", text: "Climb the leaderboard and win" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-gray-300">
              <span className="text-xl">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {!showAdmin && !showTest ? (
          <>
            {/* Google Sign in */}
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold text-lg py-4 px-6 rounded-2xl hover:bg-gray-100 transition-all duration-200 shadow-xl hover:shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>

            <div className="flex gap-4">
              <button
                onClick={() => { setShowTest(true); setUsername(""); setPassword(""); }}
                className="text-xs text-gray-700 hover:text-blue-400 transition-colors"
              >
                Test login
              </button>
              <span className="text-xs text-gray-800">·</span>
              <button
                onClick={() => { setShowAdmin(true); setUsername(""); setPassword(""); }}
                className="text-xs text-gray-700 hover:text-purple-400 transition-colors"
              >
                Admin login
              </button>
            </div>
          </>
        ) : showTest ? (
          /* Test User Login Form */
          <form onSubmit={handleTestLogin} className="w-full space-y-4">
            <div className="text-center mb-2">
              <span className="text-sm font-semibold text-blue-400">Test User Login</span>
            </div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-blue-500/30 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 bg-blue-500/10"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-blue-500/30 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 bg-blue-500/10"
            />
            {testError && <p className="text-red-400 text-sm text-center">{testError}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in as Test User"}
            </button>
            <button
              type="button"
              onClick={() => { setShowTest(false); setTestError(""); }}
              className="w-full text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              ← Back to Google login
            </button>
          </form>
        ) : (
          /* Admin Login Form */
          <form onSubmit={handleAdminLogin} className="w-full space-y-4">
            <div className="text-center mb-2">
              <span className="text-sm font-semibold text-purple-400">Administrator Login</span>
            </div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-white/15 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/60 bg-white/5"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-white/15 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/60 bg-white/5"
            />
            {adminError && <p className="text-red-400 text-sm text-center">{adminError}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--accent)] hover:brightness-110 text-black font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in as Admin"}
            </button>
            <button
              type="button"
              onClick={() => { setShowAdmin(false); setAdminError(""); }}
              className="w-full text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              ← Back to Google login
            </button>
          </form>
        )}

        <p className="text-gray-700 text-xs text-center">
          By signing in you agree to our{" "}
          <Link href="/terms" className="hover:text-gray-500 transition-colors underline underline-offset-2">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="hover:text-gray-500 transition-colors underline underline-offset-2">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
