import { useState } from 'react'
import './ImmigrationCasePage.css'
import { conversationApi } from '../../../../assets/components/api/api.jsx'

const ACCENT = '#7c3aed'

function Arrow() {
    return (
        <div className="case-card-arrow">
            <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
    )
}

/* ── 상세 화면 ── */
function CaseDetail({ c, onBack }) {
    const { applicant: ap, officer: of_, signs = [], voice = [] } = c
    const [modalUrl, setModalUrl] = useState(null)

    // 영상 ID 목록 — videoIds 배열 우선, 없으면 videoId 단일
    const allVids = c.videoIds?.length > 0
        ? c.videoIds
        : c.videoId ? [c.videoId] : []

    return (
        <div className="case-detail" style={{ '--accent': ACCENT, '--accent-light': 'rgba(124,58,237,0.07)', '--accent-border': 'rgba(124,58,237,0.2)' }}>
            <button className="case-btn-back" onClick={onBack}>← 목록으로 돌아가기</button>

            <div className="case-detail-header">
                <div>
                    <div className="case-detail-id">{c.id}</div>
                    <div className="case-detail-num">신청 목적: {c.purpose}</div>
                </div>
                <span className={`case-status-badge ${c.statusType}`}>
                    {c.flagged ? '⚠️ ' : '✅ '}{c.status}
                </span>
            </div>

            {/* ── 신청인 + 담당자 카드 ── */}
            <div className="case-people-grid">
                {/* 신청인 */}
                <div className="case-person-card applicant">
                    <div className="case-person-header">
                        <div className="case-person-emoji">{ap.avatar || '🧏'}</div>
                        <div>
                            <div className="case-person-role">🧏 신청인 (청각장애인)</div>
                            <div className="case-person-name">{ap.name}</div>
                        </div>
                    </div>
                    <div className="case-person-rows">
                        {[
                            ['생년월일', ap.birth],
                            ['장애 유형', ap.disability],
                            ['국적',     ap.nationality],
                            ['연락처',   ap.phone],
                            ['주소',     ap.address],
                        ]
                            .filter(([, v]) => v)
                            .map(([k, v]) => (
                                <div className="case-person-row" key={k}>
                                    <span>{k}</span><span>{v}</span>
                                </div>
                            ))}
                    </div>
                </div>

                {/* 담당 심사관 — 직책·소속·배지번호 포함 */}
                <div className="case-person-card officer-blue">
                    <div className="case-person-header">
                        <div className="case-person-emoji">{of_.avatar || '👔'}</div>
                        <div>
                            <div className="case-person-role">👔 담당 심사관</div>
                            <div className="case-person-name">{of_.name}</div>
                        </div>
                    </div>
                    <div className="case-person-rows">
                        {[
                            ['직책',     of_.position],
                            ['소속 부서', of_.department],
                            ['배지 번호', of_.badge],
                        ]
                            .filter(([, v]) => v)
                            .map(([k, v]) => (
                                <div className="case-person-row" key={k}>
                                    <span>{k}</span><span>{v}</span>
                                </div>
                            ))}
                    </div>
                    {/* 담당자 없을 때 안내 */}
                    {!of_.position && !of_.department && !of_.badge && (
                        <p style={{fontSize:12,color:'#aaa',padding:'8px 16px',margin:0}}>
                            담당자 상세 정보가 없습니다.
                        </p>
                    )}
                </div>
            </div>

            {/* ── 신청 정보 ── */}
            <div className="case-section">
                <div className="case-section-title">📋 신청 정보</div>
                <div className="case-info-grid">
                    {[
                        ['신청 목적', c.purpose],
                        ['접수 번호', c.caseNumber],
                        ['날짜·시간', `${c.date} ${c.time}`],
                        ['장소',     c.location],
                        ['소요 시간', c.duration],
                    ]
                        .filter(([, v]) => v)
                        .map(([k, v]) => (
                            <div className="case-info-row" key={k}>
                                <span>{k}</span><span>{v}</span>
                            </div>
                        ))}
                </div>
            </div>

            {/* ── 수어 통역 대화 기록 ── */}
            <div className="case-section">
                <div className="case-section-title">
                    💬 수어 통역 대화 기록
                    <span className="case-conv-count">
                        {signs.length + voice.length}개
                    </span>
                </div>

                <div className="case-chat-list">
                    {signs.length === 0 && voice.length === 0 ? (
                        <div className="case-chat-empty">
                            <span>💬</span>
                            <p>대화 기록이 없습니다.</p>
                        </div>
                    ) : (
                        <>
                            {/* signs — 수어(청각장애인) 왼쪽 버블 */}
                            {signs.map((s, i) => (
                                <div key={'s'+i} className="case-chat-msg case-chat-sign">
                                    <div className="case-chat-avatar">🧏</div>
                                    <div className="case-chat-bubble-wrap">
                                        <div className="case-chat-name">{ap.name || '청각장애인'}</div>
                                        <div className="case-chat-bubble case-chat-bubble-sign">
                                            {s}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {/* voice — 담당자 오른쪽 버블 */}
                            {voice.map((v, i) => (
                                <div key={'v'+i} className="case-chat-msg case-chat-voice">
                                    <div className="case-chat-bubble-wrap">
                                        <div className="case-chat-name">{of_.name || '담당자'}</div>
                                        <div className="case-chat-bubble case-chat-bubble-voice">
                                            {v}
                                        </div>
                                    </div>
                                    <div className="case-chat-avatar">👔</div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* ── 녹화 영상 ── */}
            {allVids.length > 0 && (
                <div className="case-section">
                    <div className="case-section-title">🎬 녹화 영상 ({allVids.length}개)</div>
                    <div className="case-video-grid">
                        {allVids.map((vid, vi) => {
                            const url = conversationApi.getVideoUrl(vid)
                            return (
                                <div key={vid} className="case-video-card">
                                    <div className="case-video-thumb"
                                         onClick={() => setModalUrl({ url, idx: vi })}>
                                        <video
                                            src={url}
                                            className="case-video-preview"
                                            preload="metadata"
                                            muted playsInline
                                        />
                                        <div className="case-video-overlay">
                                            <div className="case-video-play">▶</div>
                                        </div>
                                        <div className="case-video-num">영상 {vi + 1}</div>
                                    </div>
                                    <div className="case-video-actions">
                                        <button className="case-video-btn case-video-btn-play"
                                                onClick={() => setModalUrl({ url, idx: vi })}>
                                            ▶ 재생
                                        </button>
                                        <a href={url}
                                           download={`IMM_${c.id}_${vi+1}.webm`}
                                           className="case-video-btn case-video-btn-dl">
                                            ⬇ 저장
                                        </a>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="case-actions">
                <button className="case-btn-primary">📄 공식 문서 출력</button>
                <button className="case-btn-secondary">📥 기록 저장</button>
                {c.flagged && <button className="case-btn-danger">⚠️ 이의제기 접수</button>}
            </div>

            {/* ── 영상 모달 ── */}
            {modalUrl && (
                <div className="case-modal-overlay" onClick={() => setModalUrl(null)}>
                    <div className="case-modal" onClick={e => e.stopPropagation()}>
                        <div className="case-modal-hd">
                            <span>🎬 영상 {modalUrl.idx + 1} 재생</span>
                            <div style={{display:'flex',gap:8}}>
                                <a href={modalUrl.url}
                                   download={`IMM_${c.id}_${modalUrl.idx+1}.webm`}
                                   className="case-modal-dl">⬇ 다운로드</a>
                                <button className="case-modal-close"
                                        onClick={() => setModalUrl(null)}>✕</button>
                            </div>
                        </div>
                        <div className="case-modal-body">
                            <video src={modalUrl.url} controls autoPlay
                                   className="case-modal-video" playsInline/>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ── 목록 화면 ──
 * props:
 *   cases       - MyPage에서 DB 조회 후 내려주는 케이스 배열 (없으면 빈 배열)
 *   displayName - 기관명
 *   profile     - 회원가입 전체 정보 { email, orgCode, address, ... }
 */
export default function ImmigrationCasePage({ onBack, displayName = '', profile = null, cases = [], loading = false, onRegister }) {
    const [selected, setSelected] = useState(null)
    const [search,   setSearch]   = useState('')

    if (selected) return <CaseDetail c={selected} onBack={() => setSelected(null)} />

    const filtered = cases.filter(c =>
        c.applicant?.name?.includes(search) ||
        c.id?.includes(search) ||
        c.purpose?.includes(search)
    )

    const total    = cases.length
    const flagged  = cases.filter(c => c.flagged).length
    const complete = cases.filter(c => c.statusType === 'ok').length

    const officeName    = displayName || profile?.officeName || '출입국·외국인사무소'
    const orgCode       = profile?.orgCode       || '-'
    const address       = profile?.address       || '-'
    const addressDetail = profile?.addressDetail || ''
    const zonecode      = profile?.zonecode      || ''
    const email         = profile?.email         || '-'

    return (
        <div className="case-page" style={{ '--accent': ACCENT, '--accent-light': 'rgba(124,58,237,0.07)', '--accent-border': 'rgba(124,58,237,0.2)' }}>

            {/* 헤더 */}
            <div className="case-header">
                <div className="case-official-bar">🛂 출입국·외국인사무소</div>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12}}>
                    <h1 className="case-title" style={{margin:0}}>청각장애인 신청인 목록</h1>
                    {onRegister && (
                        <button className="case-btn-register" onClick={onRegister}>
                            ✏️ 새 대화 기록 등록
                        </button>
                    )}
                </div>
                <p className="case-subtitle">이름을 선택하면 신청인과 담당 심사관 정보를 확인할 수 있습니다.</p>
            </div>

            {/* 기관 정보 카드 */}
            <div className="case-org-info-card" style={{ borderColor: ACCENT + '44', background: 'rgba(124,58,237,0.04)' }}>
                <div className="case-org-info-title" style={{ color: ACCENT }}>🏢 기관 정보</div>
                <div className="case-org-info-grid">
                    <div className="case-org-info-row">
                        <span className="case-org-info-label">사무소명</span>
                        <span className="case-org-info-value">{officeName}</span>
                    </div>
                    <div className="case-org-info-row">
                        <span className="case-org-info-label">사무소 관리 코드</span>
                        <span className="case-org-info-value">{orgCode}</span>
                    </div>
                    <div className="case-org-info-row">
                        <span className="case-org-info-label">주소</span>
                        <span className="case-org-info-value">
                            {zonecode && <span className="case-org-zonecode">📮 {zonecode} </span>}
                            {address}{addressDetail && ` ${addressDetail}`}
                        </span>
                    </div>
                    <div className="case-org-info-row">
                        <span className="case-org-info-label">담당자 이메일</span>
                        <span className="case-org-info-value">{email}</span>
                    </div>
                </div>
            </div>

            {/* 통계 */}
            <div className="case-stats">
                <div className="case-stat-card">
                    <span className="case-stat-label">전체 신청</span>
                    <span className="case-stat-value">{total}건</span>
                </div>
                <div className="case-stat-card">
                    <span className="case-stat-label">처리 완료</span>
                    <span className="case-stat-value" style={{ color: '#10b981' }}>{complete}건</span>
                </div>
                <div className="case-stat-card">
                    <span className="case-stat-label">검토 필요</span>
                    <span className="case-stat-value" style={{ color: '#ef4444' }}>{flagged}건</span>
                </div>
            </div>

            {/* 검색 */}
            <div className="case-search-wrap">
                <span className="case-search-icon">🔍</span>
                <input
                    className="case-search"
                    placeholder="이름, 신청 목적, 사건번호로 검색..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* 목록 */}
            <div className="case-list">
                {filtered.map(c => (
                    <button
                        key={c.id}
                        className={`case-card ${c.flagged ? 'flagged' : ''}`}
                        onClick={() => setSelected(c)}
                    >
                        <div className="case-card-avatar">{c.applicant?.avatar || '🧏'}</div>
                        <div className="case-card-body">
                            <div className="case-card-name">{c.applicant?.name}</div>
                            <div className="case-card-meta">
                                <span>📋 {c.purpose}</span>
                                <span>📅 {c.date}</span>
                                <span>📍 {c.location?.split(' ').slice(0, 2).join(' ')}</span>
                            </div>
                            <span className="case-card-badge">IMMIGRATION</span>
                        </div>
                        <div className="case-card-right">
                            <span className={`case-status-badge ${c.statusType}`}>{c.flagged ? '⚠️ ' : ''}{c.status}</span>
                            <span className="case-card-officer">담당: {c.officer?.name}</span>
                            <Arrow />
                        </div>
                    </button>
                ))}
                {loading && (
                    <div className="case-empty">⏳ 케이스를 불러오는 중...</div>
                )}
                {!loading && filtered.length === 0 && (
                    <div className="case-empty">
                        {cases.length === 0
                            ? <span>등록된 케이스가 없습니다.<br/>
                                <span style={{fontSize:12,color:'#aaa'}}>번역기에서 대화 후 저장하기를 누르면 여기에 표시됩니다.</span>
                              </span>
                            : '검색 결과가 없습니다.'}
                    </div>
                )}
            </div>
        </div>
    )
}