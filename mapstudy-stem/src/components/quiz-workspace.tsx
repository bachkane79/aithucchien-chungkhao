'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, ClipboardCheck, Flag, Info, RotateCcw, Save, Trophy, XCircle } from 'lucide-react';
import { gradeQuiz, type QuizDefinition } from '@/lib/quizzes';
import { parseQuizProgress, quizFingerprint, quizStorageKey } from '@/lib/quiz-progress';
import styles from './quiz.module.css';

type View = 'intro' | 'active' | 'result';

export function QuizWorkspace({ quiz, simulationSlug }: { quiz: QuizDefinition; simulationSlug: string }) {
  const [view, setView] = useState<View>('intro');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [hasAttempt, setHasAttempt] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [confirm, setConfirm] = useState<'submit' | 'restart' | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const questionRef = useRef<HTMLLegendElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const storageKey = quizStorageKey(quiz);
  const fingerprint = quizFingerprint(quiz);
  const score = gradeQuiz(quiz, answers);
  const remaining = score.total - score.answered;
  const question = quiz.questions[index];

  useEffect(() => {
    try {
      const saved = parseQuizProgress(localStorage.getItem(storageKey), quiz);
      if (saved) {
        setAnswers(saved.answers); setFlagged(saved.flagged); setIndex(saved.index); setHasAttempt(true);
        if (saved.submitted) setView('result');
      }
    } catch { setStorageError(true); }
    setReady(true);
  }, [storageKey, quiz]);

  useEffect(() => {
    if (!ready || !hasAttempt) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ fingerprint, answers, flagged, index, submitted: view === 'result' }));
      setStorageError(false);
    } catch { setStorageError(true); }
  }, [ready, hasAttempt, storageKey, fingerprint, answers, flagged, index, view]);

  useEffect(() => {
    if (view === 'active') questionRef.current?.focus();
    if (view === 'result') resultRef.current?.focus();
  }, [view, index]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (confirm && dialog && !dialog.open) dialog.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, [confirm]);

  function start() { setHasAttempt(true); setView('active'); }
  function restart() { setAnswers({}); setFlagged([]); setIndex(0); setHasAttempt(true); setView('active'); setConfirm(null); }
  function submit() { setConfirm(null); setView('result'); }
  function clearAnswer() { setAnswers((current) => { const next = { ...current }; delete next[question.id]; return next; }); }
  function toggleFlag() { setFlagged((current) => current.includes(question.id) ? current.filter((id) => id !== question.id) : [...current, question.id]); }

  const storageMessage = <p className={`${styles.storage} ${storageError ? styles.warning : ''}`} role="status"><Save size={14} />{!ready ? 'Đang tải tiến độ...' : storageError ? 'Không thể lưu trên trình duyệt này. Tiến độ sẽ mất khi rời trang.' : 'Tiến độ và kết quả chỉ lưu trên trình duyệt này.'}</p>;

  return <>
    {quiz.isDemo && <div className={styles.notice}><Info size={20} /><div><strong>Bài mẫu · Demo</strong>Đây là nội dung minh họa để thử tính năng. Không phải đề chính thức và không gửi điểm cho giáo viên.</div></div>}
    <div className={styles.steps} aria-label="Các bước làm bài">{[{ label: 'Chuẩn bị', value: 'intro' }, { label: 'Làm bài', value: 'active' }, { label: 'Kết quả', value: 'result' }].map((step, stepIndex) => <span key={step.value} className={`${styles.step} ${view === step.value ? styles.activeStep : ''}`} aria-current={view === step.value ? 'step' : undefined}><span className={styles.stepNumber}>{stepIndex + 1}</span>{step.label}{stepIndex < 2 && <ChevronRight size={14} />}</span>)}</div>

    {view === 'intro' && <div className={styles.intro}>
      <section className={styles.panel}><div className="section-kicker">SẴN SÀNG CỦNG CỐ KIẾN THỨC?</div><h2>{quiz.title}</h2><p style={{ color: 'var(--muted)', fontSize: 14 }}>{quiz.description}</p>
        <ul className={styles.instructions}><li><ClipboardCheck size={21} /><div><strong>Mỗi câu có một đáp án đúng</strong>Chọn đáp án phù hợp với những điều bạn đã quan sát và học được.</div></li><li><Flag size={21} /><div><strong>Thoải mái xem lại trước khi nộp</strong>Chuyển giữa các câu, sửa đáp án hoặc đánh dấu câu còn phân vân.</div></li><li><CheckCircle2 size={21} /><div><strong>Hiểu vì sao, không chỉ biết điểm</strong>Sau khi nộp bài, xem đáp án và giải thích để củng cố kiến thức.</div></li></ul>
        {hasAttempt && <div className={styles.notice}><Save size={18} /><div><strong>Bạn có bài đang làm dở</strong>Đã trả lời {score.answered}/{score.total} câu. Bạn có thể tiếp tục từ câu {index + 1}.</div></div>}
        <div className={styles.actions}><button type="button" className="button primary" disabled={!ready} onClick={start}>{hasAttempt ? 'Tiếp tục làm bài' : 'Bắt đầu làm bài'}<ArrowRight size={17} /></button>{hasAttempt && <button type="button" className="button secondary" onClick={() => setConfirm('restart')}><RotateCcw size={16} />Làm lại từ đầu</button>}</div>{storageMessage}
      </section>
      <aside className={`${styles.panel} ${styles.summary}`} aria-label="Thông tin bài test"><h2>Thông tin bài test</h2><dl><div><dt>Số câu hỏi</dt><dd>{score.total} câu</dd></div><div><dt>Thời gian gợi ý</dt><dd>~{quiz.estimatedMinutes} phút</dd></div><div><dt>Mức độ</dt><dd>{quiz.level === 'advanced' ? 'Nâng cao' : 'Hiểu biết'}</dd></div><div><dt>Hình thức</dt><dd>Chọn một đáp án</dd></div><div><dt>Cách tính điểm</dt><dd>Mỗi câu đúng bằng nhau</dd></div></dl><p className={styles.summaryNote}>Không giới hạn thời gian. Câu chưa trả lời được tính là chưa đúng khi nộp bài. Đây là bài tự luyện do BananaLearning biên soạn dựa trên mô phỏng PhET, không phải bài kiểm tra do PhET phát hành.</p><Link href={`/mo-phong/${simulationSlug}`} className="view-all" style={{ marginTop: 20 }}><BookOpen size={16} />Xem lại mô phỏng</Link></aside>
    </div>}

    {view === 'active' && <div className={styles.workspace}>
      <section className={`${styles.panel} ${styles.question}`} aria-label="Câu hỏi hiện tại">
        <div className={styles.questionTop}><span>CÂU {index + 1} / {score.total} · CHỌN MỘT ĐÁP ÁN</span><button className={`${styles.flag} ${flagged.includes(question.id) ? styles.flagged : ''}`} type="button" aria-pressed={flagged.includes(question.id)} onClick={toggleFlag}><Flag size={14} fill={flagged.includes(question.id) ? 'currentColor' : 'none'} />{flagged.includes(question.id) ? 'Đã đánh dấu' : 'Đánh dấu xem lại'}</button></div>
        <fieldset className={styles.fieldset}><legend ref={questionRef} tabIndex={-1}>{question.prompt}</legend>{question.options.map((option, optionIndex) => <label className={`${styles.option} ${answers[question.id] === option.id ? styles.selected : ''}`} key={option.id}><input type="radio" name={`question-${question.id}`} checked={answers[question.id] === option.id} onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))} value={option.id} /><span className={styles.optionLetter} aria-hidden="true">{String.fromCharCode(65 + optionIndex)}</span><span className={styles.optionText}>{option.text}</span></label>)}</fieldset>
        <div className={styles.questionFooter}><button type="button" disabled={!answers[question.id]} onClick={clearAnswer}>Bỏ lựa chọn</button><div className={styles.actions}><button type="button" className="button secondary" disabled={index === 0} onClick={() => setIndex((current) => current - 1)}><ArrowLeft size={16} />Câu trước</button>{index < score.total - 1 ? <button type="button" className="button primary" onClick={() => setIndex((current) => current + 1)}>Câu tiếp<ArrowRight size={16} /></button> : <button type="button" className="button primary" onClick={() => setConfirm('submit')}>Nộp bài<Check size={16} /></button>}</div></div>{storageMessage}
      </section>
      <aside className={`${styles.panel} ${styles.navigator}`} aria-label="Điều hướng câu hỏi"><h2>Tiến độ của bạn</h2><p aria-live="polite">Đã trả lời {score.answered}/{score.total} câu</p><progress className={styles.progress} value={score.answered} max={score.total} aria-label="Tiến độ trả lời" />
        <div className={styles.questionMap}>{quiz.questions.map((item, questionIndex) => <button type="button" key={item.id} className={`${styles.questionNumber} ${answers[item.id] ? styles.answered : ''} ${index === questionIndex ? styles.current : ''}`} aria-label={`Câu ${questionIndex + 1}, ${answers[item.id] ? 'đã trả lời' : 'chưa trả lời'}${flagged.includes(item.id) ? ', đã đánh dấu' : ''}`} aria-current={index === questionIndex ? 'step' : undefined} onClick={() => setIndex(questionIndex)}>{questionIndex + 1}{flagged.includes(item.id) && <span className={styles.flagDot} />}</button>)}</div>
        <div className={styles.mapLegend}><span><i className={styles.legendDot} />Đã trả lời</span><span><i className={`${styles.legendDot} ${styles.legendFlag}`} />Xem lại ({flagged.length})</span></div><button className="button primary" type="button" onClick={() => setConfirm('submit')}>Nộp bài<CheckCircle2 size={17} /></button><p className={styles.summaryNote}>Bạn có thể nộp bất cứ lúc nào. Hãy kiểm tra các câu đã đánh dấu trước khi nộp.</p>
      </aside>
    </div>}

    {view === 'result' && <>
      <section className={styles.resultHero}><Trophy size={35} /><h2 ref={resultRef} tabIndex={-1}>Bạn đã hoàn thành bài test!</h2><div className={styles.score}>{(score.correct / score.total * 10).toFixed(1)}<span> / 10</span></div><p>{score.correct === score.total ? 'Rất tốt! Bạn đã trả lời đúng tất cả câu hỏi. Hãy tiếp tục khám phá những chủ đề mới.' : 'Mỗi câu hỏi là một cơ hội hiểu sâu hơn. Xem lại phần giải thích và thử mô phỏng để kiểm chứng nhé.'}</p>
        <div className={styles.resultStats}><div><strong>{score.correct}/{score.total}</strong><span>Câu đúng</span></div><div><strong>{score.answered - score.correct}</strong><span>Câu sai</span></div><div><strong>{remaining}</strong><span>Chưa trả lời</span></div><div><strong>{score.percentage}%</strong><span>Tỉ lệ đúng</span></div></div>
        <div className={styles.actions}><button className="button primary" type="button" onClick={() => setConfirm('restart')}><RotateCcw size={17} />Làm lại bài test</button><Link className="button secondary" href={`/mo-phong/${simulationSlug}`}><BookOpen size={17} />Quay lại mô phỏng</Link><Link className="button text-button" href="/trac-nghiem">Chọn chủ đề khác<ArrowRight size={16} /></Link></div>{storageMessage}
      </section>
      <h2 className={styles.reviewHeading}>Đáp án & giải thích</h2>
      {quiz.questions.map((item, questionIndex) => {
        const selected = answers[item.id];
        const correct = selected === item.correctOptionId;
        return <article key={item.id} className={`${styles.panel} ${styles.review}`}>
          <div className={styles.reviewTop}><span>CÂU {questionIndex + 1}</span><span className={`${styles.badge} ${correct ? styles.availableBadge : ''}`}>{correct ? <CheckCircle2 size={14} /> : <XCircle size={14} />}{correct ? 'Trả lời đúng' : selected ? 'Trả lời chưa đúng' : 'Chưa trả lời'}</span></div>
          <h3>{item.prompt}</h3><ul className={styles.reviewOptions}>{item.options.map((option, optionIndex) => <li key={option.id} className={`${styles.reviewOption} ${option.id === item.correctOptionId ? styles.correct : option.id === selected ? styles.incorrect : ''}`}><span className={styles.optionLetter}>{String.fromCharCode(65 + optionIndex)}</span><span>{option.text}</span>{option.id === item.correctOptionId && <small><Check size={14} />Đáp án đúng</small>}{option.id === selected && <small>Bạn chọn</small>}</li>)}</ul><div className={styles.explanation}><strong>Vì sao đáp án này đúng?</strong><p>{item.explanation}</p></div>
        </article>;
      })}
    </>}

    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="quiz-confirm-title" aria-describedby="quiz-confirm-description" onCancel={() => setConfirm(null)} onClose={() => setConfirm(null)} onKeyDown={(event) => {
      if (event.key !== 'Tab') return;
      const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <h2 id="quiz-confirm-title">{confirm === 'restart' ? 'Làm lại từ đầu?' : 'Sẵn sàng nộp bài?'}</h2><p id="quiz-confirm-description">{confirm === 'restart' ? 'Đáp án, đánh dấu và kết quả hiện tại sẽ được xóa. Bạn sẽ bắt đầu một lượt làm bài mới.' : `Bạn đã trả lời ${score.answered}/${score.total} câu.${remaining ? ` Còn ${remaining} câu chưa trả lời; các câu này sẽ được tính là chưa đúng.` : ''}${flagged.length ? ` Có ${flagged.length} câu được đánh dấu xem lại.` : ''} Sau khi nộp, bạn sẽ xem được điểm và giải thích đáp án.`}</p>
      <div className={styles.actions}><button type="button" className="button secondary" autoFocus onClick={() => setConfirm(null)}>{confirm === 'restart' ? 'Hủy' : 'Tiếp tục kiểm tra'}</button><button type="button" className="button primary" onClick={confirm === 'restart' ? restart : submit}>{confirm === 'restart' ? 'Làm lại từ đầu' : 'Xác nhận nộp bài'}</button></div>
    </dialog>
  </>;
}
