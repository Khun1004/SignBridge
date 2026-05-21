import { useState, useRef } from 'react'
import './Registration.css'

const ROLE_OPTIONS    = ['수어 선생님','수어 통역사','수어 학습자','가족/보호자','수어 관심자','연구자','기타']
const REGION_OPTIONS  = ['서울','부산','대구','인천','광주','대전','울산','경기','강원','충북','충남','전북','전남','경북','경남','제주','기타']
const CONTACT_TYPES   = [
    { id:'chat',  label:'💬 오픈채팅', placeholder:'카카오 오픈채팅 링크' },
    { id:'phone', label:'📞 전화번호', placeholder:'010-0000-0000' },
    { id:'email', label:'📧 이메일',   placeholder:'example@email.com' },
]

export default function Registration({ onBack, onSubmit, defaultName = '' }) {
    const [step, setStep] = useState(1)
    const [form, setForm] = useState({
        name: defaultName, role: '', region: '',
        intro: '', experience: '', speciality: '',
        contactType: 'chat', contactValue: '',
        certFiles: [], publicProfile: true,
    })
    const [errors,  setErrors]  = useState({})
    const [preview, setPreview] = useState([])
    const fileRef = useRef(null)

    const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

    // 파일 업로드
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || [])
        const valid = files.filter(f =>
            ['image/jpeg','image/png','application/pdf'].includes(f.type) && f.size < 5*1024*1024
        )
        if (valid.length < files.length)
            setErrors(p => ({ ...p, cert:'JPG, PNG, PDF만 가능하며 파일당 5MB 이하입니다.' }))
        else
            setErrors(p => ({ ...p, cert:'' }))
        setForm(f => ({ ...f, certFiles: [...f.certFiles, ...valid] }))
        setPreview(p => [...p, ...valid.map(f => ({
            name: f.name, size: (f.size/1024).toFixed(1)+'KB',
            type: f.type.includes('pdf') ? 'pdf' : 'img',
        }))])
    }
    const removeFile = (i) => {
        setForm(f => ({ ...f, certFiles: f.certFiles.filter((_,j) => j !== i) }))
        setPreview(p => p.filter((_,j) => j !== i))
    }

    const validate1 = () => {
        const e = {}
        if (!form.name.trim()) e.name   = '이름을 입력해 주세요.'
        if (!form.role)        e.role   = '역할을 선택해 주세요.'
        if (!form.region)      e.region = '지역을 선택해 주세요.'
        setErrors(e); return !Object.keys(e).length
    }
    const validate2 = () => {
        const e = {}
        if (!form.intro.trim()) e.intro = '자기소개를 입력해 주세요.'
        setErrors(e); return !Object.keys(e).length
    }
    const validate3 = () => {
        const e = {}
        if (!form.contactValue.trim()) e.contact = '연락처를 입력해 주세요.'
        setErrors(e); return !Object.keys(e).length
    }

    const next = () => {
        if (step === 1 && !validate1()) return
        if (step === 2 && !validate2()) return
        setStep(s => s + 1)
    }
    const handleSubmit = () => { if (validate3()) onSubmit(form) }

    const STEPS = ['기본 정보', '자세한 소개', '연락처']

    return (
        <div className="reg-page">
            {/* 헤더 */}
            <div className="reg-header">
                <button className="reg-back-btn" onClick={onBack}>← 커뮤니티로</button>
                <div>
                    <h1 className="reg-title">커뮤니티 등록</h1>
                    <p className="reg-subtitle">수어 관련 활동을 함께할 분들을 찾아보세요</p>
                </div>
            </div>

            {/* 스텝 */}
            <div className="reg-steps">
                {STEPS.map((label, i) => (
                    <div key={i} className="reg-step-wrap">
                        <div className={`reg-step ${step===i+1?'active':step>i+1?'done':''}`}>
                            <div className="reg-step-dot">{step>i+1?'✓':i+1}</div>
                            <span>{label}</span>
                        </div>
                        {i < STEPS.length-1 && (
                            <div className={`reg-step-line ${step>i+1?'done':''}`}/>
                        )}
                    </div>
                ))}
            </div>

            {/* STEP 1 */}
            {step === 1 && (
                <div className="reg-card">
                    <div className="reg-section-title">👤 기본 정보</div>
                    <div className="reg-field">
                        <label className="reg-label">이름 <span className="reg-req">*</span></label>
                        <input className={`reg-input${errors.name?' error':''}`}
                               placeholder="이름 또는 닉네임"
                               value={form.name} onChange={e => update('name', e.target.value)}/>
                        {errors.name && <span className="reg-err">{errors.name}</span>}
                    </div>
                    <div className="reg-row">
                        <div className="reg-field">
                            <label className="reg-label">역할 <span className="reg-req">*</span></label>
                            <select className={`reg-input${errors.role?' error':''}`}
                                    value={form.role} onChange={e => update('role', e.target.value)}>
                                <option value="">선택하세요</option>
                                {ROLE_OPTIONS.map(r => <option key={r}>{r}</option>)}
                            </select>
                            {errors.role && <span className="reg-err">{errors.role}</span>}
                        </div>
                        <div className="reg-field">
                            <label className="reg-label">활동 지역 <span className="reg-req">*</span></label>
                            <select className={`reg-input${errors.region?' error':''}`}
                                    value={form.region} onChange={e => update('region', e.target.value)}>
                                <option value="">선택하세요</option>
                                {REGION_OPTIONS.map(r => <option key={r}>{r}</option>)}
                            </select>
                            {errors.region && <span className="reg-err">{errors.region}</span>}
                        </div>
                    </div>
                    <div className="reg-field">
                        <label className="reg-label">프로필 공개 여부</label>
                        <div className="reg-toggle-group">
                            {[{v:true,l:'🌐 공개'},{v:false,l:'🔒 비공개'}].map(({v,l})=>(
                                <button key={String(v)}
                                        className={`reg-toggle${form.publicProfile===v?' active':''}`}
                                        onClick={()=>update('publicProfile',v)}>{l}</button>
                            ))}
                        </div>
                    </div>
                    <button className="reg-btn-next" onClick={next}>다음 →</button>
                </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
                <div className="reg-card">
                    <div className="reg-section-title">📝 자세한 소개</div>
                    <div className="reg-field">
                        <label className="reg-label">자기소개 <span className="reg-req">*</span></label>
                        <textarea className={`reg-input reg-textarea${errors.intro?' error':''}`}
                                  placeholder="활동 경력, 전문 분야, 수어와의 인연 등을 자유롭게 소개해 주세요"
                                  rows={4} value={form.intro}
                                  onChange={e => update('intro', e.target.value)}/>
                        <span className="reg-char">{form.intro.length}/500</span>
                        {errors.intro && <span className="reg-err">{errors.intro}</span>}
                    </div>
                    <div className="reg-field">
                        <label className="reg-label">경력/활동 이력 <span className="reg-opt">(선택)</span></label>
                        <textarea className="reg-input reg-textarea"
                                  placeholder="예: 한국수어 통역사 자격증 보유, 10년 수어 교육 경험 등"
                                  rows={3} value={form.experience}
                                  onChange={e => update('experience', e.target.value)}/>
                    </div>
                    <div className="reg-field">
                        <label className="reg-label">전문 분야 <span className="reg-opt">(선택)</span></label>
                        <input className="reg-input"
                               placeholder="예: 의료 수어, 법정 수어, 교육 수어"
                               value={form.speciality}
                               onChange={e => update('speciality', e.target.value)}/>
                    </div>
                    {/* 자격증 업로드 */}
                    <div className="reg-field">
                        <label className="reg-label">자격증 / 증명서 <span className="reg-opt">(선택)</span></label>
                        <div className="reg-upload-area"
                             onClick={()=>fileRef.current?.click()}
                             onDragOver={e=>e.preventDefault()}
                             onDrop={e=>{e.preventDefault();handleFileChange({target:{files:e.dataTransfer.files}})}}>
                            <div className="reg-upload-icon">📄</div>
                            <p className="reg-upload-text">클릭하거나 파일을 드래그하세요</p>
                            <p className="reg-upload-hint">JPG, PNG, PDF · 파일당 최대 5MB</p>
                        </div>
                        <input ref={fileRef} type="file" multiple
                               accept=".jpg,.jpeg,.png,.pdf"
                               style={{display:'none'}} onChange={handleFileChange}/>
                        {errors.cert && <span className="reg-err">{errors.cert}</span>}
                        {preview.length > 0 && (
                            <div className="reg-file-list">
                                {preview.map((f,i) => (
                                    <div key={i} className="reg-file-item">
                                        <span className="reg-file-icon">{f.type==='pdf'?'📑':'🖼️'}</span>
                                        <div className="reg-file-info">
                                            <span className="reg-file-name">{f.name}</span>
                                            <span className="reg-file-size">{f.size}</span>
                                        </div>
                                        <button className="reg-file-del" onClick={()=>removeFile(i)}>✕</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="reg-btn-row">
                        <button className="reg-btn-back-step" onClick={()=>setStep(1)}>← 이전</button>
                        <button className="reg-btn-next" onClick={next}>다음 →</button>
                    </div>
                </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
                <div className="reg-card">
                    <div className="reg-section-title">📞 연락처</div>
                    <div className="reg-field">
                        <label className="reg-label">연락 방법 <span className="reg-req">*</span></label>
                        <div className="reg-contact-types">
                            {CONTACT_TYPES.map(ct=>(
                                <button key={ct.id}
                                        className={`reg-contact-type${form.contactType===ct.id?' active':''}`}
                                        onClick={()=>update('contactType',ct.id)}>{ct.label}</button>
                            ))}
                        </div>
                        <input className={`reg-input${errors.contact?' error':''}`}
                               placeholder={CONTACT_TYPES.find(c=>c.id===form.contactType)?.placeholder}
                               value={form.contactValue}
                               onChange={e=>update('contactValue',e.target.value)}/>
                        {errors.contact && <span className="reg-err">{errors.contact}</span>}
                    </div>
                    {/* 요약 */}
                    <div className="reg-summary">
                        <div className="reg-summary-title">📋 등록 내용 확인</div>
                        {[
                            ['이름',    form.name],
                            ['역할',    form.role],
                            ['지역',    form.region],
                            ['자격증',  preview.length>0?`${preview.length}개 첨부`:'없음'],
                            ['공개여부',form.publicProfile?'🌐 공개':'🔒 비공개'],
                        ].map(([k,v])=>(
                            <div key={k} className="reg-summary-row">
                                <span>{k}</span><span>{v}</span>
                            </div>
                        ))}
                    </div>
                    <div className="reg-btn-row">
                        <button className="reg-btn-back-step" onClick={()=>setStep(2)}>← 이전</button>
                        <button className="reg-btn-submit" onClick={handleSubmit}>✅ 등록 완료</button>
                    </div>
                </div>
            )}
        </div>
    )
}