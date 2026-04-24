// ══════════════════════════════════════════════════════════════
//  SubPanel — 자막 생성 패널
// ══════════════════════════════════════════════════════════════
import { speak } from './utils.js'

export default function SubPanel({
                                     tokens, text, loading, history,
                                     onFlush, onClear, onConfirm,
                                     tmStatus, lstmStatus,
                                 }) {
    const tmDot  = { ready: '#10b981', loading: '#f59e0b', error: '#ef4444', off: '#94a3b8' }[tmStatus]  || '#94a3b8'
    const tmLbl  = { ready: 'TM 준비됨 ✓', loading: 'TM 로딩 중...', error: 'TM 실패 — DTW 모드', off: 'TM 비활성' }[tmStatus]
    const lstmDot = { ready: '#10b981', connecting: '#f59e0b', disconnected: '#94a3b8', error: '#ef4444' }[lstmStatus] || '#94a3b8'
    const lstmLbl = { ready: 'LSTM 연결됨 ✓', connecting: 'LSTM 연결 중...', disconnected: 'LSTM 미연결', error: 'LSTM 오류' }[lstmStatus] || 'LSTM 미연결'
    const hasSentence = !loading && !!text

    return (
        <div className="subtitle-panel">
            <div className="tm-status-bar">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: tmDot, display: 'inline-block', marginRight: 4 }}/>
                <span className="tm-label">{tmLbl}</span>
                <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: lstmDot, display: 'inline-block', marginRight: 4 }}/>
                <span className="tm-label">{lstmLbl}</span>
            </div>

            {loading && (
                <div className="subtitle-loading">
                    <div className="typing-dots"><span/><span/><span/></div>
                    <span>문장을 만드는 중...</span>
                </div>
            )}

            {!loading && !text && (
                <div className="sub-idle-area">
                    <p className="subtitle-hint">수어 동작을 하면 자동으로 문장이 생성됩니다</p>
                    {tokens.length > 0 && (
                        <button className="token-flush-btn" onClick={onFlush}>✨ 지금 문장 생성</button>
                    )}
                </div>
            )}

            {hasSentence && (
                <div className="sentence-confirm-card">
                    <div className="scc-label">💬 생성된 문장</div>
                    <div className="scc-text">{text}</div>
                    <button className="btn-tts-sm" onClick={() => speak(text)}>🔊 듣기</button>
                    <p className="scc-question">이 문장이 맞나요?</p>
                    <div className="scc-actions">
                        <button className="btn-scc-retry" onClick={onClear}>↩ 다시 인식</button>
                        <button className="btn-scc-confirm" onClick={() => onConfirm(text)}>✅ 맞음 · 전송하기</button>
                    </div>
                </div>
            )}

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