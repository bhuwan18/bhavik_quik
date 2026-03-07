"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showAdmin, setShowAdmin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) router.replace("/dashboard");
  }, [session, router]);

  const year = new Date().getFullYear();

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #070511 0%, #1a0838 50%, #070511 100%)" }}>
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/25 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pink-600/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-orange-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-md w-full">
        {/* Logo */}
        <div className="text-center">
          <div className="text-7xl mb-4 float-anim inline-block">🎯</div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
            Quizlet {year}
          </h1>
          <p className="mt-3 text-gray-400 text-lg font-medium">
            Quiz. Collect. Conquer.
          </p>
        </div>

        {/* Feature list */}
        <div className="w-full rounded-2xl p-6 space-y-3 border border-purple-500/20"
          style={{ background: "rgba(139, 92, 246, 0.08)" }}>
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

        {!showAdmin ? (
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

            <button
              onClick={() => setShowAdmin(true)}
              className="text-xs text-gray-700 hover:text-purple-400 transition-colors"
            >
              Admin login
            </button>
          </>
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
              className="w-full px-4 py-3 rounded-xl border border-purple-500/30 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 bg-purple-500/10"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-purple-500/30 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 bg-purple-500/10"
            />
            {adminError && <p className="text-red-400 text-sm text-center">{adminError}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all disabled:opacity-50"
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
          By signing in you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
}
