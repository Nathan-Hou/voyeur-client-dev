import { GoogleTagManager } from "@next/third-parties/google";

import { AuthProvider } from "@/contexts/AuthContext";
import localFont from "next/font/local";
// import "./globals.css";
import "@/styles/globals.scss";

import { ToastProvider } from "@/components/shared/toast/Config";
import "react-toastify/dist/ReactToastify.css";
import DeviceDetector from "@/components/DeviceDetector";
import ChannelIDGuard from "@/components/ChannelIDGuard";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Voyeur",
  description: "Voyeur | 首創 360 度視角影音平台，打造沉浸式觀影體驗。讓您愛怎麼看，就怎麼看!",
  metadataBase: new URL('https://voyeur.whosyourdaddy.baby'),
  keywords: 'Voyeur,360度視角,影音平台,沉浸式觀影,沉浸式影音,沉浸式影音平台',
  category: 'education',
  openGraph: {
    type: 'website',
    url: 'https://voyeur.whosyourdaddy.baby',
    siteName: 'Voyeur',
    title: 'Voyeur',
    description: 'Voyeur | 首創 360 度視角影音平台，打造沉浸式觀影體驗。讓您愛怎麼看，就怎麼看!',
    images: [
      {
        url: '/images/og/og.png',
        width: 1000,
        height: 1000,
      },
    ],
  },
  icons: {
    icon: '/favicon.ico',
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Voyeur | 360 度沉浸式影音平台",
  "description": "首創 360 度視角影音平台，打造沉浸式觀影體驗。讓您愛怎麼看，就怎麼看!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
      <meta name="google-site-verification" content="o8X_mgqNxr9KcOqMK7aGVwpecWRFRR0C52wJBgCm2t0" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd)
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black min-h-screen pt-[calc(44px+2rem)] pb-[calc(4.875rem)]`}
      >
        {/* <DeviceDetector /> */}
        <ToastProvider>
          <AuthProvider>
            {/* <ChannelIDGuard> */}
            <Navbar />
            {children}
            <Footer />
            {/* </ChannelIDGuard> */}
          </AuthProvider>
        </ToastProvider>
        <GoogleTagManager gtmId="GTM-5FWB55CH" />
      </body>
    </html>
  );
}
