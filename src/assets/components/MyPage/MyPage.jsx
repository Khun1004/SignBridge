import { useState, useEffect } from 'react'
import './MyPage.css'
import ImmigrationCasePage from '../My/ImmigrationCasePage/ImmigrationCasePage.jsx'
import PoliceCasePage      from '../My/PoliceCasePage/PoliceCasePage.jsx'
import { myPageApi } from '../../../assets/components/api/api.jsx';

// ══════════════════════════════════════════
//  상수
// ══════════════════════════════════════════
const ORG_META = {
  immigration: { icon: '🛂', label: '출입국외국인사무소', color: '#7c3aed' },
  airport:     { icon: '✈️', label: '공항',              color: '#0891b2' },
  hospital:    { icon: '🏥', label: '병원',              color: '#059669' },
  police:      { icon: '👮', label: '경찰서',            color: '#dc2626' },
}

// 기관 선택 화면에 표시할 카드 (orgType이 없을 때만 사용)
const USAGE_TYPES = [
  { id: 'personal',    icon: '👤', label: '개인용',            badge: 'PERSONAL',   sub: '내 대화 기록 및 프로필 관리',  color: '#2563eb' },
  { id: 'immigration', icon: '🛂', label: '출입국외국인사무소', badge: 'IMMIGRATION', sub: '청각장애인 신청인 목록 조회',  color: '#7c3aed' },
  { id: 'police',      icon: '👮', label: '경찰서',            badge: 'POLICE',      sub: '청각장애인 당사자 목록 조회', color: '#dc2626' },
]

const PERSONAL_STATS = [
  { icon: '📋', label: '총 대화 기록', value: '23건' },
  { icon: '⭐', label: '즐겨찾기',     value: '6개' },
  { icon: '🕐', label: '총 사용 시간', value: '1시간 42분' },
  { icon: '📍', label: '사용 장소',    value: '5곳' },
]

const PERSONAL_RECORDS = [
  { id: 'REC-001', date: '2025.05.12', time: '14:32', location: '인천국제공항 출국장',   duration: '3분 22초', signs: ['안녕하세요 👋', '화장실 어디예요? 🚻'], voice: ['화장실은 왼쪽으로 가시면 됩니다'], flagged: false },
  { id: 'REC-002', date: '2025.05.11', time: '09:15', location: '출입국 사무소 3번 창구', duration: '7분 51초', signs: ['도움이 필요해요 🤲', '잠깐만요 ✋'],       voice: ['여권을 보여주세요'],                  flagged: true  },
]

// ══════════════════════════════════════════
//  RecordModal
// ══════════════════════════════════════════
function RecordModal({ record, onClose }) {
  if (!record) return null
  return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <div className="modal-id">{record.id}</div>
              <div className={`record-status ${record.flagged ? 'status-danger' : 'status-ok'}`}>
                {record.flagged ? '⚠️ 분쟁 발생' : '✅ 정상 완료'}
              </div>
            </div>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
          <div className="modal-meta">
            <span>📅 {record.date} {record.time}</span>
            {record.location && <span>📍 {record.location}</span>}
            <span>⏱ {record.duration}</span>
          </div>
          <div className="modal-section">
            <div className="modal-section-title">수어 인식 기록</div>
            {record.signs.map((s, i) => (
                <div className="modal-msg sign-msg" key={i}>
                  <span className="msg-ico">🧏</span><span>{s}</span>
                  <span className="msg-time">+{(i + 1) * 15}초</span>
                </div>
            ))}
          </div>
          <div className="modal-section">
            <div className="modal-section-title">음성 기록</div>
            {record.voice.map((v, i) => (
                <div className="modal-msg voice-msg" key={i}>
                  <span className="msg-ico">🙋</span><span>{v}</span>
                  <span className="msg-time">+{(i + 1) * 20}초</span>
                </div>
            ))}
          </div>
          <div className="modal-actions">
            <button className="modal-btn-export">📥 공식 문서 저장 (PDF)</button>
            <button className="modal-btn-report">🚨 이의 제기</button>
          </div>
          {record.flagged && (
              <div className="modal-warning">
                ⚠️ 이 기록은 검토가 필요한 건입니다. 법적 증거로 보존되어 있으며 관련 기관에 제출 가능합니다.
              </div>
          )}
        </div>
      </div>
  )
}

// ══════════════════════════════════════════
//  개인용 MyPage
// ══════════════════════════════════════════
function PersonalMyPage({ displayName, onBack }) {
  const [activeTab, setActiveTab]     = useState('프로필')
  const [selectedRecord, setSelected] = useState(null)
  const [filterFlag, setFilterFlag]   = useState(false)
  const [editMode, setEditMode]       = useState(false)
  const [userName, setUserName]       = useState(displayName || '김서준')
  const [userRole, setUserRole]       = useState('청각장애인')
  const [notify, setNotify]           = useState(true)
  const [autoSave, setAutoSave]       = useState(true)
  const [lang, setLang]               = useState('한국어')

  const USER_ID  = 'SB-2025-00142'
  const LOCATION = '인천국제공항 1터미널'
  const JOINED   = '2025.01.15'
  const filtered = PERSONAL_RECORDS.filter(r => !filterFlag || r.flagged)
  const TABS = ['프로필', '대화 기록', '즐겨찾기', '설정']

  return (
      <>
        <div className="my-header">
          <div className="my-header-inner">
            <div className="my-avatar-wrap">
              <div className="my-avatar-big">🧏</div>
              <div className="my-avatar-badge">✓</div>
            </div>
            <div className="my-header-info">
              <div className="my-name">{userName}님, 환영합니다!</div>
              <div className="my-role-badge personal-badge">{userRole}</div>
              <div className="my-meta">
                <span>🪪 {USER_ID}</span>
                <span>📍 {LOCATION}</span>
                <span>📅 가입일 {JOINED}</span>
              </div>
            </div>
            <button className="edit-btn" onClick={() => setEditMode(true)}>✏️ 편집</button>
          </div>
          <div className="my-stats">
            {PERSONAL_STATS.map(s => (
                <div className="my-stat" key={s.label}>
                  <span className="my-stat-icon">{s.icon}</span>
                  <span className="my-stat-value">{s.value}</span>
                  <span className="my-stat-label">{s.label}</span>
                </div>
            ))}
          </div>
        </div>

        <div className="my-tabs">
          {TABS.map(t => (
              <button key={t} className={`my-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>

        {activeTab === '프로필' && (
            <div className="tab-content">
              <div className="profile-grid">
                <div className="profile-card">
                  <div className="profile-card-title">🪪 기본 정보</div>
                  <div className="profile-rows">
                    {[['이름', userName], ['사용자 유형', userRole], ['사용자 ID', USER_ID], ['주 사용 장소', LOCATION], ['가입일', JOINED]].map(([k, v]) => (
                        <div className="profile-row" key={k}><span>{k}</span><span>{v}</span></div>
                    ))}
                  </div>
                </div>
                <div className="profile-card">
                  <div className="profile-card-title">📍 사용 가능 장소</div>
                  <div className="profile-rows">
                    {['✈️ 공항 (출국/입국)', '🛂 출입국 사무소', '🏛️ 세관 검사대', '🚔 경찰서', '🏥 병원 / 응급실', '🏫 학교 / 관공서'].map(p => (
                        <div className="profile-row" key={p}><span>{p}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
        )}

        {activeTab === '대화 기록' && (
            <div className="tab-content">
              <div className="filter-row">
                <label className="filter-label">
                  <input type="checkbox" checked={filterFlag} onChange={e => setFilterFlag(e.target.checked)} />
                  분쟁 기록만 보기
                </label>
              </div>
              {filtered.map(r => (
                  <div key={r.id} className={`record-card ${r.flagged ? 'flagged' : ''}`} onClick={() => setSelected(r)}>
                    <div className="record-top">
                      <div className="record-id">{r.id}</div>
                      <div className={`record-status ${r.flagged ? 'status-danger' : 'status-ok'}`}>{r.flagged ? '⚠️ 분쟁 발생' : '✅ 정상'}</div>
                    </div>
                    <div className="record-info">
                      <span>📅 {r.date} {r.time}</span>
                      <span>📍 {r.location}</span>
                      <span>⏱ {r.duration}</span>
                    </div>
                    <div className="record-preview">
                      {r.signs.map((s, i) => <span key={i} className="sign-chip personal-chip">{s}</span>)}
                    </div>
                    <div className="record-footer">
                      <button className="detail-btn">🔍 상세 보기</button>
                      <button className="export-btn" onClick={e => e.stopPropagation()}>📥 저장</button>
                    </div>
                  </div>
              ))}
              {filtered.length === 0 && <div className="records-empty">해당하는 기록이 없습니다.</div>}
            </div>
        )}

        {activeTab === '즐겨찾기' && (
            <div className="tab-content">
              <div className="fav-grid">
                {[
                  { emoji: '👋', word: '안녕하세요', en: 'Hello' },
                  { emoji: '🚻', word: '화장실 어디예요?', en: 'Restroom?' },
                  { emoji: '🆘', word: '도와주세요', en: 'Help me' },
                  { emoji: '🙏', word: '감사합니다', en: 'Thank you' },
                  { emoji: '✋', word: '잠깐만요', en: 'Wait please' },
                  { emoji: '😊', word: '괜찮아요', en: "I'm okay" },
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

        {activeTab === '설정' && (
            <div className="tab-content">
              <div className="settings-list">
                <div className="setting-group">
                  <div className="setting-group-title">🌐 언어 설정</div>
                  <div className="setting-row">
                    <span>표시 언어</span>
                    <select className="setting-select" value={lang} onChange={e => setLang(e.target.value)}>
                      <option>한국어</option><option>English</option><option>日本語</option><option>中文</option>
                    </select>
                  </div>
                </div>
                <div className="setting-group">
                  <div className="setting-group-title">🔔 알림 설정</div>
                  <div className="setting-row">
                    <span>대화 기록 알림</span>
                    <button className={`toggle ${notify ? 'on' : ''}`} onClick={() => setNotify(v => !v)}><div className="toggle-thumb" /></button>
                  </div>
                  <div className="setting-row">
                    <span>자동 기록 저장</span>
                    <button className={`toggle ${autoSave ? 'on' : ''}`} onClick={() => setAutoSave(v => !v)}><div className="toggle-thumb" /></button>
                  </div>
                </div>
                <div className="setting-group">
                  <div className="setting-group-title">🔒 보안</div>
                  <div className="setting-row"><span>기록 암호화</span><span className="setting-badge-on">활성화됨</span></div>
                  <button className="danger-btn">⚠️ 모든 기록 삭제</button>
                </div>
              </div>
            </div>
        )}

        <RecordModal record={selectedRecord} onClose={() => setSelected(null)} />

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
                    <option>청각장애인</option><option>통역사</option><option>관계자</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button className="modal-btn-export" onClick={() => setEditMode(false)}>저장하기</button>
                </div>
              </div>
            </div>
        )}
      </>
  )
}

// ══════════════════════════════════════════
//  기관 환영 배너 (기관 페이지 상단)
// ══════════════════════════════════════════
function OrgWelcomeHeader({ displayName, orgLabel, orgIcon, orgColor }) {
  return (
      <div className="my-org-welcome" style={{ '--org-color': orgColor }}>
        <span className="my-org-welcome-icon">{orgIcon}</span>
        <div>
          <div className="my-org-welcome-name">{displayName} 환영합니다!</div>
          <div className="my-org-welcome-label">{orgLabel}</div>
        </div>
      </div>
  )
}

// ══════════════════════════════════════════
//  화살표 아이콘 (선택 화면용)
// ══════════════════════════════════════════
function ArrowIcon() {
  return (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
  )
}

// ══════════════════════════════════════════
//  메인 MyPage
//
//  동작 규칙:
//  - orgType이 있으면 → 선택 화면 없이 바로 해당 화면
//  - orgType이 없으면 → 기존 선택 화면 표시
// ══════════════════════════════════════════
export default function MyPage({ displayName = '', orgType = '', userEmail = '' }) {
    const initialView = orgType || 'select'
    const [view, setView] = useState(initialView)

    // 데이터 저장을 위한 상태 추가
    const [profileData, setProfileData] = useState(null);
    const [caseList, setCaseList] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadMyData = async () => {
            if (!userEmail) return; // 이메일이 없으면 요청하지 않음

            setLoading(true);
            try {
                // 프로필 정보와 케이스 목록을 가져와 상태에 저장
                const profile = await myPageApi.getProfile(userEmail);
                const cases = await myPageApi.getCases(userEmail);

                setProfileData(profile);
                setCaseList(cases); // 이제 'profile' is assigned a value but never used 에러가 사라집니다.
            } catch (err) {
                console.error("데이터 로드 실패:", err.message);
            } finally {
                setLoading(false);
            }
        };

        loadMyData();
    }, [userEmail]);

  // orgType prop이 바뀌면(로그인 직후 등) view도 동기화
  useEffect(() => {
    setView(orgType || 'select')
  }, [orgType])

  const meta = ORG_META[view] || {}

  // ── orgType 없음: 선택 화면 ──
  if (view === 'select') {
    return (
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
                    <button
                        key={type.id}
                        className="sel-card"
                        style={{ '--card-color': type.color }}
                        onClick={() => setView(type.id)}
                    >
                      <div className="sel-card-icon">{type.icon}</div>
                      <div className="sel-card-body">
                        <div className="sel-card-label">{type.label}</div>
                        <div className="sel-card-sub">{type.sub}</div>
                        <span className="sel-card-badge">{type.badge}</span>
                      </div>
                      <div className="sel-card-arrow"><ArrowIcon /></div>
                    </button>
                ))}
              </div>
            </div>
          </div>
        </div>
    )
  }

  // ── 개인 ──
    if (view === 'personal') {
        return (
            <div className="my-page">
                <div className="view-wrap">
                    {!orgType && <button className="back-btn" onClick={() => setView('select')}>← 뒤로</button>}
                    {/* DB에서 가져온 실제 이름을 우선 표시 */}
                    <PersonalMyPage
                        displayName={profileData?.name || displayName}
                        profile={profileData}
                    />
                </div>
            </div>
        )
    }

  // ── 출입국 ──
  if (view === 'immigration') {
    return (
        <div className="my-page">
          <div className="view-wrap">
            {!orgType && (
                <button className="back-btn" onClick={() => setView('select')}>← 용도 선택으로</button>
            )}
            <OrgWelcomeHeader displayName={displayName} orgLabel={meta.label} orgIcon={meta.icon} orgColor={meta.color} />
            <ImmigrationCasePage onBack={orgType ? undefined : () => setView('select')} />
          </div>
        </div>
    )
  }

  // ── 경찰 ──
  if (view === 'police') {
    return (
        <div className="my-page">
          <div className="view-wrap">
            {!orgType && (
                <button className="back-btn" onClick={() => setView('select')}>← 용도 선택으로</button>
            )}
            <OrgWelcomeHeader displayName={displayName} orgLabel={meta.label} orgIcon={meta.icon} orgColor={meta.color} />
            <PoliceCasePage onBack={orgType ? undefined : () => setView('select')} />
          </div>
        </div>
    )
  }

  // ── 병원·공항 등 (ImmigrationCasePage/PoliceCasePage 없는 기관) ──
  // 추후 해당 페이지 완성 시 교체
  return (
      <div className="my-page">
        <div className="view-wrap">
          <OrgWelcomeHeader displayName={displayName} orgLabel={meta.label} orgIcon={meta.icon} orgColor={meta.color} />
          <div className="records-empty" style={{ marginTop: 40 }}>
            {meta.icon} {meta.label} 화면은 준비 중입니다.
          </div>
        </div>
      </div>
  )
}