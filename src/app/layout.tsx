import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/TopNav";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});

export const metadata: Metadata = {
  title: "투어라이브 콘텐츠 관리 플랫폼",
  description: "투어라이브 크리에이터를 위한 프리미엄 콘텐츠 관리 플랫폼입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${notoSansKr.variable} font-sans antialiased bg-background text-foreground`}
      >
        <TopNav />
        <main className="pt-16 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
