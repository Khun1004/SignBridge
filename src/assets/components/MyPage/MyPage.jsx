import { useState, useEffect } from 'react'
import './MyPage.css'
import Registration from '../Registration/Registration.jsx'
import ImmigrationCasePage from '../My/ImmigrationCasePage/ImmigrationCasePage.jsx'
import PoliceCasePage      from '../My/PoliceCasePage/PoliceCasePage.jsx'
import {
    myPageApi, immigrationApi, policeApi, personalApi, conversationApi, communityApi
} from '../../../assets/components/api/api.jsx'

const ORG_META = {
    immigration: { icon: '🛂', label: '출입국외국인사무소', color: '#7c3aed' },
    airport:     { icon: '✈️', label: '공항',              color: '#0891b2' },
    hospital:    { icon: '🏥', label: '병원',              color: '#059669' },
    police:      { icon: '👮', label: '경찰서',            color: '#dc2626' },
}

const USAGE_TYPES = [
    { id: 'personal',    icon: '👤', label: '개인용',            badge: 'PERSONAL',   sub: '내 대화 기록 및 프로필 관리',  color: '#2563eb' },
    { id: 'immigration', icon: '🛂', label: '출입국외국인사무소', badge: 'IMMIGRATION', sub: '청각장애인 신청인 목록 조회',  color: '#7c3aed' },
    { id: 'police',      icon: '👮', label: '경찰서',            badge: 'POLICE',      sub: '청각장애인 당사자 목록 조회', color: '#dc2626' },
]

function ArrowIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
    )
}

function DeleteConfirm({ msg, onConfirm, onCancel }) {
    return (
        <div className="mp-del-overlay" onClick={onCancel}>
            <div className="mp-del-modal" onClick={e => e.stopPropagation()}>
                <div className="mp-del-icon">🗑️</div>
                <p className="mp-del-msg">{msg}</p>
                <div className="mp-del-actions">
                    <button className="mp-del-cancel" onClick={onCancel}>취소</button>
                    <button className="mp-del-ok"     onClick={onConfirm}>삭제</button>
                </div>
            </div>
        </div>
    )
}

function PersonalMyPage({ displayName, profile, userEmail, communityProfile, onCommunityProfileSave, onProfileUpdate }) {
    const [activeTab,   setActiveTab]   = useState('등록기록')
    const [cases,       setCases]       = useState([])
    const [loading,     setLoading]     = useState(true)
    const [delTarget,   setDelTarget]   = useState(null)
    const [modalVid,    setModalVid]    = useState(null)
    const [delLoading,  setDelLoading]  = useState(false)

    const [editMode,    setEditMode]    = useState(false)
    const [editName,    setEditName]    = useState('')
    const [editGrade,   setEditGrade]   = useState('')
    const [editSign,    setEditSign]    = useState('')
    const [editSaving,  setEditSaving]  = useState(false)
    const [editError,   setEditError]   = useState('')
    const [editAddress,       setEditAddress]       = useState('')
    const [editAddressDetail, setEditAddressDetail] = useState('')
    const [editZonecode,      setEditZonecode]      = useState('')

    // Community — list of ALL user's posts
    const [myPosts,     setMyPosts]     = useState([])
    const [myProfile,   setMyProfile]   = useState(communityProfile)
    const [showCmEdit,  setShowCmEdit]  = useState(false)
    const [editingPost, setEditingPost] = useState(null)

    // Load all community posts for this user
    useEffect(() => {
        if (!userEmail) return
        fetch(`/api/community/members/me?email=${encodeURIComponent(userEmail)}`)
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setMyPosts(data)
                    const first = data[0]
                    const p = {
                        ...first,
                        contact: { type: first.contactType, value: first.contactValue },
                        avatar: first.name?.charAt(0) || '?',
                    }
                    setMyProfile(p)
                    onCommunityProfileSave?.(p)
                }
            })
            .catch(() => {})
    }, [userEmail])

    const TABS = ['등록기록', '커뮤니티', '프로필']

    const loadData = async () => {
        if (!userEmail) { setLoading(false); return }
        setLoading(true)
        try {
            const data = await personalApi.getCases(userEmail)
            setCases(data || [])
        } catch (e) {
            console.error('[MyPage load]', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadData() }, [userEmail])

    const openEdit = () => {
        setEditName(profile?.name    || displayName || '')
        setEditGrade(profile?.disabilityGrade || '')
        setEditSign(profile?.preferredSign    || '')
        setEditAddress(profile?.address       || '')
        setEditAddressDetail(profile?.addressDetail || '')
        setEditZonecode(profile?.zonecode     || '')
        setEditError('')
        setEditMode(true)
    }

    const openAddressSearch = () => {
        if (!window.daum || !window.daum.Postcode) {
            const script = document.createElement('script')
            script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
            script.onload = () => {
                new window.daum.Postcode({
                    oncomplete: (data) => {
                        setEditAddress(data.roadAddress || data.jibunAddress)
                        setEditZonecode(data.zonecode)
                        setEditAddressDetail('')
                    }
                }).open()
            }
            document.head.appendChild(script)
        } else {
            new window.daum.Postcode({
                oncomplete: (data) => {
                    setEditAddress(data.roadAddress || data.jibunAddress)
                    setEditZonecode(data.zonecode)
                    setEditAddressDetail('')
                }
            }).open()
        }
    }

    const handleSaveProfile = async () => {
        if (!editName.trim()) { setEditError('이름을 입력해 주세요.'); return }
        setEditSaving(true); setEditError('')
        try {
            await myPageApi.updateProfile(userEmail, {
                name:            editName.trim(),
                disabilityGrade: editGrade.trim(),
                preferredSign:   editSign.trim(),
                address:         editAddress.trim(),
                addressDetail:   editAddressDetail.trim(),
                zonecode:        editZonecode.trim(),
            })
            const updated = {
                ...profile,
                name:            editName.trim(),
                disabilityGrade: editGrade.trim(),
                preferredSign:   editSign.trim(),
                address:         editAddress.trim(),
                addressDetail:   editAddressDetail.trim(),
                zonecode:        editZonecode.trim(),
            }
            onProfileUpdate?.(updated)
            setEditMode(false)
        } catch (e) {
            setEditError(`저장 실패: ${e.message}`)
        } finally {
            setEditSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!delTarget) return
        setDelLoading(true)
        try {
            if (delTarget.type === 'case') {
                await personalApi.deleteCase(delTarget.id)
                setCases(prev => prev.filter(c => c.id !== delTarget.id))
            } else if (delTarget.type === 'session') {
                await personalApi.deleteSession(delTarget.sessionId)
                setCases(prev => prev.filter(c => c.sessionId !== delTarget.sessionId))
            }
        } catch (e) {
            alert(`삭제 실패: ${e.message}`)
        } finally {
            setDelLoading(false)
            setDelTarget(null)
        }
    }

    const handleDeletePost = async (post) => {
        if (!window.confirm('이 게시물을 삭제할까요?')) return
        try {
            const res = await fetch(
                `/api/community/members/${post.id}?email=${encodeURIComponent(userEmail)}`,
                { method: 'DELETE' }
            )
            if (!res.ok) throw new Error('삭제 실패')
            const remaining = myPosts.filter(p => p.id !== post.id)
            setMyPosts(remaining)
            if (remaining.length === 0) {
                setMyProfile(null)
                onCommunityProfileSave?.(null)
            }
        } catch(e) {
            alert('삭제에 실패했습니다.')
        }
    }

    const name   = profile?.name    || displayName || '사용자'
    const email  = profile?.email   || userEmail   || '-'
    const joined = profile?.joinedAt
        ? new Date(profile.joinedAt).toLocaleDateString('ko-KR') : '-'

    return (
        <div className="mp-personal">
            <div className="mp-profile-hero">
                <div className="mp-avatar">{name.charAt(0)}</div>
                <div className="mp-hero-info">
                    <div className="mp-hero-name">{name}</div>
                    <div className="mp-hero-email">{email}</div>
                    <div className="mp-hero-badges">
                        <span className="mp-badge mp-badge-blue">👤 개인 사용자</span>
                        <span className="mp-badge mp-badge-gray">가입일 {joined}</span>
                    </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div className="mp-hero-stats">
                        <div className="mp-hero-stat">
                            <span className="mp-hero-stat-val">{cases.length}</span>
                            <span className="mp-hero-stat-lbl">등록 기록</span>
                        </div>
                    </div>
                    <button className="mp-edit-profile-btn" onClick={openEdit}>✏️ 프로필 수정</button>
                </div>
            </div>

            <div className="my-tabs">
                {TABS.map(t => (
                    <button key={t}
                            className={`my-tab ${activeTab === t ? 'active' : ''}`}
                            onClick={() => setActiveTab(t)}>{t}</button>
                ))}
            </div>

            {loading && <div className="records-empty">⏳ 불러오는 중...</div>}

            {/* 등록기록 탭 */}
            {!loading && activeTab === '등록기록' && (
                <div className="tab-content">
                    {cases.length === 0 ? (
                        <div className="records-empty">
                            📋 등록된 기록이 없습니다.<br/>
                            <span style={{fontSize:12,color:'#aaa'}}>
                                대화 기록 화면 → 등록하기 → 개인용을 선택하면 여기에 저장됩니다.
                            </span>
                        </div>
                    ) : (
                        cases.map((c, i) => (
                            <div key={c.id ?? i} className="record-card">
                                <div className="record-top">
                                    <div className="record-id">CASE-{String(c.id ?? i+1).padStart(3,'0')}</div>
                                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                                        <div className="record-status status-ok">✅ 등록됨</div>
                                        <button className="mp-del-btn"
                                            onClick={() => setDelTarget({ type:'case', id: c.id,
                                                msg:`CASE-${String(c.id).padStart(3,'0')} 기록을 삭제하시겠습니까?` })}>
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="record-info">
                                <span>👤 {c.name || '-'}</span>
                                <span>📅 {c.createdAt || '-'}</span>
                                <span>💬 {c.messageCount || 0}개 메시지</span>
                                {c.videoIds?.length > 0 && <span>🎬 영상 {c.videoIds.length}개</span>}
                            </div>
                            {c.memo && (
                                <div className="record-preview">
                                    <span className="sign-chip personal-chip">{c.memo}</span>
                                </div>
                                {c.memo && (
                                    <div className="record-preview">
                                        <span className="sign-chip personal-chip">{c.memo}</span>
                                    </div>
                                )}
                                {c.messages?.length > 0 && (
                                    <div className="mp-chat-list" style={{marginTop:8}}>
                                        {c.messages.map((msg, mi) => (
                                            <div key={mi} className={`mp-chat-msg mp-chat-${msg.msgType}`}>
                                                <div className="mp-chat-avatar">
                                                    {msg.msgType === 'sign' ? '🧏' : '🙋'}
                                                </div>
                                                <div className="mp-chat-bubble-wrap">
                                                    <div className="mp-chat-who">
                                                        {msg.msgType === 'sign' ? '청각장애인' : '담당자'}
                                                    </div>
                                                    <div className="mp-chat-bubble">{msg.content || '-'}</div>
                                                    <div className="mp-chat-time">{msg.sentAt || ''}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {(() => {
                                    const allVids = c.videoIds?.length > 0
                                        ? c.videoIds : c.videoId ? [c.videoId] : []
                                    if (allVids.length === 0) return null
                                    return (
                                        <div className="mp-video-section">
                                            <div className="mp-video-section-hd">
                                                🎬 녹화 영상
                                                <span className="mp-video-section-count">{allVids.length}개</span>
                                            </div>
                                            <div className="mp-video-grid">
                                                {allVids.map((vid, vi) => {
                                                    const url = conversationApi.getVideoUrl(vid)
                                                    return (
                                                        <div key={vid} className="mp-video-card">
                                                            <div className="mp-video-thumb"
                                                                 onClick={() => setModalVid({ url, idx: vi })}>
                                                                <video src={url} className="mp-video-thumb-player"
                                                                    preload="metadata" muted playsInline/>
                                                                <div className="mp-video-thumb-overlay">
                                                                    <div className="mp-video-play-btn">▶</div>
                                                                </div>
                                                                <div className="mp-video-thumb-label">영상 {vi + 1}</div>
                                                            </div>
                                                            <div className="mp-video-card-actions">
                                                                <button className="mp-video-action-btn mp-video-action-play"
                                                                    onClick={() => setModalVid({ url, idx: vi })}>
                                                                    ▶ 재생
                                                                </button>
                                                                <a href={url} download={`signbridge_녹화_${vid}.webm`}
                                                                    className="mp-video-action-btn mp-video-action-dl">
                                                                    ⬇ 저장
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {(() => {
                                const allVids = c.videoIds?.length > 0
                                    ? c.videoIds : c.videoId ? [c.videoId] : []
                                if (allVids.length === 0) return null
                                return (
                                    <div className="mp-video-section">
                                        <div className="mp-video-section-hd">
                                            🎬 녹화 영상
                                            <span className="mp-video-section-count">{allVids.length}개</span>
                                        </div>
                                        <div className="mp-video-grid">
                                            {allVids.map((vid, vi) => {
                                                const url = conversationApi.getVideoUrl(vid)
                                                return (
                                                    <div key={vid} className="mp-video-card">
                                                        <div className="mp-video-thumb"
                                                             onClick={() => setModalVid({ url, idx: vi })}>
                                                            <video src={url} className="mp-video-thumb-player"
                                                                   preload="metadata" muted playsInline/>
                                                            <div className="mp-video-thumb-overlay">
                                                                <div className="mp-video-play-btn">▶</div>
                                                            </div>
                                                            <div className="mp-video-thumb-label">영상 {vi+1}</div>
                                                        </div>
                                                        <div className="mp-video-card-actions">
                                                            <button className="mp-video-action-btn mp-video-action-play"
                                                                    onClick={() => setModalVid({ url, idx: vi })}>▶ 재생</button>
                                                            <a href={url} download={`signbridge_${vid}.webm`}
                                                               className="mp-video-action-btn mp-video-action-dl">⬇ 저장</a>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>
                    ))}
                </div>
            )}

            {/* 커뮤니티 탭 — Edit view */}
            {activeTab === '커뮤니티' && showCmEdit && editingPost && (
                <div className="tab-content" style={{padding:0}}>
                    <Registration
                        defaultName={displayName}
                        initialData={editingPost}
                        existingChatId={editingPost?.chatId || ''}
                        isEdit={true}
                        onBack={() => { setShowCmEdit(false); setEditingPost(null) }}
                        onSubmit={async (form) => {
                            try {
                                const body = {
                                    name: form.name || displayName,
                                    userEmail,
                                    role: form.role,
                                    region: form.region,
                                    intro: form.intro,
                                    experience: form.experience,
                                    speciality: form.speciality,
                                    contactType: form.contactType,
                                    contactValue: form.contactType === 'signbridge'
                                        ? editingPost.chatId
                                        : form.contactValue,
                                    publicProfile: form.publicProfile,
                                    certFileNames: (form.certFiles||[]).map(f=>f.name||f),
                                }
                                const res = await fetch(`/api/community/members/${editingPost.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(body),
                                })
                                const saved = await res.json()
                                setMyPosts(prev => prev.map(p => p.id === saved.id ? saved : p))
                                onCommunityProfileSave?.({
                                    ...saved,
                                    contact: { type: saved.contactType, value: saved.contactValue },
                                    avatar: saved.name?.charAt(0) || '?',
                                })
                            } catch(e) {
                                alert('수정에 실패했습니다.')
                            }
                            setShowCmEdit(false)
                            setEditingPost(null)
                        }}
                    />
                </div>
            )}

            {/* 커뮤니티 탭 — List view */}
            {activeTab === '커뮤니티' && !showCmEdit && (
                <div className="tab-content">
                    {myPosts.length === 0 ? (
                        <div className="cm-mypage-empty">
                            <div style={{fontSize:40}}>🤟</div>
                            <p style={{margin:'8px 0 4px',fontWeight:700,color:'#333'}}>
                                커뮤니티 게시물이 없습니다
                            </p>
                            <p style={{fontSize:13,color:'#888',margin:0}}>
                                커뮤니티 메뉴에서 + 등록하기를 눌러 등록하세요
                            </p>
                        </div>
                    ) : myPosts.map(post => (
                        <div key={post.id} className="cm-mypage-card" style={{marginBottom:16}}>
                            <div className="cm-mypage-card-top">
                                <div className="cm-mypage-avatar">{post.name?.charAt(0) || '?'}</div>
                                <div style={{flex:1}}>
                                    <div className="cm-mypage-name">{post.name}</div>
                                    {post.chatId && (
                                        <div style={{fontSize:12,color:'#6366f1',fontWeight:600}}>
                                            @{post.chatId}
                                        </div>
                                    )}
                                    <div style={{display:'flex',gap:6,marginTop:4,flexWrap:'wrap'}}>
                                        <span className="cm-role-badge">{post.role}</span>
                                        <span className="cm-region-badge">📍 {post.region}</span>
                                        <span className="cm-region-badge">
                                            {post.publicProfile===false ? '🔒 비공개' : '🌐 공개'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {post.intro && (
                                <div className="cm-mypage-intro-box">
                                    <div className="cm-mypage-intro-label">자기소개</div>
                                    <p className="cm-mypage-intro-text">{post.intro}</p>
                                </div>
                            )}
                            {post.experience && (
                                <div className="cm-mypage-intro-box">
                                    <div className="cm-mypage-intro-label">경력</div>
                                    <p className="cm-mypage-intro-text">{post.experience}</p>
                                </div>
                            )}
                            {post.speciality && (
                                <div className="cm-mypage-intro-box">
                                    <div className="cm-mypage-intro-label">전문 분야</div>
                                    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:2}}>
                                        {post.speciality.split(',').map((s,i) => (
                                            <span key={i} style={{
                                                background:'#f0fdf4',border:'1px solid #bbf7d0',
                                                borderRadius:20,padding:'3px 10px',
                                                fontSize:12,fontWeight:600,color:'#059669'
                                            }}>{s.trim()}</span>
                                        ))}
                                    </div>
                                    {profile.chatId && (
                                        <div className="cm-mypage-intro-box">
                                            <div className="cm-mypage-intro-label">커뮤니티 ID</div>
                                            <p className="cm-mypage-intro-text">@{profile.chatId}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div style={{display:'flex',gap:8,marginTop:12}}>
                                <button
                                    onClick={() => { setEditingPost(post); setShowCmEdit(true) }}
                                    style={{flex:1,padding:'10px 0',background:'#6366f1',color:'#fff',
                                        border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer'}}>
                                    ✏️ 수정
                                </button>
                                <button
                                    onClick={() => handleDeletePost(post)}
                                    style={{flex:1,padding:'10px 0',background:'#ef4444',color:'#fff',
                                        border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer'}}>
                                    🗑 삭제
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 프로필 탭 */}
            {!loading && activeTab === '프로필' && (
                <div className="tab-content">
                    <div className="profile-grid">
                        <div className="profile-card">
                            <div className="profile-card-title">🪪 기본 정보</div>
                            <div className="profile-rows">
                                {[
                                    ['이름',        profile?.name    || displayName || '-'],
                                    ['이메일',      email],
                                    ['사용자 유형',  '개인 사용자'],
                                    ['가입일',      joined],
                                    ['장애 등급',   profile?.disabilityGrade || '-'],
                                    ['주 사용 수어', profile?.preferredSign   || '-'],
                                ].map(([k, v]) => (
                                    <div className="profile-row" key={k}>
                                        <span>{k}</span><span>{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="profile-card">
                            <div className="profile-card-title">📍 주소 정보</div>
                            <div className="profile-rows">
                                {[
                                    ['주소',    profile?.address       || '-'],
                                    ['상세주소', profile?.addressDetail || '-'],
                                    ['우편번호', profile?.zonecode      || '-'],
                                ].map(([k, v]) => (
                                    <div className="profile-row" key={k}>
                                        <span>{k}</span><span>{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div style={{display:'flex',justifyContent:'center',marginTop:12}}>
                        <button className="mp-edit-profile-btn" onClick={openEdit}>✏️ 프로필 수정하기</button>
                    </div>
                </div>
            )}

            {/* 프로필 수정 모달 */}
            {editMode && (
                <div className="mp-modal-overlay" onClick={() => setEditMode(false)}>
                    <div className="mp-modal" onClick={e => e.stopPropagation()}>
                        <div className="mp-modal-hd">
                            <span>✏️ 프로필 수정</span>
                            <button className="mp-modal-close" onClick={() => setEditMode(false)}>✕</button>
                        </div>
                        <div className="mp-modal-body">
                            <div className="mp-edit-form">
                                <div className="mp-edit-section-label">기본 정보</div>
                                <div className="mp-edit-field">
                                    <label className="mp-edit-label">이름 <span style={{color:'#ef4444'}}>*</span></label>
                                    <input className="mp-edit-input" value={editName}
                                           onChange={e => setEditName(e.target.value)} placeholder="이름 입력"/>
                                </div>
                                <div className="mp-edit-field">
                                    <label className="mp-edit-label">장애 등급</label>
                                    <input className="mp-edit-input" value={editGrade}
                                           onChange={e => setEditGrade(e.target.value)} placeholder="예: 청각장애 1급"/>
                                </div>
                                <div className="mp-edit-field">
                                    <label className="mp-edit-label">주로 사용하는 수어</label>
                                    <select className="mp-edit-input" value={editSign}
                                            onChange={e => setEditSign(e.target.value)}>
                                        <option value="">선택</option>
                                        <option>한국수어</option>
                                        <option>미국수어(ASL)</option>
                                        <option>국제수어(ISL)</option>
                                        <option>기타</option>
                                    </select>
                                </div>
                                <div className="mp-edit-section-label" style={{marginTop:16}}>주소 정보</div>
                                <div className="mp-edit-field">
                                    <label className="mp-edit-label">주소</label>
                                    <div style={{display:'flex', gap:8}}>
                                        <input className="mp-edit-input" value={editAddress} readOnly
                                            placeholder="주소 검색 버튼을 눌러주세요"
                                            style={{flex:1, background:'#f9fafb', cursor:'pointer'}}
                                            onClick={openAddressSearch}/>
                                        <button className="mp-addr-search-btn" onClick={openAddressSearch} type="button">
                                            🔍 검색
                                        </button>
                                    </div>
                                    {editZonecode && (
                                        <span style={{fontSize:11,color:'#6b7280',marginTop:4,display:'block'}}>
                                            우편번호: {editZonecode}
                                        </span>
                                    )}
                                </div>
                                <div className="mp-edit-field">
                                    <label className="mp-edit-label">상세주소</label>
                                    <input className="mp-edit-input" value={editAddressDetail}
                                        onChange={e => setEditAddressDetail(e.target.value)}
                                        placeholder="상세주소 입력 (동/호수 등)"/>
                                </div>
                                {editError && <div className="mp-edit-error">⚠️ {editError}</div>}
                            </div>
                            <button className="mp-edit-save-btn" onClick={handleSaveProfile} disabled={editSaving}>
                                {editSaving ? '⏳ 저장 중...' : '💾 저장하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {delTarget && (
                <DeleteConfirm
                    msg={delTarget.msg || '이 기록을 삭제하시겠습니까?'}
                    onConfirm={handleDelete}
                    onCancel={() => setDelTarget(null)}
                />
            )}

            {modalVid && (
                <div className="mp-modal-overlay" onClick={() => setModalVid(null)}>
                    <div className="mp-video-modal" onClick={e => e.stopPropagation()}>
                        <div className="mp-modal-hd">
                            <span>🎬 영상 {modalVid.idx + 1} 재생</span>
                            <div style={{display:'flex',gap:8,alignItems:'center'}}>
                                <a href={modalVid.url} download={`signbridge_녹화_${Date.now()}.webm`}
                                    className="mp-video-dl-btn" onClick={e => e.stopPropagation()}>
                                    ⬇ 다운로드
                                </a>
                                <button className="mp-modal-close" onClick={() => setModalVid(null)}>✕</button>
                            </div>
                        </div>
                        <div className="mp-video-modal-body">
                            <video src={modalVid.url} controls autoPlay
                                className="mp-video-modal-player" playsInline/>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function OrgWelcomeHeader({ displayName, orgLabel, orgIcon, orgColor }) {
    const now     = new Date()
    const dateStr = now.toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric', weekday:'short' })
    const timeStr = now.toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' })
    return (
        <div className="my-org-welcome" style={{ '--org-color': orgColor }}>
            <div className="my-org-welcome-deco" aria-hidden="true"/>
            <div className="my-org-welcome-left">
                <div className="my-org-welcome-icon-wrap">
                    <span className="my-org-welcome-icon">{orgIcon}</span>
                </div>
                <div className="my-org-welcome-texts">
                    <div className="my-org-welcome-eyebrow">{orgLabel}</div>
                    <div className="my-org-welcome-name">안녕하세요, <strong>{displayName}</strong>님!</div>
                    <div className="my-org-welcome-sub">오늘도 SignBridge와 함께하세요.</div>
                </div>
            </div>
            <div className="my-org-welcome-right">
                <div className="my-org-welcome-datetime">
                    <span className="my-org-welcome-date">📅 {dateStr}</span>
                    <span className="my-org-welcome-time">🕐 {timeStr}</span>
                </div>
                <div className="my-org-welcome-status">
                    <span className="my-org-welcome-dot"/>시스템 정상 운영 중
                </div>
            </div>
        </div>
    )
}

export default function MyPage({ displayName = '', orgType = '', userEmail = '', communityProfile, onCommunityProfileSave, onProfileUpdate }) {
    const [view,        setView]        = useState(orgType || 'select')
    const [profileData, setProfileData] = useState(null)
    const [caseList,    setCaseList]    = useState([])
    const [loading,     setLoading]     = useState(false)

    const normalizeOrgType = (raw) => {
        const map = {
            '개인': 'personal', '출입국관리사무소': 'immigration',
            '출입국외국인사무소': 'immigration', '경찰서': 'police',
            '병원': 'hospital', '공항': 'airport',
        }
        return map[raw] || raw || 'personal'
    }

    useEffect(() => {
        if (!userEmail) return
        setLoading(true)
        const load = async () => {
            try {
                const profile = await myPageApi.getProfile(userEmail)
                setProfileData(profile)
                const rawType  = profile?.orgType || orgType
                const normType = normalizeOrgType(rawType)
                let cases = []
                if (normType === 'immigration') {
                    cases = await immigrationApi.getCases(userEmail)
                } else if (normType === 'police') {
                    cases = await policeApi.getCases(userEmail)
                }
                setCaseList(cases)
            } catch (e) {
                console.error('[MyPage load]', e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [userEmail, orgType])

    useEffect(() => { setView(orgType || 'select') }, [orgType])

    const meta = ORG_META[view] || {}

    const handleCommunityProfilesChange = (updated) => {
        onCommunityProfilesChange?.(updated)
    }

    if (view === 'select') return (
        <div className="my-page">
            <div className="select-screen">
                <div className="select-inner">
                    <div className="select-header">
                        <div className="select-eyebrow">SignBridge</div>
                        <h1 className="select-title">마이페이지</h1>
                        <p className="select-desc">사용 용도를 선택하면 해당 화면으로 이동합니다.</p>
                    </div>
                    <div className="select-cards">
                        {USAGE_TYPES.map(type => (
                            <button key={type.id} className="sel-card"
                                    style={{ '--card-color': type.color }}
                                    onClick={() => setView(type.id)}>
                                <div className="sel-card-icon">{type.icon}</div>
                                <div className="sel-card-body">
                                    <div className="sel-card-label">{type.label}</div>
                                    <div className="sel-card-sub">{type.sub}</div>
                                    <span className="sel-card-badge">{type.badge}</span>
                                </div>
                                <div className="sel-card-arrow"><ArrowIcon/></div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )

    if (view === 'personal') return (
        <div className="my-page">
            <div className="view-wrap">
                {!orgType && <button className="back-btn" onClick={() => setView('select')}>← 뒤로</button>}
                <PersonalMyPage
                    displayName={profileData?.name || displayName}
                    profile={profileData}
                    userEmail={userEmail}
                    communityProfile={communityProfile}
                    onCommunityProfileSave={onCommunityProfileSave}
                    onProfileUpdate={(updated) => {
                        setProfileData(updated)
                        onProfileUpdate?.(updated)
                    }}
                />
            </div>
        </div>
    )

    if (view === 'immigration') return (
        <div className="my-page">
            <div className="view-wrap">
                {!orgType && <button className="back-btn" onClick={() => setView('select')}>← 용도 선택으로</button>}
                <OrgWelcomeHeader displayName={profileData?.officeName || displayName} orgLabel={meta.label} orgIcon={meta.icon} orgColor={meta.color}/>
                <ImmigrationCasePage
                    onBack={orgType ? undefined : () => setView('select')}
                    displayName={profileData?.officeName || displayName}
                    profile={{
                        officeName:    profileData?.officeName    || '',
                        orgCode:       profileData?.orgCode       || '',
                        address:       profileData?.address       || '',
                        addressDetail: profileData?.addressDetail || '',
                        zonecode:      profileData?.zonecode      || '',
                        email:         profileData?.email         || userEmail,
                    }}
                    cases={caseList}
                    loading={loading}
                />
            </div>
        </div>
    )

    if (view === 'police') return (
        <div className="my-page">
            <div className="view-wrap">
                {!orgType && <button className="back-btn" onClick={() => setView('select')}>← 용도 선택으로</button>}
                <OrgWelcomeHeader displayName={displayName} orgLabel={meta.label} orgIcon={meta.icon} orgColor={meta.color}/>
                <PoliceCasePage
                    onBack={orgType ? undefined : () => setView('select')}
                    displayName={profileData?.officeName || displayName}
                    profile={{
                        officeName:    profileData?.officeName    || '',
                        orgCode:       profileData?.orgCode       || '',
                        address:       profileData?.address       || '',
                        addressDetail: profileData?.addressDetail || '',
                        zonecode:      profileData?.zonecode      || '',
                        email:         profileData?.email         || userEmail,
                    }}
                    cases={caseList}
                    loading={loading}
                />
            </div>
        </div>
    )

    if (view === 'register_police') {
        const RegisterPolice = require('../Register/RegisterPolice/RegisterPolice.jsx').default
        return (
            <div className="my-page">
                <div className="view-wrap">
                    <RegisterPolice messages={[]} videos={[]} onBack={() => setView('police')}
                        userEmail={userEmail} displayName={profileData?.name || displayName}/>
                </div>
            </div>
        )
    }

    if (view === 'register_immigration') {
        const RegisterImmigration = require('../Register/RegisterImmigration/RegisterImmigration.jsx').default
        return (
            <div className="my-page">
                <div className="view-wrap">
                    <RegisterImmigration messages={[]} videos={[]} onBack={() => setView('immigration')}
                        userEmail={userEmail} displayName={profileData?.name || displayName}/>
                </div>
            </div>
        )
    }

    return (
        <div className="my-page">
            <div className="view-wrap">
                <OrgWelcomeHeader displayName={displayName} orgLabel={meta.label} orgIcon={meta.icon} orgColor={meta.color}/>
                <div className="records-empty" style={{marginTop:40}}>
                    {meta.icon} {meta.label} 화면은 준비 중입니다.
                </div>
            </div>
        </div>
    )
}