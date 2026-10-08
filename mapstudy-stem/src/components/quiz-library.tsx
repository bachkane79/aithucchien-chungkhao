'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, ClipboardCheck, Clock3, Search } from 'lucide-react';
import { normalizeSearch, subjects, type Subject } from '@/lib/simulations';
import styles from './quiz.module.css';

interface QuizLibraryItem {
  slug: string;
  title: string;
  englishTitle: string;
  subject: Subject;
  subjects: Subject[];
  questionCount: number;
  estimatedMinutes: number;
  isDemo: boolean;
  available: boolean;
}

const pageSize = 12;
export function QuizLibrary({ items }: { items: QuizLibraryItem[] }) {
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('Tất cả');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [page, setPage] = useState(1);
  const filtered = items.filter((item) => (subject === 'Tất cả' || item.subjects.some((value) => value === subject))
    && (!onlyAvailable || item.available)
    && normalizeSearch(`${item.title} ${item.englishTitle} ${item.subjects.join(' ')}`).includes(normalizeSearch(query.trim())))
    .sort((a, b) => Number(b.available) - Number(a.available));
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const availableCount = items.filter((item) => item.available).length;

  function reset() { setQuery(''); setSubject('Tất cả'); setOnlyAvailable(false); setPage(1); }
  const resultsRef = useRef<HTMLElement>(null);
  const focusResults = useRef(false);
  useEffect(() => {
    if (!focusResults.current) return;
    focusResults.current = false;
    resultsRef.current?.focus({ preventScroll: true });
    resultsRef.current?.scrollIntoView({ block: 'start' });
  }, [currentPage]);
  function changePage(next: number) { focusResults.current = true; setPage(next); }

  return <>
    <div className={styles.toolbar}>
      <label className={styles.search}><Search size={18} /><input type="search" aria-label="Tìm bài trắc nghiệm" placeholder="Tìm chủ đề bạn vừa khám phá..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label>
      <select aria-label="Lọc bài trắc nghiệm theo môn" value={subject} onChange={(event) => { setSubject(event.target.value); setPage(1); }}>{subjects.map((value) => <option key={value} value={value}>{value === 'Tất cả' ? 'Tất cả môn học' : value}</option>)}</select>
      <label className={styles.filter}><input type="checkbox" checked={onlyAvailable} onChange={(event) => { setOnlyAvailable(event.target.checked); setPage(1); }} /> Có thể làm ngay ({availableCount})</label>
    </div>
    <p className={styles.count} role="status">{filtered.length} chủ đề phù hợp · {availableCount} bài có thể trải nghiệm trên toàn thư viện</p>
    <section ref={resultsRef} tabIndex={-1} id="danh-sach-bai-test" aria-label="Danh sách bài trắc nghiệm">
      {visible.length ? <div className={styles.grid}>{visible.map((item) => <article className={styles.card} key={item.slug}>
        <div className={styles.cardTop}><div className={styles.cardIcon}><ClipboardCheck size={23} /></div><span className={`${styles.badge} ${item.isDemo ? styles.demoBadge : item.available ? styles.availableBadge : ''}`}>{item.isDemo ? 'Bài mẫu · Demo' : item.available ? 'Hiểu biết' : 'Chờ nội dung'}</span></div>
        <div className={styles.cardSubject}>{item.subjects.join(' · ')}</div><h2>{item.title}</h2>
        <p>{item.available ? 'Nhận biết thao tác, dự đoán thay đổi và củng cố lý thuyết cơ bản từ mô phỏng.' : 'Câu hỏi cho mô phỏng này sẽ được bổ sung. Bạn vẫn có thể tiếp tục thực hành.'}</p>
        {item.available && <div className={styles.cardMeta}><span><BookOpen size={14} />{item.questionCount} câu hỏi</span><span><Clock3 size={14} />~{item.estimatedMinutes} phút</span></div>}
        <Link className={`button ${item.available ? 'primary' : 'secondary'}`} prefetch={false} href={`/trac-nghiem/${item.slug}`}>{item.available ? 'Làm bài hiểu biết' : 'Xem chủ đề'}<ArrowRight size={16} /></Link>
      </article>)}</div> : <div className={styles.empty}><div className={styles.emptyIcon}><Search size={30} /></div><h2>Chưa tìm thấy bài phù hợp</h2><p>Thử từ khóa khác hoặc bỏ bớt bộ lọc để tìm chủ đề của bạn.</p><button className="button secondary" type="button" onClick={reset}>Xóa bộ lọc</button></div>}
    </section>
    {pageCount > 1 && <nav className={styles.pagination} aria-label="Phân trang bài trắc nghiệm"><button type="button" className="button secondary" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}><ArrowLeft size={16} />Trước</button><span aria-live="polite" aria-atomic="true">Trang {currentPage} / {pageCount}</span><button type="button" className="button secondary" disabled={currentPage === pageCount} onClick={() => changePage(currentPage + 1)}>Sau<ArrowRight size={16} /></button></nav>}
  </>;
}
