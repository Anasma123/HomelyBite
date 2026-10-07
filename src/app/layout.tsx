import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/context/AuthContext';
import { CartProvider } from '@/lib/context/CartContext';
import RoleSwitcher from '@/components/RoleSwitcher';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'HomeFood Marketplace | Verified Home Cooks, Transparent Nutrition & Smart Delivery',
  description:
    'Discover homemade food from trusted local cooks, know exactly what goes inside it with transparent ingredients and AI nutrition calculation, and get it delivered reliably.',
  keywords: [
    'homemade food',
    'home bakery',
    'sourdough kochi',
    'eggless cake',
    'low sugar bakes',
    'artisan bakes',
    'macro calculated meal',
    'healthy homemade',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fbfbfa] text-slate-900 flex flex-col antialiased">
        <AuthProvider>
          <CartProvider>
            <RoleSwitcher />
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
