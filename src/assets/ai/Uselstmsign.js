import { useEffect, useRef, useState, useCallback } from 'react'

const WS_URL = 'ws://localhost:8000/ws/sign'

export default function useLSTMSign({ onGesture, onSentence, place = 'immigration' } = {}) {
    const [lstmStatus,   setLstmStatus]   = useState('disconnected')
    const [lstmGesture,  setLstmGesture]  = useState(null)
    const [lstmSentence, setLstmSentence] = useState('')

    const wsRef      = useRef(null)
    const retryRef   = useRef(null)
    const retryCount = useRef(0)
    const placeRef   = useRef(place)

    // place가 바뀌면 ref 동기화 + 서버에 알림
    useEffect(() => {
        placeRef.current = place
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'set_place', place }))
        }
    }, [place])

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return
        setLstmStatus('connecting')

        const ws = new WebSocket(WS_URL)
        wsRef.current = ws

        ws.onopen = () => {
            setLstmStatus('ready')
            retryCount.current = 0
            console.log('[LSTM-WS] 연결됨')
            // 연결 직후 현재 장소를 서버에 알림
            ws.send(JSON.stringify({ type: 'set_place', place: placeRef.current }))
        }

        ws.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data)

                if (msg.type === 'gesture') {
                    setLstmGesture({ name: msg.gesture, conf: msg.confidence, tokens: msg.tokens })
                    onGesture?.(msg.gesture, msg.confidence)
                }

                if (msg.type === 'subtitle') {
                    setLstmSentence(msg.sentence)
                    onSentence?.(msg.sentence, msg.words)
                }
            } catch (_) {}
        }

        ws.onerror = () => {
            setLstmStatus('error')
            console.warn('[LSTM-WS] 연결 오류 — server.py가 실행 중인지 확인하세요')
        }

        ws.onclose = () => {
            setLstmStatus('disconnected')
            wsRef.current = null
            // 지수 백오프 재연결 (최대 30초)
            const delay = Math.min(1000 * 2 ** retryCount.current, 30000)
            retryCount.current++
            console.log(`[LSTM-WS] 연결 끊김 — ${delay/1000}초 후 재시도`)
            retryRef.current = setTimeout(connect, delay)
        }
    }, [onGesture, onSentence])

    useEffect(() => {
        connect()
        return () => {
            clearTimeout(retryRef.current)
            wsRef.current?.close()
        }
    }, [connect])

    /**
     * MediaPipe 랜드마크를 서버로 전송
     * @param {Array} handLandmarks  — results.multiHandLandmarks[0]
     */
    const sendLandmarks = useCallback((handLandmarks) => {
        if (!handLandmarks || wsRef.current?.readyState !== WebSocket.OPEN) return
        const lm = handLandmarks.map(p => [p.x, p.y, p.z])
        wsRef.current.send(JSON.stringify({ landmarks: lm }))
    }, [])

    return { lstmStatus, lstmGesture, lstmSentence, sendLandmarks, reconnect: connect }
}