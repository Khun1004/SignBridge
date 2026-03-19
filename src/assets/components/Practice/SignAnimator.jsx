/**
 * SignAnimator.jsx
 * Animated SVG diagrams for KSL gesture practice.
 *
 * Each sign gets:
 *  - Body silhouette showing hand position
 *  - Animated hand shape (correct finger configuration)
 *  - Movement arrow with CSS animation
 *  - Step-by-step numbered guide below
 *  - Direct link to 국립국어원 수어사전
 *
 * Usage:
 *   import SignAnimator from './SignAnimator'
 *   <SignAnimator signId="gs01" color="#7c6fff" />
 */

import './SignAnimator.css'

/* ─── body zone Y positions (in a 160×220 silhouette viewBox) ─── */
// head top=10, head bottom=52, chin=62, chest=90-130, navel=145

/* ────────────────────────────────────────────────────────────
   HAND SHAPE SVGs
   Each returns an <svg> at 56×68 natural size showing the
   correct finger configuration for that handshape name.
   Fingers that are EXTENDED are drawn with a bright stroke.
   Fingers that are BENT are drawn faded/short.
──────────────────────────────────────────────────────────── */
function HandSVG({ shape, color = '#7c6fff', size = 60 }) {
  const hi  = color          // highlight — extended fingers
  const lo  = '#d0cce8'      // muted — bent/closed fingers
  const sk  = '#fde8cc'      // skin fill
  const sk2 = '#f9d4a8'      // skin shadow

  const shapes = {

    /* B형 — 4 fingers up, thumb folded across palm */
    bhand: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        {/* palm */}
        <rect x="10" y="30" width="36" height="28" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        {/* thumb folded */}
        <rect x="8" y="38" width="12" height="16" rx="5" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* 4 fingers extended */}
        <rect x="10" y="4"  width="8" height="30" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="20" y="2"  width="8" height="32" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="30" y="3"  width="8" height="31" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="39" y="6"  width="7" height="28" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        {/* knuckle line */}
        <line x1="10" y1="30" x2="46" y2="30" stroke={lo} strokeWidth="1" strokeDasharray="2 2"/>
      </svg>
    ),

    /* 주먹 (S형) — all fingers curled, thumb over */
    fist: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="10" y="22" width="36" height="36" rx="8" fill={sk} stroke={hi} strokeWidth="2"/>
        {/* curled finger bumps */}
        <rect x="10" y="20" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="20" y="18" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="30" y="19" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="39" y="22" width="7"  height="9"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* thumb over */}
        <rect x="6"  y="30" width="14" height="10" rx="4" fill={sk} stroke={hi} strokeWidth="1.5"/>
      </svg>
    ),

    /* 1형 — only index extended */
    one: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="10" y="30" width="36" height="28" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        {/* curled fingers */}
        <rect x="10" y="26" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="30" y="27" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="39" y="28" width="7"  height="9"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* thumb */}
        <rect x="6"  y="36" width="12" height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* index extended — highlighted */}
        <rect x="19" y="2"  width="9"  height="32" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
      </svg>
    ),

    /* V형 — index + middle extended */
    two: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="10" y="30" width="36" height="28" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="10" y="26" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="38" y="27" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="6"  y="36" width="12" height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* index + middle extended */}
        <rect x="14" y="2"  width="9"  height="32" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        <rect x="25" y="2"  width="9"  height="32" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
      </svg>
    ),

    /* 5형 — all 5 extended */
    five: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="12" y="30" width="34" height="28" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        <rect x="12" y="4"  width="8"  height="30" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="22" y="2"  width="8"  height="32" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="32" y="3"  width="8"  height="31" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        <rect x="42" y="6"  width="7"  height="28" rx="4" fill={sk} stroke={hi} strokeWidth="2"/>
        {/* thumb out to side */}
        <rect x="2"  y="26" width="14" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2"/>
      </svg>
    ),

    /* ILY — thumb + index + pinky extended */
    ily: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="12" y="30" width="34" height="28" rx="6" fill={sk} stroke={lo} strokeWidth="1"/>
        {/* middle + ring curled */}
        <rect x="22" y="26" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="32" y="27" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* index extended */}
        <rect x="12" y="4"  width="8"  height="30" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        {/* pinky extended */}
        <rect x="42" y="6"  width="7"  height="28" rx="4" fill={sk} stroke={hi} strokeWidth="2.5"/>
        {/* thumb out */}
        <rect x="2"  y="26" width="14" height="10" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
      </svg>
    ),

    /* 엄지 위 — thumb up, fist */
    thumbup: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="12" y="30" width="34" height="28" rx="8" fill={sk} stroke={lo} strokeWidth="1.5"/>
        <rect x="12" y="26" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="22" y="24" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="32" y="25" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="40" y="27" width="7"  height="9"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* thumb pointing up */}
        <rect x="4"  y="6"  width="12" height="30" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
      </svg>
    ),

    /* 엄지 아래 — thumb down */
    thumbdown: (
      <svg width={size} height={size} viewBox="0 0 56 68" fill="none">
        <rect x="12" y="10" width="34" height="28" rx="8" fill={sk} stroke={lo} strokeWidth="1.5"/>
        <rect x="12" y="30" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="22" y="32" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="32" y="31" width="8"  height="10" rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        <rect x="40" y="29" width="7"  height="9"  rx="4" fill={sk2} stroke={lo} strokeWidth="1"/>
        {/* thumb pointing down */}
        <rect x="4"  y="32" width="12" height="30" rx="5" fill={sk} stroke={hi} strokeWidth="2.5"/>
      </svg>
    ),
  }

  return shapes[shape] || shapes['bhand']
}

/* ────────────────────────────────────────────────────────────
   BODY SILHOUETTE + ANIMATED MOVEMENT SVG
   viewBox 160×220 — head centred at ~31, body below
──────────────────────────────────────────────────────────── */
function BodyDiagram({ signId, color, animClass }) {
  const hi = color
  const bd = '#e2e0f0'   // body fill
  const sk = '#fde8cc'   // hand skin

  /* Common body parts */
  const Body = () => (
    <g>
      {/* head */}
      <ellipse cx="80" cy="32" rx="22" ry="26" fill={bd} stroke="#c8c4e0" strokeWidth="1"/>
      {/* neck */}
      <rect x="72" y="54" width="16" height="12" rx="3" fill={bd} stroke="#c8c4e0" strokeWidth="1"/>
      {/* torso */}
      <rect x="48" y="64" width="64" height="70" rx="10" fill={bd} stroke="#c8c4e0" strokeWidth="1"/>
      {/* shoulders */}
      <rect x="20" y="64" width="32" height="16" rx="6" fill={bd} stroke="#c8c4e0" strokeWidth="1"/>
      <rect x="108" y="64" width="32" height="16" rx="6" fill={bd} stroke="#c8c4e0" strokeWidth="1"/>
    </g>
  )

  /* Hand indicator — small filled circle with skin color */
  const Hand = ({ cx, cy, r = 9 }) => (
    <circle cx={cx} cy={cy} r={r} fill={sk} stroke={hi} strokeWidth="2.5"/>
  )

  const diagrams = {

    /* 안녕하세요 — B형 at temple, sweep forward-down */
    gs01: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body />
        {/* hand at temple */}
        <g className={animClass}>
          <Hand cx="112" cy="28" />
          <line x1="112" y1="28" x2="112" y2="28" stroke={hi} strokeWidth="2"/>
        </g>
        {/* movement arrow: down-forward */}
        <path d="M112 28 Q118 42 106 54" stroke={hi} strokeWidth="2.5" fill="none"
          strokeDasharray="5 3" className="anim-arrow-hello" markerEnd={`url(#arr-${signId})`}/>
        <defs>
          <marker id={`arr-${signId}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={hi}/>
          </marker>
        </defs>
        {/* label */}
        <text x="80" y="158" textAnchor="middle" fontSize="11" fill="#888" fontFamily="sans-serif">관자놀이 → 아래로</text>
      </svg>
    ),

    /* 감사합니다 — B형 at chin, push forward */
    gs02: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body />
        <g className={animClass}>
          <Hand cx="80" cy="70" />
        </g>
        <path d="M80 70 L80 70" stroke={hi} strokeWidth="2.5" fill="none" className="anim-arrow-forward"/>
        <path d="M80 70 L100 70" stroke={hi} strokeWidth="2.5" fill="none"
          strokeDasharray="5 3" className="anim-arrow-thankyou" markerEnd={`url(#arr-${signId})`}/>
        <defs>
          <marker id={`arr-${signId}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={hi}/>
          </marker>
        </defs>
        <text x="80" y="158" textAnchor="middle" fontSize="11" fill="#888" fontFamily="sans-serif">턱 아래 → 앞으로</text>
      </svg>
    ),

    /* 미안합니다 — 주먹 on chest, circular */
    gs03: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body />
        <g className="anim-circle-sorry">
          <Hand cx="80" cy="95" />
        </g>
        {/* circle path on chest */}
        <ellipse cx="80" cy="95" rx="16" ry="12" stroke={hi} strokeWidth="2"
          fill="none" strokeDasharray="6 3" className="anim-dash-rotate"/>
        <defs>
          <marker id={`arr-${signId}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={hi}/>
          </marker>
        </defs>
        <text x="80" y="158" textAnchor="middle" fontSize="11" fill="#888" fontFamily="sans-serif">가슴 위 원 그리기</text>
      </svg>
    ),

    /* 숫자 1 — index up, chest, still */
    gs04: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body />
        <Hand cx="80" cy="95" />
        <line x1="80" y1="95" x2="80" y2="72" stroke={hi} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="80" cy="69" r="4" fill={hi}/>
        <text x="80" y="158" textAnchor="middle" fontSize="11" fill="#888" fontFamily="sans-serif">가슴 앞 · 검지만 위로</text>
      </svg>
    ),

    /* 숫자 2 — V shape, chest */
    gs05: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body />
        <Hand cx="80" cy="95" />
        <line x1="76" y1="95" x2="72" y2="72" stroke={hi} strokeWidth="3" strokeLinecap="round"/>
        <line x1="84" y1="95" x2="88" y2="72" stroke={hi} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="72" cy="69" r="4" fill={hi}/>
        <circle cx="88" cy="69" r="4" fill={hi}/>
        <text x="80" y="158" textAnchor="middle" fontSize="11" fill="#888" fontFamily="sans-serif">V형 · 검지+중지</text>
      </svg>
    ),

    /* 숫자 5 — all fingers spread */
    gs06: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body />
        <Hand cx="80" cy="95" r="11"/>
        {[[-16,-26],[-8,-28],[0,-28],[8,-28],[18,-22]].map(([dx,dy],i) => (
          <g key={i}>
            <line x1={80+dx*0.3} y1={95+dy*0.3} x2={80+dx} y2={95+dy} stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx={80+dx} cy={95+dy} r="3.5" fill={hi}/>
          </g>
        ))}
        <text x="80" y="158" textAnchor="middle" fontSize="11" fill="#888" fontFamily="sans-serif">5형 · 손가락 모두 펴기</text>
      </svg>
    ),

    /* 도와주세요 — open palm, upward */
    gs07: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body />
        <g className="anim-rise-help">
          <Hand cx="80" cy="105" r="11"/>
          <line x1="80" y1="105" x2="80" y2="82" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        </g>
        <path d="M80 110 L80 82" stroke={hi} strokeWidth="2.5" fill="none"
          strokeDasharray="5 3" className="anim-arrow-up" markerEnd={`url(#arr-${signId})`}/>
        <defs>
          <marker id={`arr-${signId}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={hi}/>
          </marker>
        </defs>
        <text x="80" y="158" textAnchor="middle" fontSize="11" fill="#888" fontFamily="sans-serif">가슴 앞 → 위로</text>
      </svg>
    ),

    /* 사랑해요 — ILY, chest, still */
    gs08: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body />
        <Hand cx="80" cy="95" r="11"/>
        {/* pinky up */}
        <line x1="90" y1="92" x2="98" y2="74" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="98" cy="71" r="4" fill={hi}/>
        {/* index up */}
        <line x1="74" y1="90" x2="70" y2="70" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="70" cy="67" r="4" fill={hi}/>
        {/* thumb out */}
        <line x1="68" y1="98" x2="52" y2="96" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="49" cy="96" r="4" fill={hi}/>
        <text x="80" y="158" textAnchor="middle" fontSize="11" fill="#888" fontFamily="sans-serif">엄지+검지+소지 펴기</text>
      </svg>
    ),

    /* 좋아요 — thumb up */
    gs09: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body />
        <Hand cx="80" cy="100" />
        <line x1="72" y1="98" x2="62" y2="74" stroke={hi} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="62" cy="71" r="5" fill={hi}/>
        <path d="M80 100 L98 100" stroke={hi} strokeWidth="2" fill="none"
          strokeDasharray="4 3" className="anim-arrow-thumbup" markerEnd={`url(#arr-${signId})`}/>
        <defs>
          <marker id={`arr-${signId}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={hi}/>
          </marker>
        </defs>
        <text x="80" y="158" textAnchor="middle" fontSize="11" fill="#888" fontFamily="sans-serif">엄지 위 → 앞으로</text>
      </svg>
    ),

    /* 싫어요 — thumb down */
    gs10: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body />
        <Hand cx="80" cy="90" />
        <line x1="72" y1="92" x2="62" y2="112" stroke={hi} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="62" cy="115" r="5" fill={hi}/>
        <text x="80" y="158" textAnchor="middle" fontSize="11" fill="#888" fontFamily="sans-serif">엄지 아래</text>
      </svg>
    ),

    /* 예/네 — fist nod up-down */
    gs11: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body />
        <g className="anim-nod-yes">
          <Hand cx="80" cy="95" />
        </g>
        <path d="M80 88 L80 102" stroke={hi} strokeWidth="2" fill="none" strokeDasharray="4 3"/>
        <text x="80" y="158" textAnchor="middle" fontSize="11" fill="#888" fontFamily="sans-serif">주먹 위아래로</text>
      </svg>
    ),

    /* 아니요 — index, lateral shake */
    gs12: (
      <svg viewBox="0 0 160 220" className="body-svg">
        <Body />
        <g className="anim-shake-no">
          <Hand cx="80" cy="95" />
          <line x1="80" y1="95" x2="80" y2="74" stroke={hi} strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="80" cy="71" r="4" fill={hi}/>
        </g>
        <path d="M64 95 L96 95" stroke={hi} strokeWidth="2" fill="none" strokeDasharray="4 3"/>
        <text x="80" y="158" textAnchor="middle" fontSize="11" fill="#888" fontFamily="sans-serif">검지 좌우로</text>
      </svg>
    ),
  }

  return diagrams[signId] || diagrams['gs04']
}

/* ────────────────────────────────────────────────────────────
   STEPS DATA for each sign
──────────────────────────────────────────────────────────── */
const SIGN_STEPS = {
  gs01: ['오른손을 B형으로 만드세요\n(4손가락 붙여 펴기)', '손끝을 오른쪽\n관자놀이에 댑니다', '앞·아래로\n부드럽게 내립니다', '미소와 함께\n고개를 끄덕입니다'],
  gs02: ['오른손을 B형으로\n손바닥이 위를 향하게', '손끝을 턱 아래\n가까이 댑니다', '손을 앞으로\n내밀어 냅니다', '고개를 살짝\n숙입니다'],
  gs03: ['오른손을\n주먹(S형)으로 쥡니다', '손등이 앞을 향하게\n가슴 중앙에 댑니다', '시계 방향으로\n원을 1-2회 그립니다', '미안한 표정을\n함께 보여주세요'],
  gs04: ['검지만 세우고\n나머지는 주먹', '손바닥이\n앞을 향하게', '가슴 앞\n중앙에 위치', '정지 유지'],
  gs05: ['검지·중지만 펴고\n나머지는 접습니다', '두 손가락을\n자연스럽게 벌림', '손바닥이\n앞을 향하게', '가슴 앞\n중앙에서 정지'],
  gs06: ['다섯 손가락\n모두 펼치기', '손가락을\n자연스럽게 벌림', '손바닥이\n상대방 방향', '가슴 앞\n중앙에서 정지'],
  gs07: ['왼손 엄지를 세운\n주먹을 만듭니다', '오른손(편손)을\n왼손 아래에 댑니다', '두 손을\n함께 위로 올립니다', '긴박한 표정과\n눈썹 올리기'],
  gs08: ['엄지·검지·소지를 펴고\n중지·약지는 접기', '손바닥이\n상대방 방향', '가슴 앞에서\n정지 또는 흔들기', '진심 어린\n표정'],
  gs09: ['주먹에서\n엄지만 세우기', '엄지가 위를\n향하게', '가슴 앞에서\n앞으로 내밀기', '자신감 있는\n표정'],
  gs10: ['주먹에서\n엄지만 내리기', '엄지가 아래를\n향하게', '가슴 앞\n중앙에서 정지', '불만스러운\n표정 가능'],
  gs11: ['주먹을 쥡니다\n(S형)', '가슴 앞에\n위치', '손목으로\n위아래 끄덕이기', '고개도 함께\n끄덕입니다'],
  gs12: ['검지(또는 V형)를\n세웁니다', '가슴 앞\n중앙에 위치', '좌우로\n흔들기 2-3회', '표정도 함께\n부정적으로'],
}

/* ────────────────────────────────────────────────────────────
   KSL DICTIONARY URLS
   국립국어원 한국수어사전 search URL pattern
──────────────────────────────────────────────────────────── */
const DICT_URLS = {
  gs01: 'https://sldict.korean.go.kr/front/sign/signContentsView.do?current_pos_index=1&origin_pos_index=1&prev_pos=search&searchKeyword=안녕',
  gs02: 'https://sldict.korean.go.kr/front/sign/signContentsView.do?current_pos_index=1&origin_pos_index=1&prev_pos=search&searchKeyword=감사',
  gs03: 'https://sldict.korean.go.kr/front/sign/signContentsView.do?current_pos_index=1&origin_pos_index=1&prev_pos=search&searchKeyword=미안',
  gs04: 'https://sldict.korean.go.kr/front/sign/signContentsView.do?current_pos_index=1&origin_pos_index=1&prev_pos=search&searchKeyword=일',
  gs05: 'https://sldict.korean.go.kr/front/sign/signContentsView.do?current_pos_index=1&origin_pos_index=1&prev_pos=search&searchKeyword=이',
  gs06: 'https://sldict.korean.go.kr/front/sign/signContentsView.do?current_pos_index=1&origin_pos_index=1&prev_pos=search&searchKeyword=오',
  gs07: 'https://sldict.korean.go.kr/front/sign/signContentsView.do?current_pos_index=1&origin_pos_index=1&prev_pos=search&searchKeyword=도움',
  gs08: 'https://sldict.korean.go.kr/front/sign/signContentsView.do?current_pos_index=1&origin_pos_index=1&prev_pos=search&searchKeyword=사랑',
  gs09: 'https://sldict.korean.go.kr/front/sign/signContentsView.do?current_pos_index=1&origin_pos_index=1&prev_pos=search&searchKeyword=좋다',
  gs10: 'https://sldict.korean.go.kr/front/sign/signContentsView.do?current_pos_index=1&origin_pos_index=1&prev_pos=search&searchKeyword=싫다',
  gs11: 'https://sldict.korean.go.kr/front/sign/signContentsView.do?current_pos_index=1&origin_pos_index=1&prev_pos=search&searchKeyword=예',
  gs12: 'https://sldict.korean.go.kr/front/sign/signContentsView.do?current_pos_index=1&origin_pos_index=1&prev_pos=search&searchKeyword=아니',
}

/* Hand shape key per sign */
const HAND_SHAPES = {
  gs01: 'bhand', gs02: 'bhand', gs03: 'fist',
  gs04: 'one',   gs05: 'two',   gs06: 'five',
  gs07: 'five',  gs08: 'ily',   gs09: 'thumbup',
  gs10: 'thumbdown', gs11: 'fist', gs12: 'one',
}

/* ────────────────────────────────────────────────────────────
   MAIN EXPORT
──────────────────────────────────────────────────────────── */
export default function SignAnimator({ signId, color = '#7c6fff', compact = false }) {
  const steps   = SIGN_STEPS[signId]  || []
  const dictUrl = DICT_URLS[signId]   || 'https://sldict.korean.go.kr'
  const shape   = HAND_SHAPES[signId] || 'bhand'

  if (compact) {
    /* Used inside the camera overlay — just body diagram + steps */
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
      {/* Top row: body diagram + hand shape */}
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
            <div className="sa-hand-name">
              {{ bhand:'B형 편손', fist:'주먹 S형', one:'1형 검지', two:'V형', five:'5형', ily:'ILY형', thumbup:'엄지 위', thumbdown:'엄지 아래' }[shape]}
            </div>
          </div>
        </div>
      </div>

      {/* Step cards */}
      <div className="sa-steps">
        {steps.map((s, i) => (
          <div key={i} className="sa-step" style={{ '--sc': color }}>
            <div className="sa-step-num">{i + 1}</div>
            <div className="sa-step-text">{s.replace('\n', ' ')}</div>
          </div>
        ))}
      </div>

      {/* Dictionary link */}
      <a
        href={dictUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="sa-dict-link"
      >
        📖 국립국어원 수어사전에서 영상 보기 →
      </a>
    </div>
  )
}