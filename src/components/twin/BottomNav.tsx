"use client";

/**
 * BottomNav — 4-tab navigation for the /twin route.
 * Twin 🧠 / Simulate 🔮 / Today 📅 / Scan 📷
 */

import type { TwinTab } from "@/lib/health-agent/types";

const TABS: { id: TwinTab; label: string; icon: string }[] = [
  { id: "twin", label: "Twin", icon: "🧠" },
  { id: "simulate", label: "Simulate", icon: "🔮" },
  { id: "today", label: "Today", icon: "📅" },
  { id: "scan", label: "Scan", icon: "📷" },
];

interface BottomNavProps {
  activeTab: TwinTab;
  onTabChange: (tab: TwinTab) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around"
      style={{
        backgroundColor: "rgba(10,10,10,0.95)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid var(--twin-border-subtle)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const isDisabled = tab.id === "scan";
        return (
          <button
            key={tab.id}
            onClick={() => !isDisabled && onTabChange(tab.id)}
            disabled={isDisabled}
            className="flex flex-col items-center gap-0.5 py-2.5 px-4 transition-colors"
            style={{
              color: isDisabled
                ? "var(--twin-text-subtle)"
                : isActive
                ? "var(--twin-accent)"
                : "var(--twin-text-muted)",
              opacity: isDisabled ? 0.4 : 1,
            }}
          >
            <span className="text-lg">{tab.icon}</span>
            <span
              className="text-[10px] font-medium"
              style={{
                fontFamily: "var(--font-heading)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {tab.label}
            </span>
            {isActive && (
              <span
                className="absolute bottom-0 h-0.5 w-8 rounded-full"
                style={{ backgroundColor: "var(--twin-accent)" }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
