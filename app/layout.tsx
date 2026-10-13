import type { Metadata } from "next";
import { FeedbackProvider } from "@/components/ui/FeedbackProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "KeyNova Group | Massachusetts Real Estate",
  description: "Find your next home with KeyNova Group. Explore Massachusetts properties, connect with local agents, and get expert guidance on buying and selling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-coolstyles-extension="installed"
      data-coolstyles-extension-version="1.9.0"
    >
      <body className="min-h-full flex flex-col">
        <FeedbackProvider>{children}</FeedbackProvider>
      </body>
    </html>
  );
}
