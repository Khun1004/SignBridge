import { useState, useEffect } from 'react'
import './MyPage.css'
import ImmigrationCasePage from '../My/ImmigrationCasePage/ImmigrationCasePage.jsx'
import PoliceCasePage      from '../My/PoliceCasePage/PoliceCasePage.jsx'
import {
    myPageApi, immigrationApi, policeApi, personalApi, conversationApi, communityApi
} from '../../../assets/components/api/api.jsx'

// ══════════════════════════════════════════
//  상수
// ══════════════════════════════════════════
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

// ══════════════════════════════════════════
//  삭제 확인 모달
// ══════════════════════════════════════════
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

// ══════════════════════════════════════════
//  개인용 MyPage
// ══════════════════════════════════════════
function PersonalMyPage({ displayName, profile, userEmail, onProfileUpdate, communityProfile, onCommunityProfileSave }) {
    const [activeTab,   setActiveTab]   = useState('등록기록')
    const [cases,       setCases]       = useState([])
    const [loading,     setLoading]     = useState(true)
    const [delTarget,   setDelTarget]   = useState(null)  // { type:'case'|'conv', id, sessionId }
    const [modalVid,    setModalVid]    = useState(null)  // { url, idx } — 영상 모달
    const [delLoading,  setDelLoading]  = useState(false)

    // 프로필 편집
    const [editMode,    setEditMode]    = useState(false)
    const [editName,    setEditName]    = useState('')
    const [editGrade,   setEditGrade]   = useState('')
    const [editSign,    setEditSign]    = useState('')
    const [editSaving,  setEditSaving]  = useState(false)
    const [editError,   setEditError]   = useState('')

    // 커뮤니티 프로필 — 서버에서 로드 (없으면 prop 사용)
    const [myProfile,    setMyProfile]    = useState(communityProfile)

    // 서버에서 내 커뮤니티 프로필 로드
    useEffect(() => {
        if (!userEmail) return
        communityApi.getMyProfile(userEmail)
            .then(data => {
                if (data) {
                    const profile = {
                        ...data,
                        contact: { type: data.contactType, value: data.contactValue },
                        avatar:  data.name?.charAt(0) || '?',
                    }
                    setMyProfile(profile)
                    onCommunityProfileSave?.(profile)
                }
            })
            .catch(() => {})
    }, [userEmail])
    const [showCmForm,   setShowCmForm]   = useState(false)  // 등록 폼 표시
    const [cmForm,       setCmForm]       = useState({ role: '', region: '', intro: '', experience: '', speciality: '', contactType: 'chat', contactValue: '', publicProfile: true })
    const [cmSaving,     setCmSaving]     = useState(false)
    const [cmError,      setCmError]      = useState('')

    const TABS = ['등록기록', '커뮤니티', '프로필']

    // ── 데이터 로드 ───────────────────────────────────────────
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

    // ── 프로필 편집 모달 열기 ─────────────────────────────────
    const openEdit = () => {
        setEditName(profile?.name    || displayName || '')
        setEditGrade(profile?.disabilityGrade || '')
        setEditSign(profile?.preferredSign    || '')
        setEditError('')
        setEditMode(true)
    }

    // ── 프로필 저장 ───────────────────────────────────────────
    const handleSaveProfile = async () => {
        if (!editName.trim()) { setEditError('이름을 입력해 주세요.'); return }
        setEditSaving(true); setEditError('')
        try {
            await myPageApi.updateProfile(userEmail, {
                name:            editName.trim(),
                disabilityGrade: editGrade.trim(),
                preferredSign:   editSign.trim(),
            })
            onProfileUpdate?.({
                ...profile,
                name:            editName.trim(),
                disabilityGrade: editGrade.trim(),
                preferredSign:   editSign.trim(),
            })
            setEditMode(false)
        } catch (e) {
            setEditError(`저장 실패: ${e.message}`)
        } finally {
            setEditSaving(false)
        }
    }

    // ── 삭제 실행 ─────────────────────────────────────────────
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

    const name   = profile?.name    || displayName || '사용자'
    const email  = profile?.email   || userEmail   || '-'
    const joined = profile?.joinedAt
        ? new Date(profile.joinedAt).toLocaleDateString('ko-KR') : '-'

    // ── session_id 기준으로 묶기 (등록기록용) ────────────────
    const sessions = []
    const seen     = {}
    cases.forEach(c => {
        const sid = c.sessionId || `solo_${c.id}`
        if (!seen[sid]) {
            seen[sid] = { sid, caseId: c.id, msgs: [], place: c.place,
                videoId: c.videoId, createdAt: c.createdAt,
                name: c.name, memo: c.memo, messageCount: c.messageCount }
            sessions.push(seen[sid])
        }
        // messages 배열이 있으면 추가
        if (c.messages) seen[sid].msgs.push(...c.messages)
    })

    return (
        <div className="mp-personal">

            {/* ── 프로필 히어로 ── */}
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
                    <button className="mp-edit-profile-btn" onClick={openEdit}>
                        ✏️ 프로필 수정
                    </button>
                </div>
            </div>

            {/* ── 탭 ── */}
            <div className="my-tabs">
                {TABS.map(t => (
                    <button key={t}
                            className={`my-tab ${activeTab === t ? 'active' : ''}`}
                            onClick={() => setActiveTab(t)}
                    >{t}</button>
                ))}
            </div>

            {loading && <div className="records-empty">⏳ 불러오는 중...</div>}

            {/* ══════════════
                등록기록 탭
            ══════════════ */}
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
                                        <button
                                            className="mp-del-btn"
                                            onClick={() => setDelTarget({ type:'case', id: c.id,
                                                msg:`CASE-${String(c.id).padStart(3,'0')} 기록을 삭제하시겠습니까?` })}
                                        >🗑️</button>
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
                                )}

                                {/* ── 채팅 버블 — messages 있을 때 ── */}
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

                                {/* ── 영상 카드 그리드 ── */}
                                {(() => {
                                    const allVids = c.videoIds?.length > 0
                                        ? c.videoIds
                                        : c.videoId ? [c.videoId] : []
                                    if (allVids.length === 0) return null
                                    return (
                                        <div className="mp-video-section">
                                            <div className="mp-video-section-hd">
                                                🎬 녹화 영상
                                                <span className="mp-video-section-count">
                                                    {allVids.length}개
                                                </span>
                                            </div>
                                            <div className="mp-video-grid">
                                                {allVids.map((vid, vi) => {
                                                    const url = conversationApi.getVideoUrl(vid)
                                                    return (
                                                        <div key={vid} className="mp-video-card">
                                                            {/* 미니 플레이어 */}
                                                            <div className="mp-video-thumb"
                                                                 onClick={() => setModalVid({ url, idx: vi })}>
                                                                <video
                                                                    src={url}
                                                                    className="mp-video-thumb-player"
                                                                    preload="metadata"
                                                                    muted
                                                                    playsInline
                                                                />
                                                                <div className="mp-video-thumb-overlay">
                                                                    <div className="mp-video-play-btn">▶</div>
                                                                </div>
                                                                <div className="mp-video-thumb-label">
                                                                    영상 {vi + 1}
                                                                </div>
                                                            </div>
                                                            {/* 하단 액션 */}
                                                            <div className="mp-video-card-actions">
                                                                <button
                                                                    className="mp-video-action-btn mp-video-action-play"
                                                                    onClick={() => setModalVid({ url, idx: vi })}
                                                                >▶ 재생</button>
                                                                <a
                                                                    href={url}
                                                                    download={`signbridge_녹화_${vid}.webm`}
                                                                    className="mp-video-action-btn mp-video-action-dl"
                                                                >⬇ 저장</a>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ══════════════
                커뮤니티 탭
            ══════════════ */}
            {activeTab === '커뮤니티' && (
                <div className="tab-content">

                    {/* 프로필 없을 때 안내 메시지만 표시 */}
                    {!myProfile && !showCmForm && (
                        <div className="cm-mypage-empty">
                            <div style={{fontSize:40}}>🤟</div>
                            <p style={{margin:'8px 0 4px',fontWeight:700,color:'#333'}}>커뮤니티 프로필이 없습니다</p>
                            <p style={{fontSize:13,color:'#888',margin:0}}>
                                커뮤니티 메뉴에서 등록하면 여기에 표시됩니다
                            </p>
                        </div>
                    )}

                    {/* 등록 / 수정 폼 */}
                    {showCmForm && (
                        <div className="cm-mypage-form">
                            <h3 style={{margin:'0 0 16px',fontSize:15,fontWeight:700}}>
                                {myProfile ? '✏️ 프로필 수정' : '+ 커뮤니티 프로필 등록'}
                            </h3>

                            {/* 역할 */}
                            <div className="cm-mypage-field">
                                <label className="cm-mypage-label">역할</label>
                                <select className="cm-mypage-input"
                                        value={cmForm.role}
                                        onChange={e => setCmForm(f => ({...f, role: e.target.value}))}>
                                    <option value="">선택하세요</option>
                                    {['수어 선생님','수어 통역사','수어 학습자','가족/보호자','수어 관심자','연구자','기타'].map(r =>
                                        <option key={r} value={r}>{r}</option>
                                    )}
                                </select>
                            </div>

                            {/* 지역 */}
                            <div className="cm-mypage-field">
                                <label className="cm-mypage-label">활동 지역</label>
                                <select className="cm-mypage-input"
                                        value={cmForm.region}
                                        onChange={e => setCmForm(f => ({...f, region: e.target.value}))}>
                                    <option value="">선택하세요</option>
                                    {['서울','부산','대구','인천','광주','대전','울산','경기','강원','충북','충남','전북','전남','경북','경남','제주','기타'].map(r =>
                                        <option key={r} value={r}>{r}</option>
                                    )}
                                </select>
                            </div>

                            {/* 자기소개 */}
                            <div className="cm-mypage-field">
                                <label className="cm-mypage-label">자기소개</label>
                                <textarea className="cm-mypage-input" rows={3}
                                          placeholder="활동 경력, 전문 분야 등을 소개해 주세요"
                                          value={cmForm.intro}
                                          onChange={e => setCmForm(f => ({...f, intro: e.target.value}))}/>
                            </div>

                            {/* 경력 */}
                            <div className="cm-mypage-field">
                                <label className="cm-mypage-label">경력 / 활동 이력 <span style={{fontWeight:400,color:'#aaa',fontSize:11}}>(선택)</span></label>
                                <textarea className="cm-mypage-input" rows={2}
                                          placeholder="예: 수어 통역사 7년, 복지관 강사 5년"
                                          value={cmForm.experience || ''}
                                          onChange={e => setCmForm(f => ({...f, experience: e.target.value}))}/>
                            </div>

                            {/* 전문 분야 */}
                            <div className="cm-mypage-field">
                                <label className="cm-mypage-label">전문 분야 <span style={{fontWeight:400,color:'#aaa',fontSize:11}}>(선택)</span></label>
                                <input className="cm-mypage-input"
                                       placeholder="예: 의료 수어, 법정 수어, 교육 수어"
                                       value={cmForm.speciality || ''}
                                       onChange={e => setCmForm(f => ({...f, speciality: e.target.value}))}/>
                            </div>

                            {/* 연락 방법 */}
                            <div className="cm-mypage-field">
                                <label className="cm-mypage-label">연락 방법</label>
                                <div style={{display:'flex',gap:8,marginBottom:6}}>
                                    {[
                                        {id:'chat', label:'💬 오픈채팅'},
                                        {id:'phone',label:'📞 전화번호'},
                                        {id:'email',label:'📧 이메일'},
                                    ].map(t => (
                                        <button key={t.id}
                                                className={`cm-mypage-type-btn ${cmForm.contactType===t.id?'active':''}`}
                                                onClick={() => setCmForm(f => ({...f, contactType: t.id}))}>
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                                <input className="cm-mypage-input"
                                       placeholder={
                                           cmForm.contactType==='chat'  ? '카카오 오픈채팅 링크' :
                                               cmForm.contactType==='phone' ? '010-0000-0000' : 'example@email.com'
                                       }
                                       value={cmForm.contactValue}
                                       onChange={e => setCmForm(f => ({...f, contactValue: e.target.value}))}/>
                            </div>

                            {/* 공개 여부 */}
                            <div className="cm-mypage-field">
                                <label className="cm-mypage-label">프로필 공개 여부</label>
                                <div style={{display:'flex',gap:8}}>
                                    {[{v:true,l:'🌐 공개'},{v:false,l:'🔒 비공개'}].map(({v,l}) => (
                                        <button key={String(v)}
                                                className={`cm-mypage-type-btn ${cmForm.publicProfile===v?'active':''}`}
                                                onClick={() => setCmForm(f => ({...f, publicProfile: v}))}>
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {cmError && <div className="cm-mypage-error">⚠️ {cmError}</div>}

                            <div style={{display:'flex',gap:8,marginTop:12}}>
                                <button className="cm-mypage-cancel-btn"
                                        onClick={() => { setShowCmForm(false); setCmError('') }}>
                                    취소
                                </button>
                                <button className="cm-mypage-save-btn" disabled={cmSaving}
                                        onClick={async () => {
                                            if (!cmForm.role)               { setCmError('역할을 선택해 주세요.'); return }
                                            if (!cmForm.region)             { setCmError('지역을 선택해 주세요.'); return }
                                            if (!cmForm.intro.trim())       { setCmError('자기소개를 입력해 주세요.'); return }
                                            if (!cmForm.contactValue.trim()){ setCmError('연락처를 입력해 주세요.'); return }
                                            setCmSaving(true)
                                            try {
                                                const saved = {
                                                    ...(myProfile || {}),
                                                    name:         displayName,
                                                    avatar:       displayName?.charAt(0) || '?',
                                                    userEmail,
                                                    role:         cmForm.role,
                                                    region:       cmForm.region,
                                                    intro:        cmForm.intro,
                                                    experience:   cmForm.experience,
                                                    speciality:   cmForm.speciality,
                                                    publicProfile: cmForm.publicProfile,
                                                    contact: { type: cmForm.contactType, value: cmForm.contactValue },
                                                }
                                                setMyProfile(saved)
                                                onCommunityProfileSave?.(saved)
                                                setShowCmForm(false)
                                                setCmError('')
                                            } finally {
                                                setCmSaving(false)
                                            }
                                        }}>
                                    {cmSaving ? '저장 중...' : '💾 저장하기'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 등록된 프로필 표시 */}
                    {myProfile && !showCmForm && (
                        <div className="cm-mypage-card">
                            {/* 프로필 상단 */}
                            <div className="cm-mypage-card-top">
                                <div className="cm-mypage-avatar">{myProfile.avatar}</div>
                                <div>
                                    <div className="cm-mypage-name">{myProfile.name}</div>
                                    <div style={{display:'flex',gap:6,marginTop:4,flexWrap:'wrap'}}>
                                        <span className="cm-role-badge">{myProfile.role}</span>
                                        <span className="cm-region-badge">📍 {myProfile.region}</span>
                                        <span className="cm-region-badge">
                                            {myProfile.publicProfile===false ? '🔒 비공개' : '🌐 공개'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {/* 자기소개 */}
                            <div className="cm-mypage-intro-box">
                                <div className="cm-mypage-intro-label">자기소개</div>
                                <p className="cm-mypage-intro-text">{myProfile.intro}</p>
                            </div>
                            {/* 경력 */}
                            {myProfile.experience && (
                                <div className="cm-mypage-intro-box">
                                    <div className="cm-mypage-intro-label">경력 / 활동 이력</div>
                                    <p className="cm-mypage-intro-text">{myProfile.experience}</p>
                                </div>
                            )}
                            {/* 전문 분야 */}
                            {myProfile.speciality && (
                                <div className="cm-mypage-intro-box">
                                    <div className="cm-mypage-intro-label">전문 분야</div>
                                    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:2}}>
                                        {myProfile.speciality.split(',').map((s,i) => (
                                            <span key={i} style={{
                                                background:'#f0fdf4',border:'1px solid #bbf7d0',
                                                borderRadius:20,padding:'3px 10px',
                                                fontSize:12,fontWeight:600,color:'#059669'
                                            }}>{s.trim()}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* 연락 방법 */}
                            <div className="cm-mypage-intro-box">
                                <div className="cm-mypage-intro-label">연락 방법</div>
                                <p className="cm-mypage-intro-text">
                                    {myProfile.contact?.type==='chat'  ? `💬 오픈채팅: ${myProfile.contact.value}` :
                                        myProfile.contact?.type==='phone' ? `📞 ${myProfile.contact.value}` :
                                            myProfile.contact?.type==='email' ? `📧 ${myProfile.contact.value}` : '-'}
                                </p>
                            </div>
                            {/* 수정 버튼 */}
                            <button className="cm-mypage-edit-btn"
                                    onClick={() => {
                                        setCmForm({
                                            role:          myProfile.role         || '',
                                            region:        myProfile.region       || '',
                                            intro:         myProfile.intro        || '',
                                            experience:    myProfile.experience   || '',
                                            speciality:    myProfile.speciality   || '',
                                            contactType:   myProfile.contact?.type  || 'chat',
                                            contactValue:  myProfile.contact?.value || '',
                                            publicProfile: myProfile.publicProfile !== false,
                                        })
                                        setShowCmForm(true)
                                    }}>
                                ✏️ 프로필 수정
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════
                프로필 탭
            ══════════════ */}
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
                        <button className="mp-edit-profile-btn" onClick={openEdit}>
                            ✏️ 프로필 수정하기
                        </button>
                    </div>
                </div>
            )}

            {/* ── 프로필 수정 모달 ── */}
            {editMode && (
                <div className="mp-modal-overlay" onClick={() => setEditMode(false)}>
                    <div className="mp-modal" onClick={e => e.stopPropagation()}>
                        <div className="mp-modal-hd">
                            <span>✏️ 프로필 수정</span>
                            <button className="mp-modal-close" onClick={() => setEditMode(false)}>✕</button>
                        </div>
                        <div className="mp-modal-body">
                            <div className="mp-edit-form">
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
                                {editError && (
                                    <div className="mp-edit-error">⚠️ {editError}</div>
                                )}
                            </div>
                            <button className="mp-edit-save-btn"
                                    onClick={handleSaveProfile} disabled={editSaving}>
                                {editSaving ? '⏳ 저장 중...' : '💾 저장하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 삭제 확인 모달 ── */}
            {delTarget && (
                <DeleteConfirm
                    msg={delTarget.msg || '이 기록을 삭제하시겠습니까?'}
                    onConfirm={handleDelete}
                    onCancel={() => setDelTarget(null)}
                />
            )}

            {/* ── 영상 전체화면 모달 ── */}
            {modalVid && (
                <div className="mp-modal-overlay" onClick={() => setModalVid(null)}>
                    <div className="mp-video-modal" onClick={e => e.stopPropagation()}>
                        <div className="mp-modal-hd">
                            <span>🎬 영상 {modalVid.idx + 1} 재생</span>
                            <div style={{display:'flex',gap:8,alignItems:'center'}}>
                                <a
                                    href={modalVid.url}
                                    download={`signbridge_녹화_${Date.now()}.webm`}
                                    className="mp-video-dl-btn"
                                    onClick={e => e.stopPropagation()}
                                >⬇ 다운로드</a>
                                <button className="mp-modal-close"
                                        onClick={() => setModalVid(null)}>✕</button>
                            </div>
                        </div>
                        <div className="mp-video-modal-body">
                            <video
                                src={modalVid.url}
                                controls autoPlay
                                className="mp-video-modal-player"
                                playsInline
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ══════════════════════════════════════════
//  기관 환영 배너
// ══════════════════════════════════════════
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

// ══════════════════════════════════════════
//  메인 MyPage
// ══════════════════════════════════════════
export default function MyPage({ displayName = '', orgType = '', userEmail = '' }) {
    const [view,        setView]        = useState(orgType || 'select')
    const [profileData, setProfileData] = useState(null)
    const [caseList,    setCaseList]    = useState([])
    const [loading,     setLoading]     = useState(false)

    // orgType 정규화 (한글 → 영문)
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
                // DB에서 한글로 저장된 orgType도 처리
                const rawType  = profile?.orgType || orgType
                const normType = normalizeOrgType(rawType)
                console.log('[MyPage] orgType raw:', rawType, '→ norm:', normType, '| email:', userEmail)
                let cases = []
                if (normType === 'immigration') {
                    cases = await immigrationApi.getCases(userEmail)
                    console.log('[MyPage] immigration cases 수:', cases?.length, cases)
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
                    onProfileUpdate={setProfileData}
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
                    onRegister={() => setView('register_immigration')}
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
                    onRegister={() => setView('register_police')}
                />
            </div>
        </div>
    )

    if (view === 'register_police') {
        const RegisterPolice = require('../Register/RegisterPolice/RegisterPolice.jsx').default
        return (
            <div className="my-page">
                <div className="view-wrap">
                    <RegisterPolice
                        messages={[]}
                        videos={[]}
                        onBack={() => setView('police')}
                        userEmail={userEmail}
                        displayName={profileData?.name || displayName}
                    />
                </div>
            </div>
        )
    }

    if (view === 'register_police') {
        const RegisterPolice = require('../Register/RegisterPolice/RegisterPolice.jsx').default
        return (
            <div className="my-page">
                <div className="view-wrap">
                    <RegisterPolice
                        messages={[]}
                        videos={[]}
                        onBack={() => setView('police')}
                        userEmail={userEmail}
                        displayName={profileData?.name || displayName}
                    />
                </div>
            </div>
        )
    }

    if (view === 'register_immigration') {
        const RegisterImmigration = require('../Register/RegisterImmigration/RegisterImmigration.jsx').default
        return (
            <div className="my-page">
                <div className="view-wrap">
                    <RegisterImmigration
                        messages={[]}
                        videos={[]}
                        onBack={() => setView('immigration')}
                        userEmail={userEmail}
                        displayName={profileData?.name || displayName}
                    />
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