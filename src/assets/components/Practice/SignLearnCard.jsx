import { useState } from 'react'
import './SignLearnCard.css'
import { KNOWN_SHAPES } from './Utils.jsx'  // ← add to imports
/* ════════════════════════════════════════════════════════
   PARAM META
════════════════════════════════════════════════════════ */
const PARAM_META = {
  수형:  { label: '수형',  sub: '손 모양', color: '#7c6fff' },
  수위:  { label: '수위',  sub: '위치',    color: '#3b82f6' },
  수동:  { label: '수동',  sub: '움직임',  color: '#10b981' },
  수향:  { label: '수향',  sub: '방향',    color: '#f59e0b' },
  비수지:{ label: '비수지',sub: '표정·입', color: '#ec4899' },
}

/* ════════════════════════════════════════════════════════
   HAND SHAPE SVG LIBRARY
════════════════════════════════════════════════════════ */
function FingerLabel({ x, y, text, color, active }) {
  return (
    <g>
      <circle cx={x} cy={y} r={10} fill={active ? color : '#e8e6f8'} opacity={active ? 1 : 0.6}/>
      <text x={x} y={y + 4} textAnchor="middle" fontSize="8" fontWeight="700"
        fill={active ? '#fff' : '#aaa'} fontFamily="sans-serif">{text}</text>
    </g>
  )
}

export function HandIllustration({ shapeKey, color, size = 140 }) {
  const hi  = color
  const sk  = '#fde8cc'
  const sk2 = '#f5c896'
  const lo  = '#ddd'

  const shapes = {

    bhand: (
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        <rect x="28" y="75" width="64" height="55" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        <rect x="16" y="82" width="22" height="38" rx="8" fill={sk2} stroke={lo} strokeWidth="1.5"/>
        <rect x="17" y="95" width="20" height="14" rx="6" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="28" y="10" width="14" height="70" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="44" y="6"  width="14" height="73" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="60" y="8"  width="14" height="71" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="75" y="14" width="13" height="66" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <line x1="28" y1="75" x2="88" y2="75" stroke={lo} strokeWidth="1.5" strokeDasharray="3 2"/>
        <FingerLabel x="35" y="16" text="검" color={hi} active />
        <FingerLabel x="51" y="12" text="중" color={hi} active />
        <FingerLabel x="67" y="14" text="약" color={hi} active />
        <FingerLabel x="81" y="20" text="소" color={hi} active />
        <FingerLabel x="27" y="89" text="엄" color={hi} active={false} />
      </svg>
    ),

    fist: (
      <svg width={size} height={size} viewBox="0 0 120 140" fill="none">
        <rect x="20" y="42" width="80" height="72" rx="14" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="20" y="36" width="76" height="22" rx="6" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="22" y="34" width="16" height="14" rx="6" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="40" y="30" width="16" height="14" rx="6" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="58" y="32" width="16" height="14" rx="6" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="74" y="36" width="14" height="12" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="10" y="52" width="24" height="18" rx="8" fill={sk} stroke={hi} strokeWidth="2"/>
        <text x="60" y="90" textAnchor="middle" fontSize="11" fill={hi} fontFamily="sans-serif" fontWeight="700">주먹 쥐기</text>
      </svg>
    ),

    point1: (
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        <rect x="28" y="75" width="64" height="55" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        <rect x="45" y="68" width="14" height="16" rx="6" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="61" y="70" width="14" height="14" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="76" y="72" width="13" height="12" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="16" y="82" width="22" height="30" rx="8" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="29" y="8" width="15" height="70" rx="7" fill={sk} stroke={hi} strokeWidth="3"/>
        <FingerLabel x="36" y="18" text="검" color={hi} active />
        <FingerLabel x="52" y="74" text="중" color={hi} active={false} />
        <FingerLabel x="68" y="76" text="약" color={hi} active={false} />
        <FingerLabel x="82" y="78" text="소" color={hi} active={false} />
        <FingerLabel x="27" y="88" text="엄" color={hi} active={false} />
      </svg>
    ),

    /* ── 2: 검지+중지 V형, 손등이 밖 ── */
    point2: (
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        <rect x="28" y="78" width="64" height="52" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        {/* ring + pinky folded */}
        <rect x="63" y="72" width="14" height="14" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="78" y="74" width="13" height="12" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* thumb folded */}
        <rect x="16" y="86" width="20" height="28" rx="7" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* index + middle extended */}
        <rect x="28" y="8"  width="15" height="73" rx="7" fill={sk} stroke={hi} strokeWidth="3"/>
        <rect x="45" y="6"  width="15" height="75" rx="7" fill={sk} stroke={hi} strokeWidth="3"/>
        <FingerLabel x="35" y="16" text="검" color={hi} active />
        <FingerLabel x="52" y="14" text="중" color={hi} active />
        <FingerLabel x="70" y="78" text="약" color={hi} active={false} />
        <FingerLabel x="85" y="80" text="소" color={hi} active={false} />
        <FingerLabel x="26" y="92" text="엄" color={hi} active={false} />
        <text x="60" y="142" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">V형 · 손등이 밖</text>
      </svg>
    ),

    /* ── 3: 검지+중지+약지, 엄지·소지 접음 ── */
    threefinger: (
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        <rect x="22" y="78" width="70" height="52" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        {/* pinky folded */}
        <rect x="78" y="72" width="13" height="14" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* thumb folded */}
        <rect x="10" y="86" width="20" height="28" rx="7" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* index + middle + ring extended */}
        <rect x="24" y="8"  width="14" height="73" rx="7" fill={sk} stroke={hi} strokeWidth="3"/>
        <rect x="41" y="6"  width="14" height="75" rx="7" fill={sk} stroke={hi} strokeWidth="3"/>
        <rect x="58" y="8"  width="14" height="73" rx="7" fill={sk} stroke={hi} strokeWidth="3"/>
        <FingerLabel x="31" y="16" text="검" color={hi} active />
        <FingerLabel x="48" y="14" text="중" color={hi} active />
        <FingerLabel x="65" y="16" text="약" color={hi} active />
        <FingerLabel x="84" y="78" text="소" color={hi} active={false} />
        <FingerLabel x="20" y="92" text="엄" color={hi} active={false} />
        <text x="60" y="142" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">검·중·약 · 손등이 밖</text>
      </svg>
    ),

    /* ── 4: 검지+중지+약지+소지, 엄지만 접음 ── */
    fourfinger: (
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        <rect x="20" y="78" width="72" height="52" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        {/* thumb folded */}
        <rect x="8" y="86" width="20" height="28" rx="7" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* all four fingers extended */}
        <rect x="22" y="8"  width="14" height="73" rx="7" fill={sk} stroke={hi} strokeWidth="3"/>
        <rect x="39" y="6"  width="14" height="75" rx="7" fill={sk} stroke={hi} strokeWidth="3"/>
        <rect x="56" y="8"  width="14" height="73" rx="7" fill={sk} stroke={hi} strokeWidth="3"/>
        <rect x="72" y="12" width="13" height="69" rx="7" fill={sk} stroke={hi} strokeWidth="3"/>
        <FingerLabel x="29" y="16" text="검" color={hi} active />
        <FingerLabel x="46" y="14" text="중" color={hi} active />
        <FingerLabel x="63" y="16" text="약" color={hi} active />
        <FingerLabel x="78" y="20" text="소" color={hi} active />
        <FingerLabel x="18" y="92" text="엄" color={hi} active={false} />
        <text x="60" y="142" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">검·중·약·소 · 손등이 밖</text>
      </svg>
    ),

    open: (
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        <rect x="28" y="78" width="64" height="52" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        <rect x="10" y="82" width="22" height="42" rx="9" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="28" y="8"  width="14" height="73" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="44" y="5"  width="14" height="76" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="60" y="7"  width="14" height="74" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="75" y="12" width="13" height="69" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <FingerLabel x="17" y="88" text="엄" color={hi} active />
        <FingerLabel x="35" y="16" text="검" color={hi} active />
        <FingerLabel x="51" y="13" text="중" color={hi} active />
        <FingerLabel x="67" y="15" text="약" color={hi} active />
        <FingerLabel x="81" y="20" text="소" color={hi} active />
        <text x="60" y="142" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">5형 · 손바닥이 앞</text>
      </svg>
    ),

    thumb: (
      <svg width={size} height={size} viewBox="0 0 120 140" fill="none">
        <rect x="26" y="56" width="72" height="60" rx="12" fill={sk} stroke={lo} strokeWidth="1.5"/>
        <rect x="26" y="52" width="68" height="18" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="28" y="48" width="14" height="12" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="44" y="44" width="14" height="12" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="60" y="46" width="14" height="12" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="75" y="50" width="12" height="10" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="8"  y="8"  width="22" height="56" rx="10" fill={sk} stroke={hi} strokeWidth="3"/>
        <FingerLabel x="19" y="18" text="엄" color={hi} active />
        <text x="60" y="100" textAnchor="middle" fontSize="11" fill={hi} fontFamily="sans-serif" fontWeight="700">엄지만 위로</text>
      </svg>
    ),

    ily: (
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        <rect x="28" y="78" width="64" height="52" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        <rect x="44" y="72" width="14" height="14" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="60" y="73" width="14" height="13" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="8"  y="56" width="22" height="42" rx="9" fill={sk} stroke={hi} strokeWidth="3"/>
        <rect x="28" y="8"  width="14" height="73" rx="7" fill={sk} stroke={hi} strokeWidth="3"/>
        <rect x="76" y="12" width="13" height="70" rx="7" fill={sk} stroke={hi} strokeWidth="3"/>
        <FingerLabel x="19" y="62" text="엄" color={hi} active />
        <FingerLabel x="35" y="16" text="검" color={hi} active />
        <FingerLabel x="51" y="78" text="중" color={hi} active={false} />
        <FingerLabel x="67" y="79" text="약" color={hi} active={false} />
        <FingerLabel x="82" y="20" text="소" color={hi} active />
      </svg>
    ),

    yhand: (
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        <rect x="28" y="78" width="64" height="52" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        {/* index, middle, ring folded */}
        <rect x="28" y="70" width="14" height="16" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="44" y="70" width="14" height="16" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="60" y="71" width="14" height="15" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* thumb + pinky extended */}
        <rect x="8"  y="56" width="22" height="42" rx="9" fill={sk} stroke={hi} strokeWidth="3"/>
        <rect x="76" y="12" width="13" height="70" rx="7" fill={sk} stroke={hi} strokeWidth="3"/>
        <FingerLabel x="19" y="62" text="엄" color={hi} active />
        <FingerLabel x="35" y="76" text="검" color={hi} active={false} />
        <FingerLabel x="51" y="76" text="중" color={hi} active={false} />
        <FingerLabel x="67" y="77" text="약" color={hi} active={false} />
        <FingerLabel x="82" y="20" text="소" color={hi} active />
        <text x="60" y="142" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">Y형 엄지+소지</text>
      </svg>
    ),

    /* ── 지금 (t21): 엄지+검지+중지, 손등이 위 ── */
    thumbtwofinger: (
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        <rect x="24" y="78" width="68" height="52" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        {/* ring, pinky folded */}
        <rect x="68" y="70" width="14" height="16" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="82" y="72" width="13" height="14" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* thumb extended sideways */}
        <rect x="6"  y="62" width="18" height="36" rx="9" fill={sk} stroke={hi} strokeWidth="2.5"/>
        {/* index extended */}
        <rect x="24" y="8"  width="14" height="73" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        {/* middle extended */}
        <rect x="42" y="8"  width="14" height="73" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <FingerLabel x="15" y="68" text="엄" color={hi} active />
        <FingerLabel x="31" y="16" text="검" color={hi} active />
        <FingerLabel x="49" y="16" text="중" color={hi} active />
        <FingerLabel x="75" y="76" text="약" color={hi} active={false} />
        <FingerLabel x="89" y="78" text="소" color={hi} active={false} />
        <text x="60" y="142" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">엄지+검지+중지 · 손등이 위</text>
      </svg>
    ),

    /* ── 싫다 (f24): 엄지+검지 약간 구부려 턱에 대기 ── */
    dislikehand: (
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        <rect x="26" y="80" width="66" height="50" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        {/* middle, ring, pinky folded */}
        <rect x="48" y="72" width="14" height="16" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="64" y="73" width="14" height="15" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="78" y="74" width="13" height="14" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* index slightly curved - use path */}
        <path d="M26 78 Q28 50 36 30 Q42 16 44 28 Q42 56 36 78"
          fill={sk} stroke={hi} strokeWidth="2.5"/>
        {/* thumb curved outward */}
        <path d="M8 80 Q4 60 8 44 Q14 30 22 40 Q26 56 20 78"
          fill={sk} stroke={hi} strokeWidth="2.5"/>
        <FingerLabel x="14" y="50" text="엄" color={hi} active />
        <FingerLabel x="36" y="28" text="검" color={hi} active />
        <text x="60" y="142" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">엄지+검지 구부림 → 턱</text>
      </svg>
    ),

    /* ── 6: 엄지+검지 겹치기 (overlap, 손등이 밖) ── */
    sixhand: (
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        {/* palm */}
        <rect x="30" y="78" width="62" height="52" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        {/* middle, ring, pinky folded */}
        <rect x="46" y="70" width="14" height="16" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="62" y="71" width="14" height="15" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="77" y="73" width="13" height="13" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* index finger extended upward */}
        <rect x="30" y="10" width="14" height="70" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        {/* thumb extended, crossing OVER index (overlap) */}
        <rect x="15" y="70" width="15" height="32" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <FingerLabel x="37" y="18" text="검" color={hi} active />
        <FingerLabel x="22" y="70" text="엄" color={hi} active />
        <text x="60" y="142" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">엄지+검지 겹치기</text>
      </svg>
    ),

    /* ── 7: 엄지+검지+중지 겹치기 ── */
    sevenhand: (
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        {/* palm */}
        <rect x="26" y="78" width="66" height="52" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        {/* ring, pinky folded */}
        <rect x="64" y="70" width="14" height="16" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="78" y="72" width="13" height="14" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* index finger extended */}
        <rect x="26" y="10" width="14" height="70" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        {/* middle finger extended */}
        <rect x="44" y="10" width="14" height="70" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        {/* thumb extended, crossing over (overlap) */}
        <rect x="15" y="70" width="15" height="32" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <FingerLabel x="33" y="18" text="검" color={hi} active />
        <FingerLabel x="51" y="18" text="중" color={hi} active />
        <FingerLabel x="22" y="70" text="엄" color={hi} active />
        <text x="60" y="142" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">엄지+검지+중지 겹치기</text>
      </svg>
    ),

    /* ── 8: 엄지+검지+중지+약지 겹치기 ── */
    eighthand: (
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        {/* palm */}
        <rect x="22" y="78" width="70" height="52" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        {/* pinky folded */}
        <rect x="78" y="71" width="13" height="15" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* index finger */}
        <rect x="22" y="10" width="14" height="70" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        {/* middle finger */}
        <rect x="40" y="10" width="14" height="70" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        {/* ring finger */}
        <rect x="58" y="10" width="14" height="70" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        {/* thumb crossing over all three */}
        <rect x="10" y="70" width="15" height="32" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        {/* overlap cross indicator */}
        <FingerLabel x="29" y="18" text="검" color={hi} active />
        <FingerLabel x="47" y="18" text="중" color={hi} active />
        <FingerLabel x="65" y="18" text="약" color={hi} active />
        <FingerLabel x="17" y="70" text="엄" color={hi} active />
        <text x="60" y="142" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">엄지+검지+중지+약지 겹치기</text>
      </svg>
    ),

    /* ── 9: 다섯 손가락 모두, 손등이 밖 ── */
    ninehand: (
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        {/* palm — back of hand shown (손등이 밖) */}
        <rect x="22" y="78" width="70" height="52" rx="10" fill={sk2} stroke={hi} strokeWidth="2"/>
        {/* knuckle lines to indicate back of hand */}
        <line x1="30" y1="78" x2="30" y2="90" stroke={lo} strokeWidth="1.5"/>
        <line x1="46" y1="78" x2="46" y2="90" stroke={lo} strokeWidth="1.5"/>
        <line x1="62" y1="78" x2="62" y2="90" stroke={lo} strokeWidth="1.5"/>
        <line x1="78" y1="78" x2="78" y2="90" stroke={lo} strokeWidth="1.5"/>
        {/* all 5 fingers extended */}
        <rect x="8"  y="56" width="18" height="42" rx="8" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="22" y="10" width="14" height="70" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="38" y="7"  width="14" height="73" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="54" y="9"  width="14" height="71" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="70" y="14" width="13" height="66" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <FingerLabel x="17" y="62" text="엄" color={hi} active />
        <FingerLabel x="29" y="18" text="검" color={hi} active />
        <FingerLabel x="45" y="15" text="중" color={hi} active />
        <FingerLabel x="61" y="17" text="약" color={hi} active />
        <FingerLabel x="76" y="22" text="소" color={hi} active />
        <text x="60" y="142" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">5형 · 손등이 밖(상대방)</text>
      </svg>
    ),

    lhand: (
      <svg width={size} height={size} viewBox="0 0 420 340" fill="none">
        <rect x="148" y="118" width="68" height="110" rx="12" fill={sk} stroke={lo} strokeWidth="1.5"/>
        <rect x="88" y="138" width="64" height="68" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        <rect x="214" y="142" width="32" height="20" rx="9" fill={sk2} stroke={lo} strokeWidth="1.3"/>
        <rect x="214" y="166" width="32" height="20" rx="9" fill={sk2} stroke={lo} strokeWidth="1.3"/>
        <rect x="214" y="190" width="30" height="18" rx="8" fill={sk2} stroke={lo} strokeWidth="1.3"/>
        <rect x="214" y="100" width="120" height="26" rx="12" fill={sk} stroke={hi} strokeWidth="2.8"/>
        <rect x="310" y="103" width="18" height="16" rx="5" fill={sk2} stroke={lo} strokeWidth="0.8"/>
        <line x1="254" y1="101" x2="254" y2="125" stroke={lo} strokeWidth="1" opacity="0.6"/>
        <line x1="282" y1="101" x2="282" y2="125" stroke={lo} strokeWidth="1" opacity="0.6"/>
        <rect x="214" y="214" width="100" height="26" rx="12" fill={sk} stroke={hi} strokeWidth="2.8"/>
        <rect x="292" y="217" width="18" height="16" rx="5" fill={sk2} stroke={lo} strokeWidth="0.8"/>
        <line x1="250" y1="215" x2="250" y2="239" stroke={lo} strokeWidth="1" opacity="0.6"/>
        <line x1="274" y1="215" x2="274" y2="239" stroke={lo} strokeWidth="1" opacity="0.6"/>
        <text x="210" y="94" textAnchor="middle" fontSize="13" fill={hi} fontWeight="600" fontFamily="sans-serif">검지 →</text>
        <text x="210" y="254" textAnchor="middle" fontSize="13" fill={hi} fontWeight="600" fontFamily="sans-serif">엄지 →</text>
      </svg>
    ),

    chand: (
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        <rect x="24" y="30" width="54" height="70" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        <rect x="70" y="10" width="22" height="26" rx="8" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="72" y="38" width="22" height="24" rx="8" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="72" y="64" width="22" height="24" rx="8" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="70" y="88" width="20" height="22" rx="8" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="6"  y="54" width="22" height="22" rx="8" fill={sk} stroke={hi} strokeWidth="2.5"/>
      </svg>
    ),

    flato: (
      <svg width={size} height={size} viewBox="0 0 110 150" fill="none">
        <rect x="55" y="88" width="64" height="52" rx="7" fill={sk} stroke={lo} strokeWidth="1.5"/>
        <rect x="75" y="10" width="14" height="80" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="90" y="19" width="14" height="70" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="104" y="21" width="14" height="67" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <ellipse cx="60" cy="76" rx="13" ry="12" fill={sk} stroke={hi} strokeWidth="2.8"/>
        <ellipse cx="56" cy="76" rx="6.5" ry="6" fill={sk2} stroke="none"/>
        <FingerLabel x="82" y="15" text="중" color={hi} active />
        <FingerLabel x="97" y="18" text="약" color={hi} active />
        <FingerLabel x="112" y="22" text="소" color={hi} active />
        <text x="70" y="142" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">엄지+검지 O형 핀치</text>
      </svg>
    ),

    /* ── 7: 엄지+약지 ── */
    thumbring: (
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        <rect x="26" y="78" width="68" height="52" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        {/* index, middle, pinky folded */}
        <rect x="30" y="70" width="14" height="16" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="46" y="68" width="14" height="18" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="77" y="70" width="13" height="16" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* thumb extended */}
        <rect x="8" y="56" width="22" height="42" rx="9" fill={sk} stroke={hi} strokeWidth="3"/>
        {/* ring finger extended */}
        <rect x="62" y="8" width="14" height="73" rx="7" fill={sk} stroke={hi} strokeWidth="3"/>
        <FingerLabel x="19" y="62" text="엄" color={hi} active />
        <FingerLabel x="37" y="76" text="검" color={hi} active={false} />
        <FingerLabel x="53" y="74" text="중" color={hi} active={false} />
        <FingerLabel x="69" y="16" text="약" color={hi} active />
        <FingerLabel x="83" y="76" text="소" color={hi} active={false} />
        <text x="60" y="142" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">엄지+약지</text>
      </svg>
    ),

    /* ── 8: 엄지+중지 ── */
    thumbmiddle: (
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        <rect x="26" y="78" width="68" height="52" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        {/* index, ring, pinky folded */}
        <rect x="30" y="70" width="14" height="16" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="62" y="70" width="14" height="16" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="77" y="72" width="13" height="14" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* thumb extended */}
        <rect x="8" y="56" width="22" height="42" rx="9" fill={sk} stroke={hi} strokeWidth="3"/>
        {/* middle finger extended */}
        <rect x="46" y="8" width="14" height="73" rx="7" fill={sk} stroke={hi} strokeWidth="3"/>
        <FingerLabel x="19" y="62" text="엄" color={hi} active />
        <FingerLabel x="37" y="76" text="검" color={hi} active={false} />
        <FingerLabel x="53" y="16" text="중" color={hi} active />
        <FingerLabel x="69" y="76" text="약" color={hi} active={false} />
        <FingerLabel x="83" y="78" text="소" color={hi} active={false} />
        <text x="60" y="142" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">엄지+중지</text>
      </svg>
    ),

    pinky: (
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        <rect x="28" y="88" width="64" height="52" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        <rect x="35" y="76" width="13" height="16" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="50" y="75" width="13" height="16" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="65" y="75" width="13" height="16" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="16" y="94" width="16" height="25" rx="7" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="80" y="20" width="13" height="70" rx="6" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <FingerLabel x="87" y="20" text="소" color={hi} active />
      </svg>
    ),
  }

  return (
    <div className="slc-hand-wrap">
      {shapes[shapeKey] || shapes['open']}
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   MOVEMENT DIAGRAM
════════════════════════════════════════════════════════ */
const BODY_COLOR = '#e8e6f5'
const BODY_STROKE = '#c8c4e0'

function BodyBase() {
  return (
    <g>
      <ellipse cx="80" cy="36" rx="24" ry="28" fill={BODY_COLOR} stroke={BODY_STROKE} strokeWidth="1.5"/>
      <rect x="68" y="60" width="24" height="16" rx="4" fill={BODY_COLOR} stroke={BODY_STROKE} strokeWidth="1.5"/>
      <rect x="44" y="74" width="72" height="80" rx="12" fill={BODY_COLOR} stroke={BODY_STROKE} strokeWidth="1.5"/>
      <rect x="18" y="74" width="28" height="20" rx="7" fill={BODY_COLOR} stroke={BODY_STROKE} strokeWidth="1.5"/>
      <rect x="114" y="74" width="28" height="20" rx="7" fill={BODY_COLOR} stroke={BODY_STROKE} strokeWidth="1.5"/>
      <circle cx="71" cy="30" r="3" fill={BODY_STROKE}/>
      <circle cx="89" cy="30" r="3" fill={BODY_STROKE}/>
      <path d="M72 44 Q80 50 88 44" stroke={BODY_STROKE} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </g>
  )
}

function LocationDot({ cx, cy, color, label, animClass }) {
  return (
    <g className={animClass}>
      <circle cx={cx} cy={cy} r="12" fill={color} opacity="0.2"/>
      <circle cx={cx} cy={cy} r="7"  fill={color}/>
      {label && (
        <text x={cx + 14} y={cy + 4} fontSize="9" fill={color} fontFamily="sans-serif" fontWeight="700">{label}</text>
      )}
    </g>
  )
}

function Arrow({ d, color, animClass }) {
  const id = `arr-${Math.random().toString(36).slice(2, 7)}`
  return (
    <>
      <defs>
        <marker id={id} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={color}/>
        </marker>
      </defs>
      <path d={d} stroke={color} strokeWidth="2.5" fill="none" strokeDasharray="6 3"
        markerEnd={`url(#${id})`} className={animClass}/>
    </>
  )
}

function MovementDiagram({ sign, color }) {
  const id = sign.id

  const specific = {
    g01: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <g className="mv-stroke-sequence">
          <LocationDot cx="40" cy="110" color={color} animClass="mv-delay-1"/>
          <Arrow d="M40 110 L55 130" color={color} animClass="mv-sweep-diagonal"/>
        </g>
        <g className="mv-settle-sequence">
          <LocationDot cx="65" cy="140" color={color} animClass="mv-delay-2"/>
          <LocationDot cx="95" cy="140" color={color} animClass="mv-delay-2"/>
          <Arrow d="M65 140 L65 165" color={color} animClass="mv-drop-heavy"/>
          <Arrow d="M95 140 L95 165" color={color} animClass="mv-drop-heavy"/>
        </g>
        <text x="80" y="195" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">팔 쓸기 → 두 주먹 내리기</text>
      </svg>
    ),
    g02: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <rect x="44" y="96" width="36" height="10" rx="4" fill={BODY_COLOR} stroke={BODY_STROKE} strokeWidth="1.5"/>
        <LocationDot cx="80" cy="88" color={color}/>
        <Arrow d="M80 88 L80 96" color={color} animClass="mv-drop-heavy"/>
        <Arrow d="M80 88 L80 96" color={color} animClass="mv-drop-heavy mv-delay-1"/>
        <text x="80" y="195" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">오른손 날로 왼손 등 두드리기 ×2</text>
      </svg>
    ),
    g12: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="80" cy="20" color={color} label="이마"/>
        <rect x="36" y="114" width="40" height="10" rx="4" fill={BODY_COLOR} stroke={BODY_STROKE} strokeWidth="1.5"/>
        <LocationDot cx="56" cy="110" color={color} animClass="mv-delay-1"/>
        <Arrow d="M80 26 L60 108" color={color} animClass="mv-sweep-diagonal"/>
        <Arrow d="M56 104 L56 110" color={color} animClass="mv-drop-heavy mv-delay-2"/>
        <Arrow d="M56 104 L56 110" color={color} animClass="mv-drop-heavy mv-delay-3"/>
        <text x="80" y="170" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">O형 이마 → 내리기</text>
        <text x="80" y="182" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">→ 왼 손등 톡톡</text>
      </svg>
    ),
    g13: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="80" cy="62" color={color} label="턱"/>
        <Arrow d="M80 56 L80 62" color={color} animClass="mv-drop-heavy"/>
        <Arrow d="M80 56 L80 62" color={color} animClass="mv-drop-heavy mv-delay-1"/>
        <text x="80" y="182" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">소지로 턱 아래 톡톡</text>
      </svg>
    ),
    e01: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="80" cy="110" color={color}/>
        <Arrow d="M80 114 L80 86" color={color} animClass="mv-up-arrow"/>
        <text x="80" y="195" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">가슴 앞 → 위로</text>
      </svg>
    ),
    e02: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="80" cy="48" color={color} label="입"/>
        <Arrow d="M80 50 L80 38" color={color} animClass="mv-up-arrow"/>
        <Arrow d="M82 48 L100 46" color={color} animClass="mv-push-forward"/>
        <text x="80" y="195" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">검지 입 앞 → 앞으로 내밀기</text>
      </svg>
    ),
    e03: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="80" cy="95" color={color} label="가슴"/>
        <Arrow d="M80 82 L80 92" color={color} animClass="mv-drop-heavy"/>
        <Arrow d="M80 82 L80 92" color={color} animClass="mv-drop-heavy mv-delay-1"/>
        <text x="80" y="170" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">C형 손으로</text>
        <text x="80" y="182" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">가슴을 두 번 두드리기</text>
      </svg>
    ),
    e04: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="60" cy="88" color={color} label="배지"/>
        <rect x="52" y="80" width="16" height="16" rx="3" fill="none" stroke={color} strokeWidth="2"/>
        <path d="M56 88 L59 91 L65 85" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <text x="80" y="195" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">왼쪽 가슴 배지</text>
      </svg>
    ),
    e05: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="65" cy="116" color={color}/>
        <LocationDot cx="95" cy="116" color={color}/>
        <Arrow d="M65 116 L65 90" color={color} animClass="mv-up-arrow"/>
        <Arrow d="M95 116 L95 90" color={color} animClass="mv-up-arrow"/>
        <text x="80" y="195" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">아래에서 위로 불꽃</text>
      </svg>
    ),
    m01: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <rect x="28" y="108" width="38" height="12" rx="5" fill={BODY_COLOR} stroke={BODY_STROKE} strokeWidth="1.5"/>
        <LocationDot cx="47" cy="104" color={color} animClass="mv-delay-1"/>
        <Arrow d="M47 104 L47 108" color={color} animClass="mv-drop-heavy"/>
        <Arrow d="M47 104 L47 108" color={color} animClass="mv-drop-heavy mv-delay-1"/>
        <LocationDot cx="28" cy="118" color={color} animClass="mv-delay-2"/>
        <Arrow d="M28 112 L28 118" color={color} animClass="mv-drop-heavy mv-delay-2"/>
        <Arrow d="M28 112 L28 118" color={color} animClass="mv-drop-heavy mv-delay-3"/>
        <text x="80" y="170" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">V형: 손등 ×2</text>
        <text x="80" y="182" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">→ 손목 옆 ×2</text>
      </svg>
    ),
    m02: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="80" cy="110" color={color} label="가슴 앞"/>
        <Arrow d="M80 110 L60 110" color={color} animClass="mv-push-forward"/>
        <Arrow d="M60 110 L80 110" color={color} animClass="mv-push-forward mv-delay-1"/>
        <Arrow d="M80 110 L98 110" color={color} animClass="mv-push-forward mv-delay-2"/>
        <text x="80" y="170" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">손바닥 위로 오므려</text>
        <text x="80" y="182" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">좌우로 흔들기</text>
      </svg>
    ),
    m03: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <rect x="36" y="114" width="46" height="12" rx="5" fill={BODY_COLOR} stroke={BODY_STROKE} strokeWidth="1.5"/>
        <LocationDot cx="68" cy="110" color={color}/>
        <Arrow d="M68 110 L52 110" color={color} animClass="mv-push-forward"/>
        <Arrow d="M52 110 L68 110" color={color} animClass="mv-push-forward mv-delay-1"/>
        <text x="80" y="170" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">왼 손바닥 위에서</text>
        <text x="80" y="182" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">검지로 앞뒤 문지르기</text>
      </svg>
    ),
    m04: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="80" cy="20" color={color} label="이마"/>
        <rect x="36" y="114" width="40" height="10" rx="4" fill={BODY_COLOR} stroke={BODY_STROKE} strokeWidth="1.5"/>
        <LocationDot cx="56" cy="110" color={color} animClass="mv-delay-1"/>
        <Arrow d="M80 26 L60 108" color={color} animClass="mv-sweep-diagonal"/>
        <text x="80" y="170" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">이마 → 왼 손바닥</text>
        <text x="80" y="182" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">열 확인 동작</text>
      </svg>
    ),
    t21: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="55" cy="96" color={color}/>
        <LocationDot cx="105" cy="96" color={color}/>
        <Arrow d="M55 96 L55 114" color={color} animClass="mv-drop-heavy"/>
        <Arrow d="M105 96 L105 114" color={color} animClass="mv-drop-heavy mv-delay-1"/>
        <text x="80" y="158" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">엄지·검지·중지 펴고</text>
        <text x="80" y="170" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">손등 위·손끝 밖 → 아래로</text>
      </svg>
    ),
    tr02: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        {/* hands at shoulders, pointing back */}
        <LocationDot cx="30" cy="80" color={color} label="왼어깨"/>
        <LocationDot cx="130" cy="80" color={color} label="오른어깨"/>
        {/* left hand: arc outward and forward */}
        <path d="M30 80 Q14 96 22 112 Q32 126 50 114"
          stroke={color} strokeWidth="2" fill="none" strokeDasharray="5 3" className="mv-push-forward"/>
        <Arrow d="M44 118 L58 110" color={color} animClass="mv-push-forward"/>
        {/* right hand: mirrored arc */}
        <path d="M130 80 Q146 96 138 112 Q128 126 110 114"
          stroke={color} strokeWidth="2" fill="none" strokeDasharray="5 3" className="mv-push-forward mv-delay-1"/>
        <Arrow d="M116 118 L102 110" color={color} animClass="mv-push-forward mv-delay-1"/>
        <text x="80" y="158" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">양 어깨 뒤 → 원 그리며</text>
        <text x="80" y="170" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">앞으로 내밀기 ×2</text>
      </svg>
    ),

    /* ── Numbers: all static "hold" diagrams ── */
    n27: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="80" cy="96" color={color} label="가슴"/>
        <text x="80" y="160" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">검지만 위로</text>
        <text x="80" y="172" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">손등이 밖(상대방)</text>
      </svg>
    ),
    n28: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="80" cy="96" color={color} label="가슴"/>
        <text x="80" y="160" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">검지+중지 V형</text>
        <text x="80" y="172" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">손등이 밖(상대방)</text>
      </svg>
    ),
    n29: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="80" cy="96" color={color} label="가슴"/>
        <text x="80" y="160" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">검지+중지+약지</text>
        <text x="80" y="172" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">손등이 밖(상대방)</text>
      </svg>
    ),
    n30: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="80" cy="96" color={color} label="가슴"/>
        <text x="80" y="160" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">검지+중지+약지+소지</text>
        <text x="80" y="172" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">엄지만 접음 · 손등이 밖</text>
      </svg>
    ),
    n31: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="80" cy="96" color={color} label="가슴"/>
        <text x="80" y="160" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">엄지만 수직으로</text>
        <text x="80" y="172" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">나머지는 주먹</text>
      </svg>
    ),
    n32: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="80" cy="96" color={color} label="가슴"/>
        <text x="80" y="160" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">엄지+검지 겹치기</text>
        <text x="80" y="172" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">손등이 밖(상대방)</text>
      </svg>
    ),
    n33: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="80" cy="96" color={color} label="가슴"/>
        <text x="80" y="160" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">엄지+검지+중지 겹치기</text>
        <text x="80" y="172" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">손등이 밖(상대방)</text>
      </svg>
    ),
    n34: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="80" cy="96" color={color} label="가슴"/>
        <text x="80" y="160" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">엄지+검지+중지+약지 겹치기</text>
        <text x="80" y="172" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">손등이 밖(상대방)</text>
      </svg>
    ),
    n35: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="80" cy="96" color={color} label="가슴"/>
        <text x="80" y="160" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">다섯 손가락 모두</text>
        <text x="80" y="172" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">손등이 밖(상대방)</text>
      </svg>
    ),
    n36: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="80" cy="96" color={color} label="가슴"/>
        <Arrow d="M80 96 L62 92" color={color} animClass="mv-push-forward"/>
        <Arrow d="M80 96 L98 92" color={color} animClass="mv-push-forward mv-delay-1"/>
        <text x="80" y="160" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">검지 끝이 밖 · 좌우로</text>
        <text x="80" y="172" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">살짝 흔들기</text>
      </svg>
    ),

    f24: (
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        {/* hand at chin */}
        <LocationDot cx="80" cy="60" color={color} label="턱"/>
        {/* touch chin */}
        <Arrow d="M80 52 L80 58" color={color} animClass="mv-drop-heavy"/>
        {/* flick outward */}
        <Arrow d="M82 60 L106 54" color={color} animClass="mv-push-forward mv-delay-1"/>
        <text x="80" y="158" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">엄지+검지 구부려 턱에 댄 후</text>
        <text x="80" y="170" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">밖으로 흔들며 떼기</text>
      </svg>
    ),

  }

  const zoneMap = {
    '이마': { cx:80, cy:20, label:'이마' },
    '관자': { cx:108, cy:34, label:'관자' },
    '눈':   { cx:80, cy:28, label:'눈' },
    '코':   { cx:80, cy:36, label:'코' },
    '입':   { cx:80, cy:48, label:'입' },
    '귀':   { cx:108, cy:36, label:'귀' },
    '턱':   { cx:80, cy:62, label:'턱' },
    '가슴': { cx:80, cy:96, label:'가슴' },
    '머리': { cx:80, cy:24, label:'머리' },
    '팔':   { cx:32, cy:110, label:'팔' },
    '손':   { cx:80, cy:136, label:'손' },
    '몸':   { cx:80, cy:96,  label:'몸 앞' },
  }
  const locKey = Object.keys(zoneMap).find(k => (sign.params.수위 || '').includes(k))
  const zone   = locKey ? zoneMap[locKey] : { cx:80, cy:96, label:'가슴 앞' }

  const mov = sign.params.수동 || ''
  let arrowD = null
  if (mov.includes('위로') || mov.includes('올리')) arrowD = `M${zone.cx} ${zone.cy + 8} L${zone.cx} ${zone.cy - 16}`
  else if (mov.includes('아래로') || mov.includes('내리')) arrowD = `M${zone.cx} ${zone.cy - 8} L${zone.cx} ${zone.cy + 16}`
  else if (mov.includes('앞으로') || mov.includes('내밀')) arrowD = `M${zone.cx} ${zone.cy} L${zone.cx + 20} ${zone.cy}`

  return specific[id] || (
    <svg viewBox="0 0 160 200" className="slc-body-svg">
      <BodyBase/>
      <LocationDot cx={zone.cx} cy={zone.cy} color={color} label={zone.label}/>
      {arrowD && <Arrow d={arrowD} color={color} animClass="mv-push-forward"/>}
      <text x="80" y="192" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">{sign.params.수위}</text>
    </svg>
  )
}

/* ════════════════════════════════════════════════════════
   STEP STEPPER
════════════════════════════════════════════════════════ */
function StepStepper({ steps, color }) {
  const [active, setActive] = useState(0)
  return (
    <div className="slc-stepper">
      <div className="slc-step-dots">
        {steps.map((_, i) => (
          <button
            key={i}
            className={`slc-step-dot ${i === active ? 'active' : ''}`}
            style={i === active ? { background: color, borderColor: color } : {}}
            onClick={() => setActive(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div className="slc-step-body" style={{ borderLeftColor: color }}>
        <div className="slc-step-num-label" style={{ color }}>
          Step {active + 1} / {steps.length}
        </div>
        <div className="slc-step-text">{steps[active]}</div>
      </div>
      <div className="slc-step-nav">
        <button
          className="slc-nav-btn"
          onClick={() => setActive(a => Math.max(0, a - 1))}
          disabled={active === 0}
        >← 이전</button>
        <button
          className="slc-nav-btn primary"
          style={active < steps.length - 1 ? { background: color, borderColor: color } : {}}
          onClick={() => setActive(a => Math.min(steps.length - 1, a + 1))}
          disabled={active === steps.length - 1}
        >다음 →</button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   MAIN EXPORT
════════════════════════════════════════════════════════ */
export default function SignLearnCard({ sign, isMastered, onToggleMaster }) {
  if (!sign) return null

  const KNOWN_SHAPES = new Set([
    'fist','open','point1','point2','thumb','ily','bhand','chand','flato',
    'yhand','lhand','thumbring','thumbmiddle','pinky','threefinger','fourfinger',
    'sixhand','sevenhand','eighthand','ninehand','thumbtwofinger','dislikehand',
  ])
  const shapeKeys = sign.params.수형
    .split(/[+→]/)
    .map(s => s.trim().toLowerCase().split(/[\s(]/)[0])
    .filter(s => KNOWN_SHAPES.has(s))
  const safeShapeKeys = shapeKeys.length > 0 ? shapeKeys : ['open']

  const dictUrl = `https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=${encodeURIComponent(sign.label)}`

  return (
    <div className="slc-card" style={{ '--sc': sign.color }}>

      {/* ── HEADER ── */}
      <div className="slc-header">
        <div className="slc-header-left">
          <div className="slc-label">{sign.label}</div>
          <div className="slc-english">{sign.english}</div>
        </div>
        <div className="slc-header-right">
          <button
            className={`slc-master-btn ${isMastered ? 'mastered' : ''}`}
            onClick={onToggleMaster}
          >
            {isMastered ? '✅ 완료' : '☆ 완료'}
          </button>
          <a href={dictUrl} target="_blank" rel="noopener noreferrer" className="slc-dict-btn">
            📹 영상
          </a>
        </div>
      </div>

      {/* ── VISUAL ZONE ── */}
      <div className="slc-visual">

        <div className="slc-diagram-panel">
          <div className="slc-panel-label">위치 &amp; 동작</div>
          <div className="slc-diagram-box">
            <MovementDiagram sign={sign} color={sign.color} />
          </div>
        </div>

        <div className="slc-hand-panel">
          <div className="slc-panel-label">손 모양</div>
          <div className="slc-hand-box" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {safeShapeKeys.map((key, idx) => (
              <div key={key + idx} style={{ textAlign: 'center' }}>
                <HandIllustration shapeKey={key} color={sign.color} size={safeShapeKeys.length > 1 ? 100 : 130} />
                {safeShapeKeys.length > 1 && (
                  <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
                    {idx === 0 ? '준비/진행' : '마무리'}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="slc-shape-name">{sign.params.수형}</div>
        </div>

        <div className="slc-steps-panel">
          <div className="slc-panel-label">따라하기</div>
          <StepStepper steps={sign.steps} color={sign.color} />
        </div>
      </div>

      {/* ── 5 PARAMETERS ── */}
      <div className="slc-params">
        {Object.entries(sign.params).map(([k, v]) => {
          const m = PARAM_META[k]
          if (!m) return null
          return (
            <div key={k} className="slc-param" style={{ '--pc': m.color }}>
              <div className="slc-param-key">
                <span className="slc-param-label">{m.label}</span>
                <span className="slc-param-sub">{m.sub}</span>
              </div>
              <div className="slc-param-val">{v}</div>
            </div>
          )
        })}
      </div>

      {/* ── NOTE + MISTAKE ── */}
      <div className="slc-bottom">
        {sign.notes && <div className="slc-note">{sign.notes}</div>}
        {sign.commonMistake && (
          <div className="slc-mistake">
            <span className="slc-mistake-icon">⚠️</span>
            <div>
              <div className="slc-mistake-title">흔한 실수</div>
              <div className="slc-mistake-body">{sign.commonMistake}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}