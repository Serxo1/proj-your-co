"use client";
import * as React from "react";
import { Moon, Sun } from "lucide-react";

export function ModeToggle() {
  const [theme, setTheme] = React.useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") ? "dark" : "light";
    }
    return "light";
  });

  React.useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <button
      type="button"
      aria-label="Alternar tema"
      className="rounded-full p-2 border border-border bg-background hover:bg-accent transition-colors"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
} 