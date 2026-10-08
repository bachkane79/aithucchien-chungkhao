'use client';

import Link from 'next/link';
import { ArrowUpRight, Bookmark, Clock3 } from 'lucide-react';
import type { Simulation } from '@/lib/simulations';
import { ScienceArt } from './science-art';
import { useFavorites } from './favorites';

export function subjectClass(subject: string) {
  return subject === 'Vật lí' ? 'physics' : subject === 'Hóa học' ? 'chemistry' : subject === 'Toán học' ? 'math' : 'biology';
}

export function SimulationCard({ simulation }: { simulation: Simulation }) {
  const { favorites, toggle } = useFavorites();
  const saved = favorites.includes(simulation.slug);
  return <article className={`simulation-card ${subjectClass(simulation.subject)}`}>
    <div className="card-visual"><Link prefetch={false} href={`/mo-phong/${simulation.slug}`} aria-label={`Khám phá ${simulation.title}`}>{simulation.thumbnail ? <img className="simulation-thumbnail" src={simulation.thumbnail} alt="" loading="lazy" decoding="async" /> : <ScienceArt kind={simulation.illustration} />}</Link><span className="grade-tag">{simulation.locale === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh'}</span><button className={`save-button ${saved ? 'saved' : ''}`} type="button" aria-label={`${saved ? 'Bỏ lưu' : 'Lưu'} ${simulation.title}`} aria-pressed={saved} onClick={() => toggle(simulation.slug)}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /></button><span className="placeholder-tag">{simulation.embedSrc ? 'Có mô phỏng' : 'Chờ mô phỏng'}</span></div>
    <div className="card-body"><div className="card-topic"><span className="subject-dot" />{simulation.subject}<span className="topic-separator">/</span><span>{simulation.topic}</span></div><h3><Link prefetch={false} href={`/mo-phong/${simulation.slug}`}>{simulation.title}</Link></h3><p>{simulation.description}</p><div className="card-bottom"><span><Clock3 size={14} /> {simulation.duration} phút gợi ý</span><Link prefetch={false} href={`/mo-phong/${simulation.slug}`} aria-label={`Khám phá ${simulation.title}`}>Khám phá <ArrowUpRight size={17} /></Link></div></div>
  </article>;
}
