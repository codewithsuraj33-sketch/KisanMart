import type { Metadata } from "next";
import { Playfair_Display, Inter, Caveat } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import NavbarGate from "@/components/navbar-gate";
import Footer from "@/components/footer";
import { CartProvider } from "@/components/cart-provider";
import { WishlistProvider } from "@/components/wishlist-provider";
import { CompareProvider } from "@/components/compare-provider";
import { ToastProvider } from "@/components/ui/toast";
import TopProgress from "@/components/ui/top-progress";

// Display font — elegant serif for headings, hero, logo (organic/farm feel)
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
});

// Body font — clean, highly readable
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Handwritten script — decorative accents ("Farm Fresh")
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KisanMart — Fresh Seeds & Farm Essentials",
  description:
    "India's trusted agri store. Quality-tested seeds, fertilizers, pesticides and tools for Indian farmers — direct from trusted manufacturers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-surface font-sans text-body">
        <ToastProvider>
          <CartProvider>
            <WishlistProvider>
              <CompareProvider>
                <TopProgress />
                <NavbarGate>
                  <Navbar />
                </NavbarGate>
                {children}
                <NavbarGate>
                  <Footer />
                </NavbarGate>
              </CompareProvider>
            </WishlistProvider>
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
