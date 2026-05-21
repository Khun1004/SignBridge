// ══════════════════════════════════════════════════════════════
//  SubPanel — 수어 인식 및 문장 생성 패널
//
//  흐름:
//  ① 손 동작 → 단어 인식 → [✅ 맞음] 클릭 → 수집 목록에 추가
//  ② 반복...
//  ③ [✨ 문장 생성] 클릭 → AI가 자연스러운 문장 생성
//  ④ [전송하기] 클릭 → 대화 기록에 추가
// ══════════════════════════════════════════════════════════════
import { useState } from 'react'
import { speak } from './utils.js'

// 문장 끝에 마침표 추가 — 없으면 추가, 있으면 유지
function addPeriods(text) {
    if (!text) return text
    // 문장을 분리해서 각각 마침표 추가
    const sentences = text.split(/(?<=[다요죠요])[ ]+/)
    return sentences
        .map(s => {
            const trimmed = s.trim()
            if (!trimmed) return ''
            // 이미 마침표/물음표/느낌표로 끝나면 유지
            if (/[.?!。]$/.test(trimmed)) return trimmed
            return trimmed + '.'
        })
        .filter(Boolean)
        .join(' ')
}

export default function SubPanel({
                                     tokens, text, loading, history,
                                     onFlush, onClear, onConfirm,
                                     tmStatus, lstmStatus,
                                     // 새로 추가: 현재 인식된 단어 (실시간)
                                     currentWord = '',
                                     currentConf = 0,
                                     onAccept,   // 맞음 클릭 후 currentWord 초기화 콜백
                                 }) {
    // 수집된 단어 목록
    const [collected, setCollected] = useState([])
    // 생성된 문장
    const [sentence, setSentence] = useState('')
    const [generating, setGenerating] = useState(false)

    const tmDot   = { ready:'#10b981', loading:'#f59e0b', error:'#ef4444', off:'#94a3b8' }[tmStatus] || '#94a3b8'
    const tmLbl   = { ready:'TM 준비됨 ✓', loading:'TM 로딩 중...', error:'TM 실패', off:'TM 비활성' }[tmStatus]
    const lstmDot = { ready:'#10b981', connecting:'#f59e0b', disconnected:'#94a3b8', unavailable:'#94a3b8', error:'#ef4444' }[lstmStatus] || '#94a3b8'
    const lstmLbl = { ready:'LSTM 연결됨 ✓', connecting:'LSTM 연결 중...', disconnected:'LSTM 미연결', unavailable:'LSTM 서버없음', error:'LSTM 오류' }[lstmStatus] || 'LSTM 미연결'

    // ── 맞음 클릭 — 현재 단어를 수집 목록에 추가 ────────────
    const handleAccept = () => {
        if (!currentWord) return
        setCollected(prev => [...prev, currentWord])
        setSentence('')  // 기존 문장 초기화
        onAccept?.()     // 부모에게 알려서 currentWord 초기화
    }

    // ── 단어 삭제 ────────────────────────────────────────────
    const handleRemoveWord = (idx) => {
        setCollected(prev => prev.filter((_, i) => i !== idx))
        setSentence('')
    }

    // ── 문장 생성 ────────────────────────────────────────────
    const handleGenerate = async () => {
        if (collected.length === 0) return
        setGenerating(true)
        setSentence('')
        try {
            // buildSubtitle API 또는 로컬 변환
            await onFlush(collected, (result) => {
                setSentence(addPeriods(result))
            })
        } catch (e) {
            // 로컬 변환 fallback
            const SENTENCE_MAP = {
                '안녕하세요':  '안녕하세요.',
                '만나서':      '만나서',
                '반갑습니다':  '반갑습니다.',
                '저는':        '저는',
                '당신을':      '당신을',
                '좋아합니다':  '좋아합니다.',
                '고맙습니다':  '고맙습니다.',
                '미안합니다':  '미안합니다.',
            }
            const parts = collected.map(w => SENTENCE_MAP[w] || w)
            setSentence(addPeriods(parts.join(' ')))
        } finally {
            setGenerating(false)
        }
    }

    // ── 전송하기 ─────────────────────────────────────────────
    const handleConfirm = () => {
        if (!sentence) return
        onConfirm(sentence)
        setCollected([])
        setSentence('')
    }

    // ── 처음부터 ─────────────────────────────────────────────
    const handleReset = () => {
        setCollected([])
        setSentence('')
        onClear?.()
    }

    return (
        <div className="subtitle-panel">

            {/* ── 엔진 상태 ── */}
            <div className="tm-status-bar">
                <span style={{width:8,height:8,borderRadius:'50%',background:tmDot,display:'inline-block',marginRight:4}}/>
                <span className="tm-label">{tmLbl}</span>
                <span style={{margin:'0 8px',opacity:0.3}}>|</span>
                <span style={{width:8,height:8,borderRadius:'50%',background:lstmDot,display:'inline-block',marginRight:4}}/>
                <span className="tm-label">{lstmLbl}</span>
            </div>

            {/* ── STEP 1: 현재 인식된 단어 ── */}
            <div className="sp-current-word-area">
                {currentWord ? (
                    <>
                        <div className="sp-recognized-label">인식된 수어</div>
                        <div className="sp-recognized-word">{currentWord}</div>
                        <div className="sp-conf-bar">
                            <div className="sp-conf-fill"
                                 style={{width:`${Math.round(currentConf*100)}%`}}/>
                            <span className="sp-conf-text">{Math.round(currentConf*100)}%</span>
                        </div>
                        <button className="sp-accept-btn" onClick={handleAccept}>
                            ✅ 맞음
                        </button>
                    </>
                ) : (
                    <div className="sp-waiting">
                        <span>🤟</span>
                        <p>손 동작을 하면 인식된 단어가 나타납니다</p>
                    </div>
                )}
            </div>

            {/* ── STEP 2: 수집된 단어 목록 ── */}
            {collected.length > 0 && (
                <div className="sp-collected-area">
                    <div className="sp-collected-label">
                        수집된 단어
                        <span className="sp-collected-count">{collected.length}개</span>
                    </div>
                    <div className="sp-word-chips">
                        {collected.map((w, i) => (
                            <div key={i} className="sp-word-chip">
                                <span>{w}</span>
                                <button className="sp-chip-del"
                                        onClick={() => handleRemoveWord(i)}>✕</button>
                            </div>
                        ))}
                    </div>
                    <div style={{display:'flex',gap:8,marginTop:10}}>
                        <button className="sp-reset-btn" onClick={handleReset}>
                            🔄 처음부터
                        </button>
                        <button className="sp-generate-btn"
                                onClick={handleGenerate}
                                disabled={generating}>
                            {generating ? '⏳ 생성 중...' : '✨ 문장 생성'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 3: 생성된 문장 ── */}
            {sentence && (
                <div className="sentence-confirm-card">
                    <div className="scc-label">💬 생성된 문장</div>
                    <div className="scc-text">{sentence}</div>
                    <button className="btn-tts-sm" onClick={() => speak(sentence)}>
                        🔊 듣기
                    </button>
                    <p className="scc-question">이 문장이 맞나요?</p>
                    <div className="scc-actions">
                        <button className="btn-scc-retry" onClick={() => setSentence('')}>
                            ↩ 다시 생성
                        </button>
                        <button className="btn-scc-confirm" onClick={handleConfirm}>
                            ✅ 전송하기
                        </button>
                    </div>
                </div>
            )}

            {/* ── 이전 문장 기록 ── */}
            {history.length > 0 && (
                <div className="subtitle-history">
                    <div className="hist-label">📋 이전 문장</div>
                    {history.map((h, i) => (
                        <div key={i} className="subtitle-hist-item">
                            <span className="hist-time">{h.time}</span>
                            <span className="hist-text">{h.text}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}