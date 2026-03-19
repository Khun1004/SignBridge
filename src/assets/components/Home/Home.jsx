import { useState, useEffect, useRef } from 'react'
import './Home.css'

/* ── 슬라이드 데이터 (Unsplash 이미지 사용) ── */
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

/* ── Image Slider Component ── */
function ImageSlider() {
  const [current, setCurrent] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const total = SLIDES.length
  const autoRef = useRef(null)

  // Auto-play
  useEffect(() => {
    autoRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % total)
    }, 4000)
    return () => clearInterval(autoRef.current)
  }, [total])

  const go = (idx) => {
    clearInterval(autoRef.current)
    setCurrent(idx)
    autoRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % total)
    }, 4000)
  }

  const prev = () => go((current - 1 + total) % total)
  const next = () => go((current + 1) % total)

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 900)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // On mobile: translate one card at a time (card width = 80vw + 24px gap)
  // On desktop: show all 3 at once, no translation needed
  const translateX = isMobile
      ? `calc(-${current} * (80vw + 24px))`
      : '0px'

  const progressPct = ((current + 1) / total) * 100

  return (
      <section className="slider-section">
        <div className="slider-header">
          <div>
            <div className="section-tag">기능 탐색</div>
            <h2 className="section-title">SignBridge가 제공하는<br />세 가지 경험</h2>
          </div>
          <div className="slider-nav">
            <button className="snav-btn" onClick={prev} aria-label="이전">‹</button>
            <div className="snav-dots">
              {SLIDES.map((_, i) => (
                  <button
                      key={i}
                      className={`snav-dot${i === current ? ' active' : ''}`}
                      onClick={() => go(i)}
                      aria-label={`슬라이드 ${i + 1}`}
                  />
              ))}
            </div>
            <button className="snav-btn" onClick={next} aria-label="다음">›</button>
          </div>
        </div>

        <div className="slider-viewport">
          <div
              className="slider-track"
              style={{ transform: `translateX(${translateX})` }}
          >
            {SLIDES.map((slide, i) => (
                <div className="slide-card" key={i}>
                  {/* 이미지 */}
                  <div className="slide-img-wrap">
                    <img
                        src={slide.img}
                        alt={slide.title}
                        loading={i === 0 ? 'eager' : 'lazy'}
                    />
                    <span className="slide-img-tag">{slide.imgTag}</span>
                  </div>

                  {/* 텍스트 */}
                  <div className="slide-body">
                    <div className="slide-body-tag">{slide.tag}</div>
                    <h3 className="slide-title">{slide.title}</h3>
                    <p className="slide-desc">{slide.desc}</p>
                    <button className="slide-link">
                      {slide.link} <span>→</span>
                    </button>
                  </div>
                </div>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="slider-progress">
          <div className="slider-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </section>
  )
}

/* ── Main Component ── */
export default function Home() {
  return (
      <div className="home-page">

        {/* ── 히어로 ── */}
        <section className="hero-section">
          <div className="hero-left">
            <div className="hero-badge">AI 수어 번역 시스템 v2.0</div>
            <h1 className="hero-title">
              <span className="hero-title-small">Sign Language AI</span>
              <span className="hero-accent">손짓이</span>
              <span className="hero-accent2">말이 됩니다</span>
            </h1>
            <p className="hero-sub">
              SignBridge는 카메라로 수어를 인식하여 실시간으로 텍스트로 변환합니다.
              청각장애인과 비장애인 사이의 소통 장벽을 허무는 AI 플랫폼입니다.
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
              <div className="hcard-en">HELLO</div>
              <div className="hcard-bar">
                <div className="hcard-fill" />
              </div>
            </div>
          </div>
        </section>

        {/* ── 통계 ── */}
        <section className="stats-section">
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
        </section>

        {/* ── 이미지 슬라이더 ── */}
        <ImageSlider />

        {/* ── 작동 원리 ── */}
        <div className="section-divider" />
        <section className="section section--center">
          <div className="section-tag">작동 원리</div>
          <h2 className="section-title">세 단계로 완성되는 번역</h2>

          <div className="steps-wrapper">
            {/* 연결선 */}
            <div className="steps-connector" />

            <div className="steps-grid">
              {STEPS.map((s, i) => (
                  <div className="step-card" key={i}>
                    {/* 번호 원 */}
                    <div className="step-num-circle">
                      0{i + 1}
                      <div className="step-icon-badge">{s.icon}</div>
                    </div>

                    {/* 내용 박스 */}
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