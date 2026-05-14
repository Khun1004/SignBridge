// ══════════════════════════════════════════════════════════════
//  useLSTMSign — LSTM 서버 WebSocket 훅 (v3 — 상태명 완전 일치)
//
//  TranslatePage.jsx 기대값:
//    lstmStatus  → 'ready' | 'connecting' | 'unavailable' | 'disconnected' | 'error'
//    lstmGesture → { name: string, conf: number } | null
//
//  수정 이력:
//  v1  WebSocket 연결 기본 구현
//  v2  useRef 기반으로 순환의존 제거 + StrictMode 대응
//  v3  'connected' → 'ready' 로 상태명 수정 (TranslatePage 일치)
//      lstmGesture 를 문자열 → { name, conf } 객체로 변경
// ══════════════════════════════════════════════════════════════
import { useEffect, useRef, useCallback, useState } from 'react'

const WS_URL         = 'ws://localhost:8000/ws/sign'
const RECONNECT_BASE = 2000    // 최초 재연결 대기 ms
const RECONNECT_MAX  = 30000   // 최대 재연결 대기 ms
const MAX_RETRIES    = 10      // 최대 재연결 횟수

export default function useLSTMSign({ onGesture, onSentence } = {}) {
    // ── TranslatePage가 기대하는 상태명 그대로 사용 ───────────
    // 'ready' | 'connecting' | 'unavailable' | 'disconnected' | 'error'
    const [lstmStatus,  setLstmStatus]  = useState('disconnected')

    // ── TranslatePage 1033줄: lstmGesture.name / lstmGesture.conf ─
    const [lstmGesture, setLstmGesture] = useState(null)  // { name, conf } | null

    // ── mutable 값 전부 ref ───────────────────────────────────
    const wsRef         = useRef(null)
    const retryCount    = useRef(0)
    const retryTimer    = useRef(null)
    const unmounted     = useRef(false)
    const onGestureRef  = useRef(onGesture)
    const onSentenceRef = useRef(onSentence)

    useEffect(() => { onGestureRef.current  = onGesture  }, [onGesture])
    useEffect(() => { onSentenceRef.current = onSentence }, [onSentence])

    // ── scheduleReconnect (ref 패턴 — 순환의존 없음) ─────────
    const scheduleReconnectRef = useRef(null)
    scheduleReconnectRef.current = () => {
        if (unmounted.current) return
        clearTimeout(retryTimer.current)

        retryCount.current += 1
        if (retryCount.current > MAX_RETRIES) {
            console.warn('[LSTM-WS] 최대 재연결 횟수 초과 — 새로고침 하세요')
            setLstmStatus('error')
            return
        }

        const delay = Math.min(
            RECONNECT_BASE * Math.pow(1.5, retryCount.current - 1),
            RECONNECT_MAX
        )
        console.log(`[LSTM-WS] ${(delay / 1000).toFixed(1)}초 후 재연결... (${retryCount.current}/${MAX_RETRIES})`)
        retryTimer.current = setTimeout(() => connectRef.current?.(), delay)
    }

    // ── connect (ref 패턴) ────────────────────────────────────
    const connectRef = useRef(null)
    connectRef.current = () => {
        if (unmounted.current) return

        const cur = wsRef.current
        if (cur && (cur.readyState === WebSocket.OPEN ||
            cur.readyState === WebSocket.CONNECTING)) return

        console.log('[LSTM-WS] 연결 시도...')
        setLstmStatus('connecting')

        let ws
        try {
            ws = new WebSocket(WS_URL)
        } catch (e) {
            // WebSocket 생성 자체 실패 (브라우저 차단 등)
            console.error('[LSTM-WS] WebSocket 생성 실패:', e)
            setLstmStatus('unavailable')
            return
        }
        wsRef.current = ws

        ws.onopen = () => {
            if (unmounted.current) { ws.close(); return }
            console.log('[LSTM-WS] ✅ 연결 성공')
            retryCount.current = 0
            setLstmStatus('ready')          // ← 'connected' 가 아닌 'ready'
        }

        ws.onmessage = (e) => {
            if (unmounted.current) return
            try {
                const data = JSON.parse(e.data)

                if (data.type === 'gesture') {
                    // { name, conf } 객체로 세팅 — TranslatePage 1033줄 대응
                    setLstmGesture({ name: data.gesture, conf: data.confidence })
                    onGestureRef.current?.(data.gesture, data.confidence)
                }

                if (data.type === 'subtitle') {
                    onSentenceRef.current?.(data.sentence)
                }
            } catch { /* JSON 파싱 실패 무시 */ }
        }

        ws.onerror = () => {
            if (!unmounted.current)
                console.warn('[LSTM-WS] 오류 — server.py 실행 확인')
            // onerror 직후 onclose 가 반드시 호출됨
        }

        ws.onclose = (e) => {
            if (unmounted.current) return   // cleanup 후 재연결 차단
            console.log(`[LSTM-WS] 연결 종료 (code=${e.code})`)
            setLstmStatus('disconnected')
            setLstmGesture(null)
            scheduleReconnectRef.current?.()
        }
    }

    // ── 마운트 / 언마운트 ─────────────────────────────────────
    useEffect(() => {
        unmounted.current = false

        // 300ms 딜레이: React StrictMode 이중 마운트 대응
        // (첫 번째 cleanup이 이 타이머를 취소 → 소켓 안 열림)
        const initTimer = setTimeout(() => connectRef.current?.(), 300)

        return () => {
            unmounted.current = true
            clearTimeout(initTimer)
            clearTimeout(retryTimer.current)

            const ws = wsRef.current
            if (ws) {
                ws.onopen    = null
                ws.onmessage = null
                ws.onerror   = null
                ws.onclose   = null   // ← 재연결 루프 차단
                if (ws.readyState === WebSocket.OPEN ||
                    ws.readyState === WebSocket.CONNECTING) {
                    ws.close(1000, 'unmount')
                }
                wsRef.current = null
            }
        }
    }, [])  // ref 기반 → 의존성 배열 비워도 안전

    // ── 랜드마크 전송 ─────────────────────────────────────────
    const sendLandmarks = useCallback((landmarks) => {
        const ws = wsRef.current
        if (!ws || ws.readyState !== WebSocket.OPEN) return
        try {
            ws.send(JSON.stringify({ landmarks }))
        } catch (err) {
            console.error('[LSTM-WS] send 오류:', err)
        }
    }, [])

    return { lstmStatus, lstmGesture, sendLandmarks }
}