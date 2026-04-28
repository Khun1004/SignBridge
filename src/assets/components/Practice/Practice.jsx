import { useState } from 'react'
import './Practice.css'
import GestureCheck from './Gesturecheck.jsx'
import LearnMode    from './LearnMode'
import PracticeMode from './PracticeMode'
import AITestMode   from './AITestMode'
import { SIGNS }    from './signs.js'

const TABS = [
  { icon: '📖', label: '학습' },
  { icon: '🤟', label: '연습' },
  { icon: '📷', label: '카메라' },
  { icon: '🤖', label: 'AI 시험' },
]

export default function PracticePage() {
  const [mode, setMode] = useState(0)
  return (
    <div className="practice-page">
      <div className="page-header">
        <h2 className="page-title">🤟 한국수어 학습센터</h2>
        <p className="page-sub">
          국립국어원 한국수어사전 기반 · {SIGNS.length}개 수어 학습 · MediaPipe 카메라 인식 · AI 피드백
        </p>
      </div>
      <div className="mode-tabs">
        {TABS.map(({ icon, label }, i) => (
          <button
            key={label}
            className={`mode-tab ${mode === i ? 'active' : ''}`}
            onClick={() => setMode(i)}
          >
            {icon} {label}
          </button>
        ))}
      </div>
      <div className="mode-content">
        {mode === 0 && <LearnMode />}
        {mode === 1 && <PracticeMode />}
        {mode === 2 && <GestureCheck />}
        {mode === 3 && <AITestMode />}
      </div>
    </div>
  )
}