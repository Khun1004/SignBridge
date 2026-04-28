import { useState, useEffect, useCallback } from 'react'
import './PracticeMode.css'
import { HandIllustration } from './SignLearnCard'
import { CATEGORIES, HANDSHAPES, SIGNS } from './signs.js'
import { callClaude, signsForCat, extractShapeKey, ParamBadge, PARAM_META, KNOWN_SHAPES } from './Utils.jsx'
export default function PracticeMode() {
  const [catId,      setCatId]      = useState('all')
  const [diff,       setDiff]       = useState('normal')
  const [target,     setTarget]     = useState(null)
  const [choices,    setChoices]    = useState([])
  const [selected,   setSelected]   = useState(null)
  const [result,     setResult]     = useState(null)   // 'correct' | 'wrong'
  const [aiLoad,     setAiLoad]     = useState(false)
  const [aiFb,       setAiFb]       = useState('')
  const [history,    setHistory]    = useState([])
  const [score,      setScore]      = useState({ correct: 0, total: 0 })
  const [showHint,   setShowHint]   = useState(false)
  const [streak,     setStreak]     = useState(0)
  const [bestStreak, setBestStreak] = useState(0)

  const choiceCount = diff === 'easy' ? 3 : diff === 'hard' ? 6 : 4

  const buildChoices = useCallback((t) => {
    const others = SIGNS
      .filter(s => s.id !== t.id)
      .sort(() => Math.random() - 0.5)
    const picked = others.slice(0, choiceCount - 1)
    const final = [...picked, t].sort(() => Math.random() - 0.5)
    return final  // ← add this, was missing
  }, [choiceCount])

  const next = useCallback(() => {
    const pool = signsForCat(SIGNS, catId)
    const t = pool[Math.floor(Math.random() * pool.length)]
    setTarget(t)
    setChoices(buildChoices(t))  // ← now buildChoices returns the array
    setSelected(null); setResult(null); setAiFb(''); setShowHint(false)
  }, [catId, buildChoices])

  useEffect(() => { next() }, [catId, diff])

  const pick = async (choice) => {
    if (result) return
    setSelected(choice)
    const ok = choice.id === target.id
    setResult(ok ? 'correct' : 'wrong')
    const newStreak = ok ? streak + 1 : 0
    setStreak(newStreak)
    setBestStreak(b => Math.max(b, newStreak))
    setScore(p => ({ correct: p.correct + (ok ? 1 : 0), total: p.total + 1 }))
    setHistory(h => [{
      label: target.label, chosen: choice.label,
      correct: ok, time: new Date().toLocaleTimeString('ko-KR'),
    }, ...h.slice(0, 5)])

    setAiLoad(true)
    try {
      const prompt = ok
        ? `한국수어 학습자가 "${target.label}"의 손 모양 이미지를 보고 뜻을 정확히 골랐습니다. 이 수어의 재미있는 기억법이나 실생활 활용을 2문장 이내로 알려주세요.`
        : `한국수어 학습자가 "${target.label}" 수어를 보고 "${choice.label}"라고 잘못 선택했습니다. 두 수어의 차이점을 2–3문장으로 명확히 설명해 주세요.`
      setAiFb((await callClaude(prompt, '당신은 한국수어 전문 강사입니다.')).trim())
    } catch { setAiFb('피드백을 불러올 수 없습니다.') }
    setAiLoad(false)
  }

  const acc = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0

  return (
    <div className="practice-mode">

      {/* 카테고리 & 난이도 */}
      <div className="options-bar">
        <div className="option-group">
          <span className="option-label">카테고리</span>
          <div className="option-pills">
            {CATEGORIES.map(c => (
              <button key={c.id} className={`pill ${catId === c.id ? 'active' : ''}`} onClick={() => setCatId(c.id)}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="option-group">
          <span className="option-label">난이도</span>
          <div className="option-pills">
            {[['easy','쉬움 (3개)'],['normal','보통 (4개)'],['hard','어려움 (6개)']].map(([v,l]) => (
              <button key={v} className={`pill ${diff === v ? 'active' : ''}`} onClick={() => setDiff(v)}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* 점수 바 */}
      <div className="practice-scorebar">
        <div className="score-stat">
          <span className="score-n">{score.correct}</span>
          <span className="score-l">정답</span>
        </div>
        <div className="score-stat with-divider">
          <span className="score-n">{score.total}</span>
          <span className="score-l">시도</span>
        </div>
        <div className="score-stat with-divider">
          <span className="score-n" style={{ color: acc >= 70 ? '#10b981' : acc > 0 ? '#f59e0b' : '#1a1a2e' }}>{acc}%</span>
          <span className="score-l">정확도</span>
        </div>
        <div className="score-stat with-divider">
          <span className="score-n" style={{ color: streak >= 3 ? '#f59e0b' : '#1a1a2e' }}>
            {streak >= 3 ? '🔥' : ''}{streak}
          </span>
          <span className="score-l">연속정답</span>
        </div>
        <div className="score-stat with-divider">
          <span className="score-n" style={{ fontSize: 13, color: '#aaa' }}>{bestStreak}</span>
          <span className="score-l">최고기록</span>
        </div>
      </div>

      {/* 메인 레이아웃 */}
      <div className="pm-layout">

        {/* 왼쪽: 수어 카드 + 보기 */}
        <div className="pm-left">
          {target && (
            <div className={`pm-sign-card ${result || ''}`} style={{ '--sc': target.color }}>
              <div className="pm-card-tag">이 수어의 뜻은?</div>

              <div className="pm-hand-display">
                {(() => {
                  const shapeKeys = target.params.수형
                    .split(/[+→]/)
                    .map(s => s.trim().toLowerCase().split(/[\s(]/)[0])
                    .filter(s => KNOWN_SHAPES.has(s))          // ← uses imported constant now
                  const safeShapeKeys = shapeKeys.length > 0 ? shapeKeys : ['open']
                  const handColor = result === 'correct' ? '#10b981' : result === 'wrong' ? '#ef4444' : target.color
                  const handSize = safeShapeKeys.length > 1 ? 100 : 140

                  return (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                      {safeShapeKeys.map((key, idx) => (
                        <div key={key + idx} style={{ textAlign: 'center' }}>
                          <HandIllustration shapeKey={key} color={handColor} size={handSize} />
                          {safeShapeKeys.length > 1 && (
                            <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
                              {idx === 0 ? '준비/진행' : '마무리'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>

              <div className="pm-shape-label">
                {HANDSHAPES[extractShapeKey(target.params.수형)]?.label || ''}
              </div>

              {result && (
                <div className={`pm-result-badge ${result}`}>
                  {result === 'correct' ? `✔ 정답! "${target.label}"` : `✕ 정답은 "${target.label}"`}
                </div>
              )}

              {!result && (
                <button className="hint-btn" onClick={() => setShowHint(h => !h)}>
                  {showHint ? '힌트 숨기기' : '💡 힌트'}
                </button>
              )}
              {showHint && !result && (
                <div className="pm-hint-params">
                  <ParamBadge k="수위" v={target.params.수위} />
                  <ParamBadge k="수동" v={target.params.수동} />
                </div>
              )}
            </div>
          )}

          {/* 보기 그리드 */}
          <div className={`pm-choices-grid cols-${choiceCount <= 3 ? 3 : choiceCount <= 4 ? 2 : 3}`}>
            {choices.map((s) => {
              const isChosen  = selected?.id === s.id
              const isCorrect = s.id === target?.id
              let cls = 'pm-choice-btn'
              if (result) {
                if (isChosen && result === 'correct')  cls += ' choice-correct'
                else if (isChosen && result === 'wrong') cls += ' choice-wrong'
                else if (isCorrect) cls += ' choice-reveal'
              }
              return (
                <button key={s.id} className={cls} onClick={() => pick(s)} disabled={!!result}>
                  <span className="pm-choice-label">{s.label}</span>
                  {s.korean && <span className="pm-choice-sub">{s.korean}</span>}
                  {result && isChosen  && <span className="pm-choice-mark">{result === 'correct' ? '✔' : '✕'}</span>}
                  {result && !isChosen && isCorrect && <span className="pm-choice-mark reveal">✔</span>}
                </button>
              )
            })}
          </div>

          <button className="next-btn" onClick={next}>🔁 다음 문제</button>
        </div>

        {/* 오른쪽: AI 피드백 + 기록 */}
        <div className="pm-right">
          <div className={`ai-feedback-box ${aiFb ? 'has-content' : ''} ${aiLoad ? 'loading' : ''}`}>
            <div className="ai-header">
              <span className="ai-icon">🤖</span>
              <span>AI 피드백</span>
              {aiLoad && <span className="ai-loading-dot" />}
            </div>
            {aiLoad
              ? <div className="ai-skeleton"><div className="skel-line" /><div className="skel-line short" /></div>
              : aiFb
                ? <p className="ai-text">{aiFb}</p>
                : <p className="ai-placeholder">수어를 보고 뜻을 골라보세요</p>}
          </div>

          {result && target && (
            <div className="pm-answer-params">
              <div className="pm-ap-title">📋 수어 정보</div>
              {Object.entries(target.params).map(([k, v]) =>
                PARAM_META[k] ? <ParamBadge key={k} k={k} v={v} /> : null
              )}
            </div>
          )}

          <div className="history-box">
            <div className="history-title">🕐 최근 기록</div>
            {history.length === 0
              ? <div className="history-empty">기록 없음</div>
              : history.map((h, i) => (
                <div key={i} className="history-row">
                  <span className="h-label">{h.label}</span>
                  {!h.correct && <span className="h-chosen">→ {h.chosen}</span>}
                  <span className="h-time">{h.time}</span>
                  <span className={`h-result ${h.correct ? 'ok' : 'fail'}`}>{h.correct ? '✔' : '✕'}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}