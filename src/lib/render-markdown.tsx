/**
 * Shared markdown-bold renderer.
 * Converts **text** to <strong> elements.
 */
export function renderBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="text-foreground font-semibold">{part}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}
