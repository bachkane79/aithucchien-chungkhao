import type { Metadata } from 'next';
import { Header, Footer } from '@/components/site-shell';
import { FavoritesProvider } from '@/components/favorites';
import './brand-font.css';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'BananaLearning — Học bằng khám phá', template: '%s | BananaLearning' },
  description: 'Không gian khám phá STEM dành cho học sinh THPT. Thư viện mô phỏng Vật lí, Hóa học, Toán học và Sinh học, không cần tài khoản.',
  icons: { icon: '/brand/bananalearning.png' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body><FavoritesProvider><a className="skip-link" href="#noi-dung">Chuyển đến nội dung</a><Header /><main id="noi-dung">{children}</main><Footer /></FavoritesProvider></body></html>;
}
