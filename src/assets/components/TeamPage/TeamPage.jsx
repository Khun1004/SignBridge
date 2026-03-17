import './TeamPage.css'

const TEAM = [
  { name: '김민준', role: 'AI 모델 개발',  emoji: '🤖', color: '#7c6fff' },
  { name: '이서연', role: 'UI/UX 디자인',  emoji: '🎨', color: '#ec4899' },
  { name: '박지호', role: '백엔드 개발',   emoji: '⚙️', color: '#10b981' },
  { name: '최유나', role: '프로젝트 기획', emoji: '📋', color: '#f59e0b' },
]

export default function TeamPage() {
  return (
    <div className="page">
      <div className="section-tag">우리 팀</div>
      <h2 className="section-title">SignBridge 팀을 소개합니다</h2>

      <div className="team-grid">
        {TEAM.map(m => (
          <div className="team-card" key={m.name} style={{ '--c': m.color }}>
            <div
              className="team-avatar"
              style={{ background: m.color + '22', color: m.color }}
            >
              {m.emoji}
            </div>
            <div className="team-name">{m.name}</div>
            <div className="team-role">{m.role}</div>
          </div>
        ))}
      </div>

      <div className="mission-box">
        <div className="mission-title">🌏 우리의 미션</div>
        <p className="mission-text">
          청각장애인과 비장애인 사이의 소통 장벽을 AI 기술로 허물고,<br />
          모두가 연결되는 세상을 만들어갑니다.
        </p>
      </div>
    </div>
  )
}