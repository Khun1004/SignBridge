import { useState, useEffect, useRef } from 'react'
import './App.css'

import About            from './assets/components/About/About.jsx'
import ConversationPage from './assets/components/ConversationPage/ConversationPage.jsx'
import Practice from './assets/components/Practice/Practice.jsx'
import DictPage         from './assets/components/DictPage/DictPage.jsx'
import Home             from './assets/components/Home/Home.jsx'
import MyPage           from './assets/components/MyPage/MyPage.jsx'
import TranslatePage    from './assets/components/TranslatePage/TranslatePage.jsx'

import RegisterPage        from './assets/components/RegisterPage/RegisterPage.jsx'
import RegisterPersonal    from './assets/components/RegisterPersonal/RegisterPersonal.jsx'
import RegisterImmigration from './assets/components/RegisterImmigration/RegisterImmigration.jsx'
import RegisterPolice      from './assets/components/RegisterPolice/RegisterPolice.jsx'

// ✅ 별도 폴더에서 분리된 로그인/회원가입 컴포넌트 import
import LoginPage  from './assets/components/LoginPage/LoginPage.jsx'
import SignupPage from './assets/components/SignupPage/SignupPage.jsx'

const MENUS = [
    { id: 'home',  label: '홈' },
    { id: 'practice', label: '연습하기' }, // ✅ added
    { id: 'trans', label: '번역기' },
    { id: 'dict',  label: '수어사전' },
    { id: 'about', label: 'About' },
]

const SAMPLE_NOTIFICATIONS = [
  { id: 1, icon: '📋', text: '대화 기록 REC-002가 검토되었습니다.', time: '5분 전', unread: true },
  { id: 2, icon: '✅', text: 'IMM-2025-001 신청 처리가 완료되었습니다.', time: '1시간 전', unread: true },
  { id: 3, icon: '⚠️', text: 'POL-2025-002 기록에 검토 요청이 있습니다.', time: '어제', unread: false },
]

// ── 알림 드롭다운 ──
function NotificationDropdown({ notifications, onClose, onMarkAll }) {
  const ref = useRef(null)
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
      <div className="notif-dropdown" ref={ref}>
        <div className="notif-header">
          <span className="notif-title">알림</span>
          <button className="notif-mark-all" onClick={onMarkAll}>모두 읽음</button>
        </div>
        <div className="notif-list">
          {notifications.map(n => (
              <div key={n.id} className={`notif-item ${n.unread ? 'unread' : ''}`}>
                <span className="notif-icon">{n.icon}</span>
                <div className="notif-body">
                  <div className="notif-text">{n.text}</div>
                  <div className="notif-time">{n.time}</div>
                </div>
                {n.unread && <div className="notif-dot" />}
              </div>
          ))}
        </div>
      </div>
  )
}

// ── 오른쪽 플로팅 사이드바 ──
function FloatingSidebar({ onChat, onCall }) {
  const scrollTo = (dir) =>
      window.scrollTo({ top: dir === 'top' ? 0 : document.body.scrollHeight, behavior: 'smooth' })

  return (
      <div className="floating-sidebar">
        <button className="fsb-btn fsb-scroll" onClick={() => scrollTo('top')} title="맨 위로">
        <span className="fsb-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6"/>
          </svg>
        </span>
          <span className="fsb-label">위로</span>
        </button>

        <button className="fsb-btn fsb-chat" onClick={onChat} title="채팅">
        <span className="fsb-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </span>
          <span className="fsb-label">채팅</span>
        </button>

        <button className="fsb-btn fsb-call" onClick={onCall} title="전화">
        <span className="fsb-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.42a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/>
          </svg>
        </span>
          <span className="fsb-label">전화</span>
        </button>

        <button className="fsb-btn fsb-scroll" onClick={() => scrollTo('bottom')} title="맨 아래로">
        <span className="fsb-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </span>
          <span className="fsb-label">아래</span>
        </button>
      </div>
  )
}

// ── 메인 App ──
export default function App() {
  const [tab,          setTab]          = useState('home')
  const [searchInput,  setSearchInput]  = useState('')
  const [query,        setQuery]        = useState('')
  const [convMessages, setConvMessages] = useState([])
  const [showConv,     setShowConv]     = useState(false)
  const [registerScreen, setRegisterScreen] = useState(null)

  // 인증 상태
  const [authModal,  setAuthModal]  = useState(null)  // null | 'login' | 'signup'
  const [loggedIn,   setLoggedIn]   = useState(false)
  const [userName,   setUserName]   = useState('')

  // 알림 상태
  const [notifs,     setNotifs]     = useState(SAMPLE_NOTIFICATIONS)
  const [showNotifs, setShowNotifs] = useState(false)
  const unreadCount = notifs.filter(n => n.unread).length

  const handleSearch = (e) => {
    e.preventDefault()
    setQuery(searchInput)
    setShowConv(false)
    setRegisterScreen(null)
    setTab('dict')
  }

  const handleEndConversation = (messages) => {
    setConvMessages(Array.isArray(messages) ? messages : [])
    setShowConv(true)
    setRegisterScreen(null)
  }

  const handleBackToTranslate = () => { setShowConv(false); setConvMessages([]); setRegisterScreen(null); setTab('trans') }
  const handleGoRegister = () => setRegisterScreen('registerSelect')
  const handleSelectRegisterType = (type) => setRegisterScreen(`register_${type}`)
  const handleBackToConv = () => setRegisterScreen(null)
  const handleBackFromRegisterSelect = () => setRegisterScreen(null)
  const handleLogoClick = () => { setShowConv(false); setRegisterScreen(null); setTab('home'); setQuery('') }

  // ✅ 로그인 성공 콜백
  const handleLogin = (name) => { setLoggedIn(true); setUserName(name) }
  // ✅ 회원가입 성공 콜백
  const handleSignup = (name) => { setLoggedIn(true); setUserName(name) }

  const handleLogout = () => { setLoggedIn(false); setUserName(''); setTab('home') }
  const handleMarkAllRead = () => setNotifs(ns => ns.map(n => ({ ...n, unread: false })))
  const handleQuickChat = () => { setShowConv(false); setRegisterScreen(null); setTab('trans') }
  const handleQuickCall = () => alert('전화 연결 기능은 준비 중입니다.')

  const renderMain = () => {
    if (registerScreen === 'register_personal')    return <RegisterPersonal    messages={convMessages} onBack={handleBackToConv} />
    if (registerScreen === 'register_immigration') return <RegisterImmigration messages={convMessages} onBack={handleBackToConv} />
    if (registerScreen === 'register_police')      return <RegisterPolice      messages={convMessages} onBack={handleBackToConv} />
    if (registerScreen === 'registerSelect')       return <RegisterPage messages={convMessages} onBack={handleBackFromRegisterSelect} onSelect={handleSelectRegisterType} />
    if (showConv) return <ConversationPage messages={convMessages} onBack={handleBackToTranslate} onRegister={handleGoRegister} />
    return (
        <>
            {tab === 'home'     && <Home />}
            {tab === 'practice' && <Practice />}   // ✅ HERE
            {tab === 'trans'    && <TranslatePage onEndConversation={handleEndConversation} />}
            {tab === 'dict'     && <DictPage query={query} />}
            {tab === 'about'    && <About />}
            {tab === 'my'       && <MyPage />}
        </>
    )
  }

  const isNormalTab = !showConv && !registerScreen

  return (
      <div className="app">
        {/* ── 네비바 ── */}
        <header className="navbar">
          <div className="navbar-top">
            <div className="nav-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
              <span className="nav-logo-icon">🤟</span>
              <span className="nav-logo-text">SignBridge</span>
            </div>

            <div className="nav-actions">
              {/* 검색 */}
              <form className="search-form" onSubmit={handleSearch}>
                <input className="search-input" placeholder="수어 검색..."
                       value={searchInput} onChange={e => setSearchInput(e.target.value)} />
                <button type="submit" className="search-btn">🔍</button>
              </form>

              {/* 알림 */}
              <div className="notif-wrap">
                <button className={`notif-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
                        onClick={() => setShowNotifs(v => !v)} title="알림">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                </button>
                {showNotifs && (
                    <NotificationDropdown notifications={notifs}
                                          onClose={() => setShowNotifs(false)} onMarkAll={handleMarkAllRead} />
                )}
              </div>

              {/* 로그인 상태 */}
              {loggedIn ? (
                  <div className="nav-user-group">
                    <button className="my-btn"
                            onClick={() => { setShowConv(false); setRegisterScreen(null); setTab('my') }}>
                      <div className="my-avatar">{userName.charAt(0)}</div>
                      <span>{userName}</span>
                    </button>
                    <button className="nav-logout-btn" onClick={handleLogout}>로그아웃</button>
                  </div>
              ) : (
                  <div className="nav-auth-group">
                    <button className="nav-login-btn"  onClick={() => setAuthModal('login')}>로그인</button>
                    <button className="nav-signup-btn" onClick={() => setAuthModal('signup')}>회원가입</button>
                  </div>
              )}
            </div>
          </div>

          <div className="navbar-bottom">
            <nav className="navbar-bottom-inner">
              {MENUS.map(m => (
                  <button key={m.id}
                          className={`nav-menu-btn ${(isNormalTab && tab === m.id) ? 'active' : ''}`}
                          onClick={() => { setShowConv(false); setRegisterScreen(null); setTab(m.id); setQuery('') }}>
                    {m.label}
                  </button>
              ))}
            </nav>
          </div>
        </header>

        {/* ── 본문 ── */}
        <main className="main-content">{renderMain()}</main>

        {/* ── 푸터 ── */}
        <footer className="footer">
          <span className="footer-logo">🤟 SignBridge</span>
          <span>© 2025 SignBridge Team · AI 수어 번역 시스템</span>
        </footer>

        {/* ── 오른쪽 플로팅 사이드바 ── */}
        <FloatingSidebar onChat={handleQuickChat} onCall={handleQuickCall} />

        {/* ✅ 로그인 모달 — LoginPage 컴포넌트 */}
        {authModal === 'login' && (
            <LoginPage
                onLogin={handleLogin}
                onClose={() => setAuthModal(null)}
                onSwitchToSignup={() => setAuthModal('signup')}
            />
        )}

        {/* ✅ 회원가입 모달 — SignupPage 컴포넌트 */}
        {authModal === 'signup' && (
            <SignupPage
                onSignup={handleSignup}
                onClose={() => setAuthModal(null)}
                onSwitchToLogin={() => setAuthModal('login')}
            />
        )}
      </div>
  )
}