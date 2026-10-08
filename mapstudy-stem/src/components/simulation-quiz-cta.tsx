import Link from 'next/link';
import { ArrowRight, ClipboardCheck } from 'lucide-react';
import styles from './quiz.module.css';

export function SimulationQuizCta({ slug }: { slug: string }) {
  return <section className={styles.cta} aria-label="Kiểm tra sau mô phỏng">
    <div className={styles.ctaCopy}><ClipboardCheck size={32} /><div><strong>Bạn đã hiểu cách mô phỏng hoạt động chưa?</strong><p>Làm bài hiểu biết: thao tác nào ảnh hưởng đến đại lượng nào, tăng giảm ra sao và vì sao.</p></div></div>
    <Link className="button primary" href={`/trac-nghiem/${slug}`}>Test hiểu biết <ArrowRight size={17} /></Link>
  </section>;
}
