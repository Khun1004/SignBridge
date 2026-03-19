import { useState } from 'react'
import './SignupPage.css'

const USER_TYPES = [
    { id: 'deaf',       label: '청각장애인',    icon: '🧏' },
    { id: 'officer',    label: '관련 기관 직원', icon: '👔' },
    { id: 'general',    label: '일반 사용자',    icon: '👤' },
]

export default function SignupPage({ onSignup, onClose, onSwitchToLogin }) {
    const [step, setStep]     = useState(1)   // 1: 기본정보, 2: 추가정보
    const [form, setForm]     = useState({
        name: '', email: '', password: '', passwordConfirm: '',
        userType: '', phone: '', agreeTerms: false, agreePrivacy: false,
    })
    const [errors, setErrors]  = useState({})
    const [loading, setLoading] = useState(false)

    const update = (key, val) => setForm(f => ({ ...f, [key]: val }))

    /* ── 1단계 유효성 검사 ── */
    const validateStep1 = () => {
        const e = {}
        if (!form.name.trim())          e.name     = '이름을 입력해주세요.'
        if (!form.email.includes('@'))  e.email    = '올바른 이메일을 입력해주세요.'
        if (form.password.length < 6)  e.password = '비밀번호는 6자 이상이어야 합니다.'
        if (form.password !== form.passwordConfirm) e.passwordConfirm = '비밀번호가 일치하지 않습니다.'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    /* ── 2단계 유효성 검사 ── */
    const validateStep2 = () => {
        const e = {}
        if (!form.userType)        e.userType    = '사용자 유형을 선택해주세요.'
        if (!form.agreeTerms)      e.agreeTerms  = '이용약관에 동의해주세요.'
        if (!form.agreePrivacy)    e.agreePrivacy = '개인정보 처리방침에 동의해주세요.'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleNext = () => {
        if (validateStep1()) setStep(2)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateStep2()) return

        setLoading(true)
        await new Promise(r => setTimeout(r, 700))
        setLoading(false)

        onSignup(form.name)
        onClose()
    }

    return (
        <div className="sp-overlay" onClick={onClose}>
            <div className="sp-modal" onClick={e => e.stopPropagation()}>

                {/* 닫기 */}
                <button className="sp-close" onClick={onClose} aria-label="닫기">✕</button>

                {/* 헤더 */}
                <div className="sp-header">
                    <div className="sp-logo">🤟</div>
                    <h2 className="sp-title">회원가입</h2>
                    <p className="sp-subtitle">새 계정을 만들어 SignBridge를 시작하세요.</p>
                </div>

                {/* 스텝 인디케이터 */}
                <div className="sp-steps">
                    <div className={`sp-step ${step >= 1 ? 'active' : ''}`}>
                        <div className="sp-step-dot">{step > 1 ? '✓' : '1'}</div>
                        <span>기본 정보</span>
                    </div>
                    <div className="sp-step-line" />
                    <div className={`sp-step ${step >= 2 ? 'active' : ''}`}>
                        <div className="sp-step-dot">2</div>
                        <span>추가 정보</span>
                    </div>
                </div>

                {/* ── STEP 1 ── */}
                {step === 1 && (
                    <div className="sp-form">
                        <div className="sp-field">
                            <label className="sp-label" htmlFor="sp-name">이름</label>
                            <input id="sp-name" className={`sp-input ${errors.name ? 'error' : ''}`}
                                   type="text" placeholder="홍길동"
                                   value={form.name} onChange={e => update('name', e.target.value)} />
                            {errors.name && <span className="sp-field-error">{errors.name}</span>}
                        </div>

                        <div className="sp-field">
                            <label className="sp-label" htmlFor="sp-email">이메일</label>
                            <input id="sp-email" className={`sp-input ${errors.email ? 'error' : ''}`}
                                   type="email" placeholder="example@email.com"
                                   value={form.email} onChange={e => update('email', e.target.value)} />
                            {errors.email && <span className="sp-field-error">{errors.email}</span>}
                        </div>

                        <div className="sp-field">
                            <label className="sp-label" htmlFor="sp-pw">비밀번호</label>
                            <input id="sp-pw" className={`sp-input ${errors.password ? 'error' : ''}`}
                                   type="password" placeholder="6자 이상 입력"
                                   value={form.password} onChange={e => update('password', e.target.value)} />
                            {errors.password && <span className="sp-field-error">{errors.password}</span>}
                        </div>

                        <div className="sp-field">
                            <label className="sp-label" htmlFor="sp-pw2">비밀번호 확인</label>
                            <input id="sp-pw2" className={`sp-input ${errors.passwordConfirm ? 'error' : ''}`}
                                   type="password" placeholder="비밀번호를 다시 입력"
                                   value={form.passwordConfirm} onChange={e => update('passwordConfirm', e.target.value)} />
                            {errors.passwordConfirm && <span className="sp-field-error">{errors.passwordConfirm}</span>}
                        </div>

                        <button className="sp-btn-next" type="button" onClick={handleNext}>
                            다음 단계 →
                        </button>
                    </div>
                )}

                {/* ── STEP 2 ── */}
                {step === 2 && (
                    <form className="sp-form" onSubmit={handleSubmit} noValidate>

                        {/* 사용자 유형 */}
                        <div className="sp-field">
                            <label className="sp-label">사용자 유형</label>
                            <div className="sp-type-grid">
                                {USER_TYPES.map(t => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        className={`sp-type-btn ${form.userType === t.id ? 'selected' : ''}`}
                                        onClick={() => update('userType', t.id)}
                                    >
                                        <span className="sp-type-icon">{t.icon}</span>
                                        <span className="sp-type-label">{t.label}</span>
                                    </button>
                                ))}
                            </div>
                            {errors.userType && <span className="sp-field-error">{errors.userType}</span>}
                        </div>

                        {/* 전화번호 (선택) */}
                        <div className="sp-field">
                            <label className="sp-label" htmlFor="sp-phone">
                                전화번호 <span className="sp-optional">(선택)</span>
                            </label>
                            <input id="sp-phone" className="sp-input"
                                   type="tel" placeholder="010-0000-0000"
                                   value={form.phone} onChange={e => update('phone', e.target.value)} />
                        </div>

                        {/* 약관 동의 */}
                        <div className="sp-agree-group">
                            <label className="sp-agree">
                                <input type="checkbox" checked={form.agreeTerms}
                                       onChange={e => update('agreeTerms', e.target.checked)} />
                                <span>[필수] 이용약관에 동의합니다.</span>
                            </label>
                            {errors.agreeTerms && <span className="sp-field-error">{errors.agreeTerms}</span>}

                            <label className="sp-agree">
                                <input type="checkbox" checked={form.agreePrivacy}
                                       onChange={e => update('agreePrivacy', e.target.checked)} />
                                <span>[필수] 개인정보 처리방침에 동의합니다.</span>
                            </label>
                            {errors.agreePrivacy && <span className="sp-field-error">{errors.agreePrivacy}</span>}
                        </div>

                        <div className="sp-btn-row">
                            <button className="sp-btn-back" type="button" onClick={() => setStep(1)}>
                                ← 이전
                            </button>
                            <button className="sp-submit" type="submit" disabled={loading}>
                                {loading ? <span className="sp-spinner" /> : '가입 완료'}
                            </button>
                        </div>
                    </form>
                )}

                {/* 전환 링크 */}
                <div className="sp-switch">
                    이미 계정이 있으신가요?{' '}
                    <button onClick={onSwitchToLogin}>로그인</button>
                </div>

            </div>
        </div>
    )
}