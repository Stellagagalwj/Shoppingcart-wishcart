import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000",
  ),
  title: "我的愿望购物车",
  description: "把想买的东西放进清单，慢慢实现。",
  openGraph: {
    title: "我的愿望购物车",
    description: "把想买的东西放进清单，慢慢实现。",
    images: ["/opengraph-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "购物车",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
