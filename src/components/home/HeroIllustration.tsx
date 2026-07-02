export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label="Illustration of a modern luxury living room with an arched window, sofa, plant and pendant lighting"
    >
      <defs>
        <linearGradient id="heroBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-ink)" />
          <stop offset="55%" stopColor="var(--color-ink-soft)" />
          <stop offset="100%" stopColor="var(--color-gold-deep)" />
        </linearGradient>
        <radialGradient id="heroWindowGlow" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="var(--color-gold-light)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--color-gold-light)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="heroFloor" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--color-ink-soft)" />
          <stop offset="100%" stopColor="var(--color-ink)" />
        </linearGradient>
        <linearGradient id="heroSofa" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--color-sand-dark)" />
          <stop offset="100%" stopColor="var(--color-ink-soft)" />
        </linearGradient>
        <radialGradient id="heroLampGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-gold-light)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--color-gold-light)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* backdrop */}
      <rect width="1440" height="900" fill="url(#heroBg)" />

      {/* arched window with warm glow */}
      <g opacity="0.95">
        <path
          d="M 1000 600 L 1000 320 A 160 160 0 0 1 1320 320 L 1320 600 Z"
          fill="url(#heroWindowGlow)"
        />
        <path
          d="M 1000 600 L 1000 320 A 160 160 0 0 1 1320 320 L 1320 600 Z"
          fill="none"
          stroke="var(--color-gold-light)"
          strokeOpacity="0.35"
          strokeWidth="3"
        />
        <line x1="1160" y1="325" x2="1160" y2="600" stroke="var(--color-gold-light)" strokeOpacity="0.25" strokeWidth="2" />
        <line x1="1004" y1="420" x2="1316" y2="420" stroke="var(--color-gold-light)" strokeOpacity="0.2" strokeWidth="2" />
        <line x1="1004" y1="510" x2="1316" y2="510" stroke="var(--color-gold-light)" strokeOpacity="0.2" strokeWidth="2" />
      </g>

      {/* sheer curtains */}
      <path
        d="M 930 70 Q 960 340 938 620 L 1000 620 Q 978 340 996 70 Z"
        fill="var(--color-cream)"
        opacity="0.08"
      />
      <path
        d="M 1324 70 Q 1346 340 1370 620 L 1324 620 Q 1306 340 1320 70 Z"
        fill="var(--color-cream)"
        opacity="0.08"
      />

      {/* ceiling pendant lights */}
      <g>
        <line x1="1060" y1="0" x2="1060" y2="330" stroke="var(--color-gold-deep)" strokeWidth="2" opacity="0.5" />
        <circle cx="1060" cy="352" r="34" fill="url(#heroLampGlow)" />
        <circle cx="1060" cy="352" r="16" fill="var(--color-gold-light)" opacity="0.85" />
        <line x1="1150" y1="0" x2="1150" y2="290" stroke="var(--color-gold-deep)" strokeWidth="2" opacity="0.5" />
        <circle cx="1150" cy="312" r="30" fill="url(#heroLampGlow)" />
        <circle cx="1150" cy="312" r="14" fill="var(--color-gold-light)" opacity="0.85" />
      </g>

      {/* floor plane */}
      <rect x="0" y="650" width="1440" height="250" fill="url(#heroFloor)" />
      <ellipse cx="1030" cy="815" rx="380" ry="62" fill="var(--color-sand-dark)" opacity="0.28" />
      <ellipse cx="1030" cy="815" rx="300" ry="46" fill="none" stroke="var(--color-gold-light)" strokeOpacity="0.25" strokeWidth="2" />

      {/* sofa */}
      <g>
        <rect x="760" y="580" width="70" height="180" rx="22" fill="url(#heroSofa)" />
        <rect x="1230" y="580" width="70" height="180" rx="22" fill="url(#heroSofa)" />
        <rect x="780" y="640" width="520" height="120" rx="26" fill="url(#heroSofa)" />
        <rect x="800" y="540" width="480" height="110" rx="22" fill="var(--color-ink-soft)" opacity="0.92" />
        <rect x="820" y="590" width="135" height="65" rx="14" fill="var(--color-sand)" opacity="0.85" />
        <rect x="970" y="590" width="135" height="65" rx="14" fill="var(--color-sand)" opacity="0.8" />
        <rect x="1120" y="590" width="135" height="65" rx="14" fill="var(--color-sand)" opacity="0.85" />
        <rect x="835" y="555" width="110" height="65" rx="14" fill="var(--color-sand-dark)" opacity="0.7" />
        <rect x="1095" y="555" width="110" height="65" rx="14" fill="var(--color-sand-dark)" opacity="0.7" />
      </g>

      {/* coffee table with vase */}
      <g>
        <ellipse cx="1030" cy="790" rx="95" ry="24" fill="var(--color-gold)" opacity="0.9" />
        <rect x="970" y="795" width="8" height="45" fill="var(--color-gold-deep)" opacity="0.8" />
        <rect x="1090" y="795" width="8" height="45" fill="var(--color-gold-deep)" opacity="0.8" />
        <ellipse cx="1032" cy="768" rx="20" ry="14" fill="var(--color-ink-soft)" />
        <path d="M 1032 768 Q 1010 710 990 670" fill="none" stroke="var(--color-sand-dark)" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        <path d="M 1032 768 Q 1040 700 1050 650" fill="none" stroke="var(--color-sand-dark)" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        <path d="M 1032 768 Q 1052 720 1080 685" fill="none" stroke="var(--color-sand-dark)" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      </g>

      {/* floor lamp */}
      <g>
        <line x1="1345" y1="480" x2="1345" y2="780" stroke="var(--color-gold-deep)" strokeWidth="4" opacity="0.85" />
        <path d="M 1345 480 Q 1365 440 1325 410" fill="none" stroke="var(--color-gold-deep)" strokeWidth="4" opacity="0.85" />
        <circle cx="1325" cy="410" r="46" fill="url(#heroLampGlow)" />
        <path d="M 1291 400 L 1359 400 L 1343 440 L 1307 440 Z" fill="var(--color-gold-light)" opacity="0.9" />
        <ellipse cx="1345" cy="782" rx="26" ry="7" fill="var(--color-gold-deep)" opacity="0.6" />
      </g>

      {/* plant */}
      <g>
        <path d="M 615 780 L 725 780 L 710 690 L 630 690 Z" fill="var(--color-ink-soft)" />
        <path d="M 670 700 Q 615 620 595 520" fill="none" stroke="var(--color-sand-dark)" strokeWidth="6" strokeLinecap="round" opacity="0.85" />
        <path d="M 670 700 Q 655 580 615 500" fill="none" stroke="var(--color-sand-dark)" strokeWidth="6" strokeLinecap="round" opacity="0.75" />
        <path d="M 670 700 Q 685 600 665 500" fill="none" stroke="var(--color-sand-dark)" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
        <path d="M 670 700 Q 715 610 730 530" fill="none" stroke="var(--color-sand-dark)" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
        <path d="M 670 700 Q 730 650 765 590" fill="none" stroke="var(--color-sand-dark)" strokeWidth="6" strokeLinecap="round" opacity="0.65" />
      </g>

      {/* ambient bokeh */}
      <g fill="var(--color-gold-light)">
        <circle cx="1050" cy="180" r="10" opacity="0.28" />
        <circle cx="1180" cy="240" r="6" opacity="0.22" />
        <circle cx="1320" cy="150" r="14" opacity="0.18" />
        <circle cx="1000" cy="90" r="5" opacity="0.3" />
        <circle cx="1240" cy="480" r="8" opacity="0.16" />
        <circle cx="880" cy="220" r="7" opacity="0.14" />
        <circle cx="410" cy="160" r="6" opacity="0.1" />
        <circle cx="250" cy="320" r="9" opacity="0.08" />
      </g>
    </svg>
  );
}
