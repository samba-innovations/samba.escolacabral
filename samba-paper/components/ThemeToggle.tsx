"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { AnimatedIcon } from "./AnimatedIcon";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="w-10 h-10" aria-hidden="true" />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors outline-none flex items-center justify-center"
      aria-label="Alternar tema"
    >
      <AnimatedIcon
        icon={theme === "dark" ? "line-md:sun-rising-loop" : "line-md:moon-rising-filled-loop"}
        width={20}
        height={20}
      />
    </button>
  );
}
