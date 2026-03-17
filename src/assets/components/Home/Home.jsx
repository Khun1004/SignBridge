import './Home.css'

const STEPS = [
  { icon: '📷', title: '카메라 인식',  desc: '웹캠으로 손동작을 실시간 촬영합니다.',              color: '#7c6fff' },
  { icon: '🤖', title: 'AI 분석',     desc: 'Pose 모델이 손 관절 21개 포인트를 정밀 추적합니다.', color: '#3b82f6' },
  { icon: '💬', title: '텍스트 변환', desc: '인식된 수어를 즉시 한국어 텍스트로 표시합니다.',     color: '#10b981' },
]

export default function Home() {
  return (
    <div className="home-page">

      {/* ── 히어로 ── */}
      <section className="hero-section">
        <div className="hero-left">
          <span className="hero-badge">🏆 AI 수어 번역 시스템</span>
          <h1 className="hero-title">
            손짓이<br />
            <span className="hero-accent">말이 됩니다</span>
          </h1>
          <p className="hero-sub">
            SignBridge는 카메라로 수어를 인식하여 실시간으로 텍스트로 변환합니다.<br />
            청각장애인과 비장애인 사이의 소통 다리를 놓습니다.
          </p>
          <div className="hero-btns">
            <button className="btn-primary">🎥 데모 체험하기</button>
            <button className="btn-outline">📖 더 알아보기</button>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-card floating">
            <div className="hcard-chip">실시간 인식 중</div>
            <div className="hcard-emoji">🤟</div>
            <div className="hcard-word">안녕하세요</div>
            <div className="hcard-en">Hello</div>
            <div className="hcard-bar"><div className="hcard-fill" /></div>
          </div>
        </div>
      </section>

      {/* ── 통계 ── */}
      <section className="stats-section">
        {[
          ['337만',  '국내 청각장애인'],
          ['7천만',  '전세계 수어 사용자'],
          ['98%',    '목표 인식 정확도'],
          ['0.3초',  '실시간 번역 속도'],
        ].map(([n, l]) => (
          <div className="stat-card" key={l}>
            <div className="stat-num">{n}</div>
            <div className="stat-lbl">{l}</div>
          </div>
        ))}
      </section>

      {/* ── 작동 원리 ── */}
      <section className="section">
        <div className="section-tag">작동 원리</div>
        <h2 className="section-title">세 단계로 완성되는 번역</h2>
        <div className="steps-grid">
          {STEPS.map((s, i) => (
            <div className="step-card" key={i} style={{ '--c': s.color }}>
              <div className="step-num">0{i + 1}</div>
              <div className="step-icon">{s.icon}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <h2 className="cta-title">SignBridge와 함께<br />더 나은 세상을 만들어요</h2>
        <p className="cta-sub">소통의 장벽을 허물고, 모두가 연결되는 세상을 위해</p>
        <button className="btn-primary btn-lg">🤟 프로젝트 참여하기</button>
      </section>

    </div>
  )
}