import { useState, useEffect, useRef } from 'react'
import './App.css'
import SignBridgeLogo from './assets/SignBridge.png'
import { commonApi } from './assets/components/api/api.jsx';
import About            from './assets/components/About/About.jsx'
import ConversationPage from './assets/components/ConversationPage/ConversationPage.jsx'
import Practice         from './assets/components/Practice/Practice.jsx'
import DictPage         from './assets/components/DictPage/DictPage.jsx'
import Home             from './assets/components/Home/Home.jsx'
import MyPage           from './assets/components/MyPage/MyPage.jsx'
import TranslatePage    from './assets/components/TranslatePage/TranslatePage.jsx'
import chatService from './assets/components/ChatPage/chatService'
import AIChat from './assets/components/AI/AIChat'
import RegisterPersonal    from './assets/components/RegisterPersonal/RegisterPersonal.jsx'
import RegisterImmigration from './assets/components/RegisterImmigration/RegisterImmigration.jsx'
import RegisterPolice      from './assets/components/RegisterPolice/RegisterPolice.jsx'
import LoginPage  from './assets/components/LoginPage/LoginPage.jsx'
import SignupPage from './assets/components/SignupPage/SignupPage.jsx'
import DemoPage    from "./assets/components/DemoPage/DemoPage.jsx";
import Community  from './assets/components/Community/Community.jsx'
import ChatRoom from './assets/components/ChatPage/ChatRoom.jsx'

const MENUS = [
    { id: 'home',      label: '홈' },
    { id: 'practice',  label: '연습하기' },
    { id: 'trans',     label: '번역기' },
    { id: 'dict',      label: '수어사전' },
    { id: 'community', label: '커뮤니티' },
    { id: 'about',     label: 'About' },
]

const SAMPLE_NOTIFICATIONS = [
    { id: 1, icon: '📋', text: '대화 기록 REC-002가 검토되었습니다.',       time: '5분 전',  unread: true  },
    { id: 2, icon: '✅', text: 'IMM-2025-001 신청 처리가 완료되었습니다.',   time: '1시간 전', unread: true  },
    { id: 3, icon: '⚠️', text: 'POL-2025-002 기록에 검토 요청이 있습니다.', time: '어제',    unread: false },
]

function NotificationDropdown({ notifications, onClose, onMarkAll }) {
    const ref = useRef(null)
    const [status, setStatus] = useState('')
    useEffect(() => {
        commonApi.getStatus()
            .then(data => setStatus(`${data.project} 서버 상태: ${data.status}`))
            .catch(err => console.error("연결 실패:", err));
    }, []);
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

function FloatingSidebar({ onChat, onCall, onAiChat, chatUnread = 0 }) {
    const scrollTo = (dir) =>
        window.scrollTo({ top: dir === 'top' ? 0 : document.body.scrollHeight, behavior: 'smooth' })
    return (
        <div className="floating-sidebar">
            <button className="fsb-btn fsb-scroll" onClick={() => scrollTo('top')} title="맨 위로">
                <span className="fsb-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
                </span>
                <span className="fsb-label">위로</span>
            </button>
            <button className="fsb-btn fsb-chat" onClick={onChat} title="채팅" style={{position:'relative'}}>
                <span className="fsb-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </span>
                {chatUnread > 0 && (
                    <span style={{
                        position:'absolute', top:6, right:6,
                        background:'#ef4444', color:'#fff',
                        borderRadius:'50%', width:18, height:18,
                        fontSize:11, fontWeight:700,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        lineHeight:1, border:'2px solid #fff',
                    }}>{chatUnread > 99 ? '99+' : chatUnread}</span>
                )}
                <span className="fsb-label">채팅</span>
            </button>
            <button className="fsb-btn fsb-call" onClick={onCall} title="전화">
                <span className="fsb-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.42a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/></svg>
                </span>
                <span className="fsb-label">전화</span>
            </button>
            <button className="fsb-btn fsb-ai" onClick={onAiChat} title="AI 채팅">
                <span className="fsb-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="14" rx="3"/><path d="M8 21h8M12 17v4"/><path d="M8 8h8M8 11h5"/></svg>
                </span>
                <span className="fsb-label">AI</span>
            </button>
            <button className="fsb-btn fsb-scroll" onClick={() => scrollTo('bottom')} title="맨 아래로">
                <span className="fsb-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                </span>
                <span className="fsb-label">아래</span>
            </button>
        </div>
    )
}

export default function App() {
    const [tab,            setTab]            = useState('home')
    const [showDemo,       setShowDemo]       = useState(false)
    const [showAbout,      setShowAbout]      = useState(false)
    const [searchInput,    setSearchInput]    = useState('')
    const [query,          setQuery]          = useState('')
    const [convMessages,   setConvMessages]   = useState([])
    const [convVideoBlobs, setConvVideoBlobs] = useState([])
    const [convVideos,     setConvVideos]     = useState([])
    const [showConv,       setShowConv]       = useState(false)
    const [registerScreen, setRegisterScreen] = useState(null)
    const [chatInitialRoom, setChatInitialRoom] = useState(null)

    const [authModal,    setAuthModal]    = useState(null)
    const [loggedIn,     setLoggedIn]     = useState(false)
    const [displayName,  setDisplayName]  = useState('')
    const [orgType,      setOrgType]      = useState('')
    const [userEmail,    setUserEmail]    = useState('')
    const [communityProfile, setCommunityProfile] = useState(null)
    const [userProfile,  setUserProfile]  = useState(null)

    const [notifs,     setNotifs]     = useState(SAMPLE_NOTIFICATIONS)
    const unreadCount = notifs.filter(n => n.unread).length

    const [showChat,    setShowChat]    = useState(false)
    const [showAiChat,  setShowAiChat]  = useState(false)
    const [chatUnread,  setChatUnread]  = useState(0)   // ← unread count from ChatRoom

    const chatRoomRefreshRef = useRef(null)
    const navLabel = displayName.length > 6 ? displayName.slice(0, 6) + '…' : displayName

    const loadProfile = (email) => {
        fetch(`http://localhost:8080/api/mypage/profile/${encodeURIComponent(email)}`)
            .then(r => r.json())
            .then(data => setUserProfile(data))
            .catch(() => {})
    }

    useEffect(() => {
        const savedEmail = localStorage.getItem('userEmail');
        const savedName  = localStorage.getItem('displayName');
        const savedType  = localStorage.getItem('orgType');
        if (savedEmail && savedName) {
            setUserEmail(savedEmail);
            setDisplayName(savedName);
            setOrgType(savedType || '');
            setLoggedIn(true);
            loadProfile(savedEmail)
        }
    }, []);

    useEffect(() => {
        chatService.connect('http://localhost:8080')
        return () => chatService.disconnect()
    }, [])

    const handleSearch = (e) => {
        e.preventDefault()
        setQuery(searchInput)
        setShowConv(false)
        setRegisterScreen(null)
        setTab('dict')
    }

    const handleEndConversation = (messages, videoBlob) => {
        setConvMessages(Array.isArray(messages) ? messages : [])
        setRegisterScreen(null)
        if (videoBlob) {
            setConvVideoBlobs(prev => {
                const next = [...prev, videoBlob]
                setTimeout(() => setShowConv(true), 0)
                return next
            })
        } else {
            setShowConv(true)
        }
    }

    const handleBackToTranslate = () => { setShowConv(false); setRegisterScreen(null); setTab('trans') }
    const handleGoRegister = (videos) => {
        if (videos && Array.isArray(videos)) setConvVideos(videos)
        const type = orgType || 'personal'
        setRegisterScreen(`register_${type}`)
    }
    }

    const handleLogin = (name, type, email) => {
        setDisplayName(name);
        setOrgType(type || '');
        setUserEmail(email || '');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('displayName', name);
        localStorage.setItem('orgType', type || '');
        setLoggedIn(true);
        setAuthModal(null);
        loadProfile(email)
    }

    const handleSignup = (name, type) => {
        setDisplayName(name)
        setOrgType(type || '')
    }

    const handleLogout = () => {
        setLoggedIn(false)
        setDisplayName('')
        setOrgType('')
        setUserEmail('')
        setUserProfile(null)
        setChatUnread(0)
        setTab('home')
        localStorage.removeItem('userEmail');
        localStorage.removeItem('displayName');
        localStorage.removeItem('orgType');
        Object.keys(localStorage)
            .filter(k => k.startsWith('sb_my_nickname_') || k.startsWith('sb_my_photo_'))
            .forEach(k => localStorage.removeItem(k))
    }

    const handleQuickChat = () => {
        if (!loggedIn) { setAuthModal('login') }
        else { setShowChat(true) }
    }

    const handleCommunityChat = (room) => {
        if (!loggedIn) { setAuthModal('login'); return }
        setChatInitialRoom(room)
        setShowChat(true)
    }

    const handleQuickCall   = () => alert('전화 연결 기능은 준비 중입니다.')
    const handleQuickAiChat = () => setShowAiChat(v => !v)

    // ── 커뮤니티에서 채팅 시작 ──
    const handleCommunityChat = (room) => {
        setChatInitialRoom(room)
        setShowChat(true)
    }

    const renderMain = () => {
        if (registerScreen === 'register_personal')
            return <RegisterPersonal messages={convMessages} videos={convVideos}
                userEmail={userEmail} displayName={displayName} />
        if (showConv)
            return <ConversationPage messages={convMessages} videoBlobs={convVideoBlobs}
                onBack={handleBackToTranslate} onRegister={handleGoRegister}
                orgType={orgType} userEmail={userEmail} place={orgType || 'immigration'}
                onVideosChange={setConvVideos} />
        if (showDemo)  return <DemoPage onBack={() => { setShowDemo(false); setTab('home') }} />
        if (showAbout) return <About onBack={() => { setShowAbout(false); setTab('home') }} />
        if (tab === 'home')      return <Home onDemo={() => setShowDemo(true)} onAbout={() => setShowAbout(true)} onCommunity={() => setTab('community')} onPractice={() => setTab('practice')} onTranslate={() => setTab('trans')} />
        if (tab === 'practice')  return <Practice />
        if (tab === 'trans')     return <TranslatePage onEndConversation={handleEndConversation} place={orgType || 'immigration'} userEmail={userEmail} initialMessages={convMessages} onLoginRequired={() => setAuthModal('login')} />
        if (tab === 'dict')      return <DictPage query={query} />
        if (tab === 'community') return (
            <Community
                userEmail={userEmail}
                displayName={displayName}
                onLoginRequired={() => setAuthModal('login')}
                myProfile={communityProfile}
                onProfileSave={setCommunityProfile}
                onChat={handleCommunityChat}
            />
        )
        if (tab === 'about') return <About onBack={() => setTab('home')} />
        if (tab === 'my') return (
            <MyPage
                displayName={displayName}
                orgType={orgType}
                userEmail={userEmail}
                communityProfile={communityProfile}
                onCommunityProfileSave={setCommunityProfile}
                onProfileUpdate={setUserProfile}
            />
        )
        return null
    }

    const isNormalTab = !showConv && !registerScreen && !showDemo && !showAbout

    return (
        <div className="app">
            <header className="navbar">
                <div className="navbar-top">
                    <div className="nav-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
                        <img src={SignBridgeLogo} alt="SignBridge" className="nav-logo-icon" />
                        <span className="nav-logo-text">SignBridge</span>
                    </div>
                    <div className="nav-actions">
                        <form className="search-form" onSubmit={handleSearch}>
                            <input className="search-input" placeholder="수어 검색..."
                                   value={searchInput} onChange={e => setSearchInput(e.target.value)} />
                            <button type="submit" className="search-btn">🔍</button>
                        </form>
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
                        {loggedIn ? (
                            <div className="nav-user-group">
                                <button className="my-btn"
                                    onClick={() => { setShowConv(false); setRegisterScreen(null); setShowDemo(false); setShowAbout(false); setTab('my') }}>
                                    <div className="my-avatar">{displayName.charAt(0)}</div>
                                    <span>{navLabel}</span>
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
                        {/* ← 뒤로가기 버튼 */}
                        {(showConv || registerScreen || showDemo || showAbout) && (
                            <button
                                className="nav-back-btn"
                                onClick={() => {
                                    if (registerScreen) { setRegisterScreen(null); return }
                                    if (showConv)  { setShowConv(false); setTab('trans'); return }
                                    if (showDemo)  { setShowDemo(false); setTab('home'); return }
                                    if (showAbout) { setShowAbout(false); setTab('home'); return }
                                }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                                    <path d="M15 18l-6-6 6-6"/>
                                </svg>
                                뒤로
                            </button>
                        )}
                        {MENUS.map(m => (
                            <button key={m.id}
                                className={`nav-menu-btn ${(isNormalTab && tab === m.id) || (showAbout && m.id === 'about') ? 'active' : ''}`}
                                onClick={() => { setShowConv(false); setRegisterScreen(null); setShowDemo(false); setShowAbout(false); setTab(m.id); setQuery('') }}>
                                {m.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            <main className="main-content">{renderMain()}</main>

            <footer className="footer">
                <span className="footer-logo"><img src={SignBridgeLogo} alt="SignBridge" className="footer-logo-icon" />SignBridge</span>
                <span>© 2025 SignBridge Team · AI 수어 번역 시스템</span>
            </footer>

            <FloatingSidebar
                onChat={handleQuickChat}
                onCall={handleQuickCall}
                onAiChat={handleQuickAiChat}
                chatUnread={chatUnread}
            />

            {loggedIn && (
                <ChatRoom
                    visible={showChat}
                    onClose={() => { setShowChat(false); setChatInitialRoom(null) }}
                    myEmail={userEmail}
                    myName={displayName}
                    initialRoom={chatInitialRoom}
                    profile={userProfile}
                    onRegisterRefresh={(fn) => { chatRoomRefreshRef.current = fn }}
                    onUnreadChange={setChatUnread}
                />
            )}

            {showAiChat && (
                <AIChat
                    onClose={() => setShowAiChat(false)}
                    loggedIn={loggedIn}
                    displayName={displayName}
                />
            )}

            {authModal === 'login' && (
                <LoginPage
                    displayName={displayName}
                    orgType={orgType}
                    onLogin={handleLogin}
                    onClose={() => setAuthModal(null)}
                    onSwitchToSignup={() => setAuthModal('signup')}
                />
            )}

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