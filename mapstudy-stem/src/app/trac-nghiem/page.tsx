import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ClipboardCheck, Info } from 'lucide-react';
import { simulations } from '@/lib/simulations';
import { getQuizForSimulation } from '@/lib/quizzes';
import { QuizLibrary } from '@/components/quiz-library';
import styles from '@/components/quiz.module.css';

export const metadata: Metadata = {
  title: 'Trắc nghiệm sau mô phỏng',
  description: 'Củng cố kiến thức sau khi khám phá mô phỏng STEM với câu hỏi trắc nghiệm và giải thích đáp án.',
};

export default function QuizLibraryPage() {
  const items = simulations.map((simulation) => {
    const quiz = getQuizForSimulation(simulation.slug);
    const available = !!quiz?.questions.length;
    return {
      slug: simulation.slug, title: simulation.title, englishTitle: simulation.englishTitle ?? '',
      subject: simulation.subject, subjects: simulation.subjects ?? [simulation.subject],
      questionCount: quiz?.questions.length ?? 0, estimatedMinutes: quiz?.estimatedMinutes ?? 0,
      isDemo: available && !!quiz?.isDemo, available,
    };
  });
  return <div className="container page-section">
    <div className="breadcrumbs"><Link href="/">Trang chủ</Link><ChevronRight size={14} /><span>Trắc nghiệm</span></div>
    <div className={styles.hero}><div><div className="section-kicker">HIỂU QUA TRẢI NGHIỆM · NHỚ QUA LUYỆN TẬP</div><h1>Khám phá rồi, bạn hiểu đến đâu?</h1><p>Chọn chủ đề vừa thực hành, trả lời câu hỏi và đối chiếu với những điều bạn quan sát được trong mô phỏng.</p></div><div className={styles.heroIcon}><ClipboardCheck size={42} /></div></div>
    <div className={styles.notice}><Info size={20} /><div><strong>{items.filter((item) => item.available && !item.isDemo).length} bài hiểu biết đã hoàn thiện · {items.filter((item) => item.available && item.isDemo).length} bài mẫu</strong>Các bài hoàn thiện gồm 6 câu riêng; bài con lắc mẫu vẫn được đánh dấu Demo. Những chủ đề còn lại hiển thị chờ nội dung. Đây là bài tự luyện, không phải bài kiểm tra do PhET phát hành hay bài nâng cao.</div></div>
    <QuizLibrary items={items} />
  </div>;
}
