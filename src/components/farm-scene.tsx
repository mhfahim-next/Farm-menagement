/**
 * Decorative farm landscape drawn in SVG: sun, drifting clouds, hills, a
 * barn with a silo, a turning windmill, crop rows, a fence, two cows and a
 * few hens. Pure SVG + CSS (no images), adapts to dark mode and stays still
 * for people who prefer reduced motion.
 */
export function FarmScene({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 300"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="fs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d1fae5" stopOpacity="0" />
          <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0.35" />
        </linearGradient>
        <pattern id="fs-rows" width="28" height="12" patternUnits="userSpaceOnUse" patternTransform="skewX(-35)">
          <rect width="28" height="12" className="fill-lime-500/70 dark:fill-lime-800/70" />
          <rect width="28" height="4" y="8" className="fill-lime-700/60 dark:fill-lime-950/70" />
        </pattern>
      </defs>

      <rect width="1440" height="300" fill="url(#fs-sky)" />

      {/* Sun */}
      <g className="motion-safe:animate-[pulse_6s_ease-in-out_infinite]">
        <circle cx="1180" cy="80" r="64" className="fill-amber-200/50 dark:fill-amber-400/10" />
        <circle cx="1180" cy="80" r="40" className="fill-amber-300 dark:fill-amber-200/80" />
      </g>

      {/* Clouds */}
      <g className="fill-white/90 dark:fill-stone-300/20">
        <g className="motion-safe:animate-[cloud-drift_70s_linear_infinite]">
          <ellipse cx="200" cy="60" rx="46" ry="16" />
          <ellipse cx="232" cy="50" rx="30" ry="18" />
          <ellipse cx="172" cy="54" rx="24" ry="14" />
        </g>
        <g className="motion-safe:animate-[cloud-drift_95s_linear_infinite] [animation-delay:-40s]">
          <ellipse cx="640" cy="40" rx="54" ry="16" />
          <ellipse cx="676" cy="30" rx="34" ry="18" />
          <ellipse cx="608" cy="34" rx="26" ry="14" />
        </g>
      </g>

      {/* Far and near hills */}
      <path d="M0 190 C 180 120, 360 150, 540 140 S 900 100, 1080 140 S 1320 120, 1440 150 L1440 300 L0 300Z" className="fill-emerald-200 dark:fill-emerald-950" />
      <path d="M0 220 C 240 170, 420 200, 640 190 S 1000 170, 1200 196 S 1380 200, 1440 190 L1440 300 L0 300Z" className="fill-emerald-300/80 dark:fill-emerald-900/80" />

      {/* Trees */}
      {[
        [90, 196],
        [128, 200],
        [1330, 196],
        [1372, 190],
      ].map(([x, y]) => (
        <g key={x} transform={`translate(${x} ${y})`}>
          <rect x="-3" y="0" width="6" height="18" className="fill-amber-900/70" />
          <circle cx="0" cy="-8" r="16" className="fill-emerald-600 dark:fill-emerald-700" />
          <circle cx="-8" cy="0" r="10" className="fill-emerald-600 dark:fill-emerald-700" />
        </g>
      ))}

      {/* Barn + silo */}
      <g transform="translate(250 150)">
        <rect x="70" y="-6" width="34" height="70" rx="4" className="fill-stone-300 dark:fill-stone-500" />
        <path d="M70 -6 a17 14 0 0 1 34 0z" className="fill-stone-400 dark:fill-stone-400" />
        <path d="M0 20 L35 -12 L70 20 L70 64 L0 64Z" className="fill-red-700 dark:fill-red-800" />
        <path d="M-4 22 L35 -16 L74 22" className="fill-none stroke-stone-100 dark:stroke-stone-300" strokeWidth="4" strokeLinejoin="round" />
        <rect x="22" y="32" width="26" height="32" className="fill-red-900 dark:fill-red-950" />
        <path d="M22 32 L48 64 M48 32 L22 64" className="stroke-stone-100 dark:stroke-stone-300" strokeWidth="2.5" />
        <rect x="27" y="8" width="16" height="12" className="fill-amber-100 dark:fill-amber-200/70" />
      </g>

      {/* Windmill */}
      <g transform="translate(1060 120)">
        <path d="M-6 100 L-2 0 L2 0 L6 100Z" className="fill-stone-400 dark:fill-stone-500" />
        <g className="origin-center [transform-box:fill-box] motion-safe:animate-[spin_14s_linear_infinite]">
          {[0, 90, 180, 270].map((a) => (
            <rect key={a} x="-3" y="-42" width="6" height="42" rx="2" transform={`rotate(${a})`} className="fill-stone-100 dark:fill-stone-300" />
          ))}
          <circle r="5" className="fill-stone-500" />
        </g>
      </g>

      {/* Crop field */}
      <path d="M560 300 L700 222 L1010 222 L1180 300Z" fill="url(#fs-rows)" />

      {/* Ground */}
      <path d="M0 250 C 300 236, 520 252, 760 244 S 1200 236, 1440 248 L1440 300 L0 300Z" className="fill-emerald-500 dark:fill-emerald-800" />

      {/* Fence */}
      <g className="stroke-amber-800/70 dark:stroke-amber-700/60" strokeWidth="3">
        <path d="M20 246 H520" />
        <path d="M20 258 H520" />
        {Array.from({ length: 11 }, (_, i) => (
          <path key={i} d={`M${30 + i * 48} 238 V266`} />
        ))}
      </g>

      {/* Cows */}
      <Cow x={420} y={226} />
      <Cow x={1230} y={232} flip />

      {/* Hens */}
      <Hen x={760} y={262} />
      <Hen x={800} y={268} flip />
      <Hen x={835} y={260} />
    </svg>
  );
}

function Cow({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      {[6, 16, 40, 50].map((lx) => (
        <rect key={lx} x={lx} y="18" width="6" height="18" rx="2" className="fill-stone-700 dark:fill-stone-300" />
      ))}
      <rect x="0" y="0" width="60" height="26" rx="11" className="fill-white dark:fill-stone-200" />
      <ellipse cx="18" cy="9" rx="9" ry="6" className="fill-stone-800" />
      <ellipse cx="42" cy="15" rx="7" ry="5" className="fill-stone-800" />
      <rect x="54" y="-10" width="18" height="16" rx="6" className="fill-white dark:fill-stone-200" />
      <rect x="64" y="-2" width="10" height="8" rx="3" className="fill-pink-300" />
      <circle cx="61" cy="-4" r="1.6" className="fill-stone-900" />
      <path d="M56 -10 l-4 -5 M68 -10 l3 -5" className="stroke-stone-500" strokeWidth="2" strokeLinecap="round" />
      <path d="M0 6 q-8 6 -6 16" className="fill-none stroke-stone-600" strokeWidth="2" />
      <ellipse cx="30" cy="27" rx="7" ry="3" className="fill-pink-300" />
    </g>
  );
}

function Hen({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <path d="M2 10 l-2 6 M8 10 l1 6" className="stroke-amber-600" strokeWidth="1.6" />
      <ellipse cx="6" cy="4" rx="9" ry="7" className="fill-amber-50 dark:fill-stone-200" />
      <path d="M-3 0 q-6 -6 -2 -10 q2 4 5 6z" className="fill-amber-50 dark:fill-stone-200" />
      <circle cx="13" cy="-4" r="4.5" className="fill-amber-50 dark:fill-stone-200" />
      <path d="M11 -9 q2 -3 4 0 q2 -2 3 1 l-6 1z" className="fill-red-500" />
      <path d="M17 -4 l4 1 l-4 1.5z" className="fill-amber-500" />
      <circle cx="14" cy="-5" r="0.9" className="fill-stone-900" />
    </g>
  );
}
