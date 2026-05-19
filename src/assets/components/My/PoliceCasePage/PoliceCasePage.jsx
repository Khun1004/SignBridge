import { useState } from 'react'
import './PoliceCasePage.css'
import { conversationApi } from '../../../../assets/components/api/api.jsx'

const ACCENT = '#dc2626'

function Arrow() {
    return (
        <div className="case-card-arrow">
            <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
    )
}

/* ── 상세 화면 ── */
function CaseDetail({ c, onBack }) {
    const { subject: sb, officer: of_, signs = [], voice = [] } = c
    const [modalUrl, setModalUrl] = useState(null)
    return (
        <div className="case-detail" style={{ '--accent': ACCENT, '--accent-light': 'rgba(220,38,38,0.07)', '--accent-border': 'rgba(220,38,38,0.2)' }}>
            <button className="case-btn-back" onClick={onBack}>← 목록으로 돌아가기</button>

            <div className="case-detail-header">
                <div>
                    <div className="case-detail-id">{c.id}</div>
                    <div className="case-detail-num">사건번호: {c.caseNum}</div>
                </div>
                <span className={`case-status-badge ${c.statusType}`}>
                    {c.flagged ? '⚠️ ' : '✅ '}{c.status}
                </span>
            </div>

            <div className="case-people-grid">
                <div className="case-person-card applicant">
                    <div className="case-person-header">
                        <div className="case-person-emoji">{sb.avatar}</div>
                        <div>
                            <div className="case-person-role">🧏 당사자 ({sb.role})</div>
                            <div className="case-person-name">{sb.name}</div>
                        </div>
                    </div>
                    <div className="case-person-rows">
                        {[['생년월일', sb.birth], ['장애 유형', sb.disability], ['국적', sb.nationality], ['연락처', sb.phone], ['주소', sb.address]]
                            .map(([k, v]) => <div className="case-person-row" key={k}><span>{k}</span><span>{v}</span></div>)}
                    </div>
                </div>

                <div className="case-person-card officer-blue">
                    <div className="case-person-header">
                        <div className="case-person-emoji">{of_.avatar}</div>
                        <div>
                            <div className="case-person-role">👮 담당 경찰관</div>
                            <div className="case-person-name">{of_.name}</div>
                        </div>
                    </div>
                    <div className="case-person-rows">
                        {[['계급', of_.rank], ['소속팀', of_.department], ['근무지', of_.station], ['배지번호', of_.badge]]
                            .map(([k, v]) => <div className="case-person-row" key={k}><span>{k}</span><span>{v}</span></div>)}
                    </div>
                </div>
            </div>

            <div className="case-section">
                <div className="case-section-title">📁 사건 정보</div>
                <div className="case-info-grid">
                    {[['사건 유형', c.caseType], ['사건 번호', c.caseNum], ['날짜·시간', `${c.date} ${c.time}`], ['장소', c.location], ['소요 시간', c.duration]]
                        .map(([k, v]) => <div className="case-info-row" key={k}><span>{k}</span><span>{v}</span></div>)}
                </div>
            </div>

            {/* ── 수어 통역 대화 기록 — 채팅 버블 ── */}
            <div className="case-section">
                <div className="case-section-title">
                    💬 수어 통역 대화 기록
                    <span className="case-conv-count">{signs.length + voice.length}개</span>
                </div>
                <div className="case-chat-list">
                    {signs.length === 0 && voice.length === 0 ? (
                        <div className="case-chat-empty"><span>💬</span><p>대화 기록이 없습니다.</p></div>
                    ) : (
                        <>
                            {signs.map((s, i) => (
                                <div key={'s'+i} className="case-chat-msg case-chat-sign">
                                    <div className="case-chat-avatar">🧏</div>
                                    <div className="case-chat-bubble-wrap">
                                        <div className="case-chat-name">{sb.name} ({sb.role || '당사자'})</div>
                                        <div className="case-chat-bubble case-chat-bubble-sign">{s}</div>
                                    </div>
                                </div>
                            ))}
                            {voice.map((v, i) => (
                                <div key={'v'+i} className="case-chat-msg case-chat-voice">
                                    <div className="case-chat-bubble-wrap">
                                        <div className="case-chat-name">{of_.name} {of_.rank || '경찰관'}</div>
                                        <div className="case-chat-bubble case-chat-bubble-voice">{v}</div>
                                    </div>
                                    <div className="case-chat-avatar">👮</div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* ── 녹화 영상 ── */}
            {(() => {
                const allVids = c.videoIds?.length > 0 ? c.videoIds : c.videoId ? [c.videoId] : []
                if (allVids.length === 0) return null
                return (
                    <div className="case-section">
                        <div className="case-section-title">🎬 녹화 영상 ({allVids.length}개)</div>
                        <div className="case-video-grid">
                            {allVids.map((vid, vi) => {
                                const url = conversationApi.getVideoUrl(vid)
                                return (
                                    <div key={vid} className="case-video-card">
                                        <div className="case-video-thumb" onClick={() => setModalUrl({ url, idx: vi })}>
                                            <video src={url} className="case-video-preview" preload="metadata" muted playsInline/>
                                            <div className="case-video-overlay"><div className="case-video-play">▶</div></div>
                                            <div className="case-video-num">영상 {vi+1}</div>
                                        </div>
                                        <div className="case-video-actions">
                                            <button className="case-video-btn case-video-btn-play" onClick={() => setModalUrl({ url, idx: vi })}>▶ 재생</button>
                                            <a href={url} download={`POL_${c.id}_${vi+1}.webm`} className="case-video-btn case-video-btn-dl">⬇ 저장</a>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
            })()}

            <div className="case-actions">
                <button className="case-btn-primary">📄 수어 통역 조서 출력</button>
                <button className="case-btn-secondary">🔏 디지털 서명 적용</button>
                <button className="case-btn-secondary">📥 증거 저장</button>
                {c.flagged && <button className="case-btn-danger">🚨 검토 요청</button>}
            </div>

            {modalUrl && (
                <div className="case-modal-overlay" onClick={() => setModalUrl(null)}>
                    <div className="case-modal" onClick={e => e.stopPropagation()}>
                        <div className="case-modal-hd">
                            <span>🎬 영상 {modalUrl.idx+1} 재생</span>
                            <div style={{display:'flex',gap:8}}>
                                <a href={modalUrl.url} download={`POL_${c.id}_${modalUrl.idx+1}.webm`} className="case-modal-dl">⬇ 다운로드</a>
                                <button className="case-modal-close" onClick={() => setModalUrl(null)}>✕</button>
                            </div>
                        </div>
                        <div className="case-modal-body">
                            <video src={modalUrl.url} controls autoPlay className="case-modal-video" playsInline/>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ── 목록 화면 ── */
// displayName : 회원가입의 officeName (경찰서명)
// profile     : 회원가입 전체 정보 { name, email, orgCode, address, addressDetail, zonecode, ... }
export default function PoliceCasePage({ onBack, displayName = '', profile = null, cases = [], loading = false, onRegister }) {
    const [selected, setSelected] = useState(null)
    const [search,   setSearch]   = useState('')

    if (selected) return <CaseDetail c={selected} onBack={() => setSelected(null)} />

    const filtered = cases.filter(c =>
        c.subject.name.includes(search) || c.id.includes(search) ||
        c.caseType.includes(search) || c.caseNum.includes(search)
    )

    const total    = cases.length
    const flagged  = cases.filter(c => c.flagged).length
    const complete = cases.filter(c => c.statusType === 'ok').length

    // 회원가입 정보에서 표시할 값 추출
    const officeName    = displayName || profile?.officeName || '경찰서'
    const orgCode       = profile?.orgCode       || '-'
    const address       = profile?.address       || '-'
    const addressDetail = profile?.addressDetail || ''
    const zonecode      = profile?.zonecode      || ''
    const email         = profile?.email         || '-'

    return (
        <div className="case-page" style={{ '--accent': ACCENT, '--accent-light': 'rgba(220,38,38,0.07)', '--accent-border': 'rgba(220,38,38,0.2)' }}>

            {/* 헤더 */}
            <div className="case-header">
                <div className="case-official-bar">👮 대한민국 경찰청</div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                    <h1 className="case-title" style={{margin:0}}>청각장애인 당사자 목록</h1>
                    {onRegister && (
                        <button className="case-btn-register" onClick={onRegister}>
                            ✏️ 새 대화 기록 등록
                        </button>
                    )}
                </div>
                <p className="case-subtitle">이름을 선택하면 당사자와 담당 경찰관 정보를 확인할 수 있습니다.</p>
            </div>

            {/* ── 회원가입 정보 카드 ── */}
            <div className="case-org-info-card" style={{ borderColor: ACCENT + '44', background: 'rgba(220,38,38,0.04)' }}>
                <div className="case-org-info-title" style={{ color: ACCENT }}>🏢 기관 정보</div>
                <div className="case-org-info-grid">
                    <div className="case-org-info-row">
                        <span className="case-org-info-label">경찰서명</span>
                        <span className="case-org-info-value">{officeName}</span>
                    </div>
                    <div className="case-org-info-row">
                        <span className="case-org-info-label">경찰청 기관 코드</span>
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
                    <span className="case-stat-label">전체 사건</span>
                    <span className="case-stat-value">{total}건</span>
                </div>
                <div className="case-stat-card">
                    <span className="case-stat-label">조사 완료</span>
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
                    placeholder="이름, 사건 유형, 사건번호로 검색..."
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
                        <div className="case-card-avatar">{c.subject.avatar}</div>
                        <div className="case-card-body">
                            <div className="case-card-name">
                                {c.subject.name}
                                <span className="case-role-tag">{c.subject.role}</span>
                            </div>
                            <div className="case-card-meta">
                                <span>📁 {c.caseType}</span>
                                <span>🔢 {c.caseNum}</span>
                                <span>📅 {c.date}</span>
                                <span>📍 {c.officer.station}</span>
                            </div>
                            <span className="case-card-badge">POLICE</span>
                        </div>
                        <div className="case-card-right">
                            <span className={`case-status-badge ${c.statusType}`}>{c.flagged ? '⚠️ ' : ''}{c.status}</span>
                            <span className="case-card-officer">담당: {c.officer.name} {c.officer.rank}</span>
                            <Arrow />
                        </div>
                    </button>
                ))}
                {loading && <div className="case-empty">⏳ 케이스를 불러오는 중...</div>}
                {!loading && filtered.length === 0 && (
                    <div className="case-empty">
                        {cases.length === 0
                            ? <span>등록된 케이스가 없습니다.<br/><span style={{fontSize:12,color:'#aaa'}}>번역기에서 대화 후 저장하기를 누르면 여기에 표시됩니다.</span></span>
                            : '검색 결과가 없습니다.'}
                    </div>
                )}
            </div>
        </div>
    )
}