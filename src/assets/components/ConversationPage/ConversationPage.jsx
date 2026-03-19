import { useRef } from 'react'
import './ConversationPage.css'

/**
 * ConversationPage
 * props:
 *   messages  — TranslatePage에서 넘겨받은 대화 기록 배열
 *   onBack    — "번역기로 돌아가기" 콜백
 */
export default function ConversationPage({ messages = [], onBack, onRegister }) {
    const printRef = useRef(null)

    // 텍스트 파일 저장
    const handleSaveTxt = () => {
        if (messages.length === 0) return
        const lines = messages.map(m => {
            const who = m.type === 'sign' ? '🧏 장애인 (수어)' : '🙋 나 (음성/텍스트)'
            return `[${m.time}] ${who}\n${m.text}`
        })
        const content = [
            '=== SignBridge 대화 기록 ===',
            `저장 시각: ${new Date().toLocaleString('ko-KR')}`,
            `총 ${messages.length}개 메시지`,
            '',
            ...lines.flatMap(l => [l, '']),
        ].join('\n')

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = `signbridge_대화기록_${Date.now()}.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handlePrint = () => window.print()

    const startTime  = messages[0]?.time || ''
    const endTime    = messages[messages.length - 1]?.time || ''
    const signCount  = messages.filter(m => m.type === 'sign').length
    const voiceCount = messages.filter(m => m.type === 'voice').length

    return (
        <div className="conv-page" ref={printRef}>

            {/* 헤더 */}
            <div className="conv-header">
                <div className="conv-header-left">
                    <button className="btn-back" onClick={onBack}>← 번역기로 돌아가기</button>
                    <div className="conv-title-wrap">
                        <h1 className="conv-title">💬 대화 기록</h1>
                        <p className="conv-subtitle">
                            {startTime && endTime ? `${startTime} ~ ${endTime}` : '기록 없음'}
                            {messages.length > 0 && (
                                <span className="conv-stats">
                  &nbsp;·&nbsp;총 {messages.length}개&nbsp;
                                    <span className="stat-sign">🧏 {signCount}</span>
                                    &nbsp;
                                    <span className="stat-voice">🙋 {voiceCount}</span>
                </span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="conv-actions">
                    <button className="btn-save btn-save-txt"   onClick={handleSaveTxt} disabled={messages.length === 0}>💾 텍스트로 저장</button>
                    <button className="btn-save btn-save-print" onClick={handlePrint}   disabled={messages.length === 0}>🖨️ 인쇄 / PDF</button>
                    <button className="btn-save btn-register"   onClick={onRegister}>📋 등록하기</button>
                </div>
            </div>

            {/* 본문 */}
            <div className="conv-body">
                {messages.length === 0 ? (
                    <div className="conv-empty">
                        <span style={{ fontSize: 52 }}>💬</span>
                        <p>저장된 대화 기록이 없습니다.</p>
                        <button className="btn-back-center" onClick={onBack}>← 번역기로 돌아가기</button>
                    </div>
                ) : (
                    <div className="conv-list">
                        {messages.map((msg, idx) => (
                            <div key={msg.id ?? idx} className={`conv-msg conv-msg-${msg.type}`}>
                                <div className="conv-avatar">{msg.type === 'sign' ? '🧏' : '🙋'}</div>
                                <div className="conv-bubble-wrap">
                                    <div className="conv-msg-name">
                                        {msg.type === 'sign' ? '장애인 (수어)' : '나 (음성/텍스트)'}
                                    </div>
                                    <div className="conv-bubble">{msg.text}</div>
                                    <div className="conv-msg-time">{msg.time}</div>
                                </div>
                                <div className="conv-index">#{idx + 1}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 하단 저장 버튼 (메시지 많을 때) */}
            {messages.length > 4 && (
                <div className="conv-footer">
                    <button className="btn-save btn-save-txt"   onClick={handleSaveTxt}>💾 텍스트로 저장</button>
                    <button className="btn-save btn-save-print" onClick={handlePrint}>🖨️ 인쇄 / PDF</button>
                </div>
            )}
        </div>
    )
}