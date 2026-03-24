import { useState, useEffect } from 'react'
import './SignupPage.css'
import SignBridgeLogo from '../../SignBridge.png'

// ── 카카오 우편번호 서비스 동적 로드 ──
function useDaumPostcode() {
    useEffect(() => {
        if (document.getElementById('daum-postcode-script')) return
        const script = document.createElement('script')
        script.id    = 'daum-postcode-script'
        script.src   = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
        script.async = true
        document.head.appendChild(script)
    }, [])
}

function openPostcode(onComplete) {
    if (!window.daum?.Postcode) {
        alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
        return
    }
    new window.daum.Postcode({
        oncomplete(data) {
            const addr = data.roadAddress || data.jibunAddress
            onComplete(addr, data.zonecode)
        },
    }).open()
}

// ══════════════════════════════════════════
//  기관 유형 정의
// ══════════════════════════════════════════
const ORG_TYPES = [
    { id: 'personal',    icon: '👤', label: '개인',              desc: '청각장애인 개인 사용자',       color: '#2563eb' },
    { id: 'immigration', icon: '🛂', label: '출입국외국인사무소', desc: '출입국 심사 및 외국인 업무',    color: '#7c3aed' },
    { id: 'airport',     icon: '✈️', label: '공항',              desc: '공항 안내 및 탑승 서비스',     color: '#0891b2' },
    { id: 'hospital',    icon: '🏥', label: '병원',              desc: '의료 기관 및 응급실',          color: '#059669' },
    { id: 'police',      icon: '👮', label: '경찰서',            desc: '경찰 업무 및 민원 처리',       color: '#dc2626' },
]

// ── 기관별 3단계 필드 ──
// 기관 유형: 기관명 + 주소만 (필수) — 나머지는 이후 협의
// 개인: 선택 정보만
const ORG_FIELDS = {
    personal: [
        { id: 'disabilityGrade', label: '장애 등급',        placeholder: '예: 청각장애 1급',  required: false },
        { id: 'region',          label: '거주 지역',         placeholder: '예: 서울시 강남구', required: false },
        { id: 'preferredSign',   label: '주로 사용하는 수어', required: false, type: 'select',
            options: ['한국수어', '미국수어(ASL)', '국제수어(ISL)', '기타'] },
    ],
    immigration: [
        { id: 'officeName',   label: '사무소명',         placeholder: '예: 인천출입국·외국인사무소',    required: true },
        { id: 'orgCode',      label: '사무소 관리 코드',
            placeholder: '예: IMM-ICN-001',
            hint: '법무부 출입국·외국인정책본부에서 발급한 사무소 관리 코드를 입력하세요.',
            required: true },
        { id: 'address',      label: '주소',             placeholder: '예: 인천광역시 중구 공항로 272', required: true },
    ],
    airport: [
        { id: 'officeName',   label: '공항명',           placeholder: '예: 인천국제공항',               required: true },
        { id: 'orgCode',      label: 'IATA 공항 코드',
            placeholder: '예: ICN',
            hint: '국제항공운송협회(IATA)에서 부여한 3자리 공항 코드를 입력하세요.',
            required: true },
        { id: 'address',      label: '주소',             placeholder: '예: 인천광역시 중구 공항로 272', required: true },
    ],
    hospital: [
        { id: 'officeName',   label: '병원명',           placeholder: '예: 서울아산병원',               required: true },
        { id: 'orgCode',      label: '요양기관 기호',
            placeholder: '예: 12345678',
            hint: '건강보험심사평가원(HIRA)에 등록된 8자리 요양기관 기호를 입력하세요.',
            required: true },
        { id: 'address',      label: '주소',             placeholder: '예: 서울시 송파구 올림픽로 43길 88', required: true },
    ],
    police: [
        { id: 'officeName',   label: '경찰서명',         placeholder: '예: 서울 강남경찰서',            required: true },
        { id: 'orgCode',      label: '경찰청 기관 코드',
            placeholder: '예: POL-1174',
            hint: '경찰청에서 부여한 기관 고유 코드를 입력하세요. 소속 경찰서 행정팀에 문의하시기 바랍니다.',
            required: true },
        { id: 'address',      label: '주소',             placeholder: '예: 서울시 강남구 테헤란로 114길 11', required: true },
    ],
}

function isOrgType(orgType) {
    return orgType && orgType !== 'personal'
}

// ══════════════════════════════════════════
//  메인 SignupPage
// onSignup(displayName, orgType) 형태로 호출
//   - 개인: displayName = 이름
//   - 기관: displayName = officeName
// ══════════════════════════════════════════
export default function SignupPage({ onSignup, onClose, onSwitchToLogin }) {
    const [step,    setStep]    = useState(1)
    const [form,    setForm]    = useState({
        name: '', email: '', password: '', passwordConfirm: '',
        orgType: '', officeName: '', address: '', zonecode: '',
        agreeTerms: false, agreePrivacy: false,
    })
    const [errors,  setErrors]  = useState({})
    const [loading, setLoading] = useState(false)

    useDaumPostcode()

    const update = (key, val) => setForm(f => ({ ...f, [key]: val }))
    const STEP_LABELS = ['기관 선택', '기본 정보', '상세 입력']

    const validateStep1 = () => {
        const e = {}
        if (!form.orgType) e.orgType = '기관을 선택해주세요.'
        setErrors(e); return Object.keys(e).length === 0
    }

    const validateStep2 = () => {
        const e = {}
        if (!isOrgType(form.orgType) && !form.name.trim()) e.name = '이름을 입력해주세요.'
        if (!form.email.includes('@'))               e.email           = '올바른 이메일을 입력해주세요.'
        if (form.password.length < 6)               e.password        = '비밀번호는 6자 이상이어야 합니다.'
        if (form.password !== form.passwordConfirm) e.passwordConfirm = '비밀번호가 일치하지 않습니다.'
        setErrors(e); return Object.keys(e).length === 0
    }

    const validateStep3 = () => {
        const e = {}
        ;(ORG_FIELDS[form.orgType] || []).forEach(f => {
            if (f.required && !form[f.id]?.trim()) e[f.id] = `${f.label}을(를) 입력해주세요.`
        })
        if (!form.agreeTerms)   e.agreeTerms  = '이용약관에 동의해주세요.'
        if (!form.agreePrivacy) e.agreePrivacy = '개인정보 처리방침에 동의해주세요.'
        setErrors(e); return Object.keys(e).length === 0
    }

    const handleNext = () => {
        if (step === 1 && validateStep1()) { setErrors({}); setStep(2) }
        if (step === 2 && validateStep2()) { setErrors({}); setStep(3) }
    }

    const handleBack = () => { setErrors({}); setStep(s => s - 1) }

    const handleSubmit = async () => {
        if (!validateStep3()) return
        setLoading(true)
        await new Promise(r => setTimeout(r, 700))
        setLoading(false)
        setStep(4)
    }

    const handleGoLogin = () => {
        const displayName = isOrgType(form.orgType) ? form.officeName : form.name
        onSignup?.(displayName, form.orgType)
        onSwitchToLogin()
    }

    const orgInfo   = ORG_TYPES.find(o => o.id === form.orgType)
    const orgFields = ORG_FIELDS[form.orgType] || []
    const isOrg     = isOrgType(form.orgType)

    // ══ 가입 완료 화면 ══
    if (step === 4) {
        const displayName = isOrg ? form.officeName : form.name
        return (
            <div className="sp-overlay" onClick={onClose}>
                <div className="sp-modal sp-done-modal" onClick={e => e.stopPropagation()}>
                    <button className="sp-close" onClick={onClose} aria-label="닫기">✕</button>
                    <div className="sp-done-body">
                        <div className="sp-done-icon">🎉</div>
                        <h2 className="sp-done-title">가입이 완료되었습니다!</h2>
                        <p className="sp-done-desc">
                            {isOrg
                                ? <><strong>{displayName}</strong> 계정이 생성되었습니다.<br />로그인 후 서비스를 이용해주세요.</>
                                : <><strong>{displayName}</strong>님, SignBridge에 오신 것을 환영합니다!<br />로그인 후 서비스를 이용해주세요.</>
                            }
                        </p>
                        {orgInfo && (
                            <div className="sp-done-org-badge" style={{ '--org-color': orgInfo.color }}>
                                <span>{orgInfo.icon}</span>
                                <span>{orgInfo.label}</span>
                            </div>
                        )}
                        <button className="sp-btn-next sp-done-login-btn" onClick={handleGoLogin}>
                            로그인하러 가기 →
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="sp-overlay" onClick={onClose}>
            <div className="sp-modal" onClick={e => e.stopPropagation()}>

                <button className="sp-close" onClick={onClose} aria-label="닫기">✕</button>

                <div className="sp-header">
                    <div className="sp-logo">
                        <img src={SignBridgeLogo} alt="SignBridge" className="sp-logo-img" />
                    </div>
                    <h2 className="sp-title">회원가입</h2>
                    <p className="sp-subtitle">새 계정을 만들어 SignBridge를 시작하세요.</p>
                </div>

                <div className="sp-steps">
                    {STEP_LABELS.map((label, i) => {
                        const num    = i + 1
                        const isDone = step > num
                        const isNow  = step === num
                        return (
                            <div key={num} className="sp-step-wrap">
                                <div className={`sp-step ${isNow || isDone ? 'active' : ''}`}>
                                    <div className="sp-step-dot">
                                        {isDone
                                            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M20 6L9 17l-5-5"/></svg>
                                            : num}
                                    </div>
                                    <span>{label}</span>
                                </div>
                                {i < STEP_LABELS.length - 1 && (
                                    <div className={`sp-step-line ${isDone ? 'done' : ''}`} />
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* ════════ STEP 1: 기관 선택 ════════ */}
                {step === 1 && (
                    <div className="sp-form">
                        <p className="sp-step2-guide">소속 기관을 선택해주세요. 선택에 따라 입력 항목이 달라집니다.</p>
                        {errors.orgType && <div className="sp-field-error sp-org-error">{errors.orgType}</div>}
                        <div className="sp-org-grid">
                            {ORG_TYPES.map(org => (
                                <button
                                    key={org.id}
                                    type="button"
                                    className={`sp-org-btn ${form.orgType === org.id ? 'selected' : ''}`}
                                    style={{ '--org-color': org.color }}
                                    onClick={() => { update('orgType', org.id); setErrors({}) }}
                                >
                                    <div className="sp-org-icon-wrap">
                                        <span className="sp-org-icon">{org.icon}</span>
                                    </div>
                                    <div className="sp-org-body">
                                        <div className="sp-org-label">{org.label}</div>
                                        <div className="sp-org-desc">{org.desc}</div>
                                    </div>
                                    {form.orgType === org.id && (
                                        <div className="sp-org-check">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 6L9 17l-5-5"/>
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ════════ STEP 2: 기본 정보 ════════ */}
                {step === 2 && (
                    <div className="sp-form">
                        {orgInfo && (
                            <div className="sp-org-banner" style={{ '--org-color': orgInfo.color }}>
                                <span className="sp-org-banner-icon">{orgInfo.icon}</span>
                                <div>
                                    <div className="sp-org-banner-name">{orgInfo.label}</div>
                                    <div className="sp-org-banner-desc">{orgInfo.desc}</div>
                                </div>
                            </div>
                        )}
                        {!isOrg && (
                            <div className="sp-field">
                                <label className="sp-label" htmlFor="sp-name">이름 <span className="sp-required">*</span></label>
                                <input id="sp-name" className={`sp-input ${errors.name ? 'error' : ''}`}
                                       type="text" placeholder="홍길동"
                                       value={form.name} onChange={e => update('name', e.target.value)} />
                                {errors.name && <span className="sp-field-error">{errors.name}</span>}
                            </div>
                        )}
                        <div className="sp-field">
                            <label className="sp-label" htmlFor="sp-email">이메일 <span className="sp-required">*</span></label>
                            <input id="sp-email" className={`sp-input ${errors.email ? 'error' : ''}`}
                                   type="email" placeholder="example@email.com"
                                   value={form.email} onChange={e => update('email', e.target.value)} />
                            {errors.email && <span className="sp-field-error">{errors.email}</span>}
                        </div>
                        <div className="sp-field">
                            <label className="sp-label" htmlFor="sp-pw">비밀번호 <span className="sp-required">*</span></label>
                            <input id="sp-pw" className={`sp-input ${errors.password ? 'error' : ''}`}
                                   type="password" placeholder="6자 이상 입력"
                                   value={form.password} onChange={e => update('password', e.target.value)} />
                            {errors.password && <span className="sp-field-error">{errors.password}</span>}
                        </div>
                        <div className="sp-field">
                            <label className="sp-label" htmlFor="sp-pw2">비밀번호 확인 <span className="sp-required">*</span></label>
                            <input id="sp-pw2" className={`sp-input ${errors.passwordConfirm ? 'error' : ''}`}
                                   type="password" placeholder="비밀번호를 다시 입력"
                                   value={form.passwordConfirm} onChange={e => update('passwordConfirm', e.target.value)} />
                            {errors.passwordConfirm && <span className="sp-field-error">{errors.passwordConfirm}</span>}
                        </div>
                    </div>
                )}

                {/* ════════ STEP 3: 상세 입력 ════════ */}
                {step === 3 && (
                    <div className="sp-form">
                        {orgInfo && (
                            <div className="sp-org-banner" style={{ '--org-color': orgInfo.color }}>
                                <span className="sp-org-banner-icon">{orgInfo.icon}</span>
                                <div>
                                    <div className="sp-org-banner-name">{orgInfo.label}</div>
                                    <div className="sp-org-banner-desc">{orgInfo.desc}</div>
                                </div>
                            </div>
                        )}
                        {isOrg && (
                            <p className="sp-step2-guide">
                                기관 정보와 공식 인증 코드를 입력해주세요.<br />
                                인증 코드는 가입 승인 검토에 사용되며, 허위 입력 시 이용이 제한될 수 있습니다.
                            </p>
                        )}
                        {orgFields.map(field => (
                            <div className="sp-field" key={field.id}>
                                <label className="sp-label" htmlFor={`sp-${field.id}`}>
                                    {field.label}
                                    {field.required
                                        ? <span className="sp-required"> *</span>
                                        : <span className="sp-optional"> (선택)</span>}
                                </label>
                                {field.hint && (
                                    <div className="sp-field-hint">ℹ️ {field.hint}</div>
                                )}
                                {field.type === 'select' ? (
                                    <select
                                        id={`sp-${field.id}`}
                                        className={`sp-input sp-select ${errors[field.id] ? 'error' : ''}`}
                                        value={form[field.id] || ''}
                                        onChange={e => update(field.id, e.target.value)}
                                    >
                                        <option value="">선택해주세요</option>
                                        {field.options.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : field.id === 'address' ? (
                                    /* ── 주소 검색 필드 ── */
                                    <div className="sp-address-wrap">
                                        {form.zonecode && (
                                            <div className="sp-zonecode">📮 우편번호 {form.zonecode}</div>
                                        )}
                                        <div className="sp-address-row">
                                            <input
                                                id="sp-address"
                                                className={`sp-input ${errors.address ? 'error' : ''}`}
                                                type="text"
                                                placeholder="주소 검색 버튼을 눌러주세요"
                                                value={form.address}
                                                readOnly
                                            />
                                            <button
                                                type="button"
                                                className="sp-addr-search-btn"
                                                onClick={() => openPostcode((addr, zone) => {
                                                    update('address', addr)
                                                    update('zonecode', zone)
                                                    setErrors(e => ({ ...e, address: '' }))
                                                })}
                                            >
                                                🔍 검색
                                            </button>
                                        </div>
                                        {form.address && (
                                            <input
                                                className="sp-input sp-address-detail"
                                                type="text"
                                                placeholder="상세 주소 입력 (동/호수 등)"
                                                value={form.addressDetail || ''}
                                                onChange={e => update('addressDetail', e.target.value)}
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <input
                                        id={`sp-${field.id}`}
                                        className={`sp-input ${errors[field.id] ? 'error' : ''}`}
                                        type="text"
                                        placeholder={field.placeholder}
                                        value={form[field.id] || ''}
                                        onChange={e => update(field.id, e.target.value)}
                                    />
                                )}
                                {errors[field.id] && <span className="sp-field-error">{errors[field.id]}</span>}
                            </div>
                        ))}
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
                    </div>
                )}

                <div className={`sp-btn-row ${step === 1 ? 'sp-btn-single' : ''}`}>
                    {step > 1 && (
                        <button className="sp-btn-back" type="button" onClick={handleBack}>← 이전</button>
                    )}
                    {step < 3 ? (
                        <button className="sp-btn-next" type="button" onClick={handleNext}>다음 단계 →</button>
                    ) : (
                        <button className="sp-submit" type="button" onClick={handleSubmit} disabled={loading}>
                            {loading ? <span className="sp-spinner" /> : '가입 완료'}
                        </button>
                    )}
                </div>

                <div className="sp-switch">
                    이미 계정이 있으신가요?{' '}
                    <button onClick={onSwitchToLogin}>로그인</button>
                </div>

            </div>
        </div>
    )
}