'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bookmark, Check, ChevronRight, Clock3, FileCode2, FlaskConical, Maximize2, Minimize2, RotateCcw, Upload, X } from 'lucide-react';
import type { Simulation } from '@/lib/simulations';
import { useFavorites } from './favorites';
import { ScienceArt } from './science-art';
import { subjectClass } from './simulation-card';
import { SimulationQuizCta } from './simulation-quiz-cta';

export function SimulationWorkspace({ simulation }: { simulation: Simulation }) {
  const { favorites, toggle } = useFavorites();
  const [tab, setTab] = useState<'guide' | 'notes' | 'about'>('guide');
  const [notes, setNotes] = useState('');
  const [notesReady, setNotesReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [localHtml, setLocalHtml] = useState<{ url: string; name: string } | null>(null);
  const [error, setError] = useState('');
  const [frameKey, setFrameKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const src = localHtml?.url ?? simulation.embedSrc;
  const storageKey = `mapstudy-stem:notes:${simulation.slug}`;
  const saved = favorites.includes(simulation.slug);

  useEffect(() => {
    try { setNotes(localStorage.getItem(storageKey) ?? ''); } catch { setStorageError(true); }
    setNotesReady(true);
    const onFullScreen = () => setFullscreen(document.fullscreenElement === canvas.current);
    document.addEventListener('fullscreenchange', onFullScreen);
    return () => document.removeEventListener('fullscreenchange', onFullScreen);
  }, [storageKey]);
  useEffect(() => () => { if (localHtml) URL.revokeObjectURL(localHtml.url); }, [localHtml]);
  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpanded(false); };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = previous; };
  }, [expanded]);

  async function toggleFullscreen() {
    if (expanded) { setExpanded(false); return; }
    if (fullscreen) { await document.exitFullscreen(); return; }
    try {
      if (!canvas.current?.requestFullscreen) { setExpanded(true); return; }
      await canvas.current.requestFullscreen();
    } catch { setExpanded(true); }
  }
  function saveNotes(value: string) {
    setNotes(value);
    try { localStorage.setItem(storageKey, value); setStorageError(false); } catch { setStorageError(true); }
  }
  function loadFile(file?: File) {
    if (!file) return;
    if (!/\.html?$/i.test(file.name)) { setError('Vui lòng chọn một tệp .html hoặc .htm.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Tệp quá lớn. Vui lòng chọn HTML nhỏ hơn 10 MB.'); return; }
    setError('');
    setLocalHtml({ url: URL.createObjectURL(new Blob([file], { type: 'text/html' })), name: file.name });
    setFrameKey((current) => current + 1);
    if (fileInput.current) fileInput.current.value = '';
  }

  return <div className={`container page-section detail-page ${subjectClass(simulation.subject)}`}>
    <div className="breadcrumbs"><Link href="/">Trang chủ</Link><ChevronRight size={14} /><Link href="/thu-vien">Thư viện mô phỏng</Link><ChevronRight size={14} /><span>{simulation.title}</span></div>
    <div className="detail-heading"><div><div className="detail-tags"><span className="subject-pill">{simulation.subject}</span><span>{simulation.locale === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh'} · PhET HTML5</span><span><Clock3 size={14} /> {simulation.duration} phút gợi ý</span></div><h1>{simulation.title}</h1><p>{simulation.description}</p></div><button type="button" className={`button secondary ${saved ? 'is-saved' : ''}`} aria-pressed={saved} onClick={() => toggle(simulation.slug)}><Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Đã lưu chủ đề' : 'Lưu chủ đề'}</button></div>
    <SimulationQuizCta slug={simulation.slug} />
    <div className="workspace-grid"><div className="workspace-main"><div ref={canvas} className={`simulation-canvas ${expanded ? 'expanded-canvas' : ''}`}><div className="canvas-toolbar"><span><span className={src ? 'status-dot ready' : 'status-dot'} />{src ? 'Mô phỏng HTML' : 'Vùng chờ mô phỏng'}</span><div><button type="button" className="icon-button" title="Tải lại khung mô phỏng" aria-label="Tải lại khung mô phỏng" disabled={!src} onClick={() => setFrameKey((current) => current + 1)}><RotateCcw size={17} /></button><button type="button" className="icon-button" title={fullscreen || expanded ? 'Thu nhỏ' : 'Toàn màn hình'} aria-label={fullscreen || expanded ? 'Thu nhỏ' : 'Toàn màn hình'} onClick={() => void toggleFullscreen()}>{fullscreen || expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button></div></div>
      {src ? <iframe key={frameKey} src={src} title={`Mô phỏng ${simulation.title}`} className="simulation-frame" sandbox="allow-scripts allow-pointer-lock" allow="fullscreen" onError={() => setError('Không thể tải tệp mô phỏng. Hãy kiểm tra đường dẫn HTML.')} /> : <div className="canvas-placeholder"><div className="placeholder-art"><ScienceArt kind={simulation.illustration} /></div><span className="outline-pill"><FileCode2 size={14} /> KHUNG NHÚNG HTML</span><h2>Sẵn sàng cho một khám phá mới</h2><p>Mô phỏng <strong>{simulation.title.toLowerCase()}</strong> sẽ xuất hiện tại đây.<br />Hiện tại đây là giao diện chờ, chưa có mô phỏng tương tác.</p><button type="button" className="button primary" onClick={() => fileInput.current?.click()}><Upload size={17} /> Thử nhúng tệp HTML</button><small>Tệp chạy trên trình duyệt, không tải lên máy chủ.</small></div>}
      <input ref={fileInput} type="file" accept=".html,.htm,text/html" className="visually-hidden" aria-label="Chọn tệp HTML mô phỏng" onChange={(event) => loadFile(event.target.files?.[0])} />
    </div><div className="canvas-footer"><span><FlaskConical size={16} />{localHtml ? `Đang thử: ${localHtml.name}` : 'Học qua thử nghiệm · Khám phá theo cách của bạn'}</span>{src && <button type="button" onClick={() => fileInput.current?.click()}>Đổi tệp HTML</button>}{localHtml && <button type="button" onClick={() => { setLocalHtml(null); setError(''); }}><X size={14} /> Gỡ tệp</button>}</div>{error && <p className="error-message" role="alert">{error}</p>}{simulation.provider === 'PhET' && <div className="phet-attribution"><p>Mô phỏng của <a href="https://phet.colorado.edu" target="_blank" rel="noreferrer">PhET Interactive Simulations, University of Colorado Boulder</a>, được cấp phép theo <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noreferrer">CC BY-NC 4.0</a>.</p>{simulation.locale !== 'vi' && <p>PhET chưa cung cấp bản tiếng Việt cho mô phỏng này; bản gốc tiếng Anh được giữ nguyên.</p>}{simulation.sourcePage && <a href={simulation.sourcePage} target="_blank" rel="noreferrer">Thông tin và tài liệu gốc trên PhET ↗</a>}</div>}<div className="embed-note"><FileCode2 size={20} /><div><strong>Bạn có mô phỏng HTML riêng?</strong><p>Thử tệp HTML độc lập ngay trên trình duyệt, hoặc cấu hình đường dẫn cố định trong mã nguồn. <Link href="/huong-dan#nhung-html">Xem hướng dẫn nhúng →</Link></p></div></div></div>
      <aside className="workspace-sidebar"><div className="workspace-tabs" role="tablist" aria-label="Thông tin chủ đề">{[{ id: 'guide', label: 'Hướng dẫn' }, { id: 'notes', label: 'Ghi chú' }, { id: 'about', label: 'Thông tin' }].map((item) => <button key={item.id} type="button" role="tab" id={`tab-${item.id}`} aria-controls={`panel-${item.id}`} aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id as typeof tab)}>{item.label}</button>)}</div>
        <div className="workspace-panel" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === 'guide' && <><div className="sidebar-kicker">MỤC TIÊU KHÁM PHÁ</div><h2>Bạn sẽ tìm hiểu gì?</h2><ul className="goals-list">{simulation.goals.map((goal) => <li key={goal}><Check size={16} /><span>{goal}</span></li>)}</ul><div className="sidebar-divider" /><div className="sidebar-kicker">GỢI Ý KHÁM PHÁ</div><ol className="prompts-list">{simulation.prompts.map((prompt, index) => <li key={prompt}><span>{index + 1}</span><p>{prompt}</p></li>)}</ol><div className="sidebar-tip">✦ <span>Thay đổi từng yếu tố một để dễ quan sát sự khác biệt.</span></div></>}
          {tab === 'notes' && <><div className="sidebar-kicker">NHẬT KÍ KHÁM PHÁ</div><h2>Điều bạn nhận ra</h2><p className="notes-description">Ghi lại dự đoán, quan sát và câu hỏi của bạn.</p><textarea aria-label="Ghi chú khám phá" placeholder={'Mình dự đoán rằng...\n\nSau khi quan sát, mình nhận thấy...\n\nMình muốn tìm hiểu thêm...'} value={notes} onChange={(event) => saveNotes(event.target.value)} disabled={!notesReady} maxLength={20000} /><div className="notes-status" role="status">{storageError ? 'Không thể lưu trên trình duyệt này. Hãy sao chép ghi chú trước khi rời trang.' : 'Tự động lưu trên trình duyệt này.'}</div><button className="clear-filters" type="button" disabled={!notes} onClick={() => { if (window.confirm('Bạn muốn xóa toàn bộ ghi chú của chủ đề này?')) saveNotes(''); }}>Xóa ghi chú</button></>}
          {tab === 'about' && <><div className="sidebar-kicker">THÔNG TIN CHỦ ĐỀ</div><h2>{simulation.title}</h2><dl className="info-list"><div><dt>Môn học</dt><dd>{simulation.subject}</dd></div><div><dt>Ngôn ngữ</dt><dd>{simulation.locale === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh'}</dd></div><div><dt>Chuyên đề</dt><dd>{simulation.topic}</dd></div><div><dt>Trạng thái</dt><dd>{src ? 'Đã nhúng HTML' : 'Đang chờ mô phỏng'}</dd></div></dl><p className="notes-description">Nội dung mô phỏng do PhET Interactive Simulations, University of Colorado Boulder cung cấp, được giữ nguyên từ bản HTML5 chính thức. Các gợi ý học tập bên cạnh là gợi ý của BananaLearning.</p><dl className="info-list"><div><dt>Phân loại PhET</dt><dd>{(simulation.subjects ?? [simulation.subject]).join(', ')}</dd></div>{simulation.gradeLevels?.length ? <div><dt>Cấp học PhET</dt><dd>{simulation.gradeLevels.join(', ')}</dd></div> : null}<div><dt>Giấy phép</dt><dd>{simulation.license ?? 'CC BY-NC 4.0'}</dd></div></dl><Link className="view-all" href="/huong-dan#nhung-html">Cách nhúng HTML <ChevronRight size={16} /></Link></>}
        </div>
      </aside>
    </div>
  </div>;
}
