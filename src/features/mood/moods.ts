import {
  BatteryLow, CircleDashed, CloudRain, Flame, Leaf, Moon, Sun, Waves, Wind, type LucideIcon,
} from "lucide-react";

export const MOODS: { key: string; icon: LucideIcon }[] = [
  { key: "happy", icon: Sun },
  { key: "calm", icon: Leaf },
  { key: "sad", icon: CloudRain },
  { key: "anxious", icon: Wind },
  { key: "overwhelmed", icon: Waves },
  { key: "irritated", icon: Flame },
  { key: "exhausted", icon: BatteryLow },
  { key: "lonely", icon: Moon },
  { key: "numb", icon: CircleDashed },
];

export const moodIcon = (key: string) => MOODS.find((m) => m.key === key.toLowerCase())?.icon ?? Leaf;
