import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Health Twin — 10X Health",
  description: "Your interactive 3D health twin — powered by 10X Health",
};

export default function TwinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="twin-dark">{children}</div>;
}
