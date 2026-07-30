import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jiayi 的个人空间",
  description: "一个记录生活、分享思考的个人网站",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&family=Ma+Shan+Zheng&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-[#faf7f2] text-[#2d2a24]">
        {children}
      </body>
    </html>
  );
}
