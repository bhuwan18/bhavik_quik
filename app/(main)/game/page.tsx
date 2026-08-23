import { Suspense } from "react";
import GameModesClient from "@/components/game/GameModesClient";

export default function GameModesPage() {
  return (
    <Suspense>
      <GameModesClient />
    </Suspense>
  );
}
