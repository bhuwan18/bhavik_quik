import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CertificatePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const totalQuizlets = await prisma.quizlet.count();
  const ownedQuizlets = await prisma.userQuizlet.count({ where: { userId: session.user.id } });

  if (ownedQuizlets < totalQuizlets) redirect("/dashboard");

  const year = new Date().getFullYear();
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* Certificate */}
        <div className="border-4 border-yellow-500/60 rounded-3xl p-10 bg-gradient-to-br from-yellow-950/30 to-orange-950/20 shadow-2xl shadow-yellow-500/20 text-center relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-4 text-6xl opacity-10">⭐</div>
            <div className="absolute top-4 right-4 text-6xl opacity-10">⭐</div>
            <div className="absolute bottom-4 left-4 text-6xl opacity-10">🏆</div>
            <div className="absolute bottom-4 right-4 text-6xl opacity-10">🏆</div>
          </div>

          <div className="relative z-10">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-yellow-400 font-medium tracking-widest text-sm uppercase mb-2">Certificate of Achievement</p>
            <h1 className="text-3xl font-bold text-white mb-1">Quizlet {year} Master</h1>
            <div className="w-32 h-0.5 bg-yellow-500/50 mx-auto my-5" />

            <p className="text-gray-400 mb-2">This certifies that</p>
            <p className="text-3xl font-bold text-yellow-400 mb-2">{session.user.name}</p>
            <p className="text-gray-400 mb-6">has collected every Quizlet in</p>
            <p className="text-2xl font-bold text-white mb-6">Quizlet {year}</p>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-6 py-3 inline-flex items-center gap-2 mb-6">
              <span className="text-yellow-400 font-medium">{ownedQuizlets}/{totalQuizlets} Quizlets Collected</span>
            </div>

            <div className="w-32 h-0.5 bg-yellow-500/50 mx-auto my-5" />
            <p className="text-gray-500 text-sm">Achieved on {date}</p>

            {/* Stars */}
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-yellow-400 text-2xl">⭐</span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center mt-6">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
          >
            Back to Dashboard
          </Link>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-xl transition-colors"
          >
            🖨️ Print Certificate
          </button>
        </div>
      </div>
    </div>
  );
}
