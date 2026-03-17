import { useState } from 'react'
import './App.css'

// ── 컴포넌트 import ──
import Demo from './assets/components/Demo/Demo.jsx'
import DemoPage from './assets/components/DemoPage/DemoPage.jsx'
import DictPage from './assets/components/DictPage/DictPage.jsx'
import Home from './assets/components/Home/Home.jsx'
import MyPage from './assets/components/MyPage/MyPage.jsx'
import TeamPage from './assets/components/TeamPage/TeamPage.jsx'

// ── 메뉴 ──
const MENUS = [
  { id: 'home',  label: '홈' },
  { id: 'demo',  label: '데모' },
  { id: 'trans', label: '번역기' },
  { id: 'dict',  label: '수어사전' },
  { id: 'team',  label: '팀' },
]

export default function App() {
  const [tab, setTab]                 = useState('home')
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery]             = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    setQuery(searchInput)
    setTab('dict')
  }

  const renderPage = () => {
    switch (tab) {
      case 'home':  return <Home />
      case 'demo':  return <DemoPage />
      case 'trans': return <Demo />
      case 'dict':  return <DictPage query={query} />
      case 'team':  return <TeamPage />
      case 'my':    return <MyPage />
      default:      return <Home />
    }
  }

  return (
    <div className="app">

      {/* ── 상단 네비게이션 ── */}
      <header className="navbar">

        {/* 1줄: 로고 + 검색/마이 */}
        <div className="navbar-top">
          <div className="nav-logo">
            <span className="nav-logo-icon">🤟</span>
            <span className="nav-logo-text">SignBridge</span>
          </div>
          <div className="nav-actions">
            <form className="search-form" onSubmit={handleSearch}>
              <input
                className="search-input"
                placeholder="수어 검색..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
              <button type="submit" className="search-btn">🔍</button>
            </form>
            <button className="my-btn" onClick={() => setTab('my')}>
              <div className="my-avatar">나</div>
              <span>마이</span>
            </button>
          </div>
        </div>

        {/* 2줄: 메뉴 */}
        <div className="navbar-bottom">
          <nav className="navbar-bottom-inner">
            {MENUS.map(m => (
              <button
                key={m.id}
                className={`nav-menu-btn ${tab === m.id ? 'active' : ''}`}
                onClick={() => { setTab(m.id); setQuery('') }}
              >
                {m.label}
              </button>
            ))}
          </nav>
        </div>

      </header>

      {/* ── 페이지 내용 ── */}
      <main className="main-content">
        {renderPage()}
      </main>

      {/* ── 푸터 ── */}
      <footer className="footer">
        <span className="footer-logo">🤟 SignBridge</span>
        <span>© 2025 SignBridge Team · AI 수어 번역 시스템</span>
      </footer>

    </div>
  )
}