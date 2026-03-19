import { useState } from 'react'
import './PoliceCasePage.css'

// ── 샘플 데이터: 경찰서 청각장애인 당사자 목록 ──
const CASES = [
    {
        id: 'POL-2025-001',
        subject: {
            name: '이호민',
            birth: '1990.04.12',
            disability: '청각장애 1급',
            nationality: '대한민국',
            phone: '010-1234-5678',
            address: '서울시 강남구 테헤란로 123',
            role: '피해자',
            avatar: '🧏',
        },
        officer: {
            name: '박민수',
            badge: '12-4892',
            rank: '경장',
            department: '형사과 1팀',
            station: '서울 강남경찰서',
            avatar: '👮',
        },
        caseType: '피해신고',
        caseNum: '2025-강남-4421',
        date: '2025.05.12',
        time: '16:10',
        location: '서울 강남경찰서 조사실 2호',
        duration: '15분 22초',
        status: '조사 완료',
        flagged: false,
        signs: ['안녕하세요 👋', '도움이 필요해요 🤲', '잠깐만요 ✋'],
        voice: ['사건 경위를 말씀해주세요', '언제 발생한 일인가요?', '진술서에 서명해 주세요'],
    },
    {
        id: 'POL-2025-002',
        subject: {
            name: '장민호',
            birth: '1988.07.05',
            disability: '청각장애 2급',
            nationality: '대한민국',
            phone: '010-8765-4321',
            address: '경기도 성남시 분당구 정자동 456',
            role: '참고인',
            avatar: '🧏',
        },
        officer: {
            name: '최지훈',
            badge: '08-2211',
            rank: '경위',
            department: '형사과 2팀',
            station: '서울 강남경찰서',
            avatar: '👮',
        },
        caseType: '참고인 조사',
        caseNum: '2025-강남-3901',
        date: '2025.05.10',
        time: '11:30',
        location: '서울 강남경찰서 조사실 3호',
        duration: '22분 05초',
        status: '검토 중',
        flagged: true,
        signs: ['안녕하세요 👋', '괜찮아요 😊', '감사합니다 🙏'],
        voice: ['목격한 내용을 말씀해주세요', '정확한 시간을 기억하시나요?'],
    },
    {
        id: 'POL-2025-003',
        subject: {
            name: '윤서연',
            birth: '1993.11.30',
            disability: '청각장애 1급',
            nationality: '대한민국',
            phone: '010-3333-6666',
            address: '서울시 서초구 반포대로 789',
            role: '피해자',
            avatar: '🧏',
        },
        officer: {
            name: '김현우',
            badge: '15-7731',
            rank: '순경',
            department: '생활안전과',
            station: '서울 서초경찰서',
            avatar: '👮',
        },
        caseType: '분실물 신고',
        caseNum: '2025-서초-1102',
        date: '2025.05.09',
        time: '13:45',
        location: '서울 서초경찰서 민원실',
        duration: '8분 10초',
        status: '접수 완료',
        flagged: false,
        signs: ['도움이 필요해요 🤲', '감사합니다 🙏'],
        voice: ['분실 신고를 도와드리겠습니다', '분실한 물건의 특징을 말씀해주세요'],
    },
]

// ── 상세 화면 ──
function CaseDetail({ caseData, onBack }) {
    const { subject, officer, signs, voice } = caseData

    return (
        <div className="pc-detail">
            <button className="pc-btn-back" onClick={onBack}>← 목록으로 돌아가기</button>

            <div className="pc-detail-header">
                <div>
                    <div className="pc-detail-id">{caseData.id}</div>
                    <div className="pc-case-num">사건번호: {caseData.caseNum}</div>
                </div>
                <div className={`pc-status-badge ${caseData.flagged ? 'danger' : 'ok'}`}>
                    {caseData.flagged ? '⚠️ ' + caseData.status : '✅ ' + caseData.status}
                </div>
            </div>

            <div className="pc-people-grid">
                {/* 당사자 카드 */}
                <div className="pc-person-card subject-card">
                    <div className="pc-person-header">
                        <div className="pc-person-avatar">{subject.avatar}</div>
                        <div>
                            <div className="pc-person-role">🧏 당사자 ({subject.role})</div>
                            <div className="pc-person-name">{subject.name}</div>
                        </div>
                    </div>
                    <div className="pc-person-rows">
                        {[
                            ['생년월일', subject.birth],
                            ['장애 유형', subject.disability],
                            ['국적',     subject.nationality],
                            ['연락처',   subject.phone],
                            ['주소',     subject.address],
                        ].map(([k, v]) => (
                            <div className="pc-person-row" key={k}>
                                <span>{k}</span><span>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 담당 경찰관 카드 */}
                <div className="pc-person-card officer-card">
                    <div className="pc-person-header">
                        <div className="pc-person-avatar">{officer.avatar}</div>
                        <div>
                            <div className="pc-person-role">👮 담당 경찰관</div>
                            <div className="pc-person-name">{officer.name}</div>
                        </div>
                    </div>
                    <div className="pc-person-rows">
                        {[
                            ['계급',     officer.rank],
                            ['소속팀',   officer.department],
                            ['근무지',   officer.station],
                            ['배지번호', officer.badge],
                        ].map(([k, v]) => (
                            <div className="pc-person-row" key={k}>
                                <span>{k}</span><span>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 사건 정보 */}
            <div className="pc-case-info">
                <div className="pc-section-title">📁 사건 정보</div>
                <div className="pc-info-grid">
                    {[
                        ['사건 유형', caseData.caseType],
                        ['사건 번호', caseData.caseNum],
                        ['날짜·시간', caseData.date + ' ' + caseData.time],
                        ['장소',      caseData.location],
                        ['소요 시간', caseData.duration],
                    ].map(([k, v]) => (
                        <div className="pc-info-row" key={k}>
                            <span>{k}</span><span>{v}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 대화 기록 */}
            <div className="pc-conversation">
                <div className="pc-section-title">💬 수어 통역 대화 기록</div>
                <div className="pc-conv-list">
                    {signs.map((s, i) => (
                        <div className="pc-conv-msg pc-sign" key={'s' + i}>
                            <span className="pc-conv-who">🧏 {subject.name} ({subject.role})</span>
                            <span className="pc-conv-text">{s}</span>
                        </div>
                    ))}
                    {voice.map((v, i) => (
                        <div className="pc-conv-msg pc-voice" key={'v' + i}>
                            <span className="pc-conv-who">👮 {officer.name} {officer.rank}</span>
                            <span className="pc-conv-text">{v}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 액션 버튼 */}
            <div className="pc-actions">
                <button className="pc-btn-primary">📄 수어 통역 조서 출력</button>
                <button className="pc-btn-secondary">🔏 디지털 서명 적용</button>
                <button className="pc-btn-secondary">📥 증거 저장</button>
                {caseData.flagged && (
                    <button className="pc-btn-danger">🚨 검토 요청</button>
                )}
            </div>
        </div>
    )
}

// ── 메인: 목록 화면 ──
export default function PoliceCasePage({ onBack }) {
    const [selected, setSelected] = useState(null)
    const [search,   setSearch]   = useState('')

    if (selected) {
        return <CaseDetail caseData={selected} onBack={() => setSelected(null)} />
    }

    const filtered = CASES.filter(c =>
        c.subject.name.includes(search) ||
        c.id.includes(search) ||
        c.caseType.includes(search) ||
        c.caseNum.includes(search)
    )

    return (
        <div className="pc-page">
            <button className="pc-btn-back" onClick={onBack}>← 마이페이지로</button>

            <div className="pc-header">
                <div className="pc-official-bar">👮 대한민국 경찰청</div>
                <h1 className="pc-title">청각장애인 당사자 목록</h1>
                <p className="pc-subtitle">이름을 선택하면 당사자와 담당 경찰관 정보를 확인할 수 있습니다.</p>
            </div>

            <input
                className="pc-search"
                placeholder="🔍  이름, 사건 유형, 사건번호로 검색..."
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            <div className="pc-list">
                {filtered.map(c => (
                    <button key={c.id} className={`pc-card ${c.flagged ? 'flagged' : ''}`} onClick={() => setSelected(c)}>
                        <div className="pc-card-avatar">{c.subject.avatar}</div>
                        <div className="pc-card-info">
                            <div className="pc-card-name">
                                {c.subject.name}
                                <span className="pc-role-tag">{c.subject.role}</span>
                            </div>
                            <div className="pc-card-meta">
                                <span>📁 {c.caseType}</span>
                                <span>🔢 {c.caseNum}</span>
                                <span>📅 {c.date}</span>
                                <span>📍 {c.officer.station}</span>
                            </div>
                        </div>
                        <div className="pc-card-right">
                            <div className={`pc-status-badge ${c.flagged ? 'danger' : 'ok'}`}>
                                {c.flagged ? '⚠️ ' + c.status : '✅ ' + c.status}
                            </div>
                            <div className="pc-card-officer">담당: {c.officer.name} {c.officer.rank}</div>
                            <div className="pc-card-arrow">→</div>
                        </div>
                    </button>
                ))}
                {filtered.length === 0 && (
                    <div className="pc-empty">검색 결과가 없습니다.</div>
                )}
            </div>
        </div>
    )
}