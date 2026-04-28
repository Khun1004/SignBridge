import './SignAnimator.css'

/* ────────────────────────────────────────────────────────────
   HAND SHAPE SVGs
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
        <rect x="10" y="20" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="20" y="18" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="30" y="19" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="39" y="22" width="7"  height="9"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="6"  y="30" width="14" height="10" rx="4" fill={sk} stroke={hi} strokeWidth="1.5"/>
      </svg>
    ),
    point1: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="10" y="30" width="36" height="28" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="19" y="26" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="30" y="27" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="39" y="28" width="7"  height="9"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="6"  y="36" width="12" height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="10" y="2"  width="9"  height="32" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
      </svg>
    ),

    /* ── 2: 검지+중지 V형, 엄지·약지·소지 접음 ── */
    point2: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="10" y="32" width="36" height="26" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        {/* ring + pinky folded */}
        <rect x="30" y="28" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="39" y="29" width="7"  height="9"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* thumb folded */}
        <rect x="6"  y="38" width="12" height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* index + middle extended */}
        <rect x="10" y="2"  width="9"  height="34" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="20" y="2"  width="9"  height="34" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <text x="28" y="64" textAnchor="middle" fontSize="7" fill={hi} fontFamily="sans-serif" fontWeight="700">V형</text>
      </svg>
    ),

    /* ── 3: 검지+중지+약지, 엄지·소지 접음 ── */
    threefinger: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="8" y="32" width="38" height="26" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        {/* pinky folded */}
        <rect x="39" y="28" width="7"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* thumb folded */}
        <rect x="4"  y="38" width="12" height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* index + middle + ring extended */}
        <rect x="8"  y="2"  width="9"  height="34" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="19" y="2"  width="9"  height="34" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="30" y="2"  width="9"  height="34" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <text x="28" y="64" textAnchor="middle" fontSize="7" fill={hi} fontFamily="sans-serif" fontWeight="700">검·중·약</text>
      </svg>
    ),

    /* ── 4: 검지+중지+약지+소지, 엄지만 접음 ── */
    fourfinger: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="8" y="32" width="40" height="26" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        {/* thumb folded */}
        <rect x="4"  y="38" width="12" height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* all four fingers extended */}
        <rect x="8"  y="2"  width="8"  height="34" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="18" y="2"  width="8"  height="34" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="28" y="2"  width="8"  height="34" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="38" y="4"  width="7"  height="32" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <text x="28" y="64" textAnchor="middle" fontSize="7" fill={hi} fontFamily="sans-serif" fontWeight="700">검·중·약·소</text>
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
      </svg>
    ),
    thumb: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="12" y="30" width="34" height="28" rx="8" fill={sk} stroke={lo} strokeWidth="1.5"/>
        <rect x="12" y="26" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="22" y="24" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="32" y="25" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="40" y="27" width="7"  height="9"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="4"  y="6"  width="12" height="30" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
      </svg>
    ),
    ily: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="12" y="30" width="34" height="28" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="22" y="26" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="32" y="27" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="12" y="4"  width="8"  height="30" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="42" y="6"  width="7"  height="28" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="2"  y="26" width="14" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
      </svg>
    ),
    yhand: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="14" y="28" width="30" height="30" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="14" y="24" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="23" y="22" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="32" y="23" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="2"  y="24" width="16" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="40" y="4"  width="8"  height="28" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <text x="28" y="64" textAnchor="middle" fontSize="7" fill={hi} fontFamily="sans-serif" fontWeight="700">Y형</text>
      </svg>
    ),

    /* ── 지금 (t21): 엄지+검지+중지, 손등이 위 ── */
    thumbtwofinger: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="10" y="32" width="36" height="26" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        {/* ring, pinky folded */}
        <rect x="34" y="28" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="42" y="29" width="7"  height="9"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* thumb extended sideways */}
        <rect x="2"  y="30" width="16" height="8"  rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        {/* index finger extended */}
        <rect x="10" y="2"  width="9"  height="34" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        {/* middle finger extended */}
        <rect x="21" y="2"  width="9"  height="34" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <text x="28" y="64" textAnchor="middle" fontSize="7" fill={hi} fontFamily="sans-serif" fontWeight="700">손등이 위</text>
      </svg>
    ),

    /* ── 싫다 (f24): 엄지+검지 약간 구부려 턱에 대기 ── */
    dislikehand: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="10" y="32" width="36" height="26" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        {/* middle, ring, pinky folded */}
        <rect x="22" y="28" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="32" y="29" width="8"  height="9"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="40" y="30" width="7"  height="8"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* index slightly curved */}
        <path d="M10 30 Q12 16 18 10 Q22 6 22 14 Q20 26 16 32" fill={sk} stroke={hi} strokeWidth="2.5"/>
        {/* thumb extended and slightly curved */}
        <path d="M6 36 Q2 28 4 20 Q8 14 14 18 Q16 26 12 32" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <text x="28" y="64" textAnchor="middle" fontSize="7" fill={hi} fontFamily="sans-serif" fontWeight="700">엄+검 구부림</text>
      </svg>
    ),

    /* ── 6: 엄지+검지 겹치기 ── */
    sixhand: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="12" y="30" width="34" height="28" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        {/* middle, ring, pinky folded */}
        <rect x="22" y="26" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="32" y="27" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="40" y="28" width="7"  height="9"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* index finger extended up */}
        <rect x="12" y="2"  width="9"  height="32" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        {/* thumb crossing over index */}
        <rect x="2"  y="30" width="10" height="15"  rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <text x="28" y="64" textAnchor="middle" fontSize="7" fill={hi} fontFamily="sans-serif" fontWeight="700">엄+검 겹</text>
      </svg>
    ),

    /* ── 7: 엄지+검지+중지 겹치기 ── */
    sevenhand: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="10" y="30" width="36" height="28" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        {/* ring, pinky folded */}
        <rect x="32" y="26" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="40" y="27" width="7"  height="9"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* index + middle extended */}
        <rect x="10" y="2"  width="9"  height="32" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="21" y="2"  width="9"  height="32" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        {/* thumb crossing over both */}
        <rect x="2"  y="30" width="10" height="15"  rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>  
        <text x="28" y="64" textAnchor="middle" fontSize="7" fill={hi} fontFamily="sans-serif" fontWeight="700">엄+검+중 겹</text>
      </svg>
    ),

    /* ── 8: 엄지+검지+중지+약지 겹치기 ── */
    eighthand: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="8" y="30" width="40" height="28" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        {/* pinky folded */}
        <rect x="40" y="26" width="7"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* index + middle + ring extended */}
        <rect x="8"  y="2"  width="9"  height="32" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="19" y="2"  width="9"  height="32" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="30" y="2"  width="9"  height="32" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        {/* thumb crossing over all three */}
        <rect x="2"  y="30" width="10" height="15"  rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>  
        <text x="28" y="64" textAnchor="middle" fontSize="7" fill={hi} fontFamily="sans-serif" fontWeight="700">엄+검+중+약 겹</text>
      </svg>
    ),

    /* ── 9: 다섯 손가락 모두, 손등이 밖 ── */
    ninehand: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        {/* palm — back of hand shown */}
        <rect x="10" y="30" width="36" height="28" rx="6" fill={sk2} stroke={hi} strokeWidth="1.5"/>
        <line x1="16" y1="30" x2="16" y2="40" stroke={lo} strokeWidth="1"/>
        <line x1="24" y1="30" x2="24" y2="40" stroke={lo} strokeWidth="1"/>
        <line x1="32" y1="30" x2="32" y2="40" stroke={lo} strokeWidth="1"/>
        <line x1="40" y1="30" x2="40" y2="40" stroke={lo} strokeWidth="1"/>
        {/* all 5 fingers */}
        <rect x="10" y="2"  width="8"  height="32" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="20" y="2"  width="8"  height="32" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="30" y="3"  width="8"  height="31" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="39" y="5"  width="7"  height="28" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="2"  y="26" width="12" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2"/>
        <text x="28" y="64" textAnchor="middle" fontSize="7" fill={hi} fontFamily="sans-serif" fontWeight="700">손등이 밖</text>
      </svg>
    ),
    lhand: (
      <svg width={size} height={size} viewBox="0 0 420 340" fill="none">
        <rect x="148" y="118" width="68" height="110" rx="12" fill={sk} stroke={lo} strokeWidth="1.5"/>
        <rect x="88"  y="138" width="64" height="68"  rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
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
        <rect x="34" y="6"  width="18" height="9" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="36" y="18" width="17" height="9" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="36" y="30" width="17" height="9" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="34" y="42" width="16" height="9" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="4"  y="26" width="16" height="9" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
      </svg>
    ),
    flato: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="12" y="32" width="34" height="26" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        <ellipse cx="16" cy="26" rx="9" ry="8" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <ellipse cx="16" cy="26" rx="4" ry="3.5" fill="none" stroke={lo} strokeWidth="1.5"/>
        <rect x="24" y="4"  width="8" height="30" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="34" y="5"  width="8" height="30" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="43" y="8"  width="7" height="27" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
      </svg>
    ),

    /* ── 7: 엄지+약지 ── */
    thumbring: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="10" y="30" width="36" height="28" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        {/* index, middle, pinky folded */}
        <rect x="12" y="26" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="22" y="24" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="40" y="27" width="7"  height="9"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* thumb extended */}
        <rect x="2"  y="24" width="14" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
        {/* ring finger extended */}
        <rect x="32" y="4"  width="8"  height="30" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <text x="28" y="64" textAnchor="middle" fontSize="7" fill={hi} fontFamily="sans-serif" fontWeight="700">엄+약</text>
      </svg>
    ),

    /* ── 8: 엄지+중지 ── */
    thumbmiddle: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="10" y="30" width="36" height="28" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        {/* index, ring, pinky folded */}
        <rect x="12" y="26" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="32" y="26" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="40" y="27" width="7"  height="9"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* thumb extended */}
        <rect x="2"  y="24" width="14" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
        {/* middle finger extended */}
        <rect x="22" y="4"  width="8"  height="30" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <text x="28" y="64" textAnchor="middle" fontSize="7" fill={hi} fontFamily="sans-serif" fontWeight="700">엄+중</text>
      </svg>
    ),

    pinky: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="10" y="30" width="36" height="28" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="10" y="26" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="20" y="24" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="30" y="25" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="6"  y="36" width="12" height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="40" y="4"  width="7"  height="30" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
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
    /* ── 인사 ── */
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
        <text x="80" y="170" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">O형 이마 → 내리기</text>
        <text x="80" y="182" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">→ 왼 손등 톡톡</text>
      </svg>
    ),
    g13: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <Hand cx="80" cy="60"/>
        <MArrow id="g13" d="M80 55 L80 62" label="새끼손가락 끝으로 턱 아래 톡톡" anim="anim-arrow-down"/>
      </svg>
    ),
    g14: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <Hand cx="80" cy="90"/>
        <MArrow id="g14" d="M80 88 L80 100" label="L형 가슴 높이 → 아래로" anim="anim-arrow-down"/>
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
          <text x="80" y="200" textAnchor="middle" fontSize="10" fill="#666" fontFamily="sans-serif">① 손등 두드리기</text>
        </g>
        <g className="anim-step-2">
          <rect x="36" y="100" width="8" height="24" rx="3" fill={bd} stroke="#c8c4e0" strokeWidth="1"/>
          <Hand cx="96" cy="100"/>
          <text x="80" y="215" textAnchor="middle" fontSize="10" fill="#666" fontFamily="sans-serif">② 손목 옆면 두드리기</text>
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
    m04: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <Hand cx="80" cy="20"/>
        <MArrow id="m04a" d="M80 20 L80 28" label="" anim="anim-arrow-down"/>
        <Hand cx="80" cy="100"/>
        <MArrow id="m04b" d="M80 36 L80 100" label="이마 → 왼 손바닥" anim="anim-arrow-down"/>
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
        {/* Left shoulder position */}
        <Hand cx="36" cy="78"/>
        {/* Right shoulder position */}
        <Hand cx="124" cy="78"/>
        {/* Left: circular arc going forward/outward */}
        <path d="M36 78 Q20 90 28 104 Q36 118 52 108" stroke={hi} strokeWidth="2"
          fill="none" strokeDasharray="4 3" className="anim-arrow-stroke"/>
        <defs>
          <marker id="arr-tr02L" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={hi}/>
          </marker>
        </defs>
        <path d="M46 112 L60 106" stroke={hi} strokeWidth="2" fill="none"
          markerEnd="url(#arr-tr02L)"/>
        {/* Right: mirrored arc */}
        <path d="M124 78 Q140 90 132 104 Q124 118 108 108" stroke={hi} strokeWidth="2"
          fill="none" strokeDasharray="4 3" className="anim-arrow-stroke"/>
        <defs>
          <marker id="arr-tr02R" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={hi}/>
          </marker>
        </defs>
        <path d="M114 112 L100 106" stroke={hi} strokeWidth="2" fill="none"
          markerEnd="url(#arr-tr02R)"/>
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
    f23: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <Hand cx="80" cy="36"/>
        <text x="80" y="158" textAnchor="middle" fontSize="11" fill="#888" fontFamily="sans-serif">주먹 엄지 쪽을 코에 대기</text>
      </svg>
    ),
    f24: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        {/* fingers touching chin */}
        <Hand cx="80" cy="58"/>
        {/* arrow: touch chin then flick outward */}
        <MArrow id="f24a" d="M80 58 L80 62" label="" anim="anim-arrow-down"/>
        <MArrow id="f24b" d="M82 60 L102 56" label="" anim="anim-arrow-forward"/>
        <text x="80" y="158" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">엄지+검지 구부려 턱에 댄 후</text>
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">밖으로 흔들며 떼기</text>
      </svg>
    ),

    /* ══════════════════════════════════════════════════════
       NUMBERS — all static hold diagrams
    ══════════════════════════════════════════════════════ */
    n27: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/><Hand cx="80" cy="95"/>
        <line x1="80" y1="86" x2="80" y2="68" stroke={hi} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="80" cy="65" r="4" fill={hi}/>
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">검지만 위로</text>
        <text x="80" y="182" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">손등이 밖(상대방)</text>
      </svg>
    ),
    /* 2: 검지+중지 V형, 엄지 접음, 손등이 밖 */
    n28: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/><Hand cx="80" cy="95"/>
        {/* index finger */}
        <line x1="76" y1="87" x2="70" y2="68" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="69" cy="65" r="3.5" fill={hi}/>
        {/* middle finger */}
        <line x1="80" y1="86" x2="80" y2="66" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="80" cy="63" r="3.5" fill={hi}/>
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">검지+중지 V형</text>
        <text x="80" y="182" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">엄지 접음 · 손등이 밖</text>
      </svg>
    ),
    /* 3: 검지+중지+약지, 엄지·소지 접음, 손등이 밖 */
    n29: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/><Hand cx="80" cy="95"/>
        {/* index */}
        <line x1="74" y1="87" x2="68" y2="68" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="67" cy="65" r="3.5" fill={hi}/>
        {/* middle */}
        <line x1="79" y1="86" x2="77" y2="66" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="77" cy="63" r="3.5" fill={hi}/>
        {/* ring */}
        <line x1="84" y1="87" x2="86" y2="67" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="87" cy="64" r="3.5" fill={hi}/>
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">검지+중지+약지</text>
        <text x="80" y="182" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">엄지·소지 접음 · 손등이 밖</text>
      </svg>
    ),
    /* 4: 검지+중지+약지+소지, 엄지만 접음, 손등이 밖 */
    n30: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/><Hand cx="80" cy="95"/>
        {/* index */}
        <line x1="72" y1="87" x2="66" y2="68" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="65" cy="65" r="3.5" fill={hi}/>
        {/* middle */}
        <line x1="78" y1="86" x2="76" y2="66" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="75" cy="63" r="3.5" fill={hi}/>
        {/* ring */}
        <line x1="83" y1="87" x2="85" y2="67" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="86" cy="64" r="3.5" fill={hi}/>
        {/* pinky */}
        <line x1="88" y1="89" x2="93" y2="70" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="94" cy="67" r="3.5" fill={hi}/>
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">검·중·약·소 모두 펼침</text>
        <text x="80" y="182" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">엄지만 접음 · 손등이 밖</text>
      </svg>
    ),
    /* 5: 다섯 손가락, 손바닥이 앞(상대방) */
    n31: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/><Hand cx="80" cy="95" r="11"/>
        {[[-16,-26],[-8,-28],[0,-28],[8,-28],[18,-22]].map(([dx,dy],i) => (
          <g key={i}>
            <line x1={80+dx*0.3} y1={95+dy*0.3} x2={80+dx} y2={95+dy} stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx={80+dx} cy={95+dy} r="3.5" fill={hi}/>
          </g>
        ))}
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">다섯 손가락 모두 펼침</text>
        <text x="80" y="182" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">손바닥이 앞(상대방)</text>
      </svg>
    ),
    /* 6: 엄지+검지 겹치기, 손등이 밖 */
    n32: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/><Hand cx="80" cy="95"/>
        {/* index up */}
        <line x1="78" y1="87" x2="74" y2="68" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="73" cy="65" r="3.5" fill={hi}/>
        {/* thumb crossing over */}
        <line x1="72" y1="93" x2="58" y2="91" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="55" cy="90" r="3.5" fill={hi}/>
        <circle cx="73" cy="87" r="4" fill={hi} opacity="0.4"/>
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">엄지+검지 겹치기</text>
        <text x="80" y="182" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">손등이 밖(상대방)</text>
      </svg>
    ),
    /* 7: 엄지+검지+중지 겹치기, 손등이 밖 */
    n33: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/><Hand cx="80" cy="95"/>
        {/* index */}
        <line x1="76" y1="87" x2="70" y2="68" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="69" cy="65" r="3.5" fill={hi}/>
        {/* middle */}
        <line x1="82" y1="86" x2="82" y2="67" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="82" cy="64" r="3.5" fill={hi}/>
        {/* thumb crossing over */}
        <line x1="72" y1="93" x2="56" y2="91" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="53" cy="90" r="3.5" fill={hi}/>
        <circle cx="77" cy="87" r="4" fill={hi} opacity="0.4"/>
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">엄지+검지+중지 겹치기</text>
        <text x="80" y="182" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">손등이 밖(상대방)</text>
      </svg>
    ),
    /* 8: 엄지+검지+중지+약지 겹치기, 손등이 밖 */
    n34: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/><Hand cx="80" cy="95"/>
        {/* index */}
        <line x1="74" y1="87" x2="68" y2="68" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="67" cy="65" r="3.5" fill={hi}/>
        {/* middle */}
        <line x1="80" y1="86" x2="79" y2="66" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="79" cy="63" r="3.5" fill={hi}/>
        {/* ring */}
        <line x1="86" y1="87" x2="88" y2="68" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="89" cy="65" r="3.5" fill={hi}/>
        {/* thumb crossing over */}
        <line x1="72" y1="93" x2="55" y2="91" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="52" cy="90" r="3.5" fill={hi}/>
        <circle cx="80" cy="87" r="4" fill={hi} opacity="0.4"/>
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">엄지+검지+중지+약지 겹치기</text>
        <text x="80" y="182" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">손등이 밖(상대방)</text>
      </svg>
    ),
    /* 9: 다섯 손가락 모두, 손등이 밖 */
    n35: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/><Hand cx="80" cy="95" r="11"/>
        {/* all 5 fingers, back of hand toward viewer */}
        {[[-16,-26],[-8,-28],[0,-28],[8,-28],[18,-22]].map(([dx,dy],i) => (
          <g key={i}>
            <line x1={80+dx*0.3} y1={95+dy*0.3} x2={80+dx} y2={95+dy} stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx={80+dx} cy={95+dy} r="3.5" fill={hi}/>
          </g>
        ))}
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">다섯 손가락 모두</text>
        <text x="80" y="182" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">손등이 밖(상대방)</text>
      </svg>
    ),
    /* 10: 양손 검지 X자 교차 */
    n36: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/><Hand cx="80" cy="95"/>
        {/* bent index tip suggestion */}
        <line x1="80" y1="86" x2="80" y2="72" stroke={hi} strokeWidth="3" strokeLinecap="round"/>
        <line x1="80" y1="72" x2="88" y2="65" stroke={hi} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="90" cy="63" r="3.5" fill={hi}/>
        {/* left-right shake */}
        <line x1="62" y1="93" x2="98" y2="93" stroke={hi} strokeWidth="1.5"
          strokeDasharray="3 2" opacity="0.5"/>
        <text x="80" y="170" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">검지 구부려 끝이 밖</text>
        <text x="80" y="182" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">좌우로 살짝 흔들기</text>
      </svg>
    ),
    d37: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body/>
        <Hand cx="80" cy="62"/>
        <MArrow id="d37" d="M80 75 L80 56" label="컵 모양으로 입으로 기울이기" anim="anim-repeat"/>
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
   STEPS DATA — keyed to signs.js IDs
──────────────────────────────────────────────────────────── */
const SIGN_STEPS = {
  g01: ['오른손 바닥을 펴서 왼쪽 관자놀이 부근에서 아래로 부드럽게 쓸어내립니다.', '양손을 주먹 쥐고 가슴 앞에서 가볍게 아래로 내리며 멈춥니다.'],
  g02: ['왼손을 가슴 높이에서 손바닥이 아래로 향하게 눕힙니다.', '오른손 날을 세워 왼 손등 위를 가볍게 두 번 두드립니다.'],
  g12: ['오른손 엄지와 검지를 붙여 O형(OK 모양)을 만들고 이마에 댑니다.', '손을 떼어 가슴 앞쪽 아래로 내립니다.', '왼손등 위를 오른손으로 톡톡 두드리거나 살짝 얹습니다.'],
  g13: ['오른손의 주먹을 쥔 상태에서 새끼손가락만 폅니다.', '핀 새끼손가락 끝을 턱 아래쪽에 위치시킵니다.', '턱 아래를 가볍게 두 번 톡톡 건드립니다.', '상대방에게 안심을 주는 부드러운 미소를 함께 짓습니다.'],
  g14: ['엄지와 검지를 펴고 가슴 높이에서 엄지를 아래로 향합니다.', '손을 짧게 아래로 내립니다.'],
  e01: ['왼 주먹의 엄지를 펴서 바닥이 밖으로 향하게 세웁니다.', '오른 손바닥을 세워 왼 손등에 두 번 댑니다.'],
  e02: ['오른손 검지를 펴서 입 앞에 세웁니다. 손등이 밖을 향하게 합니다.', '앞쪽으로 내밀며 정보를 전달하는 느낌으로 움직입니다.'],
  e03: ['오른손을 C자 모양으로 구부립니다.', '구부린 손가락 끝으로 가슴을 가볍게 두 번 두드립니다.'],
  m01: ['왼 손등이 밖을 향하게 하고 오른손 V형(검지+중지)으로 두 번 칩니다.', '왼손을 주먹 쥐고 손목 옆면을 다시 두 번 칩니다.'],
  m02: ['오른 손바닥을 위로 향하게 하여 살짝 오므립니다.', '가슴이나 배 앞에서 좌우로 가볍게 흔듭니다.'],
  m03: ['왼 손바닥을 펴서 위로 향하게 합니다.', '오른손 검지(1형)로 손바닥 위를 앞뒤로 문지릅니다.'],
  m04: ['오른 손바닥을 이마에 가볍게 댔다 뗍니다.', '그대로 이동해 왼 손바닥 위에 가볍게 댑니다.'],
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
  f23: ['오른 주먹의 엄지 부분을 코에 가볍게 갖다 댑니다.'],
  f24: ['오른손의 엄지와 검지를 펴서 약간 구부립니다.', '구부린 손가락 끝을 턱에 갖다 댑니다.', '손을 밖으로 살짝 흔들거나 떼며 거부·불만을 표현합니다.', '찡그린 표정이나 고개를 살짝 젓는 동작을 함께 합니다.'],

  /* ══ 수 (Numbers) — CORRECTED ══ */
  nn27: ['검지만 위로 폅니다. 나머지는 접습니다.'],
  n28: ['검지와 중지를 폅니다.', '엄지·약지·소지는 접습니다.'],
  n29: ['검지·중지·약지를 폅니다.', '엄지와 소지는 접습니다.'],
  n30: ['검지·중지·약지·소지를 모두 폅니다.', '엄지만 접습니다.'],
  n31: ['엄지만 위로 세웁니다.', '나머지 손가락은 주먹 쥡니다.'],
  n32: ['엄지와 검지를 수직으로 폅니다.', '손등이 상대방을 향하게 합니다.'],
  n33: ['엄지·검지·중지를 수직으로 폅니다.', '손등이 상대방을 향하게 합니다.'],
  n34: ['엄지·검지·중지·약지를 수직으로 폅니다.', '손등이 상대방을 향하게 합니다.'],
  n35: ['다섯 손가락을 모두 수직으로 폅니다.', '손등이 상대방을 향하게 합니다.'],
  n36: ['오른손 주먹을 쥡니다.', '검지만 펴서 약간 구부립니다. 손가락 끝이 밖(상대방)을 향하게 합니다.', '손을 좌우로 살짝 흔듭니다.'],
  d37: ['손가락 끝을 모아 컵 모양을 만듭니다.', '컵을 마시는 동작처럼 입 쪽으로 기울입니다.'],
  b38: ['검지 또는 손으로 머리 부분을 가리킵니다.'],
  b39: ['검지로 눈 아래 또는 눈 주변을 가리킵니다.'],
}

/* ────────────────────────────────────────────────────────────
   DICTIONARY URLS
──────────────────────────────────────────────────────────── */
const DICT_URLS = {
  g01:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=안녕',
  g02:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=감사',
  g12:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=죄송',
  g13:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=괜찮다',
  g14:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=이름',
  e01:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=도움',
  e02:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=신고',
  e03:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=위험',
  m01:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=의사',
  m02:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=아프다',
  m03:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=약',
  m04:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=열',
  tr01: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=비자',
  tr02: 'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=여행',
  q15:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=무엇',
  q16:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=어디',
  q17:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=왜',
  q18:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=다시',
  a19:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=예',
  a26:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=아니',
  t20:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=어제',
  t21:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=지금',
  t22:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=내일',
  f23:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=좋다',
  f24:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=싫다',
  n27:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=일',
  n28:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=이',
  n29:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=삼',
  n30:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=사',
  n31:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=오',
  n32:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=육',
  n33:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=칠',
  n34:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=팔',
  n35:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=구',
  n36:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=십',
  d37:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=물',
  b38:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=머리',
  b39:  'https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=눈',
}

/* ────────────────────────────────────────────────────────────
   HAND SHAPE KEY per sign — CORRECTED for numbers
──────────────────────────────────────────────────────────── */
const HAND_SHAPES = {
  g01:  'bhand',
  g02:  'open',
  g12:  'flato',
  g13:  'pinky',
  g14:  'lhand',
  e01:  'thumb',
  e02:  'point1',
  e03:  'chand',
  m01:  'point2',
  m02:  'chand',
  m03:  'point1',
  m04:  'open',
  tr01: 'fist',
  tr02: 'point1',
  q15:  'point1',
  q16:  'point1',
  q17:  'point1',
  q18:  'point2',
  a19:  'open',
  a26:  'open',
  t20:  'point1',
  t21:  'thumbtwofinger', // 엄지+검지+중지, 손등이 위
  t22:  'point1',
  f23:  'fist',
  f24:  'dislikehand',    // 엄지+검지 구부려 턱에 대기
  /* ══ Numbers — CORRECTED ══ */
  n27:  'point1',      // 1: 검지만
  n28:  'point2',      // 2: 검지+중지 V형 (엄지 접음)
  n29:  'threefinger', // 3: 검지+중지+약지 (엄지·소지 접음)
  n30:  'fourfinger',  // 4: 검지+중지+약지+소지 (엄지만 접음)
  n31:  'thumb',        // 5: 다섯 손가락, 손바닥이 앞
  n32:  'sixhand',    // 6: 엄지+검지 겹치기
  n33:  'sevenhand',  // 7: 엄지+검지+중지 겹치기
  n34:  'eighthand',  // 8: 엄지+검지+중지+약지 겹치기
  n35:  'ninehand',   // 9: 다섯 손가락, 손등이 밖
  n36:  'point1',      // 10: 검지 교차 (양손)
  d37:  'flato',
  b38:  'point1',
  b39:  'point1',
}

const SHAPE_LABELS = {
  bhand:          'B형 편손',
  fist:           '주먹 S형',
  point1:         '1형 검지',
  point2:         'V형 (검지+중지)',
  threefinger:    '3형 (검지+중지+약지)',
  fourfinger:     '4형 (검지+중지+약지+소지)',
  open:           '5형 (편손)',
  thumb:     '엄지형 (수직)',
  ily:            'ILY형',
  yhand:          'Y형 (엄지+소지)',
  lhand:          'L형 (엄지+검지)',
  chand:          'C형',
  flato:          'F형 / O형 핀치',
  thumbtwofinger: '엄지+검지+중지 (손등이 위)',
  dislikehand:    '엄지+검지 구부림 (턱)',
  sixhand:   '6형 (엄지+검지, 손등이 밖)',
  sevenhand: '7형 (엄지+검지+중지, 손등이 밖)',
  eighthand: '8형 (엄지+검지+중지+약지, 손등이 밖)',
  ninehand:  '9형 (전체, 손등이 밖)',
  pinky:          '소지형 (새끼손가락)',
  bentindex:      '10형 (검지 구부림, 좌우 흔들기)',
}

/* ────────────────────────────────────────────────────────────
   MAIN EXPORT
──────────────────────────────────────────────────────────── */
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