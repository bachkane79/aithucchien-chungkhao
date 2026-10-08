'use client';
import { RotateCcw } from 'lucide-react';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="container not-found"><h1>Có chút gián đoạn</h1><p>Không thể hiển thị nội dung lúc này. Bạn hãy thử tải lại nhé.</p><button className="button primary" type="button" onClick={reset}><RotateCcw size={17} /> Thử lại</button></div>;
}
