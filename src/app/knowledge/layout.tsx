import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Knowledge Base — 10X Health Admin",
  description: "Edit the Health Agent's knowledge base",
};

export default function KnowledgeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
