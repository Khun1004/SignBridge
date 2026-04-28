/* ─── Shared API call ─── */
export async function callClaude(prompt, system = '') {
  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  }
  if (system) body.system = system
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return data.content?.map(b => b.text || '').join('') || ''
}

/* ─── Shared helpers ─── */
export function signsForCat(signs, id) {
  return id === 'all' ? signs : signs.filter(s => s.cat === id)
}

/**
 * Extracts the first valid hand-shape key from a 수형 string.
 * Handles formats like:
 *   "bhand → fist"     → "bhand"
 *   "point1"           → "point1"
 *   "point2"           → "point2"
 *   "open (양손)"      → "open"
 *   "lhand"            → "lhand"
 *   "thumb + open"     → "thumb"
 *   "고개 끄덕임"       → "open"  (fallback)
 */
export function extractShapeKey(수형 = '') {
  const validKeys = [
    'fist', 'open', 'point1', 'point2', 'thumb',
    'ily', 'bhand', 'chand', 'flato', 'yhand', 'lhand',
    // ← these were missing:
    'threefinger', 'fourfinger', 'sixhand', 'sevenhand',
    'eighthand', 'ninehand', 'thumbtwofinger', 'dislikehand',
    'thumbring', 'thumbmiddle', 'pinky',
  ]

  const first = 수형.split(/[\s+→(]/)[0].trim().toLowerCase()
  return validKeys.includes(first) ? first : 'open'
}

/* ─── Shared UI: ParamBadge ─── */
export const PARAM_META = {
  수형:  { label: '수형',   sub: '손 모양', color: '#7c6fff' },
  수위:  { label: '수위',   sub: '위치',    color: '#3b82f6' },
  수동:  { label: '수동',   sub: '움직임',  color: '#10b981' },
  수향:  { label: '수향',   sub: '방향',    color: '#f59e0b' },
  비수지:{ label: '비수지', sub: '표정·입', color: '#ec4899' },
}

export function ParamBadge({ k, v }) {
  const m = PARAM_META[k]
  if (!m) return null
  return (
    <div className="param-badge" style={{ '--pc': m.color }}>
      <div className="param-key">{m.label} <span className="param-sub">{m.sub}</span></div>
      <div className="param-val">{v}</div>
    </div>
  )
}
// Utils.jsx — add this export
export const KNOWN_SHAPES = new Set([
  'fist','open','point1','point2','thumb','ily','bhand','chand','flato',
  'yhand','lhand','thumbring','thumbmiddle','pinky','threefinger','fourfinger',
  'sixhand','sevenhand','eighthand','ninehand','thumbtwofinger','dislikehand',
])