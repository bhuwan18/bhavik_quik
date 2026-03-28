import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import OnlinePing from "@/components/layout/OnlinePing";
import { AudioProvider } from "@/lib/audio-context";
import AudioPlayer from "@/components/AudioPlayer";
import PushSubscriptionManager from "@/components/layout/PushSubscriptionManager";
import { NotificationsProvider } from "@/components/layout/NotificationsProvider";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <AudioProvider>
      <NotificationsProvider>
      <div className="flex min-h-screen">
        {/* Sidebar hidden on mobile */}
        <div className="hidden md:flex sticky top-0 h-screen">
          <Sidebar />
        </div>
        <div className="flex-1 min-w-0 flex flex-col min-h-screen" style={{ background: "var(--main-bg)" }}>
          <main className="flex-1 pb-20 md:pb-0">
            {children}
          </main>
          <footer className="hidden md:block border-t border-white/5 py-3 px-6 text-center text-xs text-gray-600">
            Creator: <span className="text-purple-400/70 font-medium">Bhavik Lodha, G5MB</span>
          </footer>
        </div>
      </div>
      <MobileNav />
      <OnlinePing />
      <AudioPlayer />
      <PushSubscriptionManager />
      </NotificationsProvider>
    </AudioProvider>
  );
}
