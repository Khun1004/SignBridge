import { useState } from 'react'
import './DictPage.css'
import { SIGNS, CATEGORIES } from '../Practice/Practice'

const safeSigns = SIGNS || []
const safeCategories = CATEGORIES || []

/* ─────────────────────────────────────
   Claude API helper
───────────────────────────────────── */
async function callClaude(prompt, system = '') {
  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  }
  if (system) body.system = system
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',  // ← add this
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return data.content?.map(b => b.text || '').join('') || ''
}

/* ─────────────────────────────────────
   HANDSHAPE SVG (compact, reused)
───────────────────────────────────── */
function HandShapeSVG({ shape, color = '#7c6fff', size = 56 }) {
  const c = color
  const shapes = {
    point1: (<svg width={size} height={size} viewBox="0 0 80 100"><rect x="30" y="50" width="20" height="40" rx="4" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/><rect x="10" y="60" width="18" height="30" rx="4" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/><rect x="52" y="62" width="18" height="28" rx="4" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/><rect x="10" y="58" width="60" height="18" rx="6" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/><rect x="28" y="5" width="22" height="50" rx="8" fill="#ffd4a8" stroke={c} strokeWidth="2.5"/><rect x="7" y="55" width="12" height="10" rx="4" fill="#ffc890"/></svg>),
    open:   (<svg width={size} height={size} viewBox="0 0 80 110"><rect x="20" y="58" width="40" height="22" rx="6" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/><rect x="7" y="55" width="15" height="25" rx="5" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/><rect x="18" y="5" width="14" height="42" rx="6" fill="#ffd4a8" stroke={c} strokeWidth="2"/><rect x="31" y="3" width="14" height="44" rx="6" fill="#ffd4a8" stroke={c} strokeWidth="2"/><rect x="44" y="4" width="14" height="44" rx="6" fill="#ffd4a8" stroke={c} strokeWidth="2"/><rect x="57" y="7" width="13" height="40" rx="6" fill="#ffd4a8" stroke={c} strokeWidth="2"/></svg>),
    fist:   (<svg width={size} height={size} viewBox="0 0 80 90"><rect x="15" y="30" width="52" height="50" rx="10" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/><rect x="15" y="28" width="48" height="15" rx="5" fill="#ffc890" stroke="#e0a070" strokeWidth="1"/><rect x="7" y="38" width="15" height="28" rx="6" fill="#ffd4a8" stroke={c} strokeWidth="2"/></svg>),
    thumb:  (<svg width={size} height={size} viewBox="0 0 80 100"><rect x="18" y="40" width="46" height="48" rx="10" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/><rect x="18" y="38" width="44" height="14" rx="4" fill="#ffc890" stroke="#e0a070" strokeWidth="1"/><rect x="30" y="5" width="18" height="40" rx="8" fill="#ffd4a8" stroke={c} strokeWidth="2.5"/></svg>),
    bhand:  (<svg width={size} height={size} viewBox="0 0 80 110"><rect x="20" y="42" width="42" height="22" rx="6" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/><rect x="7" y="50" width="15" height="22" rx="6" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/><rect x="18" y="5" width="14" height="42" rx="6" fill="#ffd4a8" stroke={c} strokeWidth="2"/><rect x="31" y="3" width="14" height="44" rx="6" fill="#ffd4a8" stroke={c} strokeWidth="2"/><rect x="44" y="4" width="14" height="44" rx="6" fill="#ffd4a8" stroke={c} strokeWidth="2"/><rect x="57" y="7" width="13" height="40" rx="6" fill="#ffd4a8" stroke={c} strokeWidth="2"/></svg>),
    point2: (<svg width={size} height={size} viewBox="0 0 80 110"><rect x="26" y="68" width="34" height="20" rx="6" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/><rect x="10" y="62" width="18" height="14" rx="5" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1"/><rect x="25" y="5" width="16" height="55" rx="7" fill="#ffd4a8" stroke={c} strokeWidth="2.5"/><rect x="40" y="7" width="15" height="54" rx="7" fill="#ffd4a8" stroke={c} strokeWidth="2.5"/></svg>),
    flato:  (<svg width={size} height={size} viewBox="0 0 80 100"><path d="M38 28 Q38 15 45 12 Q52 15 52 28 Q52 38 45 40 Q38 38 38 28 Z" fill="#ffd4a8" stroke={c} strokeWidth="2"/><rect x="20" y="38" width="42" height="20" rx="6" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/><rect x="10" y="46" width="14" height="20" rx="5" fill="#ffd4a8" stroke={c} strokeWidth="1.5"/><rect x="20" y="52" width="42" height="28" rx="8" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/></svg>),
    chand:  (<svg width={size} height={size} viewBox="0 0 80 90"><path d="M15 45 Q15 25 40 20 Q65 25 65 45 Q65 75 40 80 Q15 75 15 55 Z" fill="#ffd4a8" stroke={c} strokeWidth="2" fillOpacity="0.9"/></svg>),
    whand:  (<svg width={size} height={size} viewBox="0 0 80 110"><rect x="20" y="70" width="40" height="20" rx="6" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/><rect x="18" y="5" width="14" height="58" rx="7" fill="#ffd4a8" stroke={c} strokeWidth="2"/><rect x="32" y="3" width="14" height="58" rx="7" fill="#ffd4a8" stroke={c} strokeWidth="2"/><rect x="46" y="5" width="14" height="58" rx="7" fill="#ffd4a8" stroke={c} strokeWidth="2"/></svg>),
    yhand:  (<svg width={size} height={size} viewBox="0 0 80 110"><rect x="22" y="60" width="36" height="22" rx="6" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/><rect x="10" y="5" width="16" height="44" rx="7" fill="#ffd4a8" stroke={c} strokeWidth="2"/><rect x="56" y="20" width="13" height="36" rx="6" fill="#ffd4a8" stroke={c} strokeWidth="2"/></svg>),
  }
  return shapes[shape] || shapes['open']
}

/* ─────────────────────────────────────
   Safe shape key extractor
───────────────────────────────────── */
function getShapeKey(수형 = '') {
  const key = 수형.split(' ')[0].replace('+', '').trim()
  const valid = ['point1','point2','whand','bhand','open','fist','thumb','flato','chand','yhand']
  return valid.includes(key) ? key : 'open'
}

/* ═══════════════════════════════════════════
   TOOL 1 — 수어 어순 변환기
═══════════════════════════════════════════ */
function SentenceBuilder() {
  const [input,   setInput]   = useState('')
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState([])
  const [error,   setError]   = useState('')

  const SYSTEM = `당신은 한국수어(KSL) 언어학 전문가입니다.
목표는 한국어 문장을 자연스럽고 실제적인 한국수어 어순으로 변환하는 것입니다.

[핵심 규칙]

1. 한국수어는 조사(은/는/이/가/을/를 등)를 사용하지 않는다 → 반드시 제거
2. 기본 어순: 주제 → 시간 → 장소 → 대상 → 동작/상태
3. 감정/형용사는 문장 뒤쪽에 배치 (예: 좋다, 나쁘다 등)
4. 불필요한 단어(너무, 정말 등)는 생략하거나 의미 중심으로 단순화
5. "~요", "~습니다" 같은 존댓말 어미 제거
6. 질문 문장은 끝에 "질문" 또는 의문 표현으로 명확히 표시
7. 1인칭/2인칭(나, 너)은 필요할 때만 사용 (생략 가능)
8. 동사는 원형 형태로 변환 (예: 좋아요 → 좋다)
9. 의미 단위 중심으로 재구성 (직역 금지)
10. 실제 수어 사용자가 이해하기 쉬운 자연스러운 표현으로 변환
11. 시간 표현은 항상 문장 앞쪽에 위치 (예: 오늘, 어제 등)
12. 장소 표현은 시간 다음에 위치
13. 수어는 시각적 흐름이 중요하므로 짧고 명확하게 구성
14. 같은 의미 반복 금지 (중복 단어 제거)
15. 자연스러운 KSL 패턴 우선 (교과서식보다 실제 사용 중심)

[검증 규칙]

- 출력 전에 다음을 확인:
  1. 조사 포함 여부 → 있으면 제거
  2. 동사 원형 여부
  3. 어순이 "주제 → 시간 → 장소 → 대상 → 동작"인지 확인
  4. 불필요한 단어 제거 여부

[예시]

입력: "나는 밥을 먹어요"
출력:
{
  "ksl_order": ["나", "밥", "먹다"],
  "gloss": "나 밥 먹다",
  "removed_elements": ["조사 제거", "먹어요 → 먹다"],
  "explanation": "조사를 제거하고 동사를 원형으로 변환합니다. KSL은 핵심 의미 중심으로 표현합니다.",
  "tips": ["조사를 제거하세요", "동사는 원형으로"],
  "nonManual": "자연스러운 표정 유지"
}

입력: "어디 가세요?"
출력:
{
  "ksl_order": ["어디", "가다", "질문"],
  "gloss": "어디 가다 질문",
  "removed_elements": ["세요 제거"],
  "explanation": "의문문은 끝에 질문 표현을 추가합니다.",
  "tips": ["질문은 끝에 표시하세요"],
  "nonManual": "눈썹을 올려 질문 표현"
}
[출력 형식 — 반드시 JSON]
{
"ksl_order": ["단어1", "단어2", "..."],
"gloss": "단어들을 공백으로 연결한 형태",
"removed_elements": ["삭제된 요소 설명"],
"explanation": "어순 변화 이유를 간단히 2문장으로 설명",
"tips": ["학습 팁 1", "학습 팁 2"],
"nonManual": "표정, 눈썹, 입 모양 등 비수지 신호 설명"
}

[중요]

* 반드시 JSON만 출력 (설명문, 마크다운, 코드블록 금지)
* 자연스러운 KSL 표현이 최우선
* 한국어 문장을 그대로 유지하지 말고 반드시 수어 구조로 변환

입력 문장:
`

  const convert = async () => {
    if (!input.trim()) return
    setLoading(true); setResult(null); setError('')
    try {
      const raw = await callClaude(`한국어 문장: "${input.trim()}"`, SYSTEM)
      
      // FIX: extract JSON more robustly
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error('No JSON found in response:', raw)
        setError('AI 응답 형식 오류 (JSON)')
        setLoading(false)
        return
      }

      let parsed
      try {
        parsed = JSON.parse(jsonMatch[0])
      } catch (e) {
        console.error('JSON parse failed:', jsonMatch[0])
        setError('AI 응답 형식 오류 (JSON)')
        setLoading(false)
        return
      }
      setResult(parsed)
    } catch (e) {
      console.error('API error:', e)
      setError('변환 중 오류가 발생했습니다. 다시 시도해 주세요.')
    }
    setLoading(false)
  }

  const saveResult = () => {
    if (!result) return
    setSaved(s => [{ input, result, id: Date.now() }, ...s.slice(0, 4)])
  }

  return (
    <div className="tool-panel">
      <div className="tool-header">
        <span className="tool-icon-lg">🔄</span>
        <div>
          <h3 className="tool-title">수어 어순 변환기</h3>
          <p className="tool-desc">한국어 문장 → 한국수어(KSL) 어순으로 변환</p>
        </div>
      </div>

      <div className="sb-input-row">
        <input
          className="sb-input"
          type="text"
          placeholder="예: 오늘 날씨가 너무 좋아요"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && convert()}
          maxLength={80}
        />
        <button className="sb-btn" onClick={convert} disabled={loading || !input.trim()}>
          {loading ? <span className="btn-spinner" /> : '변환 →'}
        </button>
      </div>

      {error && <p className="tool-error">{error}</p>}

      {/* FIX: sb-gloss and all result content moved inside result guard */}
      {result && (
        <div className="sb-result">
          {/* KSL 어순 */}
          <div className="sb-order-section">
            <div className="sb-label">📌 KSL 어순</div>
            <div className="sb-tokens">
              {result.ksl_order?.map((word, i) => (
                <span key={i} className="sb-token">
                  {word}
                  {i < result.ksl_order.length - 1 && <span className="sb-arrow">→</span>}
                </span>
              ))}
            </div>
          </div>

          {/* Gloss — FIX: was outside result block, causing null crash */}
          <div className="sb-gloss">
            <span className="sb-label">📝 Gloss</span>
            <p>{result.gloss}</p>
          </div>

          {/* 설명 */}
          {result.explanation && (
            <div className="sb-explanation">
              <span className="sb-exp-icon">💡</span>
              <p>{result.explanation}</p>
            </div>
          )}

          {/* 비수지 */}
          {result.nonManual && (
            <div className="sb-nonmanual">
              <span className="sb-nm-label">😊 비수지 신호</span>
              <p>{result.nonManual}</p>
            </div>
          )}

          {/* 팁 */}
          {result.tips?.length > 0 && (
            <div className="sb-tips">
              {result.tips.map((t, i) => (
                <div key={i} className="sb-tip">✅ {t}</div>
              ))}
            </div>
          )}

          <button className="save-btn" onClick={saveResult}>🔖 저장하기</button>
        </div>
      )}

      {/* 저장된 문장 */}
      {saved.length > 0 && (
        <div className="sb-saved">
          <div className="sb-saved-title">🔖 저장된 문장</div>
          {saved.map(s => (
            <div key={s.id} className="sb-saved-row" onClick={() => { setInput(s.input); setResult(s.result) }}>
              <span className="sb-saved-input">{s.input}</span>
              <span className="sb-saved-ksl">{s.result.ksl_order?.join(' → ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   TOOL 2 — 수형 검색 사전
═══════════════════════════════════════════ */
const SHAPE_OPTIONS = [
  { key: 'point1', label: '검지 (1형)' },
  { key: 'point2', label: 'V형 (2형)' },
  { key: 'whand',  label: 'W형 (3형)' },
  { key: 'bhand',  label: 'B형 (편손)' },
  { key: 'open',   label: '편손 (5형)' },
  { key: 'fist',   label: '주먹 (S형)' },
  { key: 'thumb',  label: '엄지 (A형)' },
  { key: 'flato',  label: 'F형 (집기)' },
  { key: 'chand',  label: 'C형 (구형)' },
  { key: 'yhand',  label: 'Y형' },
]

function ShapeSearch() {
  const [selected, setSelected] = useState(null)

  // FIX: null guard on safeSigns
  const matches = selected
    ? safeSigns.filter(s => s.params?.수형?.includes(selected))
    : []

  const catLabel = (catId) => safeCategories.find(c => c.id === catId)?.label || catId

  return (
    <div className="tool-panel">
      <div className="tool-header">
        <span className="tool-icon-lg">🖐</span>
        <div>
          <h3 className="tool-title">수형으로 검색</h3>
          <p className="tool-desc">손 모양을 선택하면 해당 수어를 모두 찾아줍니다</p>
        </div>
      </div>

      <div className="ss-shape-grid">
        {SHAPE_OPTIONS.map(s => (
          <button
            key={s.key}
            className={`ss-shape-btn ${selected === s.key ? 'active' : ''}`}
            onClick={() => setSelected(prev => prev === s.key ? null : s.key)}
          >
            <HandShapeSVG shape={s.key} color={selected === s.key ? '#fff' : '#7c6fff'} size={48} />
            <span className="ss-shape-label">{s.label}</span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="ss-results">
          <div className="ss-results-title">
            <span className="ss-results-count">{matches.length}개</span> 수어 발견
          </div>
          {matches.length === 0 ? (
            <div className="ss-empty">이 수형을 쓰는 수어가 데이터베이스에 없습니다.</div>
          ) : (
            <div className="ss-cards">
              {matches.map(sign => (
                <div key={sign.id} className="ss-card" style={{ '--sc': sign.color }}>
                  <div className="ss-card-left">
                    {/* FIX: safe shape key extractor */}
                    <HandShapeSVG shape={getShapeKey(sign.params?.수형)} color={sign.color} size={52} />
                  </div>
                  <div className="ss-card-right">
                    <div className="ss-card-label">{sign.label}</div>
                    <div className="ss-card-cat">{catLabel(sign.cat)}</div>
                    <div className="ss-card-move">{sign.params?.수동}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!selected && (
        <div className="ss-placeholder">
          <div className="ss-ph-icon">☝️</div>
          <p>위에서 손 모양을 선택하세요</p>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   TOOL 3 — 상황별 수어 모음
═══════════════════════════════════════════ */
const SITUATIONS = [
  {
    id: 'hospital',
    label: '병원',
    icon: '🏥',
    color: '#ef4444',
    phrases: [
      { kr: '아프다', ksl: ['나', '몸', '아프다'], tip: '표정: 찡그리기' },
      { kr: '도와주세요', ksl: ['도움', '요청'], tip: '눈썹 올리기 필수' },
      { kr: '약 주세요', ksl: ['약', '달라'], tip: '손바닥 위로 내밀기' },
      { kr: '어디가 아프세요?', ksl: ['어디', '아프다', '질문'], tip: '의문 표정 유지' },
      { kr: '빨리 와 주세요', ksl: ['빨리', '오다', '부탁'], tip: '빠른 동작으로 긴박감 표현' },
    ],
  },
  {
    id: 'restaurant',
    label: '식당',
    icon: '🍽️',
    color: '#f59e0b',
    phrases: [
      { kr: '메뉴 주세요', ksl: ['메뉴', '달라'], tip: '손바닥을 위로' },
      { kr: '맛있다', ksl: ['맛', '좋다'], tip: '표정으로 강조' },
      { kr: '물 주세요', ksl: ['물', '달라'], tip: '마시는 동작 후 달라' },
      { kr: '계산해 주세요', ksl: ['계산', '부탁'], tip: '두 손으로 교차 동작' },
      { kr: '주문할게요', ksl: ['주문', '하다'], tip: '손가락 하나 세우기' },
    ],
  },
  {
    id: 'transport',
    label: '교통',
    icon: '🚌',
    color: '#3b82f6',
    phrases: [
      { kr: '어디로 가세요?', ksl: ['어디', '가다', '질문'], tip: '눈썹 올리기' },
      { kr: '버스 정류장', ksl: ['버스', '정류장'], tip: '버스 모양 수형' },
      { kr: '길을 잃었어요', ksl: ['나', '길', '잃다'], tip: '당황한 표정' },
      { kr: '지하철역', ksl: ['지하철', '역'], tip: '손으로 땅 아래 가리키기' },
      { kr: '얼마나 걸려요?', ksl: ['시간', '얼마', '질문'], tip: '손목 시계 가리키기' },
    ],
  },
  {
    id: 'school',
    label: '학교',
    icon: '🏫',
    color: '#8b5cf6',
    phrases: [
      { kr: '모르겠어요', ksl: ['나', '모르다'], tip: '고개 좌우로 흔들기' },
      { kr: '다시 설명해 주세요', ksl: ['다시', '설명', '부탁'], tip: '손을 크게 원형으로' },
      { kr: '이해했어요', ksl: ['이해', '완료'], tip: '고개 끄덕이기' },
      { kr: '질문 있어요', ksl: ['나', '질문', '있다'], tip: '손 들기 후 질문 수어' },
      { kr: '도움이 필요해요', ksl: ['나', '도움', '필요'], tip: '눈썹 올리며 요청' },
    ],
  },
  {
    id: 'shopping',
    label: '쇼핑',
    icon: '🛍️',
    color: '#10b981',
    phrases: [
      { kr: '얼마예요?', ksl: ['가격', '얼마', '질문'], tip: '눈썹 올리기' },
      { kr: '이거 주세요', ksl: ['이것', '달라'], tip: '물건 가리키기 후' },
      { kr: '너무 비싸요', ksl: ['가격', '높다', '너무'], tip: '표정으로 강조' },
      { kr: '할인 되나요?', ksl: ['할인', '가능', '질문'], tip: '의문 표정' },
      { kr: '환불해 주세요', ksl: ['환불', '부탁'], tip: '물건 돌려주는 동작' },
    ],
  },
]

function SituationPhrases() {
  const [sitId, setSitId]     = useState('hospital')
  const [openIdx, setOpenIdx] = useState(null)
  const sit = SITUATIONS.find(s => s.id === sitId)

  return (
    <div className="tool-panel">
      <div className="tool-header">
        <span className="tool-icon-lg">📍</span>
        <div>
          <h3 className="tool-title">상황별 수어 모음</h3>
          <p className="tool-desc">병원·식당·교통 등 실생활 필수 표현</p>
        </div>
      </div>

      <div className="sit-tabs">
        {SITUATIONS.map(s => (
          <button
            key={s.id}
            className={`sit-tab ${sitId === s.id ? 'active' : ''}`}
            style={{ '--sc': s.color }}
            onClick={() => { setSitId(s.id); setOpenIdx(null) }}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      <div className="sit-phrases">
        {sit?.phrases.map((p, i) => (
          <div
            key={i}
            className={`sit-phrase ${openIdx === i ? 'open' : ''}`}
            style={{ '--sc': sit.color }}
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
          >
            <div className="sit-phrase-top">
              <span className="sit-kr">{p.kr}</span>
              <span className="sit-arrow">{openIdx === i ? '▲' : '▼'}</span>
            </div>
            {openIdx === i && (
              <div className="sit-phrase-detail">
                <div className="sit-ksl-row">
                  {p.ksl.map((w, j) => (
                    <span key={j} className="sit-ksl-token">
                      {w}
                      {j < p.ksl.length - 1 && <span className="sit-ksl-arrow">→</span>}
                    </span>
                  ))}
                </div>
                <div className="sit-tip">💡 {p.tip}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   TOOL 4 — 즐겨찾기 & 저장
═══════════════════════════════════════════ */
function Favorites() {
  const [favIds,    setFavIds]    = useState(new Set(['g01','g02','e01','e02','fd01']))
  const [catFilter, setCatFilter] = useState('all')
  const [search,    setSearch]    = useState('')
  const [note,      setNote]      = useState({})
  const [editId,    setEditId]    = useState(null)

  // FIX: null guards via safeSigns / safeCategories
  const favSigns = safeSigns.filter(s => favIds.has(s.id))
  const filtered = favSigns
    .filter(s => catFilter === 'all' || s.cat === catFilter)
    .filter(s => !search || s.label.includes(search))

  const toggle = (id) => setFavIds(prev => {
    const n = new Set(prev)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })

  const cats = ['all', ...new Set(favSigns.map(s => s.cat))]

  return (
    <div className="tool-panel">
      <div className="tool-header">
        <span className="tool-icon-lg">🔖</span>
        <div>
          <h3 className="tool-title">즐겨찾기 수어</h3>
          <p className="tool-desc">자주 쓰는 수어를 저장하고 메모를 남겨보세요</p>
        </div>
      </div>

      <div className="fav-controls">
        <input
          className="fav-search"
          type="text"
          placeholder="🔍 수어 이름 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="fav-cats">
          {cats.map(c => {
            const cat = safeCategories.find(x => x.id === c)
            return (
              <button
                key={c}
                className={`fav-cat-btn ${catFilter === c ? 'active' : ''}`}
                onClick={() => setCatFilter(c)}
              >
                {c === 'all' ? '전체' : `${cat?.icon} ${cat?.label}`}
              </button>
            )
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="fav-empty">
          <div className="fav-empty-icon">🔖</div>
          <p>즐겨찾기한 수어가 없습니다.</p>
          <p className="fav-empty-sub">학습 모드에서 수어를 저장해보세요</p>
        </div>
      ) : (
        <div className="fav-grid">
          {filtered.map(s => (
            <div key={s.id} className="fav-card" style={{ '--fc': s.color }}>
              <div className="fav-card-top">
                {/* FIX: safe shape key extractor */}
                <HandShapeSVG shape={getShapeKey(s.params?.수형)} color={s.color} size={44} />
                <div className="fav-card-info">
                  <div className="fav-card-label">{s.label}</div>
                  <div className="fav-card-cat">
                    {safeCategories.find(c => c.id === s.cat)?.icon}{' '}
                    {safeCategories.find(c => c.id === s.cat)?.label}
                  </div>
                </div>
                <button className="fav-remove-btn" onClick={() => toggle(s.id)} title="즐겨찾기 해제">✕</button>
              </div>
              <div className="fav-card-move">{s.params?.수동}</div>

              {editId === s.id ? (
                <div className="fav-note-edit">
                  <textarea
                    className="fav-note-input"
                    placeholder="메모를 입력하세요..."
                    value={note[s.id] || ''}
                    onChange={e => setNote(n => ({ ...n, [s.id]: e.target.value }))}
                    rows={2}
                  />
                  <button className="fav-note-save" onClick={() => setEditId(null)}>저장</button>
                </div>
              ) : (
                <div className="fav-note-row" onClick={() => setEditId(s.id)}>
                  {note[s.id]
                    ? <span className="fav-note-text">{note[s.id]}</span>
                    : <span className="fav-note-placeholder">+ 메모 추가</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="fav-add-section">
        <div className="fav-add-title">➕ 수어 추가하기</div>
        <div className="fav-add-grid">
          {safeSigns
            .filter(s => !favIds.has(s.id))
            .filter(s => catFilter === 'all' || s.cat === catFilter)
            .slice(0, 8)
            .map(s => (
              <button key={s.id} className="fav-add-btn" style={{ '--fc': s.color }} onClick={() => toggle(s.id)}>
                + {s.label}
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   ROOT — Tools Page
═══════════════════════════════════════════ */
const TOOLS = [
  { id: 'sentence',  icon: '🔄', label: '어순 변환기', sub: '한국어 → KSL 어순' },
  { id: 'shape',     icon: '🖐',  label: '수형 검색',   sub: '손 모양으로 찾기' },
  { id: 'situation', icon: '📍', label: '상황별 모음',  sub: '병원·식당·교통 등' },
  { id: 'favorites', icon: '🔖', label: '즐겨찾기',     sub: '저장·메모 관리' },
]

export default function DictPage() {
  const [active, setActive] = useState('sentence')

  return (
    <div className="tools-page">
      <div className="tools-header">
        <h2 className="tools-title">🛠 수어 도구함</h2>
        <p className="tools-sub">어순 변환 · 수형 검색 · 상황별 표현 · 즐겨찾기</p>
      </div>

      <div className="tools-nav">
        {TOOLS.map(t => (
          <button
            key={t.id}
            className={`tools-nav-btn ${active === t.id ? 'active' : ''}`}
            onClick={() => setActive(t.id)}
          >
            <span className="tnb-icon">{t.icon}</span>
            <span className="tnb-label">{t.label}</span>
            <span className="tnb-sub">{t.sub}</span>
          </button>
        ))}
      </div>

      <div className="tools-content">
        {active === 'sentence'  && <SentenceBuilder />}
        {active === 'shape'     && <ShapeSearch />}
        {active === 'situation' && <SituationPhrases />}
        {active === 'favorites' && <Favorites />}
      </div>
    </div>
  )
}