import { useState } from 'react'
import './App.css'

import About            from './assets/components/About/About.jsx'
import ConversationPage from './assets/components/ConversationPage/ConversationPage.jsx'
import DemoPage         from './assets/components/DemoPage/DemoPage.jsx'
import DictPage         from './assets/components/DictPage/DictPage.jsx'
import Home             from './assets/components/Home/Home.jsx'
import MyPage           from './assets/components/MyPage/MyPage.jsx'
import TranslatePage    from './assets/components/TranslatePage/TranslatePage.jsx'

import RegisterPage        from './assets/components/RegisterPage/RegisterPage.jsx'
import RegisterPersonal    from './assets/components/RegisterPersonal/RegisterPersonal.jsx'
import RegisterImmigration from './assets/components/RegisterImmigration/RegisterImmigration.jsx'
import RegisterPolice      from './assets/components/RegisterPolice/RegisterPolice.jsx'

const MENUS = [
  { id: 'home',  label: '홈' },
  { id: 'demo',  label: '데모' },
  { id: 'trans', label: '번역기' },
  { id: 'dict',  label: '수어사전' },
  { id: 'about', label: 'About' },
]

export default function App() {
  const [tab,         setTab]         = useState('home')
  const [searchInput, setSearchInput] = useState('')
  const [query,       setQuery]       = useState('')

  // 대화 화면 상태
  const [convMessages, setConvMessages] = useState([])
  const [showConv,     setShowConv]     = useState(false)

  // 등록 화면 상태
  // screen: null | 'registerSelect' | 'registerPersonal' | 'registerImmigration' | 'registerPolice'
  const [registerScreen, setRegisterScreen] = useState(null)

  const handleSearch = (e) => {
    e.preventDefault()
    setQuery(searchInput)
    setShowConv(false)
    setRegisterScreen(null)
    setTab('dict')
  }

  // TranslatePage → ConversationPage
  const handleEndConversation = (messages) => {
    setConvMessages(Array.isArray(messages) ? messages : [])
    setShowConv(true)
    setRegisterScreen(null)
  }

  // ConversationPage → TranslatePage
  const handleBackToTranslate = () => {
    setShowConv(false)
    setConvMessages([])
    setRegisterScreen(null)
    setTab('trans')
  }

  // ConversationPage → RegisterPage (선택 화면)
  const handleGoRegister = () => {
    setRegisterScreen('registerSelect')
  }

  // RegisterPage에서 용도 선택
  const handleSelectRegisterType = (type) => {
    // type: 'personal' | 'immigration' | 'police'
    setRegisterScreen(`register_${type}`)
  }

  // 등록 완료 or 뒤로 → ConversationPage로
  const handleBackToConv = () => {
    setRegisterScreen(null)
  }

  // RegisterPage → ConversationPage로 뒤로
  const handleBackFromRegisterSelect = () => {
    setRegisterScreen(null)
  }

  // 로고 클릭
  const handleLogoClick = () => {
    setShowConv(false)
    setRegisterScreen(null)
    setTab('home')
    setQuery('')
  }

  // 현재 렌더할 화면 결정
  const renderMain = () => {
    // 등록 세부 화면
    if (registerScreen === 'register_personal') {
      return <RegisterPersonal messages={convMessages} onBack={handleBackToConv} />
    }
    if (registerScreen === 'register_immigration') {
      return <RegisterImmigration messages={convMessages} onBack={handleBackToConv} />
    }
    if (registerScreen === 'register_police') {
      return <RegisterPolice messages={convMessages} onBack={handleBackToConv} />
    }

    // 등록 선택 화면
    if (registerScreen === 'registerSelect') {
      return (
          <RegisterPage
              messages={convMessages}
              onBack={handleBackFromRegisterSelect}
              onSelect={handleSelectRegisterType}
          />
      )
    }

    // 대화 기록 화면
    if (showConv) {
      return (
          <ConversationPage
              messages={convMessages}
              onBack={handleBackToTranslate}
              onRegister={handleGoRegister}
          />
      )
    }

    // 일반 탭
    return (
        <>
          {tab === 'home'  && <Home />}
          {tab === 'demo'  && <DemoPage />}
          {tab === 'trans' && <TranslatePage onEndConversation={handleEndConversation} />}
          {tab === 'dict'  && <DictPage query={query} />}
          {tab === 'about' && <About />}
          {tab === 'my'    && <MyPage />}
        </>
    )
  }

  const isNormalTab = !showConv && !registerScreen

  return (
      <div className="app">
        <header className="navbar">
          <div className="navbar-top">
            <div className="nav-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
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
              <button className="my-btn" onClick={() => { setShowConv(false); setRegisterScreen(null); setTab('my') }}>
                <div className="my-avatar">나</div>
                <span>마이</span>
              </button>
            </div>
          </div>

          <div className="navbar-bottom">
            <nav className="navbar-bottom-inner">
              {MENUS.map(m => (
                  <button
                      key={m.id}
                      className={`nav-menu-btn ${(isNormalTab && tab === m.id) ? 'active' : ''}`}
                      onClick={() => { setShowConv(false); setRegisterScreen(null); setTab(m.id); setQuery('') }}
                  >
                    {m.label}
                  </button>
              ))}
            </nav>
          </div>
        </header>

        <main className="main-content">
          {renderMain()}
        </main>

        <footer className="footer">
          <span className="footer-logo">🤟 SignBridge</span>
          <span>© 2025 SignBridge Team · AI 수어 번역 시스템</span>
        </footer>
      </div>
  )
}