import React from 'react';
import './About.css';

const About = () => {
    return (
        <div className="about-container">
            {/* 히어로 섹션 */}
            <section className="about-hero">
                <h1 className="hero-title">
                    <span className="emoji">🤟</span> <br />
                    언어의 장벽을 넘는 <br />
                    <span className="highlight">SignBridge</span>
                </h1>
                <p className="hero-subtitle">
                    우리는 인공지능 기술을 통해 농인과 청인 사이의 <br />
                    자유로운 소통을 돕는 '수어 다리'를 만듭니다.
                </p>
            </section>

            {/* 미션 섹션 */}
            <section className="about-mission">
                <div className="mission-card">
                    <div className="mission-icon">🎯</div>
                    <h3>Our Mission</h3>
                    <p>
                        단순한 번역을 넘어, 누구나 자신의 언어로 <br />
                        세상과 연결될 수 있는 디지털 환경을 구축합니다.
                    </p>
                </div>
            </section>

            {/* 특징 섹션 */}
            <section className="about-features">
                <h2 className="section-title">Why SignBridge?</h2>
                <div className="features-grid">
                    <div className="feature-item">
                        <div className="feature-emoji">⚡</div>
                        <h4>실시간 번역</h4>
                        <p>고도화된 AI 모델을 통해 수어를 즉각적으로 텍스트로 변환합니다.</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-emoji">📚</div>
                        <h4>방대한 사전</h4>
                        <p>표준 수어를 포함한 다양한 일상 수어 데이터를 제공합니다.</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-emoji">🤝</div>
                        <h4>사용자 중심</h4>
                        <p>농인 커뮤니티의 피드백을 최우선으로 반영하여 설계되었습니다.</p>
                    </div>
                </div>
            </section>

            {/* 팀/푸터 섹션 */}
            <section className="about-contact">
                <p>SignBridge 팀과 함께 더 나은 미래를 만들어가세요.</p>
                <button className="contact-btn">문의하기</button>
            </section>
        </div>
    );
};

export default About;