import { useState } from 'react'

/* ═══════════════════════════════════════════
   TOOL 1 — 수어 어순 변환기
   Usage: <SentenceBuilder />
═══════════════════════════════════════════ */

const GROQ_MODEL = 'llama-3.3-70b-versatile'
const API_KEY = import.meta.env.VITE_GROQ_API_KEY

async function callGroq(prompt, systemInstruction) {
  const url = 'https://api.groq.com/openai/v1/chat/completions'
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user',   content: prompt }
      ],
      response_format: { type: 'json_object' }
    })
  })
  const data = await res.json()
  console.log('Groq response:', JSON.stringify(data, null, 2))
  const parsed = JSON.parse(data.choices[0].message.content)
  console.log('Parsed result:', parsed)  // ← add this
  return parsed
}

const KSL_SYSTEM = `당신은 한국수어(KSL) 언어학 전문가입니다.
목표는 한국어 문장을 자연스럽고 실제적인 한국수어 어순으로 변환하는 것입니다.

[핵심 규칙]
1. 한국수어는 조사(은/는/이/가/을/를 등)를 사용하지 않는다 → 반드시 제거
2. 기본 어순: 주제 → 시간 → 장소 → 대상 → 동작/상태
3. 감정/형용사는 문장 뒤쪽에 배치
4. 불필요한 단어는 생략하거나 의미 중심으로 단순화
5. "~요", "~습니다" 같은 존댓말 어미 제거
6. 질문 문장은 끝에 "질문" 표시
7. 동사는 원형 형태로 변환
8. 자연스러운 KSL 패턴 우선

반드시 valid JSON 형식으로만 응답하세요.
입력 문장:
`

export default function SentenceBuilder() {
  const [input,   setInput]   = useState('')
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState([])
  const [error,   setError]   = useState('')

  const convert = async () => {
    if (!input.trim()) return
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const data = await callGroq(`한국어 문장: "${input.trim()}"`, KSL_SYSTEM)
      if (!data) throw new Error('No result')
      setResult(data)
    } catch {
      setError('수어 변환 엔진 연결에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
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

      {result && (
        <div className="sb-result">
          {/* KSL 어순 토큰 */}
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

          {/* Gloss */}
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

          {/* 비수지 신호 */}
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

      {/* 저장 목록 */}
      {saved.length > 0 && (
        <div className="sb-saved">
          <div className="sb-saved-title">🔖 저장된 문장</div>
          {saved.map(s => (
            <div
              key={s.id}
              className="sb-saved-row"
              onClick={() => { setInput(s.input); setResult(s.result) }}
            >
              <span className="sb-saved-input">{s.input}</span>
              <span className="sb-saved-ksl">{s.result.ksl_order?.join(' → ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}