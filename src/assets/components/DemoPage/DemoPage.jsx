import { useState } from 'react'
import './DemoPage.css'

const SIGNS = [
  { emoji: '👈', label: '왼쪽',   desc: '왼쪽으로 가세요',   color: '#3b82f6' },
  { emoji: '👉', label: '오른쪽',  desc: '오른쪽으로 가세요', color: '#10b981' },
  { emoji: '☝️',  label: '위쪽',   desc: '위로 올라가세요',   color: '#f59e0b' },
  { emoji: '👇', label: '아래쪽',  desc: '아래로 내려가세요', color: '#ec4899' },
  { emoji: '✋', label: '정지',    desc: '잠깐 멈춰주세요',   color: '#ef4444' },
  { emoji: '👍', label: '확인',    desc: '네, 알겠습니다!',   color: '#8b5cf6' },
  { emoji: '🤲', label: '도움',    desc: '도움이 필요합니다', color: '#06b6d4' },
]

export default function DemoPage() {
  const [detected, setDetected] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [history, setHistory]   = useState([])

  const detect = (sign) => {
    setLoading(true)
    setDetected(null)
    setTimeout(() => {
      setDetected(sign)
      setLoading(false)
      setHistory(h => [
        { ...sign, time: new Date().toLocaleTimeString('ko-KR') },
        ...h.slice(0, 4)
      ])
    }, 800)
  }

  return (
    <div className="page">
      <div className="section-tag">라이브 데모</div>
      <h2 className="section-title">수어 방향 인식 체험</h2>
      <p className="page-sub">버튼을 눌러 손동작 인식을 시뮬레이션하세요</p>

      <div className="demo-layout">
        {/* 버튼 그리드 */}
        <div className="demo-left">
          <div className="sign-grid">
            {SIGNS.map(s => (
              <button
                key={s.label}
                className="sign-btn"
                style={{ '--c': s.color }}
                onClick={() => detect(s)}
              >
                <span className="sign-emoji">{s.emoji}</span>
                <span className="sign-label">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 결과 + 기록 */}
        <div className="demo-right">
          <div
            className="result-box"
            style={detected ? { borderColor: detected.color, background: detected.color + '12' } : {}}
          >
            {loading ? (
              <div className="scanning">
                <div className="spin-ring" />
                <span>인식 중...</span>
              </div>
            ) : detected ? (
              <>
                <div className="res-emoji" key={detected.label}>{detected.emoji}</div>
                <div className="res-label" style={{ color: detected.color }}>{detected.label}</div>
                <div className="res-desc">{detected.desc}</div>
              </>
            ) : (
              <div className="res-empty">
                <span style={{ fontSize: 52 }}>🤟</span>
                <p>손동작 버튼을 눌러보세요</p>
              </div>
            )}
          </div>

          <div className="history-box">
            <div className="history-title">🕐 인식 기록</div>
            {history.length === 0 ? (
              <div className="history-empty">아직 인식 기록이 없습니다</div>
            ) : (
              history.map((h, i) => (
                <div className="history-row" key={i}>
                  <span style={{ fontSize: 22 }}>{h.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: h.color, fontSize: 14 }}>{h.label}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{h.desc}</div>
                  </div>
                  <span style={{ fontSize: 11, color: '#bbb', fontFamily: 'monospace' }}>{h.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}