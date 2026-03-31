import { useState } from 'react'
import './ImmigrationCasePage.css'

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

            <div className="case-people-grid">
                <div className="case-person-card applicant">
                    <div className="case-person-header">
                        <div className="case-person-emoji">{ap.avatar || '🧏'}</div>
                        <div>
                            <div className="case-person-role">🧏 신청인 (청각장애인)</div>
                            <div className="case-person-name">{ap.name}</div>
                        </div>
                    </div>
                    <div className="case-person-rows">
                        {[['생년월일', ap.birth], ['장애 유형', ap.disability], ['국적', ap.nationality], ['연락처', ap.phone], ['주소', ap.address]]
                            .filter(([, v]) => v)
                            .map(([k, v]) => <div className="case-person-row" key={k}><span>{k}</span><span>{v}</span></div>)}
                    </div>
                </div>

                <div className="case-person-card officer-blue">
                    <div className="case-person-header">
                        <div className="case-person-emoji">{of_.avatar || '👔'}</div>
                        <div>
                            <div className="case-person-role">👔 담당 심사관</div>
                            <div className="case-person-name">{of_.name}</div>
                        </div>
                    </div>
                    <div className="case-person-rows">
                        {[['직책', of_.position], ['소속', of_.department], ['배지 번호', of_.badge]]
                            .filter(([, v]) => v)
                            .map(([k, v]) => <div className="case-person-row" key={k}><span>{k}</span><span>{v}</span></div>)}
                    </div>
                </div>
            </div>

            <div className="case-section">
                <div className="case-section-title">📋 신청 정보</div>
                <div className="case-info-grid">
                    {[['신청 목적', c.purpose], ['날짜·시간', `${c.date} ${c.time}`], ['장소', c.location], ['소요 시간', c.duration]]
                        .filter(([, v]) => v)
                        .map(([k, v]) => <div className="case-info-row" key={k}><span>{k}</span><span>{v}</span></div>)}
                </div>
            </div>

            <div className="case-section">
                <div className="case-section-title">💬 수어 통역 대화 기록</div>
                <div className="case-conv-list">
                    {signs.length === 0 && voice.length === 0 && (
                        <p className="case-empty" style={{ padding: '12px 0', color: '#999' }}>대화 기록이 없습니다.</p>
                    )}
                    {signs.map((s, i) => (
                        <div className="case-conv-msg case-conv-sign" key={'s'+i}>
                            <span className="case-conv-who">🧏 {ap.name}</span>
                            <span className="case-conv-text">{s}</span>
                        </div>
                    ))}
                    {voice.map((v, i) => (
                        <div className="case-conv-msg case-conv-voice" key={'v'+i}>
                            <span className="case-conv-who">👔 {of_.name}</span>
                            <span className="case-conv-text">{v}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="case-actions">
                <button className="case-btn-primary">📄 공식 문서 출력</button>
                <button className="case-btn-secondary">📥 기록 저장</button>
                {c.flagged && <button className="case-btn-danger">⚠️ 이의제기 접수</button>}
            </div>
        </div>
    )
}

/* ── 목록 화면 ──
 * props:
 *   cases       - MyPage에서 DB 조회 후 내려주는 케이스 배열 (없으면 빈 배열)
 *   displayName - 기관명
 *   profile     - 회원가입 전체 정보 { email, orgCode, address, ... }
 */
export default function ImmigrationCasePage({ onBack, displayName = '', profile = null, cases = [] }) {
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
                <h1 className="case-title">청각장애인 신청인 목록</h1>
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
                {filtered.length === 0 && (
                    <div className="case-empty">
                        {cases.length === 0 ? '등록된 케이스가 없습니다.' : '검색 결과가 없습니다.'}
                    </div>
                )}
            </div>
        </div>
    )
}