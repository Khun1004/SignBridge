/**
 * SignLearnCard.jsx
 *
 * Replaces the fragmented two-column learn card with a unified
 * illustrated panel for every sign in the SIGNS database.
 *
 * Each card shows:
 *   ┌──────────────────────────────────┐
 *   │  HEADER: label · english · cat   │
 *   ├──────────────┬───────────────────┤
 *   │  ILLUSTRATION│  STEP STEPPER     │
 *   │  body + hand │  ① ② ③ ④        │
 *   │  + movement  │  active step text │
 *   │  animation   │                   │
 *   ├──────────────┴───────────────────┤
 *   │  5 PARAMETERS  (colour-coded)    │
 *   ├──────────────────────────────────┤
 *   │  ⚠️ COMMON MISTAKE               │
 *   └──────────────────────────────────┘
 *
 * Usage:
 *   import SignLearnCard from './SignLearnCard'
 *   <SignLearnCard sign={sign} isMastered={bool} onToggleMaster={fn} />
 */

import { useState } from 'react'
import './SignLearnCard.css'

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
   Larger, cleaner, with labels indicating which fingers
   are active vs. folded. Used directly in the illustration.
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

function HandIllustration({ shapeKey, color, size = 140 }) {
  const hi  = color
  const sk  = '#fde8cc'
  const sk2 = '#f5c896'
  const lo  = '#ddd'

  // Each shape: draw the palm + correct finger states + a label strip
  const shapes = {

    bhand: ( // B형: 4 fingers up, thumb tucked
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        <rect x="28" y="75" width="64" height="55" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        <rect x="16" y="82" width="22" height="38" rx="8" fill={sk2} stroke={lo} strokeWidth="1.5"/>
        {/* thumb folded across */}
        <rect x="17" y="95" width="20" height="14" rx="6" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* 4 fingers */}
        <rect x="28" y="10" width="14" height="70" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="44" y="6"  width="14" height="73" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="60" y="8"  width="14" height="71" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="75" y="14" width="13" height="66" rx="7" fill={sk} stroke={hi} strokeWidth="2.5"/>
        {/* knuckle line */}
        <line x1="28" y1="75" x2="88" y2="75" stroke={lo} strokeWidth="1.5" strokeDasharray="3 2"/>
        {/* finger labels */}
        <FingerLabel x="35" y="16" text="검" color={hi} active />
        <FingerLabel x="51" y="12" text="중" color={hi} active />
        <FingerLabel x="67" y="14" text="약" color={hi} active />
        <FingerLabel x="81" y="20" text="소" color={hi} active />
        <FingerLabel x="27" y="89" text="엄" color={hi} active={false} />
      </svg>
    ),

    fist: ( // 주먹 S형
      <svg width={size} height={size} viewBox="0 0 120 140" fill="none">
        <rect x="20" y="42" width="80" height="72" rx="14" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="20" y="36" width="76" height="22" rx="6" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* curled finger bumps */}
        <rect x="22" y="34" width="16" height="14" rx="6" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="40" y="30" width="16" height="14" rx="6" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="58" y="32" width="16" height="14" rx="6" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="74" y="36" width="14" height="12" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* thumb over fingers */}
        <rect x="10" y="52" width="24" height="18" rx="8" fill={sk} stroke={hi} strokeWidth="2"/>
        <text x="60" y="90" textAnchor="middle" fontSize="11" fill={hi} fontFamily="sans-serif" fontWeight="700">주먹 쥐기</text>
      </svg>
    ),

    point1: ( // 1형: index only
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        <rect x="28" y="75" width="64" height="55" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        {/* folded fingers */}
        <rect x="45" y="68" width="14" height="16" rx="6" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="61" y="70" width="14" height="14" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="76" y="72" width="13" height="12" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="16" y="82" width="22" height="30" rx="8" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* index extended — HIGHLIGHTED */}
        <rect x="29" y="8" width="15" height="70" rx="7" fill={sk} stroke={hi} strokeWidth="3"/>
        <circle cx="36" cy="14" r="5" fill={hi} opacity="0.3"/>
        <FingerLabel x="36" y="18" text="검" color={hi} active />
        <FingerLabel x="52" y="74" text="중" color={hi} active={false} />
        <FingerLabel x="68" y="76" text="약" color={hi} active={false} />
        <FingerLabel x="82" y="78" text="소" color={hi} active={false} />
      </svg>
    ),

    point2: ( // V형: index + middle
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        <rect x="28" y="78" width="64" height="52" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        <rect x="63" y="72" width="14" height="14" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="78" y="74" width="13" height="12" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="16" y="86" width="20" height="28" rx="7" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* index + middle extended */}
        <rect x="28" y="8"  width="15" height="73" rx="7" fill={sk} stroke={hi} strokeWidth="3"/>
        <rect x="45" y="6"  width="15" height="75" rx="7" fill={sk} stroke={hi} strokeWidth="3"/>
        <FingerLabel x="35" y="16" text="검" color={hi} active />
        <FingerLabel x="52" y="14" text="중" color={hi} active />
        <FingerLabel x="70" y="78" text="약" color={hi} active={false} />
        <FingerLabel x="85" y="80" text="소" color={hi} active={false} />
      </svg>
    ),

    open: ( // 5형: all fingers
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
      </svg>
    ),

    thumb: ( // 엄지 A형
      <svg width={size} height={size} viewBox="0 0 120 140" fill="none">
        <rect x="26" y="56" width="72" height="60" rx="12" fill={sk} stroke={lo} strokeWidth="1.5"/>
        <rect x="26" y="52" width="68" height="18" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* curled */}
        <rect x="28" y="48" width="14" height="12" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="44" y="44" width="14" height="12" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="60" y="46" width="14" height="12" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="75" y="50" width="12" height="10" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* THUMB UP */}
        <rect x="8"  y="8"  width="22" height="56" rx="10" fill={sk} stroke={hi} strokeWidth="3"/>
        <circle cx="19" cy="14" r="5" fill={hi} opacity="0.25"/>
        <FingerLabel x="19" y="18" text="엄" color={hi} active />
        <text x="60" y="100" textAnchor="middle" fontSize="11" fill={hi} fontFamily="sans-serif" fontWeight="700">엄지만 위로</text>
      </svg>
    ),

    ily: ( // ILY형: thumb + index + pinky
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        <rect x="28" y="78" width="64" height="52" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        {/* middle + ring folded */}
        <rect x="44" y="72" width="14" height="14" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="60" y="73" width="14" height="13" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* thumb + index + pinky extended */}
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

    yhand: ( // Y형: thumb + pinky
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        <rect x="28" y="78" width="64" height="52" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        <rect x="28" y="70" width="14" height="16" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="44" y="70" width="14" height="16" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="60" y="71" width="14" height="15" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* thumb + pinky */}
        <rect x="8"  y="56" width="22" height="42" rx="9" fill={sk} stroke={hi} strokeWidth="3"/>
        <rect x="76" y="12" width="13" height="70" rx="7" fill={sk} stroke={hi} strokeWidth="3"/>
        <FingerLabel x="19" y="62" text="엄" color={hi} active />
        <FingerLabel x="35" y="76" text="검" color={hi} active={false} />
        <FingerLabel x="51" y="76" text="중" color={hi} active={false} />
        <FingerLabel x="67" y="77" text="약" color={hi} active={false} />
        <FingerLabel x="82" y="20" text="소" color={hi} active />
      </svg>
    ),

    chand: ( // C형
      <svg width={size} height={size} viewBox="0 0 120 130" fill="none">
        <path d="M22 50 Q22 20 60 16 Q98 20 98 50 Q98 90 60 96 Q22 90 22 70 Z"
          fill={sk} stroke={hi} strokeWidth="2.5"/>
        <path d="M22 50 Q22 34 36 28" fill="none" stroke={lo} strokeWidth="2"/>
        <path d="M98 50 Q98 34 84 28" fill="none" stroke={lo} strokeWidth="2"/>
        <text x="60" y="58" textAnchor="middle" fontSize="11" fill={hi} fontFamily="sans-serif" fontWeight="700">C자 모양</text>
        <text x="60" y="74" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">손가락 살짝 굽히기</text>
      </svg>
    ),

    whand: ( // W형: index + middle + ring
      <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
        <rect x="28" y="78" width="64" height="52" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        <rect x="76" y="72" width="13" height="14" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="16" y="86" width="18" height="28" rx="7" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* 3 middle fingers extended */}
        <rect x="28" y="8"  width="14" height="73" rx="7" fill={sk} stroke={hi} strokeWidth="3"/>
        <rect x="44" y="6"  width="14" height="75" rx="7" fill={sk} stroke={hi} strokeWidth="3"/>
        <rect x="60" y="8"  width="14" height="73" rx="7" fill={sk} stroke={hi} strokeWidth="3"/>
        <FingerLabel x="35" y="16" text="검" color={hi} active />
        <FingerLabel x="51" y="14" text="중" color={hi} active />
        <FingerLabel x="67" y="16" text="약" color={hi} active />
        <FingerLabel x="82" y="78" text="소" color={hi} active={false} />
      </svg>
    ),

    flato: ( // F/O형: fingertips gathered
      <svg width={size} height={size} viewBox="0 0 120 140" fill="none">
        <rect x="26" y="68" width="68" height="52" rx="10" fill={sk} stroke={lo} strokeWidth="1.5"/>
        {/* gathered fingertips */}
        <path d="M36 68 Q60 40 84 68" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <circle cx="36" cy="68" r="7" fill={sk} stroke={hi} strokeWidth="2"/>
        <circle cx="60" cy="42" r="7" fill={sk} stroke={hi} strokeWidth="2"/>
        <circle cx="84" cy="68" r="7" fill={sk} stroke={hi} strokeWidth="2"/>
        <text x="60" y="100" textAnchor="middle" fontSize="11" fill={hi} fontFamily="sans-serif" fontWeight="700">끝 모으기 (O형)</text>
        <text x="60" y="115" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">다섯 손가락 끝 집기</text>
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
   Body silhouette + hand position + animated movement arrow
   for ALL 40 signs. Signs without a specific diagram get
   a clean generic body with location callout.
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
      {/* face features */}
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

  // Specific diagrams for signs with distinctive movements
  const specific = {
    // ── 인사 ──
    g01: ( // 안녕하세요
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="112" cy="34" color={color} label="관자놀이"/>
        <Arrow d="M112 34 Q118 52 105 64" color={color} animClass="mv-sweep-down"/>
        <text x="80" y="195" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">이마 옆 → 앞·아래</text>
      </svg>
    ),
    g02: ( // 감사합니다
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="80" cy="72" color={color} label="턱"/>
        <Arrow d="M80 72 L105 72" color={color} animClass="mv-push-forward"/>
        <text x="80" y="195" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">턱 아래 → 앞으로</text>
      </svg>
    ),
    g03: ( // 미안합니다
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <g className="mv-circle">
          <LocationDot cx="80" cy="100" color={color}/>
        </g>
        <ellipse cx="80" cy="100" rx="18" ry="13" stroke={color} strokeWidth="2"
          fill="none" strokeDasharray="6 3" className="mv-rotate-dash"/>
        <text x="80" y="195" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">가슴 위 원 그리기</text>
      </svg>
    ),
    g04: ( // 이름
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="80" cy="36" color={color} label="이마"/>
        <Arrow d="M80 36 L80 56" color={color} animClass="mv-sweep-down"/>
        <text x="80" y="195" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">이마에서 아래로</text>
      </svg>
    ),
    g05: ( // 반갑습니다
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="60" cy="92" color={color}/>
        <LocationDot cx="100" cy="92" color={color}/>
        <path d="M60 92 Q80 80 100 92 Q80 104 60 92" stroke={color} strokeWidth="2"
          fill="none" strokeDasharray="5 3" className="mv-push-forward"/>
        <text x="80" y="195" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">가슴 앞 교차</text>
      </svg>
    ),
    // ── 가족 ──
    f01: ( // 엄마
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="60" cy="88" color={color} label="왼쪽 가슴"/>
        <text x="80" y="195" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">왼쪽 가슴 (심장 쪽)</text>
      </svg>
    ),
    f02: ( // 아빠
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="100" cy="88" color={color} label="오른쪽 가슴"/>
        <text x="80" y="195" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">오른쪽 가슴</text>
      </svg>
    ),
    f03: ( // 형제/오빠
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="108" cy="74" color={color} label="오른쪽"/>
        <Arrow d="M108 74 L120 74" color={color} animClass="mv-push-forward"/>
        <text x="80" y="195" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">오른쪽 어깨 앞→앞</text>
      </svg>
    ),
    f04: ( // 언니/누나
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="52" cy="74" color={color} label="왼쪽"/>
        <Arrow d="M52 74 L40 74" color={color} animClass="mv-push-forward"/>
        <text x="80" y="195" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">왼쪽 어깨 앞→앞</text>
      </svg>
    ),
    // ── 긴급 ──
    e01: ( // 도와주세요
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <g className="mv-rise">
          <LocationDot cx="80" cy="110" color={color}/>
        </g>
        <Arrow d="M80 114 L80 86" color={color} animClass="mv-up-arrow"/>
        <text x="80" y="195" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">가슴 앞 → 위로</text>
      </svg>
    ),
    e02: ( // 병원
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        {/* arm reference */}
        <rect x="18" y="88" width="28" height="50" rx="8" fill={BODY_COLOR} stroke={BODY_STROKE} strokeWidth="1.5"/>
        {/* cross on arm */}
        <line x1="32" y1="102" x2="32" y2="118" stroke={color} strokeWidth="3" strokeLinecap="round" className="mv-draw-cross-v"/>
        <line x1="24" y1="110" x2="40" y2="110" stroke={color} strokeWidth="3" strokeLinecap="round" className="mv-draw-cross-h"/>
        <text x="80" y="195" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">팔 위에 십자 그리기</text>
      </svg>
    ),
    e03: ( // 위험
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <g className="mv-wave-danger">
          <LocationDot cx="55" cy="36" color={color}/>
          <LocationDot cx="105" cy="36" color={color}/>
        </g>
        <path d="M55 36 L105 36" stroke={color} strokeWidth="2" strokeDasharray="5 3"/>
        <text x="80" y="195" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">머리 위 양손 흔들기</text>
      </svg>
    ),
    e04: ( // 경찰
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <LocationDot cx="60" cy="88" color={color} label="배지"/>
        <rect x="52" y="80" width="16" height="16" rx="3" fill="none" stroke={color} strokeWidth="2"/>
        <path d="M56 88 L59 91 L65 85" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <text x="80" y="195" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">왼쪽 가슴 배지</text>
      </svg>
    ),
    e05: ( // 불
      <svg viewBox="0 0 160 200" className="slc-body-svg">
        <BodyBase/>
        <g className="mv-flame">
          <LocationDot cx="65" cy="116" color={color}/>
          <LocationDot cx="95" cy="116" color={color}/>
        </g>
        <Arrow d="M65 116 L65 90" color={color} animClass="mv-up-arrow"/>
        <Arrow d="M95 116 L95 90" color={color} animClass="mv-up-arrow"/>
        <text x="80" y="195" textAnchor="middle" fontSize="9" fill="#888" fontFamily="sans-serif">아래에서 위로 불꽃</text>
      </svg>
    ),
  }

  // Generic fallback — shows location zone from params.수위
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

  // movement hint arrow based on 수동 text
  const mov = sign.params.수동 || ''
  let arrowD = null
  if (mov.includes('위로') || mov.includes('올리')) arrowD = `M${zone.cx} ${zone.cy + 8} L${zone.cx} ${zone.cy - 16}`
  else if (mov.includes('아래로') || mov.includes('내리')) arrowD = `M${zone.cx} ${zone.cy - 8} L${zone.cx} ${zone.cy + 16}`
  else if (mov.includes('앞으로') || mov.includes('내밀')) arrowD = `M${zone.cx} ${zone.cy} L${zone.cx + 20} ${zone.cy}`
  else if (mov.includes('왼쪽')) arrowD = `M${zone.cx + 10} ${zone.cy} L${zone.cx - 10} ${zone.cy}`
  else if (mov.includes('오른쪽')) arrowD = `M${zone.cx - 10} ${zone.cy} L${zone.cx + 10} ${zone.cy}`

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

  const shapeKey = sign.params.수형.split(/[\s+]/)[0].replace('+','').trim()
  const catLabel = sign.cat
  const dictUrl  = `https://sldict.korean.go.kr/front/search/searchList.do?searchKeyword=${encodeURIComponent(sign.label)}`

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

        {/* Movement diagram */}
        <div className="slc-diagram-panel">
          <div className="slc-panel-label">위치 & 동작</div>
          <div className="slc-diagram-box">
            <MovementDiagram sign={sign} color={sign.color} />
          </div>
        </div>

        {/* Hand shape */}
        <div className="slc-hand-panel">
          <div className="slc-panel-label">손 모양</div>
          <div className="slc-hand-box">
            <HandIllustration shapeKey={shapeKey} color={sign.color} size={130} />
          </div>
          <div className="slc-shape-name">{sign.params.수형}</div>
        </div>

        {/* Step stepper */}
        <div className="slc-steps-panel">
          <div className="slc-panel-label">따라하기</div>
          <StepStepper steps={sign.steps} color={sign.color} />
        </div>
      </div>

      {/* ── 5 PARAMETERS ── */}
      <div className="slc-params">
        {Object.entries(sign.params).map(([k, v]) => {
          const m = PARAM_META[k]
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
        <div className="slc-note">{sign.notes}</div>
        <div className="slc-mistake">
          <span className="slc-mistake-icon">⚠️</span>
          <div>
            <div className="slc-mistake-title">흔한 실수</div>
            <div className="slc-mistake-body">{sign.commonMistake}</div>
          </div>
        </div>
      </div>
    </div>
  )
}