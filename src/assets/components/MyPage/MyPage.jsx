import { useState } from 'react'
import './MyPage.css'

// ── 샘플 데이터 ──
const SAMPLE_USER = {
  name: '김서준',
  role: '청각장애인',
  id: 'SB-2025-00142',
  location: '인천국제공항 1터미널',
  joined: '2025.01.15',
  avatar: '🧏',
}

const SAMPLE_RECORDS = [
  {
    id: 'REC-001',
    date: '2025.05.12',
    time: '14:32:08',
    location: '인천국제공항 출국장',
    duration: '3분 22초',
    signs: ['안녕하세요 👋', '화장실 어디예요? 🚻', '감사합니다 🙏'],
    voice: ['화장실은 왼쪽으로 가시면 됩니다', '천천히 말씀해 주세요'],
    status: '정상',
    flagged: false,
  },
  {
    id: 'REC-002',
    date: '2025.05.11',
    time: '09:15:44',
    location: '출입국 사무소 3번 창구',
    duration: '7분 51초',
    signs: ['도움이 필요해요 🤲', '잠깐만요 ✋', '괜찮아요 😊'],
    voice: ['여권을 보여주세요', '비자 확인이 필요합니다', '잠시만 기다려주세요'],
    status: '분쟁 발생',
    flagged: true,
  },
  {
    id: 'REC-003',
    date: '2025.05.10',
    time: '17:05:21',
    location: '공항 세관 검사대',
    duration: '2분 10초',
    signs: ['감사합니다 🙏', '안녕하세요 👋'],
    voice: ['수하물 검사 완료되었습니다'],
    status: '정상',
    flagged: false,
  },
]

const LOCATIONS = ['전체', '공항', '출입국 사무소', '세관', '경찰서', '병원', '기타']
const STATS = [
  { icon: '📋', label: '총 대화 기록', value: '23건' },
  { icon: '⚠️', label: '분쟁 기록',    value: '1건' },
  { icon: '🕐', label: '총 사용 시간', value: '1시간 42분' },
  { icon: '📍', label: '사용 장소',    value: '5곳' },
]

const TABS = ['프로필', '대화 기록', '즐겨찾기', '설정']

export default function MyPage() {
  const [activeTab, setActiveTab]       = useState('프로필')
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [filterLoc, setFilterLoc]       = useState('전체')
  const [filterFlag, setFilterFlag]     = useState(false)
  const [editMode, setEditMode]         = useState(false)
  const [userName, setUserName]         = useState(SAMPLE_USER.name)
  const [userRole, setUserRole]         = useState(SAMPLE_USER.role)
  const [lang, setLang]                 = useState('한국어')
  const [notify, setNotify]             = useState(true)
  const [autoSave, setAutoSave]         = useState(true)

  const filtered = SAMPLE_RECORDS.filter(r => {
    const locMatch = filterLoc === '전체' || r.location.includes(filterLoc)
    const flagMatch = !filterFlag || r.flagged
    return locMatch && flagMatch
  })

  return (
    <div className="my-page">

      {/* ── 상단 프로필 헤더 ── */}
      <div className="my-header">
        <div className="my-header-inner">
          <div className="my-avatar-wrap">
            <div className="my-avatar-big">{SAMPLE_USER.avatar}</div>
            <div className="my-avatar-badge">✓</div>
          </div>
          <div className="my-header-info">
            <div className="my-name">{userName}</div>
            <div className="my-role-badge">{userRole}</div>
            <div className="my-meta">
              <span>🪪 {SAMPLE_USER.id}</span>
              <span>📍 {SAMPLE_USER.location}</span>
              <span>📅 가입일 {SAMPLE_USER.joined}</span>
            </div>
          </div>
          <button className="edit-btn" onClick={() => setEditMode(true)}>✏️ 편집</button>
        </div>

        {/* 통계 */}
        <div className="my-stats">
          {STATS.map(s => (
            <div className="my-stat" key={s.label}>
              <span className="my-stat-icon">{s.icon}</span>
              <span className="my-stat-val">{s.value}</span>
              <span className="my-stat-lbl">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 탭 ── */}
      <div className="my-tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={`my-tab ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="my-body">

        {/* ════ 프로필 탭 ════ */}
        {activeTab === '프로필' && (
          <div className="tab-content">
            <div className="profile-grid">
              <div className="profile-card">
                <div className="profile-card-title">🪪 기본 정보</div>
                <div className="profile-row"><span>이름</span><span>{userName}</span></div>
                <div className="profile-row"><span>사용자 유형</span><span>{userRole}</span></div>
                <div className="profile-row"><span>사용자 ID</span><span className="mono">{SAMPLE_USER.id}</span></div>
                <div className="profile-row"><span>주 사용 장소</span><span>{SAMPLE_USER.location}</span></div>
                <div className="profile-row"><span>가입일</span><span>{SAMPLE_USER.joined}</span></div>
              </div>

              <div className="profile-card">
                <div className="profile-card-title">📍 사용 가능 장소</div>
                {['✈️ 공항 (출국/입국)', '🛂 출입국 사무소', '🏛️ 세관 검사대', '🚔 경찰서', '🏥 병원 / 응급실', '🏫 학교 / 관공서'].map(p => (
                  <div className="place-row" key={p}>
                    <span>{p}</span>
                    <span className="place-badge">사용 가능</span>
                  </div>
                ))}
              </div>

              <div className="profile-card full-width">
                <div className="profile-card-title">⚖️ 법적 안내</div>
                <div className="legal-box">
                  <p>SignBridge의 모든 대화 기록은 <strong>암호화</strong>되어 저장되며, 사용자 동의 없이 제3자에게 제공되지 않습니다.</p>
                  <p>대화 기록은 <strong>법적 증거 자료</strong>로 활용될 수 있으며, 관련 기관 요청 시 공식 절차를 통해 제출 가능합니다.</p>
                  <p>기록 보관 기간: <strong>5년</strong> (법적 분쟁 기록은 무기한 보관)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ 대화 기록 탭 ════ */}
        {activeTab === '대화 기록' && (
          <div className="tab-content">

            {/* 필터 */}
            <div className="record-filters">
              <div className="filter-group">
                {LOCATIONS.map(l => (
                  <button
                    key={l}
                    className={`filter-btn ${filterLoc === l ? 'active' : ''}`}
                    onClick={() => setFilterLoc(l)}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <button
                className={`flag-filter ${filterFlag ? 'active' : ''}`}
                onClick={() => setFilterFlag(v => !v)}
              >
                ⚠️ 분쟁 기록만 보기
              </button>
            </div>

            {/* 기록 목록 */}
            <div className="record-list">
              {filtered.map(r => (
                <div
                  key={r.id}
                  className={`record-card ${r.flagged ? 'flagged' : ''}`}
                  onClick={() => setSelectedRecord(r)}
                >
                  <div className="record-top">
                    <div className="record-id mono">{r.id}</div>
                    <div className={`record-status ${r.flagged ? 'status-danger' : 'status-ok'}`}>
                      {r.flagged ? '⚠️ 분쟁 발생' : '✅ 정상'}
                    </div>
                  </div>
                  <div className="record-info">
                    <span>📅 {r.date} {r.time}</span>
                    <span>📍 {r.location}</span>
                    <span>⏱ {r.duration}</span>
                  </div>
                  <div className="record-preview">
                    {r.signs.slice(0, 2).map((s, i) => (
                      <span key={i} className="sign-chip">{s}</span>
                    ))}
                  </div>
                  <div className="record-footer">
                    <button className="detail-btn" onClick={e => { e.stopPropagation(); setSelectedRecord(r) }}>
                      🔍 상세 보기
                    </button>
                    <button className="export-btn" onClick={e => e.stopPropagation()}>
                      📥 증거 저장
                    </button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="empty-records">해당하는 기록이 없습니다</div>
              )}
            </div>
          </div>
        )}

        {/* ════ 즐겨찾기 탭 ════ */}
        {activeTab === '즐겨찾기' && (
          <div className="tab-content">
            <div className="fav-grid">
              {[
                { emoji: '👋', word: '안녕하세요',       en: 'Hello' },
                { emoji: '🚻', word: '화장실 어디예요?',  en: 'Restroom?' },
                { emoji: '🆘', word: '도와주세요',       en: 'Help me' },
                { emoji: '🛂', word: '비자 확인이요',    en: 'Visa check' },
                { emoji: '✈️', word: '탑승구 어디예요?', en: 'Gate?' },
                { emoji: '🧳', word: '짐을 잃어버렸어요', en: 'Lost baggage' },
              ].map(f => (
                <div className="fav-card" key={f.word}>
                  <div className="fav-emoji">{f.emoji}</div>
                  <div className="fav-word">{f.word}</div>
                  <div className="fav-en">{f.en}</div>
                  <button className="fav-del">🗑</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ 설정 탭 ════ */}
        {activeTab === '설정' && (
          <div className="tab-content">
            <div className="settings-list">

              <div className="setting-group">
                <div className="setting-group-title">🌐 언어 설정</div>
                <div className="setting-row">
                  <span>표시 언어</span>
                  <select className="setting-select" value={lang} onChange={e => setLang(e.target.value)}>
                    <option>한국어</option>
                    <option>English</option>
                    <option>日本語</option>
                    <option>中文</option>
                  </select>
                </div>
              </div>

              <div className="setting-group">
                <div className="setting-group-title">🔔 알림 설정</div>
                <div className="setting-row">
                  <span>대화 기록 알림</span>
                  <div className={`toggle ${notify ? 'on' : ''}`} onClick={() => setNotify(v => !v)}>
                    <div className="toggle-thumb" />
                  </div>
                </div>
                <div className="setting-row">
                  <span>자동 기록 저장</span>
                  <div className={`toggle ${autoSave ? 'on' : ''}`} onClick={() => setAutoSave(v => !v)}>
                    <div className="toggle-thumb" />
                  </div>
                </div>
              </div>

              <div className="setting-group">
                <div className="setting-group-title">🔒 보안 & 개인정보</div>
                <div className="setting-row">
                  <span>기록 암호화</span>
                  <span className="setting-badge-on">활성화됨</span>
                </div>
                <div className="setting-row">
                  <span>기록 보관 기간</span>
                  <select className="setting-select">
                    <option>5년 (기본)</option>
                    <option>1년</option>
                    <option>무기한</option>
                  </select>
                </div>
                <button className="danger-btn">⚠️ 모든 기록 삭제</button>
              </div>

              <div className="setting-group">
                <div className="setting-group-title">🏛️ 기관 연동</div>
                {['인천국제공항', '출입국 사무소', '경찰청'].map(org => (
                  <div className="setting-row" key={org}>
                    <span>{org}</span>
                    <span className="setting-badge-on">연동됨</span>
                  </div>
                ))}
                <button className="add-org-btn">+ 기관 추가</button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ── 기록 상세 모달 ── */}
      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-id mono">{selectedRecord.id}</div>
                <div className={`record-status ${selectedRecord.flagged ? 'status-danger' : 'status-ok'}`}>
                  {selectedRecord.flagged ? '⚠️ 분쟁 발생' : '✅ 정상 대화'}
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedRecord(null)}>✕</button>
            </div>

            <div className="modal-meta">
              <span>📅 {selectedRecord.date} {selectedRecord.time}</span>
              <span>📍 {selectedRecord.location}</span>
              <span>⏱ {selectedRecord.duration}</span>
            </div>

            <div className="modal-section">
              <div className="modal-section-title">🧏 수어 인식 기록</div>
              {selectedRecord.signs.map((s, i) => (
                <div className="modal-msg sign-msg" key={i}>
                  <span className="msg-ico">🧏</span>
                  <span>{s}</span>
                  <span className="msg-time">+{(i+1)*15}초</span>
                </div>
              ))}
            </div>

            <div className="modal-section">
              <div className="modal-section-title">🙋 음성 기록</div>
              {selectedRecord.voice.map((v, i) => (
                <div className="modal-msg voice-msg" key={i}>
                  <span className="msg-ico">🙋</span>
                  <span>{v}</span>
                  <span className="msg-time">+{(i+1)*20}초</span>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="modal-btn-export">
                📥 증거 자료 다운로드 (PDF)
              </button>
              <button className="modal-btn-report">
                🚨 신고 / 이의 제기
              </button>
            </div>

            {selectedRecord.flagged && (
              <div className="modal-warning">
                ⚠️ 이 기록은 분쟁이 발생한 대화입니다. 법적 증거로 보존되어 있으며 관련 기관에 제출 가능합니다.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 프로필 편집 모달 ── */}
      {editMode && (
        <div className="modal-overlay" onClick={() => setEditMode(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-id">프로필 편집</div>
              <button className="modal-close" onClick={() => setEditMode(false)}>✕</button>
            </div>
            <div className="edit-form">
              <label className="edit-label">이름</label>
              <input className="edit-input" value={userName} onChange={e => setUserName(e.target.value)} />
              <label className="edit-label">사용자 유형</label>
              <select className="edit-input" value={userRole} onChange={e => setUserRole(e.target.value)}>
                <option>청각장애인</option>
                <option>통역사</option>
                <option>관계자</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="modal-btn-export" onClick={() => setEditMode(false)}>저장하기</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}