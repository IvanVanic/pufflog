import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Josefin_Sans, Rubik } from "next/font/google";
import { EntriesProvider } from "./providers/EntriesProvider";
import { SettingsProvider } from "./providers/SettingsProvider";
import { AppBar } from "./components/AppBar";
import { NavigationWrapper } from "./components/NavigationWrapper";
import { AppHeader } from "./components/AppHeader";
import "./globals.css";
import { TaperProvider } from "./providers/TaperProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const josefin = Josefin_Sans({
  variable: "--font-title",
  subsets: ["latin"],
});

const rubik = Rubik({
  variable: "--font-ui",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PuffLog",
  description: "Track daily cannabis use easily.",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.ico" },
  applicationName: "PuffLog",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PuffLog",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${josefin.variable} ${rubik.variable} antialiased overflow-x-hidden`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <SettingsProvider>
            <EntriesProvider>
              <TaperProvider>
                <div className="min-h-dvh flex flex-col overflow-hidden">
                  <AppBar />
                  <div className="flex-1 overflow-hidden animate-fade-in-up">
                    {children}
                  </div>
                  <NavigationWrapper />
                </div>
              </TaperProvider>
            </EntriesProvider>
          </SettingsProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
