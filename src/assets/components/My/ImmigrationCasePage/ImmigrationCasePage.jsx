import { useState } from 'react'
import './ImmigrationCasePage.css'

const CASES = [
    {
        id: 'IMM-2025-001',
        applicant: {
            name: '이호민', birth: '1990.04.12', disability: '청각장애 1급',
            nationality: '대한민국', phone: '010-1234-5678',
            address: '서울시 강남구 테헤란로 123', avatar: '🧏',
        },
        officer: {
            name: '박지수', badge: 'A-7741', department: '출입국·외국인정책본부',
            position: '출입국 심사관', avatar: '👔',
        },
        purpose: '체류연장 신청', date: '2025.05.12', time: '10:20',
        location: '인천국제공항 출입국사무소 3번 창구', duration: '12분 03초',
        status: '처리 완료', statusType: 'ok', flagged: false,
        signs:  ['안녕하세요 👋', '도움이 필요해요 🤲', '감사합니다 🙏'],
        voice:  ['비자를 제시해주세요', '체류 기간이 만료되어 연장 신청이 필요합니다', '처리가 완료되었습니다'],
    },
    {
        id: 'IMM-2025-002',
        applicant: {
            name: '장민호', birth: '1985.09.28', disability: '청각장애 2급',
            nationality: '대한민국', phone: '010-9876-5432',
            address: '경기도 수원시 팔달구 중부대로 456', avatar: '🧏',
        },
        officer: {
            name: '김태영', badge: 'B-3312', department: '출입국·외국인정책본부',
            position: '출입국 심사관', avatar: '👔',
        },
        purpose: '관광비자 심사', date: '2025.05.11', time: '14:45',
        location: '인천국제공항 출입국사무소 1번 창구', duration: '8분 21초',
        status: '보류', statusType: 'danger', flagged: true,
        signs:  ['잠깐만요 ✋', '도움이 필요해요 🤲', '괜찮아요 😊'],
        voice:  ['서류가 부족합니다', '추가 서류를 제출해주세요', '재방문이 필요합니다'],
    },
    {
        id: 'IMM-2025-003',
        applicant: {
            name: '최수아', birth: '1995.02.17', disability: '청각장애 1급',
            nationality: '대한민국', phone: '010-5555-7777',
            address: '서울시 마포구 합정동 789', avatar: '🧏',
        },
        officer: {
            name: '이민정', badge: 'C-9921', department: '출입국·외국인정책본부',
            position: '선임 심사관', avatar: '👔',
        },
        purpose: '귀화 신청', date: '2025.05.10', time: '09:00',
        location: '서울출입국·외국인청 5번 창구', duration: '25분 40초',
        status: '심사 중', statusType: 'warn', flagged: false,
        signs:  ['안녕하세요 👋', '감사합니다 🙏'],
        voice:  ['귀화 신청서를 작성해주세요', '추가 서류가 필요합니다'],
    },
]

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
    const { applicant: ap, officer: of_, signs, voice } = c
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
                        <div className="case-person-emoji">{ap.avatar}</div>
                        <div>
                            <div className="case-person-role">🧏 신청인 (청각장애인)</div>
                            <div className="case-person-name">{ap.name}</div>
                        </div>
                    </div>
                    <div className="case-person-rows">
                        {[['생년월일', ap.birth], ['장애 유형', ap.disability], ['국적', ap.nationality], ['연락처', ap.phone], ['주소', ap.address]]
                            .map(([k, v]) => <div className="case-person-row" key={k}><span>{k}</span><span>{v}</span></div>)}
                    </div>
                </div>

                <div className="case-person-card officer-blue">
                    <div className="case-person-header">
                        <div className="case-person-emoji">{of_.avatar}</div>
                        <div>
                            <div className="case-person-role">👔 담당 심사관</div>
                            <div className="case-person-name">{of_.name}</div>
                        </div>
                    </div>
                    <div className="case-person-rows">
                        {[['직책', of_.position], ['소속', of_.department], ['배지 번호', of_.badge]]
                            .map(([k, v]) => <div className="case-person-row" key={k}><span>{k}</span><span>{v}</span></div>)}
                    </div>
                </div>
            </div>

            <div className="case-section">
                <div className="case-section-title">📋 신청 정보</div>
                <div className="case-info-grid">
                    {[['신청 목적', c.purpose], ['날짜·시간', `${c.date} ${c.time}`], ['장소', c.location], ['소요 시간', c.duration]]
                        .map(([k, v]) => <div className="case-info-row" key={k}><span>{k}</span><span>{v}</span></div>)}
                </div>
            </div>

            <div className="case-section">
                <div className="case-section-title">💬 수어 통역 대화 기록</div>
                <div className="case-conv-list">
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

/* ── 목록 화면 ── */
export default function ImmigrationCasePage({ onBack }) {
    const [selected, setSelected] = useState(null)
    const [search,   setSearch]   = useState('')

    if (selected) return <CaseDetail c={selected} onBack={() => setSelected(null)} />

    const filtered = CASES.filter(c =>
        c.applicant.name.includes(search) || c.id.includes(search) || c.purpose.includes(search)
    )

    const total    = CASES.length
    const flagged  = CASES.filter(c => c.flagged).length
    const complete = CASES.filter(c => c.statusType === 'ok').length

    return (
        <div className="case-page" style={{ '--accent': ACCENT, '--accent-light': 'rgba(124,58,237,0.07)', '--accent-border': 'rgba(124,58,237,0.2)' }}>
            <button className="case-btn-back" onClick={onBack}>← 마이페이지로</button>

            {/* 헤더 */}
            <div className="case-header">
                <div className="case-official-bar">🛂 출입국·외국인사무소</div>
                <h1 className="case-title">청각장애인 신청인 목록</h1>
                <p className="case-subtitle">이름을 선택하면 신청인과 담당 심사관 정보를 확인할 수 있습니다.</p>
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
                        <div className="case-card-avatar">{c.applicant.avatar}</div>
                        <div className="case-card-body">
                            <div className="case-card-name">{c.applicant.name}</div>
                            <div className="case-card-meta">
                                <span>📋 {c.purpose}</span>
                                <span>📅 {c.date}</span>
                                <span>📍 {c.location.split(' ').slice(0,2).join(' ')}</span>
                            </div>
                            <span className="case-card-badge">IMMIGRATION</span>
                        </div>
                        <div className="case-card-right">
                            <span className={`case-status-badge ${c.statusType}`}>{c.flagged ? '⚠️ ' : ''}{c.status}</span>
                            <span className="case-card-officer">담당: {c.officer.name}</span>
                            <Arrow />
                        </div>
                    </button>
                ))}
                {filtered.length === 0 && <div className="case-empty">검색 결과가 없습니다.</div>}
            </div>
        </div>
    )
}