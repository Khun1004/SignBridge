import { useState } from 'react'
import './DictPage.css'
import SentenceBuilder  from './SentenceBuilder'
import ShapeSearch      from './ShapeSearch'
import SituationPhrases from './SituationPhrases'
import Favorites        from './Favorites'

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
      <nav className="tools-nav">
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
      </nav>
      <div className="tools-content">
        {active === 'sentence'  && <SentenceBuilder />}
        {active === 'shape'     && <ShapeSearch />}
        {active === 'situation' && <SituationPhrases />}
        {active === 'favorites' && <Favorites />}
      </div>
    </div>
  )
}