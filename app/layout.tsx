import type { Metadata, Viewport } from "next";
import "@/styles/e2e.css";

import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "e2e PayPal checkout",
  description: "A PayPal checkout in the sandbox, tested end to end with e2e.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
