import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// next/font downloads the fonts at build time and serves them from our own
// site. `variable` exposes each one as a CSS variable used in globals.css.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "LeadFlow",
  description: "Every lead, every conversation, every follow-up, on time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrains.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
