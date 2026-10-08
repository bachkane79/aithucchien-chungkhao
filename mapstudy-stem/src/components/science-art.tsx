import type { Illustration } from '@/lib/simulations';

export function ScienceArt({ kind, className = '' }: { kind: Illustration; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 230" fill="none" aria-hidden="true">
      <defs>
        <pattern id={`grid-${kind}`} width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" stroke="currentColor" strokeOpacity=".07" /></pattern>
      </defs>
      <rect width="400" height="230" fill={`url(#grid-${kind})`} />
      {kind === 'pendulum' && <>
        <path d="M110 39H290" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
        <path d="M200 42V186" stroke="currentColor" strokeDasharray="5 7" strokeOpacity=".3" />
        <path d="M200 42L267 171" stroke="currentColor" strokeWidth="3" />
        <path d="M200 42L133 171" stroke="currentColor" strokeOpacity=".16" strokeWidth="3" />
        <path d="M131 176Q200 214 271 176" stroke="currentColor" strokeDasharray="4 6" strokeOpacity=".35" />
        <circle cx="133" cy="171" r="19" fill="currentColor" opacity=".12" />
        <circle cx="267" cy="171" r="23" fill="currentColor" /><circle cx="260" cy="164" r="7" fill="white" opacity=".35" />
        <path d="M200 78Q211 78 218 86" stroke="currentColor" strokeWidth="2" /><text x="216" y="114" fill="currentColor" fontSize="18">θ</text>
        <text x="107" y="98" fill="currentColor" opacity=".65" fontSize="17">T = 2π√(ℓ/g)</text>
      </>}
      {kind === 'atom' && <>
        <ellipse cx="200" cy="116" rx="104" ry="39" stroke="currentColor" strokeWidth="2" />
        <ellipse cx="200" cy="116" rx="104" ry="39" transform="rotate(60 200 116)" stroke="currentColor" strokeWidth="2" />
        <ellipse cx="200" cy="116" rx="104" ry="39" transform="rotate(-60 200 116)" stroke="currentColor" strokeWidth="2" />
        <circle cx="194" cy="110" r="13" fill="currentColor" /><circle cx="210" cy="119" r="12" fill="currentColor" opacity=".5" /><circle cx="191" cy="125" r="10" fill="currentColor" opacity=".7" />
        <circle cx="301" cy="109" r="8" fill="currentColor" /><circle cx="144" cy="35" r="8" fill="currentColor" /><circle cx="148" cy="203" r="8" fill="currentColor" />
        <text x="319" y="107" fill="currentColor" fontSize="17">e⁻</text>
      </>}
      {kind === 'graph' && <>
        <path d="M70 178H342M200 205V28" stroke="currentColor" strokeOpacity=".45" strokeWidth="2" />
        <path d="M332 172L342 178L332 184M194 38L200 28L206 38" stroke="currentColor" strokeOpacity=".45" strokeWidth="2" />
        <path d="M96 44Q200 296 304 44" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <circle cx="200" cy="170" r="6" fill="currentColor" /><text x="228" y="70" fill="currentColor" fontSize="21">y = ax² + bx + c</text>
        <text x="350" y="183" fill="currentColor" fontSize="17">x</text><text x="211" y="30" fill="currentColor" fontSize="17">y</text>
      </>}
      {kind === 'wave' && <>
        <path d="M40 115H360" stroke="currentColor" strokeOpacity=".2" strokeDasharray="5 6" />
        <path d="M40 115C65 20 95 20 120 115S175 210 200 115S255 20 280 115S335 210 360 115" stroke="currentColor" strokeWidth="4" />
        <path d="M40 115C65 210 95 210 120 115S175 20 200 115S255 210 280 115S335 20 360 115" stroke="currentColor" strokeOpacity=".3" strokeWidth="3" />
        <path d="M80 35H240" stroke="currentColor" strokeOpacity=".6" /><text x="157" y="28" fill="currentColor" fontSize="19">λ</text>
      </>}
      {kind === 'molecule' && <>
        <path d="M200 100L132 163M200 100L277 153" stroke="currentColor" strokeOpacity=".4" strokeWidth="12" strokeLinecap="round" />
        <circle cx="200" cy="100" r="39" fill="currentColor" /><circle cx="132" cy="163" r="25" fill="currentColor" opacity=".55" /><circle cx="277" cy="153" r="25" fill="currentColor" opacity=".55" />
        <text x="190" y="108" fill="white" fontSize="24">O</text><text x="125" y="170" fill="white" fontSize="20">H</text><text x="270" y="160" fill="white" fontSize="20">H</text>
        <text x="175" y="214" fill="currentColor" opacity=".7" fontSize="18">H₂O</text>
      </>}
      {kind === 'dna' && <>
        <path d="M145 20C300 75 100 155 255 210M255 20C100 75 300 155 145 210" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        {[35, 60, 85, 110, 135, 160, 185].map((y, i) => <path key={y} d={`M${i % 3 === 0 ? 169 : i % 3 === 1 ? 180 : 155} ${y}H${i % 3 === 0 ? 231 : i % 3 === 1 ? 220 : 245}`} stroke="currentColor" strokeOpacity=".45" strokeWidth="5" strokeLinecap="round" />)}
      </>}
      {kind === 'circuit' && <>
        <path d="M100 115V57H300V173H100V133M165 57V173M100 105V124" stroke="currentColor" strokeWidth="3" />
        <path d="M80 112H120M89 130H111" stroke="currentColor" strokeWidth="4" /><rect x="151" y="90" width="28" height="48" rx="3" fill="#e9f1f7" stroke="currentColor" strokeWidth="3" />
        <circle cx="300" cy="115" r="22" fill="#e9f1f7" stroke="currentColor" strokeWidth="3" /><path d="M287 102L313 128M313 102L287 128" stroke="currentColor" strokeWidth="2" />
        <text x="194" y="117" fill="currentColor" fontSize="18">U = IR</text>
      </>}
      {kind === 'geometry' && <>
        <path d="M128 83L235 47L292 92L183 133Z" fill="currentColor" opacity=".1" />
        <path d="M128 83L183 133L292 92L235 47L128 83V166L183 209L292 168V92M183 133V209" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="M235 47V126L128 166M235 126L292 168" stroke="currentColor" strokeOpacity=".35" strokeWidth="2" strokeDasharray="5 5" />
      </>}
    </svg>
  );
}

export function HeroArt() {
  return <div className="hero-art" aria-hidden="true">
    <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
    <div className="art-main"><div className="art-bar"><span /><span /><span /><b>Không gian khám phá</b></div><ScienceArt kind="atom" /><div className="art-caption"><span className="art-dot" /> Từ tò mò đến thấu hiểu <span>↗</span></div></div>
    <div className="floating-formula formula-one">E = mc² <small>VẬT LÍ</small></div>
    <div className="floating-formula formula-two">ƒ(x) <small>TOÁN HỌC</small></div>
    <div className="floating-formula formula-three">H₂O <small>HÓA HỌC</small></div>
    <div className="hero-star star-one">✦</div><div className="hero-star star-two">✦</div>
  </div>;
}
