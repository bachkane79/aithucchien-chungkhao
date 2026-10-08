'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, BookOpen, FlaskConical, Menu, Search, X } from 'lucide-react';
import styles from './site-shell.module.css';

const nav = [
  { href: '/', label: 'Trang chủ' },
  { href: '/thu-vien', label: 'Thư viện mô phỏng' },
  { href: '/trac-nghiem', label: 'Trắc nghiệm' },
  { href: '/huong-dan', label: 'Hướng dẫn' },
  { href: '/gioi-thieu', label: 'Về BananaLearning' },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState('');
  return <header className="site-header"><div className={`container header-inner ${styles.headerInner}`}>
    <Link href="/" className="brand" aria-label="BananaLearning - Trang chủ"><img src="/brand/bananalearning.png" alt="" width="40" height="40" /><span><strong>BananaLearning</strong><small>KHÔNG GIAN STEM</small></span></Link>
    <nav aria-label="Điều hướng chính" className={menu ? 'main-nav open' : 'main-nav'}>{nav.map((item) => <Link onClick={() => setMenu(false)} key={item.href} href={item.href} className={(item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)) ? 'active' : ''}>{item.label}</Link>)}</nav>
    <form className="header-search" role="search" onSubmit={(event) => { event.preventDefault(); router.push(`/thu-vien?q=${encodeURIComponent(query)}`); setMenu(false); }}><input aria-label="Tìm mô phỏng" placeholder="Tìm mô phỏng..." value={query} onChange={(event) => setQuery(event.target.value)} /><button aria-label="Tìm kiếm" type="submit"><Search size={18} /></button></form>
    <button type="button" className="menu-toggle icon-button" aria-label={menu ? 'Đóng menu' : 'Mở menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
  </div></header>;
}

export function Footer() {
  return <footer className="site-footer"><div className="container footer-grid">
    <div className="footer-brand"><Link href="/" className="brand"><img src="/brand/bananalearning.png" width="44" height="44" alt="" /><span><strong>BananaLearning</strong><small>KHÔNG GIAN STEM</small></span></Link><p>Định vị tri thức<br />Dẫn lối tư duy.</p><span className="footer-note">Học bằng trải nghiệm, hiểu bằng khám phá.</span></div>
    <div><h3>KHÁM PHÁ</h3><Link href="/thu-vien?mon=Vật%20lí">Vật lí</Link><Link href="/thu-vien?mon=Hóa%20học">Hóa học</Link><Link href="/thu-vien?mon=Toán%20học">Toán học</Link><Link href="/thu-vien?mon=Sinh%20học">Sinh học</Link><Link href={`/thu-vien?mon=${encodeURIComponent('Khoa học Trái Đất')}`}>Khoa học Trái Đất</Link></div>
    <div><h3>ĐỒNG HÀNH</h3><Link href="/huong-dan">Hướng dẫn sử dụng</Link><Link href="/huong-dan#nhung-html">PhET và thử HTML cục bộ</Link><Link href="/gioi-thieu">Về không gian STEM</Link><Link href="/thu-vien?daLuu=1">Mô phỏng đã lưu</Link></div>
    <div className="footer-message"><FlaskConical size={26} /><h3>MỘT CÂU HỎI NHỎ.<br />MỘT KHÁM PHÁ LỚN.</h3><p>Không cần tài khoản. Chọn một chủ đề và bắt đầu hành trình của bạn.</p><Link href="/thu-vien">Đến thư viện <ArrowRight size={16} /></Link></div>
  </div><div className="container footer-bottom"><span>Mô phỏng do <a href="https://phet.colorado.edu" target="_blank" rel="noopener noreferrer">PhET Interactive Simulations · University of Colorado Boulder</a> phát triển, được cấp phép theo <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener noreferrer">CC BY-NC 4.0</a> (phi thương mại). <a href="https://phet.colorado.edu/en/licensing" target="_blank" rel="noopener noreferrer">Điều kiện sử dụng PhET</a></span></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} BananaLearning · Giao diện học tập thử nghiệm</span><span><BookOpen size={14} /> Dành cho học sinh THPT</span></div></footer>;
}
