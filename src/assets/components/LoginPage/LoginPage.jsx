import { useState } from 'react'
import './LoginPage.css'

// displayName : 개인=이름, 기관=기관명 (SignupPage 완료 후 전달받거나 API 응답값 사용)
// orgType     : 'personal' | 'immigration' | 'airport' | 'hospital' | 'police' | ''
export default function LoginPage({ onLogin, onClose, onSwitchToSignup, displayName = '', orgType = '' }) {
    const [form,    setForm]    = useState({ email: '', password: '' })
    const [error,   setError]   = useState('')
    const [loading, setLoading] = useState(false)

    const isOrg = orgType && orgType !== 'personal'

    // 환영 문구
    const welcomeMsg = displayName
        ? isOrg
            ? `${displayName} 환영합니다.`
            : `${displayName}님, 환영합니다.`
        : 'SignBridge에 오신 것을 환영합니다.'

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (!form.email || !form.password) {
            setError('이메일과 비밀번호를 입력해주세요.')
            return
        }
        setLoading(true)
        await new Promise(r => setTimeout(r, 600))
        setLoading(false)
        const name = displayName || form.email.split('@')[0]
        onLogin(name, orgType)
        onClose()
    }

    return (
        <div className="lp-overlay" onClick={onClose}>
            <div className="lp-modal" onClick={e => e.stopPropagation()}>

                <button className="lp-close" onClick={onClose} aria-label="닫기">✕</button>

                <div className="lp-header">
                    <div className="lp-logo">🤟</div>
                    <h2 className="lp-title">로그인</h2>
                    <p className="lp-subtitle">{welcomeMsg}</p>
                </div>

                <form className="lp-form" onSubmit={handleSubmit} noValidate>
                    <div className="lp-field">
                        <label className="lp-label" htmlFor="lp-email">이메일</label>
                        <input
                            id="lp-email"
                            className="lp-input"
                            type="email"
                            placeholder="example@email.com"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="lp-field">
                        <label className="lp-label" htmlFor="lp-password">비밀번호</label>
                        <input
                            id="lp-password"
                            className="lp-input"
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {error && <div className="lp-error">⚠️ {error}</div>}

                    <button className="lp-submit" type="submit" disabled={loading}>
                        {loading ? <span className="lp-spinner" /> : '로그인'}
                    </button>
                </form>

                <div className="lp-switch">
                    계정이 없으신가요?{' '}
                    <button onClick={onSwitchToSignup}>회원가입</button>
                </div>

            </div>
        </div>
    )
}