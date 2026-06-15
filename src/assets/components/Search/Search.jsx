import { useState, useRef, useEffect } from 'react'
import './Search.css'

const SIGN_DB = [
    { id:'1', word:'안녕하세요',       category:'인사', emoji:'👋', description:'상대방을 처음 만나거나 하루를 시작할 때 사용하는 기본 인사 표현입니다.', handShape:'오른손을 펴서 손바닥이 앞을 향하게 합니다', movement:'손을 이마 옆에서 앞으로 내밀며 가볍게 흔듭니다', expression:'밝고 친근한 표정, 눈 맞춤 유지', tips:'손을 너무 크게 흔들지 않고 자연스럽게 움직이는 것이 포인트입니다', related:['안녕히 가세요','안녕히 계세요','반갑습니다'] },
    { id:'2', word:'감사합니다',        category:'예절', emoji:'🙏', description:'고마움을 표현할 때 사용하는 수어입니다.', handShape:'오른손 손끝을 모아 입술 아래에 댑니다', movement:'손을 앞으로 뻗으며 약간 아래로 내립니다', expression:'진심 어린 표정', tips:'천천히 정성스럽게 표현하세요', related:['고맙습니다','죄송합니다','괜찮습니다'] },
    { id:'3', word:'도와주세요',        category:'요청', emoji:'🤝', description:'도움이 필요할 때 상대방에게 요청하는 표현입니다.', handShape:'왼손 주먹 위에 오른손 엄지를 올려 받칩니다', movement:'두 손을 함께 앞으로 내밀며 올립니다', expression:'간절하거나 급한 표정', tips:'긴급할 때는 동작을 빠르고 크게 표현하세요', related:['부탁합니다','필요해요','긴급'] },
    { id:'4', word:'만나서 반갑습니다', category:'인사', emoji:'🤗', description:'처음 만나는 사람에게 반가움을 표현하는 수어입니다.', handShape:'양손을 가슴 앞에서 마주 보게 펼칩니다', movement:'양손을 가슴 중앙으로 모으듯 합장하며 살짝 흔듭니다', expression:'밝고 환한 미소', tips:'악수하듯 자연스럽게 연결하면 자연스럽습니다', related:['안녕하세요','처음 뵙겠습니다','반갑습니다'] },
    { id:'5', word:'사랑합니다',        category:'감정', emoji:'❤️', description:'깊은 애정과 사랑을 표현하는 수어입니다.', handShape:'오른손 엄지·검지·소지를 펴고 나머지를 접습니다', movement:'손을 가슴에서 상대방을 향해 부드럽게 내밉니다', expression:'따뜻하고 진심 어린 표정', tips:"국제 수어에서도 통용되는 'ILY' 핸드셰이프입니다", related:['좋아해요','보고 싶어요','행복해요'] },
]
const RECENT_KEY = 'sb_search_recent'

export default function SearchPage({ onBack, onGoDict }) {
    const [query,      setQuery]      = useState('')
    const [recent,     setRecent]     = useState(() => {
        try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
    })
    const [results,    setResults]    = useState([])
    const [searched,   setSearched]   = useState(false)
    const [expandedId, setExpandedId] = useState(null)
    const inputRef = useRef(null)

    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80) }, [])

    useEffect(() => {
        const h = (e) => { if (e.key === 'Escape') onBack() }
        document.addEventListener('keydown', h)
        return () => document.removeEventListener('keydown', h)
    }, [onBack])

    const suggestions = query.trim()
        ? SIGN_DB.filter(s => s.word.includes(query) || s.category.includes(query)).map(s => s.word)
        : []

    const doSearch = (text) => {
        const t = text.trim()
        if (!t) return
        const next = [t, ...recent.filter(r => r !== t)].slice(0, 10)
        setRecent(next)
        localStorage.setItem(RECENT_KEY, JSON.stringify(next))
        setQuery(t)
        setResults(SIGN_DB.filter(w =>
            w.word.includes(t) || w.category.includes(t) ||
            w.description.includes(t) || w.related.some(r => r.includes(t))
        ))
        setSearched(true)
        setExpandedId(null)
    }

    const reset = () => {
        setSearched(false); setResults([]); setQuery(''); setExpandedId(null)
        inputRef.current?.focus()
    }

    const removeRecent = (item, e) => {
        e.stopPropagation()
        const next = recent.filter(r => r !== item)
        setRecent(next)
        localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    }

    return (
        <div className="sp-page" onClick={onBack}>
            <div className="sp-card-wrap" onClick={e => e.stopPropagation()}>
                {/* ── 상단 바 ── */}
                <div className="sp-topbar">
                    <button className="sp-back" onClick={onBack}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6"/>
                        </svg>
                        뒤로
                    </button>

                    <div className="sp-input-wrap">
                        <svg className="sp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                            ref={inputRef}
                            className="sp-input"
                            placeholder="수어 단어를 검색하세요..."
                            value={query}
                            onChange={e => {
                                setQuery(e.target.value)
                                if (!e.target.value.trim()) { setSearched(false); setResults([]) }
                            }}
                            onKeyDown={e => { if (e.key === 'Enter') doSearch(query) }}
                        />
                        {query && <button className="sp-clear" onClick={reset}>✕</button>}
                    </div>

                    <button className="sp-search-btn" onClick={() => doSearch(query)}>검색</button>
                </div>

                {/* ── 본문 ── */}
                <div className="sp-body">

                    {/* 자동완성 */}
                    {!searched && suggestions.length > 0 && (
                        <div className="sp-section">
                            {suggestions.map(item => (
                                <div key={item} className="sp-row" onClick={() => doSearch(item)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                    </svg>
                                    <span className="sp-row-text">{item}</span>
                                    <button className="sp-fill-btn" onClick={e => { e.stopPropagation(); setQuery(item) }}>↙</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 검색 결과 */}
                    {searched && (
                        <div className="sp-results">
                            <div className="sp-result-count">
                                <span>"{query}"</span> 검색 결과 {results.length}개
                            </div>
                            {results.length > 0 ? results.map(item => (
                                <div key={item.id} className="sp-card">
                                    <div className="sp-card-head" onClick={() => setExpandedId(v => v === item.id ? null : item.id)}>
                                        <div className="sp-card-left">
                                            <span className="sp-emoji">{item.emoji}</span>
                                            <div>
                                                <div className="sp-word">{item.word}</div>
                                                <span className="sp-cat">{item.category}</span>
                                            </div>
                                        </div>
                                        <span className="sp-chevron">{expandedId === item.id ? '▲' : '▼'}</span>
                                    </div>
                                    <div className="sp-card-desc">{item.description}</div>
                                    {expandedId === item.id && (
                                        <div className="sp-detail">
                                            <div className="sp-detail-row"><span>✋</span><div><b>손 모양</b><p>{item.handShape}</p></div></div>
                                            <div className="sp-detail-row"><span>↔️</span><div><b>동작</b><p>{item.movement}</p></div></div>
                                            <div className="sp-detail-row"><span>😊</span><div><b>표정</b><p>{item.expression}</p></div></div>
                                            <div className="sp-detail-row sp-detail-tip"><span>💡</span><div><b>학습 팁</b><p>{item.tips}</p></div></div>
                                            <div className="sp-related">
                                                <span className="sp-related-label">관련 단어</span>
                                                {item.related.map(r => (
                                                    <button key={r} className="sp-related-tag" onClick={() => doSearch(r)}>{r}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="sp-empty">
                                    <div className="sp-empty-icon">🔍</div>
                                    <div className="sp-empty-title">"{query}" 결과가 없습니다</div>
                                    <div className="sp-empty-sub">수어 사전에서 더 찾아보세요</div>
                                    <button className="sp-dict-btn" onClick={() => { onGoDict?.(query); onBack() }}>
                                        수어 사전으로 이동 →
                                    </button>
                                </div>
                            )}

                            {results.length > 0 && (
                                <div className="sp-dict-banner" onClick={() => { onGoDict?.(query); onBack() }}>
                                    <span>📖</span>
                                    <div>
                                        <div className="sp-dict-banner-title">수어 사전에서 더 보기</div>
                                        <div className="sp-dict-banner-sub">더 많은 수어 단어와 영상을 확인하세요</div>
                                    </div>
                                    <span className="sp-dict-arrow">›</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 최근 검색어 */}
                    {!searched && query.length === 0 && recent.length > 0 && (
                        <div className="sp-section">
                            <div className="sp-section-head">
                                <span className="sp-section-title">최근 검색어</span>
                                <button className="sp-clear-all" onClick={() => { setRecent([]); localStorage.removeItem(RECENT_KEY) }}>전체 삭제</button>
                            </div>
                            {recent.map(item => (
                                <div key={item} className="sp-row" onClick={() => doSearch(item)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                    </svg>
                                    <span className="sp-row-text">{item}</span>
                                    <button className="sp-remove" onClick={e => removeRecent(item, e)}>✕</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 자주 찾는 수어 */}
                    {!searched && (
                        <div className="sp-quick">
                            <div className="sp-quick-title">자주 찾는 수어</div>
                            <div className="sp-quick-grid">
                                {SIGN_DB.map(w => (
                                    <button key={w.id} className="sp-chip" onClick={() => doSearch(w.word)}>
                                        <span>{w.emoji}</span>
                                        <span>{w.word}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}