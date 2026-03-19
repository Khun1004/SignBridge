import { useState } from 'react'
import './ImmigrationCasePage.css'

// ── 샘플 데이터: 출입국 청각장애인 신청인 목록 ──
const CASES = [
    {
        id: 'IMM-2025-001',
        applicant: {
            name: '이호민',
            birth: '1990.04.12',
            disability: '청각장애 1급',
            nationality: '대한민국',
            phone: '010-1234-5678',
            address: '서울시 강남구 테헤란로 123',
            avatar: '🧏',
        },
        officer: {
            name: '박지수',
            badge: 'A-7741',
            department: '출입국·외국인정책본부',
            position: '출입국 심사관',
            avatar: '👔',
        },
        purpose: '체류연장 신청',
        date: '2025.05.12',
        time: '10:20',
        location: '인천국제공항 출입국사무소 3번 창구',
        duration: '12분 03초',
        status: '처리 완료',
        flagged: false,
        signs: ['안녕하세요 👋', '도움이 필요해요 🤲', '감사합니다 🙏'],
        voice: ['비자를 제시해주세요', '체류 기간이 만료되어 연장 신청이 필요합니다', '처리가 완료되었습니다'],
    },
    {
        id: 'IMM-2025-002',
        applicant: {
            name: '장민호',
            birth: '1985.09.28',
            disability: '청각장애 2급',
            nationality: '대한민국',
            phone: '010-9876-5432',
            address: '경기도 수원시 팔달구 중부대로 456',
            avatar: '🧏',
        },
        officer: {
            name: '김태영',
            badge: 'B-3312',
            department: '출입국·외국인정책본부',
            position: '출입국 심사관',
            avatar: '👔',
        },
        purpose: '관광비자 심사',
        date: '2025.05.11',
        time: '14:45',
        location: '인천국제공항 출입국사무소 1번 창구',
        duration: '8분 21초',
        status: '보류',
        flagged: true,
        signs: ['잠깐만요 ✋', '도움이 필요해요 🤲', '괜찮아요 😊'],
        voice: ['서류가 부족합니다', '추가 서류를 제출해주세요', '재방문이 필요합니다'],
    },
    {
        id: 'IMM-2025-003',
        applicant: {
            name: '최수아',
            birth: '1995.02.17',
            disability: '청각장애 1급',
            nationality: '대한민국',
            phone: '010-5555-7777',
            address: '서울시 마포구 합정동 789',
            avatar: '🧏',
        },
        officer: {
            name: '이민정',
            badge: 'C-9921',
            department: '출입국·외국인정책본부',
            position: '선임 심사관',
            avatar: '👔',
        },
        purpose: '귀화 신청',
        date: '2025.05.10',
        time: '09:00',
        location: '서울출입국·외국인청 5번 창구',
        duration: '25분 40초',
        status: '심사 중',
        flagged: false,
        signs: ['안녕하세요 👋', '감사합니다 🙏'],
        voice: ['귀화 신청서를 작성해주세요', '추가 서류가 필요합니다'],
    },
]

// ── 화살표 아이콘 ──
function ArrowIcon() {
    return (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
    )
}

// ── 상세 화면 ──
function CaseDetail({ caseData, onBack }) {
    const { applicant, officer, signs, voice } = caseData

    return (
        <div className="ic-detail">
            <button className="ic-btn-back" onClick={onBack}>← 목록으로 돌아가기</button>

            <div className="ic-detail-header">
                <div className="ic-detail-id">{caseData.id}</div>
                <div className={`ic-status-badge ${caseData.flagged ? 'danger' : 'ok'}`}>
                    {caseData.flagged ? '⚠️ ' + caseData.status : '✅ ' + caseData.status}
                </div>
            </div>

            <div className="ic-people-grid">
                <div className="ic-person-card applicant-card">
                    <div className="ic-person-header">
                        <div className="ic-person-avatar">{applicant.avatar}</div>
                        <div>
                            <div className="ic-person-role">🧏 신청인 (청각장애인)</div>
                            <div className="ic-person-name">{applicant.name}</div>
                        </div>
                    </div>
                    <div className="ic-person-rows">
                        {[
                            ['생년월일', applicant.birth],
                            ['장애 유형', applicant.disability],
                            ['국적',     applicant.nationality],
                            ['연락처',   applicant.phone],
                            ['주소',     applicant.address],
                        ].map(([k, v]) => (
                            <div className="ic-person-row" key={k}>
                                <span>{k}</span><span>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="ic-person-card officer-card">
                    <div className="ic-person-header">
                        <div className="ic-person-avatar">{officer.avatar}</div>
                        <div>
                            <div className="ic-person-role">👔 담당 심사관</div>
                            <div className="ic-person-name">{officer.name}</div>
                        </div>
                    </div>
                    <div className="ic-person-rows">
                        {[
                            ['직책',     officer.position],
                            ['소속',     officer.department],
                            ['배지 번호', officer.badge],
                        ].map(([k, v]) => (
                            <div className="ic-person-row" key={k}>
                                <span>{k}</span><span>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="ic-case-info">
                <div className="ic-section-title">📋 신청 정보</div>
                <div className="ic-info-grid">
                    {[
                        ['신청 목적', caseData.purpose],
                        ['날짜·시간', caseData.date + ' ' + caseData.time],
                        ['장소',      caseData.location],
                        ['소요 시간', caseData.duration],
                    ].map(([k, v]) => (
                        <div className="ic-info-row" key={k}>
                            <span>{k}</span><span>{v}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="ic-conversation">
                <div className="ic-section-title">💬 수어 통역 대화 기록</div>
                <div className="ic-conv-list">
                    {signs.map((s, i) => (
                        <div className="ic-conv-msg ic-sign" key={'s' + i}>
                            <span className="ic-conv-who">🧏 {applicant.name}</span>
                            <span className="ic-conv-text">{s}</span>
                        </div>
                    ))}
                    {voice.map((v, i) => (
                        <div className="ic-conv-msg ic-voice" key={'v' + i}>
                            <span className="ic-conv-who">👔 {officer.name}</span>
                            <span className="ic-conv-text">{v}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="ic-actions">
                <button className="ic-btn-primary">📄 공식 문서 출력</button>
                <button className="ic-btn-secondary">📥 기록 저장</button>
                {caseData.flagged && (
                    <button className="ic-btn-danger">⚠️ 이의제기 접수</button>
                )}
            </div>
        </div>
    )
}

// ── 메인: 목록 화면 ──
export default function ImmigrationCasePage({ onBack }) {
    const [selected, setSelected] = useState(null)
    const [search,   setSearch]   = useState('')

    if (selected) {
        return <CaseDetail caseData={selected} onBack={() => setSelected(null)} />
    }

    const filtered = CASES.filter(c =>
        c.applicant.name.includes(search) ||
        c.id.includes(search) ||
        c.purpose.includes(search)
    )

    return (
        <div className="ic-page">
            <button className="ic-btn-back" onClick={onBack}>← 마이페이지로</button>

            <div className="ic-header">
                <div className="ic-official-bar">🛂 출입국·외국인사무소</div>
                <h1 className="ic-title">청각장애인 신청인 목록</h1>
                <p className="ic-subtitle">이름을 선택하면 신청인과 담당 심사관 정보를 확인할 수 있습니다.</p>
            </div>

            <input
                className="ic-search"
                placeholder="🔍  이름, 신청 목적, 사건번호로 검색..."
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            <div className="ic-list">
                {filtered.map(c => (
                    <button
                        key={c.id}
                        className={`ic-card ${c.flagged ? 'flagged' : ''}`}
                        onClick={() => setSelected(c)}
                    >
                        <div className="ic-card-avatar">{c.applicant.avatar}</div>
                        <div className="ic-card-info">
                            <div className="ic-card-name">{c.applicant.name}</div>
                            <div className="ic-card-meta">
                                <span>📋 {c.purpose}</span>
                                <span>📅 {c.date}</span>
                                <span>📍 {c.location.split(' ').slice(0, 2).join(' ')}</span>
                            </div>
                            <span className="ic-card-badge">IMMIGRATION</span>
                        </div>
                        <div className="ic-card-right">
                            <div className={`ic-status-badge ${c.flagged ? 'danger' : 'ok'}`}>
                                {c.flagged ? '⚠️ ' + c.status : '✅ ' + c.status}
                            </div>
                            <div className="ic-card-officer">담당: {c.officer.name}</div>
                            <div className="ic-card-arrow"><ArrowIcon /></div>
                        </div>
                    </button>
                ))}
                {filtered.length === 0 && (
                    <div className="ic-empty">검색 결과가 없습니다.</div>
                )}
            </div>
        </div>
    )
}