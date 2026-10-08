import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ChevronRight, Layers3 } from 'lucide-react';
import { SimulationLibrary } from '@/components/simulation-library';

export const metadata: Metadata = { title: 'Thư viện mô phỏng' };
export default function LibraryPage() {
  return <div className="container page-section"><div className="breadcrumbs"><Link href="/">Trang chủ</Link><ChevronRight size={14} /><span>Thư viện mô phỏng</span></div><div className="page-heading"><div><div className="section-kicker">HỌC THEO CÁCH CỦA BẠN</div><h1>Thư viện mô phỏng</h1><p>Tìm một chủ đề. Đặt một câu hỏi. Bắt đầu khám phá.</p></div><div className="page-heading-icon"><Layers3 size={36} strokeWidth={1.5} /></div></div><Suspense fallback={<p className="loading-state">Đang chuẩn bị thư viện...</p>}><SimulationLibrary /></Suspense></div>;
}
