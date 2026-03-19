import { useState } from 'react'
import './LoginPage.css'

export default function LoginPage({ onLogin, onClose, onSwitchToSignup }) {
    const [form, setForm]     = useState({ email: '', password: '' })
    const [error, setError]   = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!form.email || !form.password) {
            setError('이메일과 비밀번호를 입력해주세요.')
            return
        }

        setLoading(true)
        // 실제 API 연동 시 여기에 fetch/axios 호출
        await new Promise(r => setTimeout(r, 600)) // 로딩 시뮬레이션
        setLoading(false)

        const name = form.email.split('@')[0]
        onLogin(name)
        onClose()
    }

    return (
        <div className="lp-overlay" onClick={onClose}>
            <div className="lp-modal" onClick={e => e.stopPropagation()}>

                {/* 닫기 버튼 */}
                <button className="lp-close" onClick={onClose} aria-label="닫기">✕</button>

                {/* 헤더 */}
                <div className="lp-header">
                    <div className="lp-logo">🤟</div>
                    <h2 className="lp-title">로그인</h2>
                    <p className="lp-subtitle">SignBridge에 오신 것을 환영합니다.</p>
                </div>

                {/* 폼 */}
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
                        {loading
                            ? <span className="lp-spinner" />
                            : '로그인'}
                    </button>
                </form>

                {/* 전환 링크 */}
                <div className="lp-switch">
                    계정이 없으신가요?{' '}
                    <button onClick={onSwitchToSignup}>회원가입</button>
                </div>

            </div>
        </div>
    )
}