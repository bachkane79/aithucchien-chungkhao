import Link from 'next/link';
import { ArrowRight, Atom, BookOpen, ChevronRight, FlaskConical, GraduationCap, Globe2, Lightbulb, MoveUpRight, Orbit, Shapes, Sparkles, Sprout } from 'lucide-react';
import { HeroArt } from '@/components/science-art';
import { SimulationCard } from '@/components/simulation-card';
import { simulations } from '@/lib/simulations';

const subjectItems = [
  { name: 'Vật lí', icon: Orbit, note: 'Hiểu quy luật tự nhiên', className: 'physics' },
  { name: 'Hóa học', icon: FlaskConical, note: 'Khám phá thế giới vi mô', className: 'chemistry' },
  { name: 'Toán học', icon: Shapes, note: 'Nhìn thấy những ý tưởng', className: 'math' },
  { name: 'Sinh học', icon: Sprout, note: 'Giải mã sự sống', className: 'biology' },
  { name: 'Khoa học Trái Đất', icon: Globe2, note: 'Khám phá hành tinh xanh', className: 'physics' },
];

export default function HomePage() {
  return <>
    <section className="hero-section"><div className="container hero-grid"><div className="hero-copy"><div className="eyebrow"><span /> KHÔNG GIAN HỌC TẬP TƯƠNG TÁC</div><h1>Đừng chỉ học.<br />Hãy <span>khám phá.</span></h1><p>Biến những công thức thành trải nghiệm.<br className="desktop-break" /> Cùng BananaLearning khám phá thế giới STEM theo cách của bạn.</p><div className="hero-actions"><Link href="/thu-vien" className="button primary">Khám phá mô phỏng <ArrowRight size={18} /></Link><Link href="/huong-dan" className="button text-button"><BookOpen size={18} /> Bắt đầu như thế nào?</Link></div><div className="hero-trust"><span><GraduationCap size={17} /> Dành cho học sinh THPT</span><span><Sparkles size={16} /> Không cần tài khoản</span></div></div><HeroArt /></div></section>
    <section className="container subject-section"><div className="section-kicker">BẠN MUỐN KHÁM PHÁ ĐIỀU GÌ?</div><div className="subject-grid">{subjectItems.map(({ name, icon: Icon, note, className }) => <Link key={name} href={`/thu-vien?mon=${encodeURIComponent(name)}`} className={`subject-card ${className}`}><span className="subject-icon"><Icon size={27} strokeWidth={1.7} /></span><div><h2>{name}</h2><p>{note}</p><small>{simulations.filter((item) => (item.subjects ?? [item.subject]).some((subject) => subject === name)).length} mô phỏng</small></div><MoveUpRight size={18} /></Link>)}</div></section>
    <section className="container featured-section"><div className="section-heading"><div><div className="section-kicker">MỖI CHỦ ĐỀ, MỘT GÓC NHÌN MỚI</div><h2>Bắt đầu từ sự tò mò</h2><p>Những chủ đề quen thuộc, một cách tiếp cận khác biệt.</p></div><Link href="/thu-vien" className="view-all">Xem tất cả mô phỏng <ArrowRight size={17} /></Link></div><div className="placeholder-notice"><FlaskConical size={18} /><span><strong>{simulations.length} mô phỏng PhET HTML5.</strong> Mở một chủ đề để tương tác với mô phỏng độc lập được lưu cục bộ. Ưu tiên tiếng Việt khi có bản dịch.</span></div><div className="simulation-grid">{simulations.slice(0, 4).map((simulation) => <SimulationCard key={simulation.slug} simulation={simulation} />)}</div></section>
    <section className="container learning-section"><div className="learning-intro"><div className="section-kicker">HỌC CHỦ ĐỘNG. HIỂU SÂU HƠN.</div><h2>Kiến thức không chỉ<br />nằm trên trang sách.</h2><p>Một không gian để đặt câu hỏi, thử nghiệm và kết nối những điều bạn đã học.</p><Link href="/gioi-thieu" className="view-all">Tìm hiểu về BananaLearning <ChevronRight size={17} /></Link></div><div className="learning-steps">{[
      { icon: Lightbulb, title: 'Bắt đầu với một câu hỏi', text: 'Chọn môn học, tìm một chủ đề và đưa ra dự đoán của riêng bạn.' },
      { icon: Atom, title: 'Tự tay khám phá', text: 'Mở mô phỏng PhET, thay đổi tham số và quan sát điều gì xảy ra.' },
      { icon: BookOpen, title: 'Kết nối với kiến thức', text: 'Đối chiếu với lí thuyết và ghi lại những điều bạn nhận ra.' },
    ].map(({ icon: Icon, title, text }, index) => <div className="learning-step" key={title}><span className="step-icon"><Icon size={23} /></span><div><small>0{index + 1}</small><h3>{title}</h3><p>{text}</p></div></div>)}</div></section>
    <section className="container"><div className="explore-banner"><div><span>HÔM NAY, BẠN TÒ MÒ VỀ ĐIỀU GÌ?</span><h2>Một lần thử. Một điều mới.</h2><p>Chọn chủ đề đầu tiên để sẵn sàng cho hành trình khám phá.</p></div><Link href="/thu-vien" className="button white-button">Đến thư viện <ArrowRight size={18} /></Link><span className="banner-decoration" aria-hidden="true">✳</span></div></section>
  </>;
}
