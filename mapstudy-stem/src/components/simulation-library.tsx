'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bookmark, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { simulations, subjects, normalizeSearch } from '@/lib/simulations';
import { SimulationCard } from './simulation-card';
import { useFavorites } from './favorites';

export function SimulationLibrary() {
  const params = useSearchParams();
  const { favorites, ready } = useFavorites();
  const urlQuery = params.get('q') ?? '';
  const [query, setQuery] = useState(urlQuery);
  useEffect(() => { setQuery(urlQuery); }, [urlQuery]);
  const subject = subjects.find((item) => item === params.get('mon')) ?? 'Tất cả';
  const language = params.get('ngonNgu') ?? '';
  const savedOnly = params.get('daLuu') === '1';
  const sort = params.get('sapXep') ?? 'goi-y';
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    window.history.replaceState(null, '', `/thu-vien${next.size ? `?${next.toString()}` : ''}`);
  };
  const reset = () => { setQuery(''); window.history.replaceState(null, '', '/thu-vien'); };
  const filtered = useMemo(() => {
    const result = simulations.filter((item) =>
      (subject === 'Tất cả' || (item.subjects ?? [item.subject]).includes(subject)) &&
      (!language || item.locale === language) &&
      (!savedOnly || favorites.includes(item.slug)) &&
      normalizeSearch(`${item.title} ${item.englishTitle ?? ''} ${(item.subjects ?? [item.subject]).join(' ')} ${item.description}`).includes(normalizeSearch(query.trim()))
    );
    if (sort === 'ten') result.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    if (sort === 'ngon-ngu') result.sort((a, b) => Number(b.locale === 'vi') - Number(a.locale === 'vi'));
    return result;
  }, [subject, language, savedOnly, favorites, query, sort]);
  const active = subject !== 'Tất cả' || !!language || savedOnly || !!query;

  return <div className="library-layout">
    <aside className="filter-panel" aria-label="Bộ lọc mô phỏng">
      <h2><SlidersHorizontal size={19} /> Bộ lọc</h2>
      <div className="filter-group"><h3>MÔN HỌC</h3>{subjects.map((item) => <button key={item} className={`subject-filter ${subject === item ? 'selected' : ''}`} onClick={() => update('mon', item === 'Tất cả' ? '' : item)} type="button" aria-pressed={subject === item}><span>{item}</span><small>{item === 'Tất cả' ? simulations.length : simulations.filter((sim) => (sim.subjects ?? [sim.subject]).includes(item)).length}</small></button>)}</div>
      <div className="filter-group"><h3>NGÔN NGỮ MÔ PHỎNG</h3><div className="grade-filters">{[{ value: 'vi', label: 'Tiếng Việt' }, { value: 'en', label: 'Tiếng Anh' }].map((item) => <button type="button" key={item.value} aria-pressed={language === item.value} className={language === item.value ? 'selected' : ''} onClick={() => update('ngonNgu', language === item.value ? '' : item.value)}>{item.label}</button>)}</div></div>
      <div className="filter-group"><h3>THƯ VIỆN CỦA BẠN</h3><button type="button" className={`saved-filter ${savedOnly ? 'selected' : ''}`} aria-pressed={savedOnly} onClick={() => update('daLuu', savedOnly ? '' : '1')}><Bookmark size={17} /> Đã lưu <small>{favorites.length}</small></button><p className="local-hint">Lưu trên trình duyệt này.<br />Không cần đăng nhập.</p></div>
      {active && <button className="clear-filters" type="button" onClick={reset}><X size={15} /> Xóa bộ lọc</button>}
      <div className="filter-tip"><span>✦</span><strong>Khám phá ngay!</strong><p>Mô phỏng PhET HTML5 mở trực tiếp trên website, không cần tải về.</p></div>
    </aside>
    <section className="library-results" aria-label="Danh sách mô phỏng">
      <div className="library-toolbar"><label className="library-search"><Search size={20} /><input type="search" aria-label="Tìm kiếm trong thư viện" placeholder="Tìm chủ đề bạn muốn khám phá..." value={query} onChange={(event) => { setQuery(event.target.value); update('q', event.target.value); }} /></label><label className="sort-select"><span>Sắp xếp</span><select aria-label="Sắp xếp mô phỏng" value={sort} onChange={(event) => update('sapXep', event.target.value)}><option value="goi-y">Gợi ý cho bạn</option><option value="ten">Tên A–Z</option><option value="ngon-ngu">Tiếng Việt trước</option></select></label></div>
      <div className="results-summary"><span><strong>{savedOnly && !ready ? '…' : filtered.length}</strong> mô phỏng{subject !== 'Tất cả' ? ` · ${subject}` : ' để khám phá'}</span><span><span className="status-dot ready" /> PhET HTML5 · Chơi ngay trên trình duyệt</span></div>
      {filtered.length ? <div className="simulation-grid library-grid">{filtered.map((simulation) => <SimulationCard key={simulation.slug} simulation={simulation} />)}</div> : <div className="empty-state"><Filter size={40} /><h2>{savedOnly ? 'Chưa có mô phỏng phù hợp đã lưu' : 'Chưa tìm thấy chủ đề phù hợp'}</h2><p>{savedOnly ? 'Nhấn biểu tượng dấu trang để lưu mô phỏng, hoặc thử bỏ bớt bộ lọc.' : 'Thử một từ khóa khác hoặc bỏ bớt bộ lọc để khám phá thêm.'}</p><button type="button" className="button primary" onClick={reset}>Xem tất cả chủ đề</button></div>}
    </section>
  </div>;
}
