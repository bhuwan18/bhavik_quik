"use client";

import { useState } from "react";

const TYPES = ["General", "Bug Report", "Feature Request", "Content Issue", "Other"];

export default function FeedbackPage() {
  const [type, setType] = useState("General");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 5) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, type }),
      });
      if (res.ok) {
        setStatus("sent");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">💬 Feedback</h1>
        <p className="text-gray-400 mt-1">
          Help us improve BittsQuiz — your feedback goes straight to the team.
        </p>
      </div>

      {status === "sent" ? (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-10 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-white mb-2">Thanks for your feedback!</h2>
          <p className="text-gray-400 mb-6">We read every message and really appreciate the input.</p>
          <button
            onClick={() => setStatus("idle")}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium"
          >
            Send Another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Feedback Type</label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    type === t
                      ? "bg-indigo-600 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Message <span className="text-red-400">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Tell us what's on your mind — bugs, ideas, suggestions..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
              required
              minLength={5}
            />
            <p className="text-xs text-gray-600 mt-1">{message.length} characters</p>
          </div>

          {status === "error" && (
            <p className="text-red-400 text-sm">Something went wrong. Please try again.</p>
          )}

          <button
            type="submit"
            disabled={status === "sending" || message.trim().length < 5}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            {status === "sending" ? "Sending..." : "Send Feedback 💬"}
          </button>
        </form>
      )}

      <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4 text-center">
        <p className="text-sm text-gray-500">
          All feedback is reviewed by Bhavik. It is not visible to other users.
        </p>
      </div>
    </div>
  );
}
