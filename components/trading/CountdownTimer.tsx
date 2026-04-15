"use client";

import { useEffect, useState } from "react";

export function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState(() => calcRemaining(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(calcRemaining(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (remaining <= 0) {
    return <span className="text-xs font-bold text-red-400">Expired</span>;
  }

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  let color = "text-gray-300";
  if (remaining < 600) color = "text-red-400"; // < 10 min
  else if (remaining < 3600) color = "text-yellow-400"; // < 1 hour

  return (
    <span className={`text-xs font-bold tabular-nums ${color}`}>
      {hours > 0 && `${hours}h `}{minutes}m {seconds}s
    </span>
  );
}

function calcRemaining(expiresAt: string): number {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}
