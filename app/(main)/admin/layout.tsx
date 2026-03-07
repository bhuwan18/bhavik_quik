import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Double-check: must be logged in and have isAdmin flag
  if (!session?.user?.id) redirect("/login");
  if (!(session.user as { isAdmin?: boolean }).isAdmin) redirect("/dashboard");

  return (
    <div className="min-h-full">
      {/* Admin section header */}
      <div className="border-b border-purple-800/40 px-8 py-4"
        style={{ background: "linear-gradient(90deg, rgba(88,28,135,0.15) 0%, rgba(168,85,247,0.05) 100%)" }}>
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <span className="text-xl">🛡️</span>
          <div>
            <h2 className="text-sm font-bold text-purple-300 uppercase tracking-widest">Admin Panel</h2>
            <p className="text-xs text-gray-500">Restricted — authorised administrators only</p>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
