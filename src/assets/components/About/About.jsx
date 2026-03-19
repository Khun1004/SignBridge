import { useEffect, useRef, useState } from 'react'
import './About.css'

/* ── 숫자 카운트업 훅 ── */
function useCountUp(target, duration = 1800, start = false) {
    const [count, setCount] = useState(0)
    useEffect(() => {
        if (!start) return
        let startTime = null
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp
            const progress = Math.min((timestamp - startTime) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * target))
            if (progress < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
    }, [target, duration, start])
    return count
}

/* ── IntersectionObserver 훅 ── */
function useInView(threshold = 0.15) {
    const ref = useRef(null)
    const [inView, setInView] = useState(false)
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
        if (ref.current) obs.observe(ref.current)
        return () => obs.disconnect()
    }, [threshold])
    return [ref, inView]
}

/* ── 통계 아이템 ── */
function StatItem({ value, suffix, label, delay }) {
    const [ref, inView] = useInView()
    const count = useCountUp(value, 1600, inView)
    return (
        <div className="ab-stat" ref={ref} style={{ animationDelay: `${delay}ms` }}>
            <div className="ab-stat-number">
                {count}{suffix}
            </div>
            <div className="ab-stat-label">{label}</div>
        </div>
    )
}

/* ── 팀 멤버 ── */
const TEAM = [
    { emoji: '👑', name: '쿤산', role: 'Team Lead · Full Stack', desc: 'AI 수어 번역 시스템 설계, 개발, 기획 전반을 총괄합니다.' },
    { emoji: '🤝', name: '토야',  role: 'Full Stack · Design',   desc: 'UI/UX 디자인부터 프론트엔드 · 백엔드 개발까지 함께합니다.' },
]

/* ── 타임라인 ── */
const TIMELINE = [
    { year: '2024.01', title: '프로젝트 시작',     desc: '청각장애인 소통 문제 연구 및 아이디어 발굴' },
    { year: '2024.06', title: 'AI 모델 v1 완성',   desc: '한국수어 50개 단어 실시간 인식 달성' },
    { year: '2024.10', title: '파일럿 테스트',      desc: '인천공항 출입국사무소와 시범 운영 시작' },
    { year: '2025.01', title: 'SignBridge 정식 출시', desc: '앱 공개 및 공공기관 연계 서비스 확장' },
    { year: '2025.06', title: '글로벌 확장',        desc: '국제수어(ISL) 지원 및 해외 기관 파트너십' },
]

/* ── 특징 ── */
const FEATURES = [
    { icon: '⚡', label: '0.3초', title: '실시간 번역', desc: '고도화된 AI 모델로 수어를 즉각적으로 텍스트로 변환합니다.' },
    { icon: '🧠', label: '98%',   title: '인식 정확도', desc: '수천 시간의 학습 데이터로 정밀 수어 인식을 구현했습니다.' },
    { icon: '📚', label: '500+',  title: '수어 사전',    desc: '표준 수어 및 일상 수어 500가지 이상을 DB로 보유합니다.' },
    { icon: '🏛️', label: '10+',  title: '연계 기관',    desc: '공항, 병원, 경찰서 등 10개 이상의 공공기관과 협력합니다.' },
    { icon: '🌐', label: '3개',   title: '지원 언어',    desc: '한국수어, 미국수어(ASL), 국제수어(ISL)를 지원합니다.' },
    { icon: '🔒', label: '100%',  title: '보안 기록',    desc: '모든 대화 기록은 암호화되어 법적 증거로 활용 가능합니다.' },
]

/* ── 메인 컴포넌트 ── */
export default function About() {
    const [heroRef, heroInView]     = useInView(0.1)
    const [missionRef, missionInView] = useInView(0.1)
    const [featureRef, featureInView] = useInView(0.1)
    const [teamRef, teamInView]     = useInView(0.1)
    const [tlRef, tlInView]         = useInView(0.1)
    const [ctaRef, ctaInView]       = useInView(0.1)

    return (
        <div className="ab-root">

            {/* ════ HERO ════ */}
            <section className="ab-hero" ref={heroRef}>
                {/* 배경 장식 */}
                <div className="ab-hero-deco ab-deco-1" />
                <div className="ab-hero-deco ab-deco-2" />
                <div className="ab-hero-deco ab-deco-3" />

                <div className={`ab-hero-inner ${heroInView ? 'ab-visible' : ''}`}>
                    <div className="ab-hero-eyebrow">
                        <span className="ab-dot" />
                        AI 수어 번역 플랫폼
                    </div>
                    <h1 className="ab-hero-title">
                        <span className="ab-hero-line ab-hero-line-1">언어의</span>
                        <span className="ab-hero-line ab-hero-line-2">장벽을</span>
                        <span className="ab-hero-line ab-hero-line-3 ab-hero-accent">허뭅니다</span>
                    </h1>
                    <p className="ab-hero-sub">
                        SignBridge는 인공지능 기술을 통해<br />
                        농인과 청인 사이의 자유로운 소통을 돕는<br />
                        수어 다리를 만듭니다.
                    </p>
                    <div className="ab-hero-sign">🤟</div>
                </div>
            </section>

            {/* ════ 통계 ════ */}
            <section className="ab-stats-section">
                <div className="ab-stats-inner">
                    <StatItem value={337}  suffix="만+" label="국내 청각장애인"    delay={0}   />
                    <div className="ab-stats-div" />
                    <StatItem value={98}   suffix="%"   label="수어 인식 정확도"  delay={100} />
                    <div className="ab-stats-div" />
                    <StatItem value={500}  suffix="+"   label="수어 사전 단어"    delay={200} />
                    <div className="ab-stats-div" />
                    <StatItem value={10}   suffix="+"   label="연계 공공기관"     delay={300} />
                </div>
            </section>

            {/* ════ 미션 ════ */}
            <section className="ab-mission" ref={missionRef}>
                <div className={`ab-mission-inner ${missionInView ? 'ab-visible' : ''}`}>
                    <div className="ab-mission-label">Our Mission</div>
                    <blockquote className="ab-mission-quote">
                        "단순한 번역을 넘어,<br />
                        누구나 자신의 언어로<br />
                        세상과 연결되는<br />
                        <em>디지털 환경</em>을 구축합니다."
                    </blockquote>
                    <p className="ab-mission-body">
                        한국에는 약 337만 명의 청각장애인이 있습니다. 하지만 공항, 병원, 경찰서 같은
                        공공 공간에서 전문 수어 통역사를 구하기는 쉽지 않습니다. SignBridge는 AI 기술로
                        그 빈자리를 채웁니다.
                    </p>
                </div>
                <div className={`ab-mission-visual ${missionInView ? 'ab-visible' : ''}`}>
                    <div className="ab-mission-card ab-mc-1">
                        <span>🧏</span>
                        <span>농인</span>
                    </div>
                    <div className="ab-mission-bridge">
                        <div className="ab-bridge-line" />
                        <div className="ab-bridge-icon">🤖</div>
                        <div className="ab-bridge-label">AI</div>
                        <div className="ab-bridge-line" />
                    </div>
                    <div className="ab-mission-card ab-mc-2">
                        <span>🙋</span>
                        <span>청인</span>
                    </div>
                </div>
            </section>

            {/* ════ 특징 그리드 ════ */}
            <section className="ab-features" ref={featureRef}>
                <div className="ab-section-header">
                    <div className="ab-section-tag">Why SignBridge?</div>
                    <h2 className="ab-section-title">기술이 만드는<br />소통의 혁신</h2>
                </div>
                <div className={`ab-features-grid ${featureInView ? 'ab-visible' : ''}`}>
                    {FEATURES.map((f, i) => (
                        <div className="ab-feature-card" key={f.title} style={{ animationDelay: `${i * 80}ms` }}>
                            <div className="ab-feature-top">
                                <div className="ab-feature-icon">{f.icon}</div>
                                <div className="ab-feature-badge">{f.label}</div>
                            </div>
                            <div className="ab-feature-title">{f.title}</div>
                            <div className="ab-feature-desc">{f.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ════ 타임라인 ════ */}
            <section className="ab-timeline" ref={tlRef}>
                <div className="ab-section-header">
                    <div className="ab-section-tag">우리의 여정</div>
                    <h2 className="ab-section-title">SignBridge의<br />발자취</h2>
                </div>
                <div className={`ab-tl-list ${tlInView ? 'ab-visible' : ''}`}>
                    {TIMELINE.map((t, i) => (
                        <div className="ab-tl-item" key={t.year} style={{ animationDelay: `${i * 120}ms` }}>
                            <div className="ab-tl-left">
                                <div className="ab-tl-year">{t.year}</div>
                            </div>
                            <div className="ab-tl-dot-wrap">
                                <div className="ab-tl-dot" />
                                {i < TIMELINE.length - 1 && <div className="ab-tl-line" />}
                            </div>
                            <div className="ab-tl-right">
                                <div className="ab-tl-title">{t.title}</div>
                                <div className="ab-tl-desc">{t.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ════ 팀 ════ */}
            <section className="ab-team" ref={teamRef}>
                <div className="ab-section-header">
                    <div className="ab-section-tag">Team</div>
                    <h2 className="ab-section-title">함께 만드는<br />SignBridge</h2>
                </div>
                <div className={`ab-team-grid ${teamInView ? 'ab-visible' : ''}`}>
                    {TEAM.map((m, i) => (
                        <div className="ab-team-card" key={m.name} style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="ab-team-avatar">{m.emoji}</div>
                            <div className="ab-team-role">{m.role}</div>
                            <div className="ab-team-name">{m.name}</div>
                            <div className="ab-team-desc">{m.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ════ CTA ════ */}
            <section className="ab-cta" ref={ctaRef}>
                <div className={`ab-cta-inner ${ctaInView ? 'ab-visible' : ''}`}>
                    <div className="ab-cta-sign">🤟</div>
                    <h2 className="ab-cta-title">함께 더 나은<br />세상을 만들어요</h2>
                    <p className="ab-cta-sub">
                        수어 사용자, 개발자, 연구자 모두를 환영합니다.<br />
                        더 나은 소통은 함께 만들어가는 것입니다.
                    </p>
                    <div className="ab-cta-btns">
                        <button className="ab-cta-btn-primary">📬 문의하기</button>
                        <button className="ab-cta-btn-outline">🌐 GitHub</button>
                    </div>
                    <div className="ab-cta-note">무료 오픈소스 프로젝트 · MIT License</div>
                </div>
                {/* 배경 장식 */}
                <div className="ab-cta-deco-1" />
                <div className="ab-cta-deco-2" />
            </section>

        </div>
    )
}