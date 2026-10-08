import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { simulations, getSimulation } from '@/lib/simulations';
import { SimulationWorkspace } from '@/components/simulation-workspace';
import { SimulationCard } from '@/components/simulation-card';

export function generateStaticParams() { return simulations.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const simulation = getSimulation(slug);
  return { title: simulation?.title ?? 'Không tìm thấy chủ đề', description: simulation?.description };
}
export default async function SimulationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const simulation = getSimulation(slug);
  if (!simulation) notFound();
  const related = simulations.filter((item) => item.slug !== slug).sort((a, b) => Number(b.subject === simulation.subject) - Number(a.subject === simulation.subject)).slice(0, 3);
  return <><SimulationWorkspace key={slug} simulation={simulation} /><section className="container related-section"><div className="section-heading"><div><div className="section-kicker">TIẾP TỤC HÀNH TRÌNH</div><h2>Còn nhiều điều để khám phá</h2></div><Link className="view-all" href="/thu-vien">Đến thư viện <ArrowRight size={17} /></Link></div><div className="simulation-grid related-grid">{related.map((item) => <SimulationCard key={item.slug} simulation={item} />)}</div></section></>;
}
