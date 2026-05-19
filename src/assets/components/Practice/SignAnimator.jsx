import './SignAnimator.css'

/* ────────────────────────────────────────────────────────────
   HAND SHAPE SVGs — HandSVG has NO FingerLabel component
   All new shapes must use plain SVG only
──────────────────────────────────────────────────────────── */
function HandSVG({ shape, color = '#7c6fff', size = 60 }) {
  const hi  = color
  const lo  = '#d0cce8'
  const sk  = '#fde8cc'
  const sk2 = '#f9d4a8'

  const shapes = {
    bhand: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="10" y="30" width="36" height="28" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="8"  y="38" width="12" height="16" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="10" y="4"  width="8"  height="30" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="20" y="2"  width="8"  height="32" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="30" y="3"  width="8"  height="31" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="39" y="6"  width="7"  height="28" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <line x1="10" y1="30" x2="46" y2="30" stroke={lo} strokeWidth="1" strokeDasharray="2 2"/>
      </svg>
    ),
    fist: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="10" y="22" width="36" height="36" rx="8" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="10" y="18" width="9"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="21" y="16" width="9"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="32" y="17" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="41" y="20" width="7"  height="9"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="4"  y="30" width="10" height="14" rx="5" fill={sk} stroke={lo} strokeWidth="1"/>
        <line x1="10" y1="28" x2="46" y2="28" stroke={lo} strokeWidth="1" strokeDasharray="2 2"/>
      </svg>
    ),
    point1: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="10" y="30" width="36" height="28" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="21" y="24" width="9"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="32" y="25" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="41" y="26" width="7"  height="9"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="4"  y="36" width="10" height="14" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="10" y="2"  width="9"  height="32" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <line x1="10" y1="30" x2="46" y2="30" stroke={lo} strokeWidth="1" strokeDasharray="2 2"/>
      </svg>
    ),
    point2: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="10" y="32" width="36" height="26" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="32" y="26" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="41" y="27" width="7"  height="9"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="4"  y="38" width="10" height="14" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="10" y="2"  width="9"  height="34" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="21" y="2"  width="9"  height="34" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <line x1="10" y1="32" x2="46" y2="32" stroke={lo} strokeWidth="1" strokeDasharray="2 2"/>
      </svg>
    ),
    threefinger: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="8"  y="32" width="38" height="26" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="41" y="26" width="7"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="4"  y="38" width="10" height="14" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="8"  y="2"  width="9"  height="34" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="19" y="2"  width="9"  height="34" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="30" y="2"  width="9"  height="34" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <line x1="8" y1="32" x2="46" y2="32" stroke={lo} strokeWidth="1" strokeDasharray="2 2"/>
      </svg>
    ),
    fourfinger: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="8"  y="32" width="40" height="26" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="4"  y="38" width="10" height="14" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="8"  y="2"  width="8"  height="34" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="18" y="2"  width="8"  height="34" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="28" y="2"  width="8"  height="34" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="38" y="4"  width="7"  height="32" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <line x1="8" y1="32" x2="48" y2="32" stroke={lo} strokeWidth="1" strokeDasharray="2 2"/>
      </svg>
    ),
    open: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="12" y="30" width="34" height="28" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="12" y="4"  width="8"  height="30" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="22" y="2"  width="8"  height="32" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="32" y="3"  width="8"  height="31" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="42" y="6"  width="7"  height="28" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="2"  y="26" width="14" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2"/>
        <line x1="12" y1="30" x2="46" y2="30" stroke={lo} strokeWidth="1" strokeDasharray="2 2"/>
      </svg>
    ),
    // ── thumb: 좋다 👍 — 주먹 수평, 엄지 위로 ─────────────────
    // ── thumb: 좋다 👍 — 주먹 수평, 엄지 위로 ─────────────────
    thumb: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        {/* fist body — fingers pointing RIGHT */}
        <rect x="14" y="26" width="36" height="32" rx="8" fill={sk} stroke={lo} strokeWidth="1"/>
        {/* knuckles on the RIGHT side */}
        <rect x="37" y="32" width="18" height="8"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="37" y="41" width="18" height="8"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="37" y="50" width="18" height="7"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="37" y="24" width="18" height="8"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* thumb pointing STRAIGHT UP */}
        <rect x="14" y="7"  width="12" height="24" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <line x1="14" y1="26" x2="50" y2="26" stroke={lo} strokeWidth="1" strokeDasharray="2 2"/>
      </svg>
    ),
    // ── thumb_slant: 숫자 5 — 엄지 살짝 기울어짐 ─────────────
    // ── thumb_slant: 숫자 5 — 엄지 살짝 기울어짐 ─────────────
    thumb_slant: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="12" y="30" width="34" height="28" rx="8" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="12" y="24" width="9"  height="18" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="22" y="22" width="9"  height="18" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="32" y="23" width="8"  height="18" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="41" y="25" width="7"  height="18"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="-6"  y="30"  width="10" height="20" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"
          transform="rotate(-30 3 29)"/>
        <line x1="12" y1="30" x2="46" y2="30" stroke={lo} strokeWidth="1" strokeDasharray="2 2"/>
      </svg>
    ),
    // ── thumbdown: 싫다 👎 — 주먹 수평, 엄지 아래로 ────────────
    // ── thumbdown: 싫다 👎 — 주먹 수평, 엄지 아래로 ────────────
    thumbdown: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        {/* fist body — fingers pointing RIGHT */}
        <rect x="14" y="10" width="36" height="32" rx="8" fill={sk} stroke={lo} strokeWidth="1"/>
        {/* knuckles on the RIGHT side */}
        <rect x="37" y="12" width="18" height="8"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="37" y="21" width="18" height="8"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="37" y="30" width="18" height="7"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="37" y="38" width="18" height="7"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* thumb pointing STRAIGHT DOWN */}
        <rect x="14" y="38" width="12" height="24" rx="7" fill={sk} stroke={hi} strokeWidth="2"/>
        <line x1="14" y1="42" x2="50" y2="42" stroke={lo} strokeWidth="1" strokeDasharray="2 2"/>
      </svg>
    ),
    // ── lhandtouch: 이름 — L형으로 가슴 두 번 터치 ───────────
    lhandtouch: (
      <svg width={size} height={size} viewBox="0 0 68 56" fill="none">
        <rect x="18"  y="14" width="30" height="28" rx="8" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="39" y="18" width="12" height="8"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="39" y="26" width="11" height="7"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="39" y="33" width="10" height="6"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="33" y="6"  width="26" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="33" y="40" width="24" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <line x1="64" y1="11" x2="64" y2="50" stroke={hi} strokeWidth="1" strokeDasharray="3 3" opacity="0.5"/>
      </svg>
    ),
    // ── waterhand: 물 — 엄지+검지 펴기 (컵 잡기) ─────────────
    waterhand: (
      <svg width={size} height={size} viewBox="0 0 68 56" fill="none">
        <rect x="18"  y="14" width="30" height="28" rx="8" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="39" y="18" width="12" height="8"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="39" y="26" width="11" height="7"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="39" y="33" width="10" height="6"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="33" y="6"  width="26" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="33" y="40" width="24" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
      </svg>
    ),
    ily: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="12" y="30" width="34" height="28" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="22" y="24" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="32" y="25" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="12" y="4"  width="8"  height="30" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="42" y="6"  width="7"  height="28" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="2"  y="26" width="14" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <line x1="12" y1="30" x2="46" y2="30" stroke={lo} strokeWidth="1" strokeDasharray="2 2"/>
      </svg>
    ),
    yhand: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="14" y="28" width="30" height="30" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="14" y="22" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="23" y="20" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="32" y="21" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="2"  y="24" width="16" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="40" y="4"  width="8"  height="28" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <line x1="14" y1="28" x2="44" y2="28" stroke={lo} strokeWidth="1" strokeDasharray="2 2"/>
      </svg>
    ),
    thumbtwofinger: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="10" y="32" width="36" height="26" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="34" y="26" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="43" y="27" width="7"  height="9"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="2"  y="30" width="16" height="8"  rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="10" y="2"  width="9"  height="34" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="21" y="2"  width="9"  height="34" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <line x1="10" y1="32" x2="46" y2="32" stroke={lo} strokeWidth="1" strokeDasharray="2 2"/>
      </svg>
    ),
    dislikehand: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="10" y="32" width="36" height="26" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="22" y="26" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="32" y="27" width="8"  height="9"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="40" y="28" width="7"  height="8"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="8"  y="10" width="9"  height="26" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="4"  y="28" width="12" height="12" rx="5" fill={sk} stroke={hi} strokeWidth="2"/>
        <line x1="10" y1="32" x2="46" y2="32" stroke={lo} strokeWidth="1" strokeDasharray="2 2"/>
      </svg>
    ),
    sixhand: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="1" y="20" width="30" height="35" rx="8" fill={sk2} stroke={hi} strokeWidth="1.5"/>
        <line x1="4" y1="30" x2="28" y2="30" stroke={lo} strokeWidth="1"/>
        <line x1="4" y1="40" x2="28" y2="40" stroke={lo} strokeWidth="1"/>
        <line x1="4" y1="48" x2="28" y2="48" stroke={lo} strokeWidth="1"/>
        <rect x="25" y="20" width="30" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="1" y="4"  width="10" height="20" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
      </svg>
    ),
    sevenhand: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="1" y="20" width="30" height="35" rx="8" fill={sk2} stroke={hi} strokeWidth="1.5"/>
        <line x1="4" y1="30" x2="28" y2="30" stroke={lo} strokeWidth="1"/>
        <line x1="4" y1="40" x2="28" y2="40" stroke={lo} strokeWidth="1"/>
        <line x1="4" y1="48" x2="28" y2="48" stroke={lo} strokeWidth="1"/>
        <rect x="25" y="20" width="30" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="25" y="30" width="35" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="1" y="4"  width="10" height="20" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
      </svg>
    ),
    eighthand: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="1" y="20" width="30" height="35" rx="8" fill={sk2} stroke={hi} strokeWidth="1.5"/>
        <line x1="4" y1="30" x2="28" y2="30" stroke={lo} strokeWidth="1"/>
        <line x1="4" y1="40" x2="28" y2="40" stroke={lo} strokeWidth="1"/>
        <line x1="4" y1="48" x2="28" y2="48" stroke={lo} strokeWidth="1"/>
        <rect x="25" y="20" width="30" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="25" y="30" width="35" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="25" y="40" width="34" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="1" y="4"  width="10" height="20" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
      </svg>
    ),
    ninehand: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="1" y="20" width="30" height="35" rx="8" fill={sk2} stroke={hi} strokeWidth="1.5"/>
        <line x1="4" y1="30" x2="28" y2="30" stroke={lo} strokeWidth="1"/>
        <line x1="4" y1="40" x2="28" y2="40" stroke={lo} strokeWidth="1"/>
        <line x1="4" y1="48" x2="28" y2="48" stroke={lo} strokeWidth="1"/>
        <rect x="25" y="20" width="30" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="25" y="30" width="35" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="25" y="40" width="34" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="25" y="49" width="30" height="9"  rx="5" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="1" y="4"  width="10" height="20" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
      </svg>
    ),
    lhand: (
      <svg width={size} height={size} viewBox="0 0 420 340" fill="none">
        <rect x="148" y="118" width="68" height="110" rx="12" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="88"  y="138" width="64" height="68"  rx="10" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="214" y="142" width="32" height="20" rx="9"  fill={sk2} stroke={lo} strokeWidth="1.3"/>
        <rect x="214" y="166" width="32" height="20" rx="9"  fill={sk2} stroke={lo} strokeWidth="1.3"/>
        <rect x="214" y="190" width="30" height="18" rx="8"  fill={sk2} stroke={lo} strokeWidth="1.3"/>
        <rect x="214" y="100" width="120" height="26" rx="12" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="292" y="103" width="18" height="16" rx="5"  fill={sk2} stroke={lo} strokeWidth="0.8"/>
        <rect x="214" y="214" width="100" height="26" rx="12" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="292" y="217" width="18" height="16" rx="5"  fill={sk2} stroke={lo} strokeWidth="0.8"/>
      </svg>
    ),
    chand: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="12" y="14" width="26" height="40" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="34" y="6"  width="18" height="9"  rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="36" y="18" width="17" height="9"  rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="36" y="30" width="17" height="9"  rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="34" y="42" width="16" height="9"  rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="4"  y="26" width="16" height="9"  rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
      </svg>
    ),
    flato: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="12" y="32" width="34" height="26" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="4"  y="20" width="16" height="16" rx="8" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="8"  y="22" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="24" y="4"  width="8"  height="30" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="34" y="5"  width="8"  height="30" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="43" y="8"  width="7"  height="27" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <line x1="12" y1="32" x2="46" y2="32" stroke={lo} strokeWidth="1" strokeDasharray="2 2"/>
      </svg>
    ),
    thumbring: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="10" y="30" width="36" height="28" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="12" y="24" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="22" y="22" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="40" y="25" width="7"  height="9"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="2"  y="24" width="12" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="32" y="4"  width="8"  height="30" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <line x1="10" y1="30" x2="46" y2="30" stroke={lo} strokeWidth="1" strokeDasharray="2 2"/>
      </svg>
    ),
    thumbmiddle: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="10" y="30" width="36" height="28" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="12" y="24" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="32" y="24" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="40" y="25" width="7"  height="9"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="2"  y="24" width="12" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="22" y="4"  width="8"  height="30" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <line x1="10" y1="30" x2="46" y2="30" stroke={lo} strokeWidth="1" strokeDasharray="2 2"/>
      </svg>
    ),
    pinky: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="10" y="30" width="36" height="28" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="10" y="24" width="9"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="21" y="22" width="9"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="31" y="23" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="4"  y="36" width="10" height="14" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="40" y="4"  width="7"  height="30" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <line x1="10" y1="30" x2="46" y2="30" stroke={lo} strokeWidth="1" strokeDasharray="2 2"/>
      </svg>
    ),
  }

  return shapes[shape] || shapes['open']
}

/* ────────────────────────────────────────────────────────────
   BODY DIAGRAM
──────────────────────────────────────────────────────────── */
function BodyDiagram({ signId, color, animClass }) {
  const hi = color
  const bd = '#e2e0f0'
  const sk = '#fde8cc'

  const Body = () => (
    <g>
      <ellipse cx="80" cy="32" rx="22" ry="26" fill={bd} stroke="#c8c4e0" strokeWidth="1"/>
      <rect x="72" y="54" width="16" height="12" rx="3" fill={bd} stroke="#c8c4e0" strokeWidth="1"/>
      <rect x="48" y="64" width="64" height="70" rx="10" fill={bd} stroke="#c8c4e0" strokeWidth="1"/>
      <rect x="20" y="64" width="32" height="16" rx="6" fill={bd} stroke="#c8c4e0" strokeWidth="1"/>
      <rect x="108" y="64" width="32" height="16" rx="6" fill={bd} stroke="#c8c4e0" strokeWidth="1"/>
    </g>
  )

  const Hand = ({ cx, cy, r = 9 }) => (
    <circle cx={cx} cy={cy} r={r} fill={sk} stroke={hi} strokeWidth="2.5"/>
  )

  const MArrow = ({ id, d, label, anim }) => (
    <>
      <defs>
        <marker id={`arr-${id}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={hi}/>
        </marker>
      </defs>
      <path d={d} stroke={hi} strokeWidth="2.5" fill="none"
        strokeDasharray="5 3" className={anim} markerEnd={`url(#arr-${id})`}/>
      {label && <text x="80" y="158" textAnchor="middle" fontSize="11" fill="#888" fontFamily="sans-serif">{label}</text>}
    </>
  )

  const diagrams = {
    g01: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <rect x="25" y="100" width="12" height="40" rx="4" fill={bd} stroke="#c8c4e0" strokeWidth="1.5" transform="rotate(-20 25 100)"/>
        <circle cx="45" cy="95" r="8" fill={bd} stroke="#c8c4e0" strokeWidth="1.5"/>
        <MArrow id="g01-s" d="M40 110 L55 130" label="" anim="anim-arrow-stroke"/>
        <MArrow id="g01-l" d="M65 140 L65 165" label="" anim="anim-arrow-drop"/>
        <MArrow id="g01-r" d="M95 140 L95 165" label="" anim="anim-arrow-drop"/>
        <text x="80" y="215" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">팔 쓸기 → 두 주먹 내리기</text>
      </svg>
    ),
    g02: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <rect x="44" y="100" width="36" height="10" rx="4" fill={bd} stroke="#c8c4e0" strokeWidth="1.5"/>
        <Hand cx="80" cy="90"/>
        <MArrow id="g02" d="M80 90 L80 100" label="오른손 날로 두드리기 ×2" anim="anim-arrow-down"/>
      </svg>
    ),
    g12: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <Hand cx="80" cy="16" r="8"/>
        <text x="96" y="19" fontSize="9" fill={hi} fontFamily="sans-serif" fontWeight="700">이마</text>
        <rect x="36" y="108" width="40" height="10" rx="4" fill={bd} stroke="#c8c4e0" strokeWidth="1.5"/>
        <MArrow id="g12-sweep" d="M80 24 L60 106" label="" anim="anim-arrow-down"/>
        <MArrow id="g12-tap1" d="M56 104 L56 110" label="" anim="anim-arrow-drop"/>
        <MArrow id="g12-tap2" d="M64 104 L64 110" label="" anim="anim-arrow-drop"/>
        <text x="80" y="170" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">O형 이마 → 내리기 → 왼 손등</text>
      </svg>
    ),
    g13: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <Hand cx="80" cy="60"/>
        <MArrow id="g13" d="M80 55 L80 62" label="새끼손가락 끝으로 턱 아래 톡톡" anim="anim-arrow-down"/>
      </svg>
    ),
    // ── g14 이름: L형으로 가슴 두 번 터치 ─────────────────────
    g14: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <Hand cx="70" cy="95"/>
        <MArrow id="g14a" d="M70 95 L70 88" label="" anim="anim-arrow-drop"/>
        <MArrow id="g14b" d="M70 95 L70 88" label="" anim="anim-arrow-drop"/>
        <text x="80" y="158" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">L형 — 왼쪽 가슴 두 번 터치</text>
      </svg>
    ),
    e01: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <Hand cx="72" cy="100" r="9"/>
        <Hand cx="88" cy="100" r="11"/>
        <MArrow id="e01" d="M80 100 L80 75" label="두 손 함께 위로" anim="anim-arrow-up"/>
      </svg>
    ),
    e02: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <Hand cx="80" cy="50"/>
        <MArrow id="e02" d="M80 50 L100 48" label="검지를 입 앞 → 앞으로" anim="anim-arrow-forward"/>
      </svg>
    ),
    e03: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <Hand cx="80" cy="100"/>
        <MArrow id="e03" d="M80 100 L80 88" label="C자 모양으로 가슴 두드리기 ×2" anim="anim-arrow-down"/>
      </svg>
    ),
    m01: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <g className="anim-step-1">
          <rect x="36" y="88" width="44" height="14" rx="6" fill={bd} stroke="#c8c4e0" strokeWidth="1"/>
          <Hand cx="96" cy="82"/>
          <text x="80" y="200" textAnchor="middle" fontSize="10" fill="#666" fontFamily="sans-serif">① 손등 한 번 두드리기</text>
        </g>
        <g className="anim-step-2">
          <rect x="36" y="100" width="8" height="24" rx="3" fill={bd} stroke="#c8c4e0" strokeWidth="1"/>
          <Hand cx="96" cy="100"/>
          <text x="80" y="215" textAnchor="middle" fontSize="10" fill="#666" fontFamily="sans-serif">② 손목 두 번 두드리기</text>
        </g>
      </svg>
    ),
    m02: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <g className="anim-shake-no"><Hand cx="80" cy="100"/></g>
        <path d="M64 100 L96 100" stroke={hi} strokeWidth="2" fill="none" strokeDasharray="4 3"/>
        <text x="80" y="158" textAnchor="middle" fontSize="11" fill="#888" fontFamily="sans-serif">가슴/배 앞 좌우 흔들기</text>
      </svg>
    ),
    m03: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <rect x="44" y="100" width="36" height="10" rx="4" fill={bd} stroke="#c8c4e0" strokeWidth="1.5"/>
        <Hand cx="80" cy="88"/>
        <MArrow id="m03" d="M68 92 L92 92" label="왼 손바닥 위 앞뒤 문지르기" anim="anim-arrow-lateral"/>
      </svg>
    ),
    // ── m04 열: 이마 → 왼 손바닥 두 번 ────────────────────────
    m04: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <Hand cx="80" cy="20"/>
        <text x="96" y="22" fontSize="9" fill={hi} fontFamily="sans-serif" fontWeight="700">이마</text>
        <rect x="44" y="108" width="36" height="10" rx="4" fill={bd} stroke="#c8c4e0" strokeWidth="1.5"/>
        <MArrow id="m04" d="M80 28 L80 106" label="이마 → 왼 손바닥 (빠르게)" anim="anim-arrow-down"/>
      </svg>
    ),
    tr01: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <rect x="44" y="100" width="36" height="10" rx="4" fill={bd} stroke="#c8c4e0" strokeWidth="1.5"/>
        <Hand cx="80" cy="88"/>
        <MArrow id="tr01" d="M80 88 L80 100" label="주먹으로 도장 찍기" anim="anim-arrow-down"/>
      </svg>
    ),
    tr02: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <Hand cx="36" cy="78"/>
        <Hand cx="124" cy="78"/>
        <path d="M36 78 Q20 90 28 104 Q36 118 52 108" stroke={hi} strokeWidth="2"
          fill="none" strokeDasharray="4 3" className="anim-arrow-stroke"/>
        <defs>
          <marker id="arr-tr02L" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={hi}/>
          </marker>
        </defs>
        <path d="M46 112 L60 106" stroke={hi} strokeWidth="2" fill="none" markerEnd="url(#arr-tr02L)"/>
        <path d="M124 78 Q140 90 132 104 Q124 118 108 108" stroke={hi} strokeWidth="2"
          fill="none" strokeDasharray="4 3" className="anim-arrow-stroke"/>
        <defs>
          <marker id="arr-tr02R" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={hi}/>
          </marker>
        </defs>
        <path d="M114 112 L100 106" stroke={hi} strokeWidth="2" fill="none" markerEnd="url(#arr-tr02R)"/>
        <text x="80" y="158" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">양 어깨 뒤 → 원 그리며</text>
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">앞으로 내밀기 ×2</text>
      </svg>
    ),
    q15: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <g className="anim-shake-no"><Hand cx="80" cy="95"/></g>
        <path d="M64 95 L96 95" stroke={hi} strokeWidth="2" fill="none" strokeDasharray="4 3"/>
        <text x="80" y="158" textAnchor="middle" fontSize="11" fill="#888" fontFamily="sans-serif">검지 좌우 흔들기</text>
      </svg>
    ),
    q16: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <g className="anim-shake-no"><Hand cx="80" cy="95"/></g>
        <MArrow id="q16" d="M80 95 L80 108" label="검지 좌우 → 아래로" anim="anim-arrow-down"/>
      </svg>
    ),
    q17: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <Hand cx="108" cy="34"/>
        <text x="80" y="158" textAnchor="middle" fontSize="11" fill="#888" fontFamily="sans-serif">검지 끝을 관자놀이에</text>
      </svg>
    ),
    q18: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <Hand cx="96" cy="85"/>
        <MArrow id="q18" d="M100 78 L82 98" label="대각선 베기" anim="anim-arrow-diagonal"/>
      </svg>
    ),
    a19: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <g className="anim-nod-yes">
          <ellipse cx="80" cy="32" rx="22" ry="26" fill={bd} stroke={hi} strokeWidth="2.5"/>
        </g>
        <text x="80" y="158" textAnchor="middle" fontSize="11" fill="#888" fontFamily="sans-serif">고개 끄덕임</text>
      </svg>
    ),
    a26: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <g className="anim-shake-no"><Hand cx="80" cy="95"/></g>
        <path d="M62 95 L98 95" stroke={hi} strokeWidth="2" fill="none" strokeDasharray="4 3"/>
        <text x="80" y="158" textAnchor="middle" fontSize="11" fill="#888" fontFamily="sans-serif">손바닥 밖 향해 좌우 흔들기</text>
      </svg>
    ),
    t20: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <Hand cx="108" cy="80"/>
        <MArrow id="t20" d="M108 80 L108 64" label="어깨 뒤로 검지 넘기기" anim="anim-arrow-back"/>
      </svg>
    ),
    t21: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <Hand cx="55" cy="100"/>
        <Hand cx="105" cy="100"/>
        <MArrow id="t21a" d="M55 100 L55 116" label="" anim="anim-arrow-down"/>
        <MArrow id="t21b" d="M105 100 L105 116" label="" anim="anim-arrow-down"/>
        <text x="80" y="158" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">엄지·검지·중지 펴고</text>
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">손등 위 · 손끝 밖 → 아래로</text>
      </svg>
    ),
    t22: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <Hand cx="104" cy="34"/>
        <MArrow id="t22" d="M100 34 L120 34" label="눈 옆 댔다가 앞으로" anim="anim-arrow-forward"/>
      </svg>
    ),
    // ── f23 좋다: 엄지 위로 👍 ─────────────────────────────────
    f23: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <Hand cx="80" cy="90"/>
        {/* Thumb pointing up indicator */}
        <line x1="80" y1="86" x2="80" y2="70" stroke={hi} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="80" cy="67" r="4" fill={hi}/>
        <text x="80" y="158" textAnchor="middle" fontSize="12" fill="#888" fontFamily="sans-serif">👍 엄지 위로</text>
      </svg>
    ),
    // ── f24 싫다: 엄지 아래로 👎 ──────────────────────────────
    f24: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <Hand cx="80" cy="90"/>
        {/* Thumb pointing down indicator */}
        <line x1="80" y1="94" x2="80" y2="112" stroke={hi} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="80" cy="115" r="4" fill={hi}/>
        <text x="80" y="158" textAnchor="middle" fontSize="12" fill="#888" fontFamily="sans-serif">👎 엄지 아래로</text>
      </svg>
    ),
    n27: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/><Hand cx="80" cy="95"/>
        <line x1="80" y1="86" x2="80" y2="68" stroke={hi} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="80" cy="65" r="4" fill={hi}/>
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">검지만 위로 · 손등이 밖</text>
      </svg>
    ),
    n28: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/><Hand cx="80" cy="95"/>
        <line x1="76" y1="87" x2="70" y2="68" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="69" cy="65" r="3.5" fill={hi}/>
        <line x1="80" y1="86" x2="80" y2="66" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="80" cy="63" r="3.5" fill={hi}/>
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">검지+중지 V형 · 엄지 접음</text>
      </svg>
    ),
    n29: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/><Hand cx="80" cy="95"/>
        <line x1="74" y1="87" x2="68" y2="68" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="67" cy="65" r="3.5" fill={hi}/>
        <line x1="79" y1="86" x2="77" y2="66" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="77" cy="63" r="3.5" fill={hi}/>
        <line x1="84" y1="87" x2="86" y2="67" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="87" cy="64" r="3.5" fill={hi}/>
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">검+중+약 · 엄·소 접음</text>
      </svg>
    ),
    n30: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/><Hand cx="80" cy="95"/>
        <line x1="72" y1="87" x2="66" y2="68" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="65" cy="65" r="3.5" fill={hi}/>
        <line x1="78" y1="86" x2="76" y2="66" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="75" cy="63" r="3.5" fill={hi}/>
        <line x1="83" y1="87" x2="85" y2="67" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="86" cy="64" r="3.5" fill={hi}/>
        <line x1="88" y1="89" x2="93" y2="70" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="94" cy="67" r="3.5" fill={hi}/>
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">검·중·약·소 · 엄지만 접음</text>
      </svg>
    ),
    n31: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/><Hand cx="80" cy="95"/>
        {/* Thumb slightly tilted */}
        <line x1="76" y1="92" x2="68" y2="72" stroke={hi} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="67" cy="69" r="4" fill={hi}/>
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">엄지만 (살짝 기울어짐)</text>
      </svg>
    ),
    n32: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/><Hand cx="80" cy="95"/>
        <line x1="78" y1="87" x2="74" y2="68" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="73" cy="65" r="3.5" fill={hi}/>
        <line x1="72" y1="93" x2="58" y2="91" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="55" cy="90" r="3.5" fill={hi}/>
        <circle cx="73" cy="87" r="4" fill={hi} opacity="0.4"/>
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">엄지+검지 겹치기</text>
      </svg>
    ),
    n33: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/><Hand cx="80" cy="95"/>
        <line x1="76" y1="87" x2="70" y2="68" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="69" cy="65" r="3.5" fill={hi}/>
        <line x1="82" y1="86" x2="82" y2="67" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="82" cy="64" r="3.5" fill={hi}/>
        <line x1="72" y1="93" x2="56" y2="91" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="53" cy="90" r="3.5" fill={hi}/>
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">엄+검+중 겹치기</text>
      </svg>
    ),
    n34: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/><Hand cx="80" cy="95"/>
        <line x1="74" y1="87" x2="68" y2="68" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="67" cy="65" r="3.5" fill={hi}/>
        <line x1="80" y1="86" x2="79" y2="66" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="79" cy="63" r="3.5" fill={hi}/>
        <line x1="86" y1="87" x2="88" y2="68" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="89" cy="65" r="3.5" fill={hi}/>
        <line x1="72" y1="93" x2="55" y2="91" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="52" cy="90" r="3.5" fill={hi}/>
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">엄+검+중+약 겹치기</text>
      </svg>
    ),
    n35: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/><Hand cx="80" cy="95" r="11"/>
        {[[-16,-26],[-8,-28],[0,-28],[8,-28],[18,-22]].map(([dx,dy],i) => (
          <g key={i}>
            <line x1={80+dx*0.3} y1={95+dy*0.3} x2={80+dx} y2={95+dy} stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx={80+dx} cy={95+dy} r="3.5" fill={hi}/>
          </g>
        ))}
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">다섯 손가락 · 손등이 밖</text>
      </svg>
    ),
    n36: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/><Hand cx="80" cy="95"/>
        <line x1="80" y1="86" x2="80" y2="72" stroke={hi} strokeWidth="3" strokeLinecap="round"/>
        <line x1="80" y1="72" x2="88" y2="65" stroke={hi} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="90" cy="63" r="3.5" fill={hi}/>
        <line x1="62" y1="93" x2="98" y2="93" stroke={hi} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5"/>
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">검지 구부려 좌우 흔들기</text>
      </svg>
    ),
    // ── d37 물: 엄지+검지 컵 잡기 ─────────────────────────────
    d37: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <Hand cx="80" cy="55"/>
        <MArrow id="d37" d="M80 62 L80 50" label="엄지+검지로 컵 잡아 마시기" anim="anim-repeat"/>
      </svg>
    ),
    b38: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <g className="anim-nod-yes"><Hand cx="80" cy="12"/></g>
        <text x="80" y="158" textAnchor="middle" fontSize="11" fill="#888" fontFamily="sans-serif">머리 부분 가리키기</text>
      </svg>
    ),
    b39: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <Hand cx="88" cy="36"/>
        <line x1="84" y1="34" x2="76" y2="34" stroke={hi} strokeWidth="2" strokeLinecap="round"/>
        <text x="80" y="158" textAnchor="middle" fontSize="11" fill="#888" fontFamily="sans-serif">검지로 눈 주변 가리키기</text>
      </svg>
    ),
  }

  if (!diagrams[signId]) {
    return (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <circle cx="80" cy="95" r="9" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <text x="80" y="158" textAnchor="middle" fontSize="11" fill="#888" fontFamily="sans-serif">가슴 앞 중앙</text>
      </svg>
    )
  }
  return diagrams[signId]
}

/* ────────────────────────────────────────────────────────────
   STEPS DATA
──────────────────────────────────────────────────────────── */
const SIGN_STEPS = {
  g01: ['오른손 바닥을 펴서 왼쪽 관자놀이 부근에서 아래로 부드럽게 쓸어내립니다.', '양손을 주먹 쥐고 가슴 앞에서 가볍게 아래로 내리며 멈춥니다.'],
  g02: ['왼손을 가슴 높이에서 손바닥이 아래로 향하게 눕힙니다.', '오른손 날을 세워 왼 손등 위를 가볍게 두 번 두드립니다.'],
  g12: ['오른손 엄지와 검지를 붙여 O형(OK 모양)을 만들고 이마에 댑니다.', '손을 떼어 가슴 앞쪽 아래로 내립니다.', '왼손등 위를 오른손으로 톡톡 두드리거나 살짝 얹습니다.'],
  g13: ['오른손의 주먹을 쥔 상태에서 새끼손가락만 폅니다.', '핀 새끼손가락 끝을 턱 아래쪽에 위치시킵니다.', '턱 아래를 가볍게 두 번 톡톡 건드립니다.'],
  g14: ['오른손 엄지와 검지를 폅니다 (L형).', '손을 왼쪽 가슴 앞으로 가져갑니다.', '엄지와 검지 끝으로 왼쪽 가슴을 가볍게 두 번 터치합니다.'],
  e01: ['왼손을 주먹 쥐고 엄지만 위로 세웁니다.', '오른 손바닥을 가슴 앞에 수평으로 펼칩니다.', '왼 엄지로 오른 손바닥을 가볍게 두 번 톡톡 두드립니다.'],
  e02: ['오른손 검지를 펴서 입 앞에 세웁니다. 손등이 밖을 향하게 합니다.', '앞쪽으로 내밀며 정보를 전달하는 느낌으로 움직입니다.'],
  e03: ['오른손을 C자 모양으로 구부립니다.', '구부린 손가락 끝으로 가슴을 가볍게 두 번 두드립니다.'],
  m01: ['왼손을 주먹 쥐고 손등이 밖을 향하게 가슴 앞에 위치합니다.', '오른손 V형(검지+중지)으로 왼손 손등을 한 번 톡 칩니다.', '이어서 왼손 손목 쪽을 두 번 톡톡 칩니다.'],
  m02: ['오른 손바닥을 위로 향하게 하여 가볍게 오므립니다.', '가슴이나 배 앞에서 좌우로 가볍게 흔듭니다.'],
  m03: ['왼 손바닥을 펴서 위로 향하게 합니다.', '오른손 검지(1형)로 손바닥 위를 앞뒤로 문지릅니다.'],
  m04: ['왼 손바닥을 가슴 앞에 수평으로 위치시킵니다.', '오른 손바닥을 이마에 가볍게 댔다 뗍니다.', '그대로 내려서 왼 손바닥 위에 댔다가 빠르게 뗍니다.'],
  tr01: ['왼 손바닥을 펴서 위로 향하게 합니다.', '오른손을 주먹 쥐어 도장을 찍듯 톡 내립니다.'],
  tr02: ['양손 검지 끝을 어깨 쪽(뒤)으로 향하게 합니다.', '동시에 안쪽으로 빙글 돌리며 앞으로 내밉니다.'],
  q15: ['오른손 검지를 펴서 손바닥이 밖을 향하게 합니다.', '좌우로 가볍게 두 번 흔듭니다.'],
  q16: ['검지를 좌우로 움직인 후 손을 아래로 살짝 내립니다.'],
  q17: ['검지 끝을 관자놀이에 갖다 댑니다.', '의문스러운 표정을 함께 짓습니다.'],
  q18: ['주먹을 쥔 상태에서 검지와 중지만 펴서 V형을 만듭니다.', '손을 대각선 위 뒤쪽에서 앞 아래쪽으로 칼로 베듯이 가볍게 내립니다.'],
  a19: ['고개를 위아래로 한 번 끄덕입니다.'],
  a26: ['손바닥이 밖을 향하게 세우고 좌우로 흔듭니다.'],
  t20: ['검지를 펴서 어깨 뒤쪽 방향으로 움직입니다.'],
  t21: ['양손의 엄지·검지·중지 세 손가락을 폅니다.', '손등이 위를, 손끝이 바깥(상대방 방향)을 향하게 합니다.', '두 손을 가슴 앞에서 아래로 약간 내립니다.'],
  t22: ['검지를 눈 옆에 댔다가 앞쪽으로 내밉니다.'],
  f23: ['오른손을 주먹 쥐고 엄지만 위로 세웁니다.', '가슴 앞에서 엄지를 위로 향하게 유지합니다 👍'],
  f24: ['오른손을 주먹 쥐고 엄지만 아래로 향하게 세웁니다.', '가슴 앞에서 엄지를 아래로 향하게 유지합니다 👎', '찡그린 표정을 함께 짓습니다.'],
  n27: ['검지만 위로 폅니다. 나머지는 접습니다.'],
  n28: ['검지와 중지를 폅니다.', '엄지·약지·소지는 접습니다.'],
  n29: ['검지·중지·약지를 폅니다.', '엄지와 소지는 접습니다.'],
  n30: ['검지·중지·약지·소지를 모두 폅니다.', '엄지만 접습니다.'],
  n31: ['엄지만 세웁니다. 나머지 손가락은 주먹 쥡니다.', '엄지는 완전히 수직이 아닌 살짝 기울어진 자세입니다.'],
  n32: ['엄지와 검지를 수직으로 폅니다.', '손등이 상대방을 향하게 합니다.'],
  n33: ['엄지·검지·중지를 수직으로 폅니다.', '손등이 상대방을 향하게 합니다.'],
  n34: ['엄지·검지·중지·약지를 수직으로 폅니다.', '손등이 상대방을 향하게 합니다.'],
  n35: ['다섯 손가락을 모두 수직으로 폅니다.', '손등이 상대방을 향하게 합니다.'],
  n36: ['오른손 주먹을 쥡니다.', '검지만 펴서 약간 구부립니다. 손가락 끝이 밖(상대방)을 향하게 합니다.', '손을 좌우로 살짝 흔듭니다.'],
  d37: ['엄지와 검지를 펴고 나머지 손가락은 접습니다.', '컵을 잡듯 엄지+검지로 잡는 모양을 만듭니다.', '마시는 동작처럼 입 쪽으로 기울입니다.'],
  b38: ['검지 또는 손으로 머리 부분을 가리킵니다.'],
  b39: ['검지로 눈 아래 또는 눈 주변을 가리킵니다.'],
}

const DICT_URLS = {
  g01: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=안녕',
  g02: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=감사',
  g12: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=죄송',
  g13: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=괜찮다',
  g14: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=이름',
  e01: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=도움',
  e02: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=신고',
  e03: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=위험',
  m01: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=의사',
  m02: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=아프다',
  m03: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=약',
  m04: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=열',
  tr01: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=비자',
  tr02: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=여행',
  q15: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=무엇',
  q16: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=어디',
  q17: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=왜',
  q18: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=다시',
  a19: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=예',
  a26: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=아니',
  t20: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=어제',
  t21: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=지금',
  t22: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=내일',
  f23: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=좋다',
  f24: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=싫다',
  n27: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=일',
  n28: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=이',
  n29: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=삼',
  n30: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=사',
  n31: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=오',
  n32: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=육',
  n33: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=칠',
  n34: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=팔',
  n35: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=구',
  n36: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=십',
  d37: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=물',
  b38: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=머리',
  b39: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=눈',
}

const HAND_SHAPES = {
  g01: 'open',
  g02: 'open',
  g12: 'flato',
  g13: 'pinky',
  g14: 'lhandtouch',    // ✅ L형 터치
  e01: 'thumb',
  e02: 'point1',
  e03: 'chand',
  m01: 'point2',
  m02: 'chand',
  m03: 'point1',
  m04: 'open',
  tr01: 'fist',
  tr02: 'point1',
  q15: 'point1',
  q16: 'point1',
  q17: 'point1',
  q18: 'point2',
  a19: 'open',
  a26: 'open',
  t20: 'point1',
  t21: 'thumbtwofinger',
  t22: 'point1',
  f23: 'thumb',          // ✅ 엄지 위 👍
  f24: 'thumbdown',      // ✅ 엄지 아래 👎
  n27: 'point1',
  n28: 'point2',
  n29: 'threefinger',
  n30: 'fourfinger',
  n31: 'thumb_slant',    // ✅ 살짝 기울어진 엄지
  n32: 'sixhand',
  n33: 'sevenhand',
  n34: 'eighthand',
  n35: 'ninehand',
  n36: 'point1',
  d37: 'waterhand',      // ✅ 엄지+검지 컵 잡기
  b38: 'point1',
  b39: 'point1',
}

const SHAPE_LABELS = {
  bhand:          '5형 편손',  // alias for open
  fist:           '주먹 S형',
  point1:         '1형 검지',
  point2:         'V형 (검지+중지)',
  threefinger:    '3형 (검지+중지+약지)',
  fourfinger:     '4형 (검지+중지+약지+소지)',
  open:           '5형 (편손)',
  thumb:          '엄지 위로 👍',
  thumb_slant:    '엄지 (살짝 기울) — 숫자 5',
  thumbdown:      '엄지 아래로 👎',
  lhandtouch:     'L형 터치 (엄지+검지)',
  waterhand:      '엄지+검지 (컵 잡기)',
  ily:            'ILY형',
  yhand:          'Y형 (엄지+소지)',
  lhand:          'L형 (엄지+검지)',
  chand:          'C형',
  flato:          'F형 / O형 핀치',
  thumbtwofinger: '엄지+검지+중지 (손등이 위)',
  dislikehand:    '엄지+검지 구부림 (턱)',
  sixhand:        '6형 (엄지+검지 겹)',
  sevenhand:      '7형 (엄지+검지+중지 겹)',
  eighthand:      '8형 (엄지+검지+중지+약지 겹)',
  ninehand:       '9형 (전체, 손등이 밖)',
  pinky:          '소지형 (새끼손가락)',
}

export default function SignAnimator({ signId, color = '#7c6fff', compact = false }) {
  const steps   = SIGN_STEPS[signId]  || []
  const dictUrl = DICT_URLS[signId]   || 'https://sldict.korean.go.kr'
  const shape   = HAND_SHAPES[signId] || 'open'

  if (compact) {
    return (
      <div className="sa-compact">
        <div className="sa-compact-diagram">
          <BodyDiagram signId={signId} color={color} animClass="body-anim" />
        </div>
        <div className="sa-compact-steps">
          {steps.map((s, i) => (
            <div key={i} className="sa-cs-row">
              <span className="sa-cs-num" style={{ background: color }}>{i + 1}</span>
              <span className="sa-cs-text">{s.replace('\n', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="sa-wrap">
      <div className="sa-top">
        <div className="sa-diagram-col">
          <div className="sa-diagram-label">동작 방향</div>
          <div className="sa-diagram-box">
            <BodyDiagram signId={signId} color={color} animClass="body-anim" />
          </div>
        </div>
        <div className="sa-hand-col">
          <div className="sa-diagram-label">손 모양</div>
          <div className="sa-hand-box">
            <HandSVG shape={shape} color={color} size={80} />
            <div className="sa-hand-name">{SHAPE_LABELS[shape] || shape}</div>
          </div>
        </div>
      </div>
      <div className="sa-steps">
        {steps.map((s, i) => (
          <div key={i} className="sa-step" style={{ '--sc': color }}>
            <div className="sa-step-num">{i + 1}</div>
            <div className="sa-step-text">{s.replace('\n', ' ')}</div>
          </div>
        ))}
      </div>
      <a href={dictUrl} target="_blank" rel="noopener noreferrer" className="sa-dict-link">
        📖 국립국어원 수어사전에서 영상 보기 →
      </a>
    </div>
  )
}