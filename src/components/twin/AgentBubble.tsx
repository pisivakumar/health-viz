"use client";

/**
 * AgentBubble — Floating trigger button to open the agent panel.
 * Light theme — 10X red bubble with white text.
 */

interface AgentBubbleProps {
  onClick: () => void;
  hasUnread?: boolean;
}

export default function AgentBubble({ onClick, hasUnread }: AgentBubbleProps) {
  return (
    <button
      onClick={onClick}
      className="fixed z-40 flex items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 bg-tenx-red text-white"
      style={{
        bottom: 24,
        right: 24,
        width: 52,
        height: 52,
        boxShadow: "0 4px 20px rgba(209,36,42,0.3)",
      }}
    >
      {hasUnread && (
        <span className="absolute inset-0 rounded-full animate-ping bg-tenx-red opacity-30" />
      )}
      <span className="text-sm font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
        10X
      </span>
      {hasUnread && (
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
      )}
    </button>
  );
}
