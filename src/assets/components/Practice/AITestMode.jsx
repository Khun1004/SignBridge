import { useState, useEffect, useRef } from 'react'
import './AITestMode.css'
import { CATEGORIES, SIGNS } from './signs.js'
import { callClaude, signsForCat } from './Utils.jsx'

export default function AITestMode() {
  const [phase,   setPhase]   = useState('intro')
  const [catId,   setCatId]   = useState('all')
  const [msgs,    setMsgs]    = useState([])
  const [input,   setInput]   = useState('')
  const [sending, setSending] = useState(false)
  const [qNum,    setQNum]    = useState(0)
  const [done,    setDone]    = useState(false)
  const [finalFb, setFinalFb] = useState('')
  const [fbLoad,  setFbLoad]  = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  const catSigns = signsForCat(SIGNS, catId)
  const TOTAL    = Math.min(10, catSigns.length)

  const SYSTEM = `당신은 공인 한국수어(KSL) 시험관입니다.
시험 범위 수어:
${catSigns.map(s => `- ${s.label}: 수형=${s.params.수형}, 수위=${s.params.수위}, 수동=${s.params.수동}`).join('\n')}

규칙:
1. 총 ${TOTAL}문제. 항상 [질문 N/${TOTAL}] 형식으로 번호 표시.
2. 문제 유형 교체: ①수어 동작 설명→이름 맞히기, ②이름→동작 설명, ③수형 설명→해당 수어 2가지.
3. 정답이면 "✅ 정답!" 으로 시작, 오답이면 "❌ 오답:" 으로 시작.
4. 오답 후 반드시 정확한 KSL 동작 설명 제공.
5. ${TOTAL}번째 채점 후 정확히 이 JSON 한 줄을 출력: {"score":N,"total":${TOTAL}}
6. 이후 "🏁 테스트 완료" 출력.
7. 전체 한국어, 친근하고 전문적 어조.`

  const start = async () => {
    setMsgs([]); setQNum(0); setDone(false); setFinalFb('')
    setPhase('chat'); setSending(true)
    try {
      const r = await callClaude('한국수어 시험을 시작합니다. 첫 번째 질문을 해주세요.', SYSTEM)
      setMsgs([{ role: 'assistant', content: r }])
      setQNum(1)
    } catch {
      setMsgs([{ role: 'assistant', content: '연결 오류. 잠시 후 다시 시도해 주세요.' }])
    }
    setSending(false)
  }

  const send = async () => {
    if (!input.trim() || sending || done) return
    const text = input.trim()
    setInput('')
    const history = [...msgs, { role: 'user', content: text }]
    setMsgs(history)
    setSending(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM,
          messages: history.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data  = await res.json()
      const reply = data.content?.map(b => b.text || '').join('') || ''
      const updated = [...history, { role: 'assistant', content: reply }]
      setMsgs(updated)

      if (reply.includes('🏁 테스트 완료')) {
        setDone(true)
        setFbLoad(true)
        const m = reply.match(/\{"score"\s*:\s*(\d+).*?\}/)
        const scoreVal = m ? parseInt(m[1]) : '?'
        const fb = await callClaude(
          `KSL 시험 결과: ${TOTAL}문제 중 ${scoreVal}개 정답. 학습자에게 구체적인 개선 방향과 격려를 한국어 3-4문장으로.`,
          '한국수어 전문 강사'
        )
        setFinalFb(fb.trim())
        setFbLoad(false)
      } else {
        setQNum(q => q + 1)
      }
    } catch {
      setMsgs(m => [...m, { role: 'assistant', content: '오류가 발생했습니다.' }])
    }
    setSending(false)
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, sending])
  useEffect(() => { if (phase === 'chat') inputRef.current?.focus() }, [phase])

  if (phase === 'intro') return (
    <div className="test-intro">
      <div className="intro-icon">🤖</div>
      <h3 className="intro-title">AI 한국수어 시험</h3>
      <p className="intro-desc">
        AI 시험관이 실제 KSL 지식을 평가합니다.<br />
        수형·수위·수동 등 5요소를 정확히 알아야 합격!
      </p>
      <div className="option-group" style={{ width: '100%', maxWidth: 520 }}>
        <span className="option-label">시험 범위</span>
        <div className="option-pills" style={{ justifyContent: 'center' }}>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              className={`pill ${catId === c.id ? 'active' : ''}`}
              onClick={() => setCatId(c.id)}
            >
              {c.icon} {c.label} <span className="cat-count">{signsForCat(SIGNS, c.id).length}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="intro-rules">
        {[
          ['🤖', `AI가 ${TOTAL}문제 출제`],
          ['💬', '수형·위치·동작을 텍스트로 설명'],
          ['✅', '즉각 채점 + 정확한 KSL 해설'],
          ['📊', '최종 AI 종합 분석'],
        ].map(([icon, text]) => (
          <div key={text} className="rule"><span>{icon}</span><span>{text}</span></div>
        ))}
      </div>
      <button className="start-btn" onClick={start}>시험 시작 →</button>
    </div>
  )

  return (
    <div className="ai-test-wrap">
      <div className="chat-header">
        <div className="chat-header-left">
          <span className="chat-avatar">🤖</span>
          <div>
            <div className="chat-name">한국수어 AI 시험관</div>
            <div className="chat-status">
              {sending ? '답변 작성 중...' : done ? '시험 완료' : `질문 ${Math.min(qNum, TOTAL)} / ${TOTAL}`}
            </div>
          </div>
        </div>
        <div className="chat-progress-wrap">
          <div className="chat-progress-track">
            <div className="chat-progress-fill" style={{ width: `${(Math.min(qNum, TOTAL) / TOTAL) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.role === 'assistant' && <span className="msg-avatar">🤖</span>}
            <div className="msg-bubble"><pre className="msg-text">{m.content}</pre></div>
          </div>
        ))}
        {sending && (
          <div className="msg assistant">
            <span className="msg-avatar">🤖</span>
            <div className="msg-bubble typing">
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {done && (
        <div className={`ai-feedback-box has-content final-feedback ${fbLoad ? 'loading' : ''}`}>
          <div className="ai-header">
            <span className="ai-icon">🤖</span><span>AI 종합 분석</span>
            {fbLoad && <span className="ai-loading-dot" />}
          </div>
          {fbLoad
            ? <div className="ai-skeleton"><div className="skel-line" /><div className="skel-line" /><div className="skel-line short" /></div>
            : <p className="ai-text">{finalFb}</p>}
        </div>
      )}

      <div className="chat-input-wrap">
        {done
          ? <button className="start-btn" style={{ width: '100%' }} onClick={() => setPhase('intro')}>🔁 다시 시작</button>
          : <>
              <textarea
                ref={inputRef}
                className="chat-input"
                rows={2}
                placeholder="수어 동작을 설명하거나 이름을 입력하세요 (Enter 전송)"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                disabled={sending || done}
              />
              <button className="chat-send-btn" onClick={send} disabled={sending || !input.trim() || done}>
                {sending ? '⏳' : '전송 ↑'}
              </button>
            </>}
      </div>
    </div>
  )
}