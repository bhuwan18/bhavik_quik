import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Wand2, Cpu, Palette, Music,
  Calculator, FlaskConical, Atom, Globe, Flag, Tag, PawPrint, Swords, GraduationCap, Map,
} from "lucide-react";
import SoccerBallIcon from "@/components/icons/SoccerBallIcon";
import CricketWicketIcon from "@/components/icons/CricketWicketIcon";
import AvengersIcon from "@/components/icons/AvengersIcon";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CATEGORIES = [
  { slug: "football",        label: "Football",        icon: SoccerBallIcon, color: "text-green-400"   },
  { slug: "cricket",         label: "Cricket",         icon: CricketWicketIcon, color: "text-orange-400"  },
  { slug: "harry-potter",    label: "Harry Potter",    icon: Wand2,        color: "text-purple-400"  },
  { slug: "technology",      label: "Technology",      icon: Cpu,          color: "text-blue-400"    },
  { slug: "avengers",        label: "Avengers",        icon: AvengersIcon, color: "text-red-400"     },
  { slug: "artists",         label: "Artists",         icon: Palette,      color: "text-pink-400"    },
  { slug: "musicians",       label: "Musicians",       icon: Music,        color: "text-violet-400"  },
  { slug: "math",            label: "Math",            icon: Calculator,   color: "text-cyan-400"    },
  { slug: "science",         label: "Science",         icon: FlaskConical, color: "text-emerald-400" },
  { slug: "physics",         label: "Physics",         icon: Atom,         color: "text-sky-400"     },
  { slug: "world-languages", label: "World Languages", icon: Globe,        color: "text-amber-400"   },
  { slug: "flags",           label: "Flags",           icon: Flag,         color: "text-rose-400"    },
  { slug: "brand-logos",     label: "Brand Logos",     icon: Tag,          color: "text-lime-400"    },
  { slug: "animals",         label: "Animals",         icon: PawPrint,     color: "text-yellow-400"  },
  { slug: "anime",           label: "Anime",           icon: Swords,       color: "text-fuchsia-400" },
  { slug: "grade-6",         label: "Grade 6",         icon: GraduationCap, color: "text-teal-400"   },
  { slug: "geography",       label: "Geography",       icon: Map,           color: "text-green-600"  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const RARITY_COLORS: Record<string, { border: string; glow: string; label: string; text: string }> = {
  common: { border: "border-gray-400", glow: "", label: "Common", text: "text-gray-400" },
  uncommon: { border: "border-green-400", glow: "shadow-green-400/30 shadow-lg", label: "Uncommon", text: "text-green-400" },
  rare: { border: "border-blue-400", glow: "shadow-blue-400/40 shadow-xl", label: "Rare", text: "text-blue-400" },
  epic: { border: "border-purple-500", glow: "shadow-purple-500/50 shadow-xl", label: "Epic", text: "text-purple-500" },
  legendary: { border: "border-yellow-400", glow: "shadow-yellow-400/60 shadow-2xl", label: "Legendary", text: "text-yellow-400" },
  secret: { border: "border-red-800", glow: "shadow-red-800/50 shadow-2xl", label: "Secret", text: "text-red-500" },
  unique: { border: "border-pink-400", glow: "shadow-pink-400/50 shadow-2xl", label: "Unique", text: "text-pink-400" },
  impossible: { border: "border-transparent", glow: "shadow-2xl rainbow-border", label: "Impossible", text: "text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400" },
};

export const SELL_VALUES: Record<string, number> = {
  common: 10,
  uncommon: 25,
  rare: 60,
  epic: 150,
  legendary: 400,
  secret: 1000,
  unique: 5000,
  impossible: 99999,
};
