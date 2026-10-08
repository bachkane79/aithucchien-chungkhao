import Link from 'next/link';
import { ArrowLeft, Telescope } from 'lucide-react';

export default function NotFound() {
  return <div className="container not-found"><Telescope size={58} strokeWidth={1.4} /><span className="section-kicker">404 · LẠC KHỎI QUỸ ĐẠO MỘT CHÚT</span><h1>Chưa tìm thấy trang này</h1><p>Đường dẫn có thể đã thay đổi. Hãy trở về thư viện để tiếp tục khám phá nhé.</p><Link className="button primary" href="/thu-vien"><ArrowLeft size={17} /> Về thư viện mô phỏng</Link></div>;
}
