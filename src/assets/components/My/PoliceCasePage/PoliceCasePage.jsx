import { useState } from 'react'
import './PoliceCasePage.css'

const CASES = [
    {
        id: 'POL-2025-001',
        subject: {
            name: '이호민', birth: '1990.04.12', disability: '청각장애 1급',
            nationality: '대한민국', phone: '010-1234-5678',
            address: '서울시 강남구 테헤란로 123', role: '피해자', avatar: '🧏',
        },
        officer: {
            name: '박민수', badge: '12-4892', rank: '경장',
            department: '형사과 1팀', station: '서울 강남경찰서', avatar: '👮',
        },
        caseType: '피해신고', caseNum: '2025-강남-4421',
        date: '2025.05.12', time: '16:10',
        location: '서울 강남경찰서 조사실 2호', duration: '15분 22초',
        status: '조사 완료', statusType: 'ok', flagged: false,
        signs:  ['안녕하세요 👋', '도움이 필요해요 🤲', '잠깐만요 ✋'],
        voice:  ['사건 경위를 말씀해주세요', '언제 발생한 일인가요?', '진술서에 서명해 주세요'],
    },
    {
        id: 'POL-2025-002',
        subject: {
            name: '장민호', birth: '1988.07.05', disability: '청각장애 2급',
            nationality: '대한민국', phone: '010-8765-4321',
            address: '경기도 성남시 분당구 정자동 456', role: '참고인', avatar: '🧏',
        },
        officer: {
            name: '최지훈', badge: '08-2211', rank: '경위',
            department: '형사과 2팀', station: '서울 강남경찰서', avatar: '👮',
        },
        caseType: '참고인 조사', caseNum: '2025-강남-3901',
        date: '2025.05.10', time: '11:30',
        location: '서울 강남경찰서 조사실 3호', duration: '22분 05초',
        status: '검토 중', statusType: 'warn', flagged: true,
        signs:  ['안녕하세요 👋', '괜찮아요 😊', '감사합니다 🙏'],
        voice:  ['목격한 내용을 말씀해주세요', '정확한 시간을 기억하시나요?'],
    },
    {
        id: 'POL-2025-003',
        subject: {
            name: '윤서연', birth: '1993.11.30', disability: '청각장애 1급',
            nationality: '대한민국', phone: '010-3333-6666',
            address: '서울시 서초구 반포대로 789', role: '피해자', avatar: '🧏',
        },
        officer: {
            name: '김현우', badge: '15-7731', rank: '순경',
            department: '생활안전과', station: '서울 서초경찰서', avatar: '👮',
        },
        caseType: '분실물 신고', caseNum: '2025-서초-1102',
        date: '2025.05.09', time: '13:45',
        location: '서울 서초경찰서 민원실', duration: '8분 10초',
        status: '접수 완료', statusType: 'ok', flagged: false,
        signs:  ['도움이 필요해요 🤲', '감사합니다 🙏'],
        voice:  ['분실 신고를 도와드리겠습니다', '분실한 물건의 특징을 말씀해주세요'],
    },
]

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
    const { subject: sb, officer: of_, signs, voice } = c
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

            <div className="case-section">
                <div className="case-section-title">💬 수어 통역 대화 기록</div>
                <div className="case-conv-list">
                    {signs.map((s, i) => (
                        <div className="case-conv-msg case-conv-sign" key={'s'+i}>
                            <span className="case-conv-who">🧏 {sb.name} ({sb.role})</span>
                            <span className="case-conv-text">{s}</span>
                        </div>
                    ))}
                    {voice.map((v, i) => (
                        <div className="case-conv-msg case-conv-voice" key={'v'+i}>
                            <span className="case-conv-who">👮 {of_.name} {of_.rank}</span>
                            <span className="case-conv-text">{v}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="case-actions">
                <button className="case-btn-primary">📄 수어 통역 조서 출력</button>
                <button className="case-btn-secondary">🔏 디지털 서명 적용</button>
                <button className="case-btn-secondary">📥 증거 저장</button>
                {c.flagged && <button className="case-btn-danger">🚨 검토 요청</button>}
            </div>
        </div>
    )
}

/* ── 목록 화면 ── */
export default function PoliceCasePage({ onBack }) {
    const [selected, setSelected] = useState(null)
    const [search,   setSearch]   = useState('')

    if (selected) return <CaseDetail c={selected} onBack={() => setSelected(null)} />

    const filtered = CASES.filter(c =>
        c.subject.name.includes(search) || c.id.includes(search) ||
        c.caseType.includes(search) || c.caseNum.includes(search)
    )

    const total    = CASES.length
    const flagged  = CASES.filter(c => c.flagged).length
    const complete = CASES.filter(c => c.statusType === 'ok').length

    return (
        <div className="case-page" style={{ '--accent': ACCENT, '--accent-light': 'rgba(220,38,38,0.07)', '--accent-border': 'rgba(220,38,38,0.2)' }}>
            <button className="case-btn-back" onClick={onBack}>← 마이페이지로</button>

            {/* 헤더 */}
            <div className="case-header">
                <div className="case-official-bar">👮 대한민국 경찰청</div>
                <h1 className="case-title">청각장애인 당사자 목록</h1>
                <p className="case-subtitle">이름을 선택하면 당사자와 담당 경찰관 정보를 확인할 수 있습니다.</p>
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
                {filtered.length === 0 && <div className="case-empty">검색 결과가 없습니다.</div>}
            </div>
        </div>
    )
}