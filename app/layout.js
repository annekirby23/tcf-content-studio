import "./globals.css";

export const metadata = {
  title: "TCF Content Studio",
  description: "Multi-platform content scheduler and publishing pipeline for TCF",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070B14",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
