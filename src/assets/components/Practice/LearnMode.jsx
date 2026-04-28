import { useState, useEffect } from 'react'
import './LearnMode.css'
import SignLearnCard from './SignLearnCard'
import { CATEGORIES, SIGNS } from './signs.js'

import { callClaude, signsForCat } from './Utils.jsx'

export default function LearnMode() {
  const [catId,    setCatId]    = useState('all')
  const [idx,      setIdx]      = useState(0)
  const [mastered, setMastered] = useState(new Set())
  const [aiText,   setAiText]   = useState('')
  const [aiLoad,   setAiLoad]   = useState(false)

  const pool = signsForCat(SIGNS, catId)
  const sign = pool[Math.min(idx, pool.length - 1)]

  const go = (d) => {
    setAiText('')
    setTimeout(() => setIdx(i => (i + d + pool.length) % pool.length), 80)
  }

  useEffect(() => { setIdx(0); setAiText('') }, [catId])

  const askAI = async () => {
    setAiLoad(true); setAiText('')
    try {
      const t = await callClaude(
        `한국수어 "${sign.label}" 초보자를 위한 추가 정보:\n1. 손 모양의 기원/이유 (1-2문장)\n2. 실생활 예시 문장 2개 (수어 어순)\n3. 혼동하기 쉬운 수어 1개와 구별법`,
        '한국농아인협회 공인 한국수어 강사. 정확하고 친근하게.'
      )
      setAiText(t.trim())
    } catch { setAiText('AI 설명을 불러올 수 없습니다.') }
    setAiLoad(false)
  }

  const isMastered    = mastered.has(sign?.id)
  const masteredCount = pool.filter(s => mastered.has(s.id)).length
  const toggleMaster  = () => setMastered(p => {
    const n = new Set(p)
    n.has(sign.id) ? n.delete(sign.id) : n.add(sign.id)
    return n
  })

  return (
    <div className="learn-mode">
      <div className="cat-scroll">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            className={`cat-tab ${catId === c.id ? 'active' : ''}`}
            onClick={() => setCatId(c.id)}
          >
            {c.icon} {c.label} <span className="cat-count">{signsForCat(SIGNS, c.id).length}</span>
          </button>
        ))}
      </div>

      <div className="learn-meta-row">
        <span className="learn-counter">{idx + 1} / {pool.length}</span>
        <div className="mastered-bar">
          <div className="mastered-track">
            <div className="mastered-fill" style={{ width: `${(masteredCount / pool.length) * 100}%` }} />
          </div>
          <span className="mastered-label">✅ {masteredCount}/{pool.length}</span>
        </div>
      </div>

      <div className="learn-dots">
        {pool.map((s, i) => (
          <span
            key={s.id}
            className={`dot ${i === idx ? 'active' : ''} ${mastered.has(s.id) ? 'mastered' : ''}`}
            title={s.label}
            onClick={() => { setAiText(''); setIdx(i) }}
          />
        ))}
      </div>

      {sign && <SignLearnCard sign={sign} isMastered={isMastered} onToggleMaster={toggleMaster} />}

      <div className="learn-controls">
        <button className="ctrl-btn" onClick={() => go(-1)}>← 이전</button>
        <span className="lc-nav-label">{sign?.label}</span>
        <button className="ctrl-btn" onClick={() => go(1)}>다음 →</button>
      </div>

      <div className="ai-section">
        <button className="ai-explain-btn" onClick={askAI} disabled={aiLoad}>
          {aiLoad ? '🤖 생성 중...' : '🤖 AI 심화 설명 (기원 · 예문 · 혼동어)'}
        </button>
        {(aiLoad || aiText) && (
          <div className={`ai-feedback-box has-content ${aiLoad ? 'loading' : ''}`}>
            <div className="ai-header">
              <span className="ai-icon">🤖</span>
              <span>AI 심화 설명</span>
              {aiLoad && <span className="ai-loading-dot" />}
            </div>
            {aiLoad
              ? <div className="ai-skeleton"><div className="skel-line" /><div className="skel-line" /><div className="skel-line short" /></div>
              : <p className="ai-text">{aiText}</p>}
          </div>
        )}
      </div>
    </div>
  )
}