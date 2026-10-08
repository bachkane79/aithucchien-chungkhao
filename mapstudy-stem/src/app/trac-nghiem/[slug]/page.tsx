import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ChevronRight, ClipboardCheck } from 'lucide-react';
import { simulations, getSimulation } from '@/lib/simulations';
import { getQuizForSimulation } from '@/lib/quizzes';
import { quizFingerprint } from '@/lib/quiz-progress';
import { QuizWorkspace } from '@/components/quiz-workspace';
import styles from '@/components/quiz.module.css';

export function generateStaticParams() { return simulations.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const simulation = getSimulation(slug);
  return { title: simulation ? `Bài test hiểu biết · ${simulation.title}` : 'Không tìm thấy bài test' };
}

export default async function QuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const simulation = getSimulation(slug);
  if (!simulation) notFound();
  const quiz = getQuizForSimulation(simulation.slug);
  return <div className="container page-section">
    <div className="breadcrumbs"><Link href="/">Trang chủ</Link><ChevronRight size={14} /><Link href="/trac-nghiem">Trắc nghiệm</Link><ChevronRight size={14} /><span>{simulation.title}</span></div>
    <div className={styles.hero}><div><div className="section-kicker">BÀI TEST HIỂU BIẾT · {simulation.subject.toUpperCase()}</div><h1>{simulation.title}</h1><p>Nhận biết tương tác, dự đoán thay đổi và giải thích bằng lý thuyết cơ bản; khác với bài nâng cao.</p></div><Link className="button secondary" href={`/mo-phong/${simulation.slug}`}><ArrowLeft size={16} />Về mô phỏng</Link></div>
    {quiz?.questions.length ? <QuizWorkspace key={quizFingerprint(quiz)} quiz={quiz} simulationSlug={simulation.slug} /> : <div className={styles.empty}>
      <div className={styles.emptyIcon}><ClipboardCheck size={34} /></div><span className={styles.badge}>Chờ nội dung</span><h2 style={{ marginTop: 18 }}>Bài test đang được chuẩn bị</h2>
      <p>Chủ đề <strong>{simulation.title}</strong> chưa có câu hỏi chính thức. Khi nội dung được bổ sung, bạn có thể làm bài và xem kết quả ngay tại đây. Trong lúc chờ, hãy tiếp tục khám phá mô phỏng hoặc thử bài mẫu.</p>
      <div className={styles.actions}><Link href={`/mo-phong/${simulation.slug}`} className="button primary">Tiếp tục mô phỏng<ArrowRight size={17} /></Link><Link href="/trac-nghiem/pendulum-lab" className="button secondary">Trải nghiệm bài mẫu</Link></div>
    </div>}
  </div>;
}
