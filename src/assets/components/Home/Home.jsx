import { useState, useEffect, useRef } from 'react'
import './Home.css'

/* ── 슬라이드 데이터 ── */
const SLIDES = [
  {
    img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80',
    imgTag: '수어 학습',
    tag: 'LEARN',
    title: '단계별 수어 학습 프로그램',
    desc: '초급부터 고급까지, 게임처럼 즐기는 커리큘럼. 매일 10분으로 일상 수어를 마스터하세요.',
    link: '커리큘럼 보기',
  },
  {
    img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
    imgTag: '실시간 번역',
    tag: 'LIVE',
    title: '카메라 하나로 즉시 번역',
    desc: '웹캠을 켜는 순간 번역이 시작됩니다. 청각장애인과의 대화를 실시간 텍스트로 중계합니다.',
    link: '데모 체험하기',
  },
  {
    img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
    imgTag: '커뮤니티',
    tag: 'COMMUNITY',
    title: '함께 만드는 SignBridge',
    desc: '수어 사용자, 개발자, 연구자가 모여 더 나은 번역 데이터를 만들어갑니다.',
    link: '커뮤니티 참여',
  },
]

const STEPS = [
  {
    icon: '📷',
    title: '카메라 인식',
    desc: '웹캠으로 손동작을 실시간 촬영합니다. 별도 장비 없이 일반 카메라만으로 동작합니다.',
  },
  {
    icon: '🤖',
    title: 'AI 분석',
    desc: 'Pose 모델이 손 관절 21개 포인트를 정밀 추적하여 제스처를 분류합니다.',
  },
  {
    icon: '💬',
    title: '텍스트 변환',
    desc: '인식된 수어를 0.3초 이내 한국어 텍스트로 표시하고 음성으로도 출력합니다.',
  },
]

/* ── 이미지 슬라이더 ── */
function ImageSlider() {
  const [current, setCurrent] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const total = SLIDES.length
  const autoRef = useRef(null)

  useEffect(() => {
    autoRef.current = setInterval(() => setCurrent(c => (c + 1) % total), 4000)
    return () => clearInterval(autoRef.current)
  }, [total])

  const go = (idx) => {
    clearInterval(autoRef.current)
    setCurrent(idx)
    autoRef.current = setInterval(() => setCurrent(c => (c + 1) % total), 4000)
  }

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 900)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const translateX = isMobile ? `calc(-${current} * (80vw + 24px))` : '0px'
  const progressPct = ((current + 1) / total) * 100

  return (
      <section className="slider-section">
        <div className="slider-header">
          <div>
            <div className="section-tag">기능 탐색</div>
            <h2 className="section-title">SignBridge가 제공하는<br />세 가지 경험</h2>
          </div>
          <div className="slider-nav">
            <button className="snav-btn" onClick={() => go((current - 1 + total) % total)}>‹</button>
            <div className="snav-dots">
              {SLIDES.map((_, i) => (
                  <button key={i} className={`snav-dot${i === current ? ' active' : ''}`} onClick={() => go(i)} />
              ))}
            </div>
            <button className="snav-btn" onClick={() => go((current + 1) % total)}>›</button>
          </div>
        </div>

        <div className="slider-viewport">
          <div className="slider-track" style={{ transform: `translateX(${translateX})` }}>
            {SLIDES.map((slide, i) => (
                <div className="slide-card" key={i}>
                  <div className="slide-img-wrap">
                    <img src={slide.img} alt={slide.title} loading={i === 0 ? 'eager' : 'lazy'} />
                    <span className="slide-img-tag">{slide.imgTag}</span>
                  </div>
                  <div className="slide-body">
                    <div className="slide-body-tag">{slide.tag}</div>
                    <h3 className="slide-title">{slide.title}</h3>
                    <p className="slide-desc">{slide.desc}</p>
                    <button className="slide-link">{slide.link} <span>→</span></button>
                  </div>
                </div>
            ))}
          </div>
        </div>

        <div className="slider-progress">
          <div className="slider-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </section>
  )
}

/* ── 메인 컴포넌트 ── */
export default function Home() {
  return (
      <div className="home-page">

        {/* ══════════════════════════════
          히어로 — 풀스크린 배경 + 글래스 카드
      ══════════════════════════════ */}
        <section className="hero-section">

          {/* 배경 이미지 */}
          <div className="hero-bg">
            <img
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&q=85"
                alt="사람들이 소통하는 모습"
            />
            {/* 어두운 그라디언트 오버레이 */}
            <div className="hero-bg-overlay" />
          </div>

          {/* 콘텐츠 */}
          <div className="hero-content">

            {/* 왼쪽: 글래스 텍스트 카드 (이미지 참고 디자인) */}
            <div className="hero-glass-card">
              <div className="hero-glass-eyebrow">AI 수어 번역 시스템</div>
              <div className="hero-glass-divider" />
              <h1 className="hero-glass-title">
                <span className="hero-glass-title-main">손짓이</span>
                <span className="hero-glass-title-sub">말이 됩니다</span>
              </h1>
              <p className="hero-glass-desc">
                SignBridge는 카메라로 수어를 인식하여 실시간으로 텍스트로 변환합니다.<br />
                청각장애인과 비장애인 사이의 소통 장벽을 허무는 AI 플랫폼입니다.
              </p>
              <div className="hero-glass-btns">
                <button className="hero-btn-primary">🎥 데모 체험하기</button>
                <button className="hero-btn-outline">📖 더 알아보기</button>
              </div>
            </div>

            {/* 오른쪽: 실시간 인식 카드 */}
            <div className="hero-live-card floating">
              <div className="hero-live-chip">
                <span className="hero-live-dot" />
                실시간 인식 중
              </div>
              <div className="hero-live-emoji">🤟</div>
              <div className="hero-live-word">안녕하세요</div>
              <div className="hero-live-en">HELLO</div>
              <div className="hero-live-bar">
                <div className="hero-live-fill" />
              </div>
              <div className="hero-live-acc">정확도 98.2%</div>
            </div>

          </div>

          {/* 하단 스크롤 힌트 */}
          <div className="hero-scroll-hint">
            <span>스크롤하여 더 보기</span>
            <div className="hero-scroll-arrow">↓</div>
          </div>

          {/* ── 통계 — Hero 이미지 위 하단 오버랩 ── */}
          <div className="stats-section">
            {[
              ['337만', '국내 청각장애인'],
              ['7천만', '전세계 수어 사용자'],
              ['98%',   '목표 인식 정확도'],
              ['0.3초', '실시간 번역 속도'],
            ].map(([n, l]) => (
                <div className="stat-card" key={l}>
                  <div className="stat-num">{n}</div>
                  <div className="stat-lbl">{l}</div>
                </div>
            ))}
          </div>

        </section>

        {/* ── 이미지 슬라이더 ── */}
        <ImageSlider />

        {/* ── 작동 원리 ── */}
        <div className="section-divider" />
        <section className="section section--center">
          <div className="section-tag">작동 원리</div>
          <h2 className="section-title">세 단계로 완성되는 번역</h2>
          <div className="steps-wrapper">
            <div className="steps-connector" />
            <div className="steps-grid">
              {STEPS.map((s, i) => (
                  <div className="step-card" key={i}>
                    <div className="step-num-circle">
                      0{i + 1}
                      <div className="step-icon-badge">{s.icon}</div>
                    </div>
                    <div className="step-body">
                      <div className="step-label">STEP 0{i + 1}</div>
                      <div className="step-title">{s.title}</div>
                      <div className="step-desc">{s.desc}</div>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cta-section">
          <div>
            <div className="cta-label">Join SignBridge</div>
            <h2 className="cta-title">소통의 장벽을<br />함께 허뭅시다</h2>
            <p className="cta-sub">
              수어 사용자, 개발자, 연구자 모두를 환영합니다.<br />
              더 나은 세상은 함께 만들어가는 것입니다.
            </p>
          </div>
          <div className="cta-right">
            <button className="btn-white">🤟 프로젝트 참여하기</button>
            <span className="cta-note">무료 오픈소스 프로젝트</span>
          </div>
        </section>

      </div>
  )
}