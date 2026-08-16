"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center ${className}`}>
        <div className="w-4 h-4 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`p-2 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] rounded-lg border border-border bg-card hover:bg-muted text-foreground hover:text-copper transition flex items-center justify-center shadow-sm cursor-pointer ${className}`}
      title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
      aria-label={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-copper transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-copper transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}
