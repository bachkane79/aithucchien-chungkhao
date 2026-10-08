import catalog from './phet-catalog.json';

export const subjects = ['Tất cả', 'Vật lí', 'Hóa học', 'Toán học', 'Sinh học', 'Khoa học Trái Đất'] as const;
export type Subject = Exclude<(typeof subjects)[number], 'Tất cả'>;
export type Illustration = 'pendulum' | 'atom' | 'graph' | 'wave' | 'molecule' | 'dna' | 'circuit' | 'geometry';

export interface Simulation {
  slug: string;
  title: string;
  englishTitle?: string;
  subject: Subject;
  subjects?: Subject[];
  grade?: 10 | 11 | 12;
  gradeLevels?: string[];
  topic: string;
  description: string;
  duration: number;
  illustration: Illustration;
  goals: string[];
  prompts: string[];
  embedSrc: string | null;
  thumbnail?: string;
  locale?: string;
  sourcePage?: string;
  downloadUrl?: string;
  provider?: 'PhET';
  license?: string;
}

interface PhETEntry {
  slug: string;
  title: string;
  englishTitle: string;
  subjects: string[];
  gradeLevels?: string[];
  sourcePage: string;
  localizedSourcePage?: string;
  downloadUrl: string;
  locale: string;
  thumbnail?: string | null;
  embedSrc: string;
  license?: string | { name: string; source?: string; attribution?: string };
}

const subjectAliases: Record<string, Subject> = {
  physics: 'Vật lí', chemistry: 'Hóa học', math: 'Toán học', mathematics: 'Toán học',
  biology: 'Sinh học', 'earth-science': 'Khoa học Trái Đất', 'earth science': 'Khoa học Trái Đất',
};

function mapSubject(value: string): Subject | undefined {
  if (subjects.includes(value as (typeof subjects)[number]) && value !== 'Tất cả') return value as Subject;
  return subjectAliases[value.toLowerCase()];
}

function illustrationFor(slug: string, subject: Subject): Illustration {
  if (/pendulum|spring|mass/.test(slug)) return 'pendulum';
  if (/wave|sound|fourier/.test(slug)) return 'wave';
  if (/circuit|ohm|resistance|capacitor/.test(slug)) return 'circuit';
  if (/atom|isotope|quantum/.test(slug)) return 'atom';
  if (subject === 'Hóa học') return 'molecule';
  if (subject === 'Sinh học') return 'dna';
  if (/area|geometry|shape|vector/.test(slug)) return 'geometry';
  return 'graph';
}

const featured = ['pendulum-lab', 'build-an-atom', 'graphing-quadratics', 'wave-interference'];

export const simulations: Simulation[] = (catalog as unknown as PhETEntry[]).map((entry): Simulation => {
  const classifications = [...new Set(entry.subjects.map(mapSubject).filter((item): item is Subject => !!item))];
  const subject = classifications[0] ?? 'Vật lí';
  return {
    ...entry,
    subject,
    subjects: classifications.length ? classifications : [subject],
    provider: 'PhET',
    sourcePage: entry.localizedSourcePage ?? entry.sourcePage,
    license: typeof entry.license === 'string' ? entry.license : entry.license?.name,
    gradeLevels: entry.gradeLevels?.map((level) => (({ 'Elementary School': 'Tiểu học', 'Middle School': 'THCS', 'High School': 'THPT', University: 'Đại học' } as Record<string, string>)[level] ?? level)),
    thumbnail: entry.thumbnail ?? undefined,
    topic: 'PhET HTML5',
    description: `Khám phá ${entry.title.toLowerCase()} qua mô phỏng tương tác PhET. Mở và trải nghiệm trực tiếp trên trình duyệt.`,
    duration: 20,
    illustration: illustrationFor(entry.slug, subject),
    goals: [
      'Làm quen với các đại lượng và đối tượng trong mô phỏng.',
      'Thay đổi một yếu tố, quan sát và ghi lại kết quả.',
      'Đối chiếu dự đoán với quan sát để rút ra kết luận.',
    ],
    prompts: [
      'Chọn một màn hình hoặc thí nghiệm, sau đó quan sát trạng thái ban đầu.',
      'Đưa ra dự đoán trước khi thay đổi tham số hoặc thao tác với đối tượng.',
      'Thử lại với điều kiện khác và ghi chú những điều bạn nhận thấy.',
    ],
  };
}).sort((a, b) => {
  const aIndex = featured.indexOf(a.slug);
  const bIndex = featured.indexOf(b.slug);
  if (aIndex !== -1 || bIndex !== -1) return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  return a.title.localeCompare(b.title, 'vi');
});

// Giữ các đường dẫn của bản nền hoạt động sau khi thay bằng mô phỏng PhET thực tế.
export const legacySimulationAliases: Record<string, string> = {
  'con-lac-don': 'pendulum-lab',
  'cau-tao-nguyen-tu': 'build-an-atom',
  'do-thi-ham-so': 'graphing-quadratics',
  'giao-thoa-song': 'wave-interference',
  'lien-ket-hoa-hoc': 'molecule-shapes',
  'cau-truc-adn': 'gene-expression-essentials',
  'mach-dien-co-ban': 'circuit-construction-kit-dc',
  'hinh-hoc-khong-gian': 'molecule-shapes',
};

export function getSimulation(slug: string) {
  const actualSlug = legacySimulationAliases[slug] ?? slug;
  return simulations.find((simulation) => simulation.slug === actualSlug);
}

export function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
}
