// ══════════════════════════════════════════════════════════════
//  TranslatePage — 3열 레이아웃 (수어 인식 | 3D 아바타 | 텍스트 입력)
//  ✅ TM과 MediaPipe 완전 분리 — 충돌 없음
// ══════════════════════════════════════════════════════════════
import { useEffect, useRef, useState, useCallback } from 'react'
import './TranslatePage.css'
import useLSTMSign from '../../ai/Uselstmsign.js'

// ── 분리된 모듈 import ────────────────────────────────────────
import {
    TM_MODEL_URL, TM_THRESHOLD, TM_ENABLED,
    STABLE, COOLDOWN, FLUSH, MAX_TOKS,
    PLACE_LABEL, A2P, POSE_CFG,
    ENGINE_DEFAULT,
} from './constants.js'
import { DTWRec, DTW_TH } from './dtwEngine.js'
import { RULES, classify, vote, MotionTracker } from './gestureClassifier.js'
import { fixAnim, speak, loadMP } from './utils.js'
import { buildSubtitle, fetchSignGuide } from './translateApis.js'
import SubPanel from './SubPanel.jsx'
import AIPanel  from './AIPanel.jsx'
import HandSVG  from './HandSVG.jsx'

// ── MiniHand ─────────────────────────────────────────────────
function MiniHand({ pose, size = 48, running }) {
    const cfg = POSE_CFG[pose] || POSE_CFG.idle
    return (
        <svg width={size} height={size} viewBox="-20 -24 40 36">
            <HandSVG type={pose} color={cfg.c}/>
            {running && (
                <circle cx="16" cy="-20" r="4" fill="#10b981">
                    <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite"/>
                </circle>
            )}
        </svg>
    )
}

// ══════════════════════════════════════════════════════════════
//  메인 컴포넌트
// ══════════════════════════════════════════════════════════════
export default function TranslatePage({ onEndConversation, place = 'immigration' }) {
    const [mpError,       setMpError]       = useState(null)
    const [cameraOn,      setCameraOn]      = useState(false)
    const [messages,      setMessages]      = useState([])
    const [textInput,     setTextInput]     = useState('')
    const [voiceText,     setVoiceText]     = useState('')
    const [listening,     setListening]     = useState(false)
    const [inputMode,     setInputMode]     = useState('text')
    const [pendingSign,   setPendingSign]   = useState(null)
    const [signMeaning,   setSignMeaning]   = useState(null)
    const [signPose,      setSignPose]      = useState('idle')
    const [pendingReply,  setPendingReply]  = useState(null)
    const [aiGuide,       setAiGuide]       = useState(null)
    const [aiLoading,     setAiLoading]     = useState(false)
    const [avatarPlaying, setAvatarPlaying] = useState(false)
    const [showStopWarn,  setShowStopWarn]  = useState(false)
    const [liveG,         setLiveG]         = useState(null)
    const [handDet,       setHandDet]       = useState(false)
    const [stabProg,      setStabProg]      = useState(0)
    const [ttsOn,         setTtsOn]         = useState(true)
    const [subTokens,     setSubTokens]     = useState([])
    const [subText,       setSubText]       = useState('')
    const [subLoading,    setSubLoading]    = useState(false)
    const [subHist,       setSubHist]       = useState([])
    const [tmStatus,      setTmStatus]      = useState(TM_ENABLED ? 'loading' : 'off')
    const [engineMode,    setEngineMode]    = useState('tm')  // 'mediapipe' | 'tm'
    const engineModeRef   = useRef('tm')

    const vRef          = useRef(null)
    const cvRef         = useRef(null)
    const handsRef      = useRef(null)
    const rafRef        = useRef(null)
    const recRef        = useRef(null)
    const chatRef       = useRef(null)
    const taRef         = useRef(null)
    const lastSignRef   = useRef(null)
    const lastTimeRef   = useRef(0)
    const runRef        = useRef(false)
    const msgsRef       = useRef([])
    const stabCnt       = useRef(0)
    const stabName      = useRef(null)
    const ttsRef        = useRef(true)
    const dtwRef        = useRef(new DTWRec())
    const motionRef     = useRef(new MotionTracker(25))
    const tmRef         = useRef(null)
    const tmResultRef   = useRef(null)
    const lstmHitRef    = useRef(null)
    const flushTRef     = useRef(null)
    const tokRef        = useRef([])
    const prevSentRef   = useRef('')
    const tmStatusRef   = useRef(tmStatus)

    const { lstmStatus, lstmGesture, sendLandmarks } = useLSTMSign({
        onGesture: useCallback((name, conf) => {
            if (name && conf >= 0.75) {
                const r = RULES.find(r => r.name === name)
                lstmHitRef.current = r || { name, emoji: '🤖', meaning: '', pose: 'idle' }
                setTimeout(() => { lstmHitRef.current = null }, 2000)
            }
        }, []),
        onSentence: useCallback((sentence) => {
            if (sentence) setSubText(sentence)
        }, []),
    })

    useEffect(() => { ttsRef.current = ttsOn }, [ttsOn])
    useEffect(() => { tmStatusRef.current = tmStatus }, [tmStatus])
    useEffect(() => { engineModeRef.current = engineMode }, [engineMode])
    useEffect(() => { chatRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

    // ── TM 로드 ──────────────────────────────────────────────
    useEffect(() => {
        if (!TM_ENABLED) return
            ;(async () => {
            try {
                if (!window.tmPose) {
                    await new Promise((res, rej) => {
                        const s = document.createElement('script')
                        s.src = 'https://cdn.jsdelivr.net/npm/@teachablemachine/pose@0.8/dist/teachablemachine-pose.min.js'
                        s.onload = res; s.onerror = rej
                        document.head.appendChild(s)
                    })
                }
                setTmStatus('loading')
                tmRef.current = await window.tmPose.load(
                    TM_MODEL_URL + 'model.json',
                    TM_MODEL_URL + 'metadata.json'
                )
                setTmStatus('ready')
            } catch (e) {
                console.error('[TM]', e); setTmStatus('error')
            }
        })()
    }, [])

    // ── 자막 생성 ─────────────────────────────────────────────
    const flushSub = useCallback(async (toks) => {
        if (!toks?.length) return
        setSubLoading(true)
        setSubTokens([])
        tokRef.current = []
        const s = await buildSubtitle(toks, place, prevSentRef.current)
        setSubLoading(false)
        if (s && s !== prevSentRef.current) {
            setSubText(s)
            prevSentRef.current = s
        }
    }, [place])

    // ── 토큰 추가 ─────────────────────────────────────────────
    const pushTok = useCallback((name) => {
        const w = name.replace(/\p{Emoji}/gu, '').trim()
        if (!w) return
        const cur = tokRef.current
        if (cur.length > 0 && cur[cur.length - 1] === w) return
        setSubTokens(prev => {
            const next = [...prev, w]
            tokRef.current = next
            if (next.length >= MAX_TOKS) {
                clearTimeout(flushTRef.current)
                setTimeout(() => flushSub([...next]), 0)
            }
            return next
        })
        clearTimeout(flushTRef.current)
        flushTRef.current = setTimeout(() => {
            if (tokRef.current.length > 0) flushSub([...tokRef.current])
        }, FLUSH)
    }, [flushSub])

    // ══════════════════════════════════════════════════════════
    //  MediaPipe 결과 콜백 — TM / MediaPipe 완전 분리
    // ══════════════════════════════════════════════════════════
    const onResults = useCallback((results) => {
        if (!runRef.current) return

        const cv = cvRef.current
        if (!cv) return
        const ctx = cv.getContext('2d')

        // ── 카메라 영상 그리기 (좌우 반전) ──────────────────────
        ctx.save()
        ctx.clearRect(0, 0, cv.width, cv.height)
        ctx.scale(-1, 1)
        ctx.drawImage(results.image, -cv.width, 0, cv.width, cv.height)
        ctx.restore()

        // ── Holistic: 손 + 포즈 랜드마크 추출 ────────────────
        const rightHand = results.rightHandLandmarks || null
        const leftHand  = results.leftHandLandmarks  || null
        const poseLm    = results.poseLandmarks      || null

        // 감지된 손 (오른손 우선, 없으면 왼손)
        const lm  = rightHand || leftHand
        const lm2 = (rightHand && leftHand) ? leftHand : null

        if (lm) {
            setHandDet(true)
            sendLandmarks(lm)

            // ── 손 랜드마크 시각화 ────────────────────────────────
            const HAND_CONNECTIONS = [
                [0,1],[1,2],[2,3],[3,4],
                [0,5],[5,6],[6,7],[7,8],
                [0,9],[9,10],[10,11],[11,12],
                [0,13],[13,14],[14,15],[15,16],
                [0,17],[17,18],[18,19],[19,20],
                [5,9],[9,13],[13,17],
            ]
            const W        = cv.width, H = cv.height
            const TIP_IDS  = [4, 8, 12, 16, 20]
            const BASE_IDS = [0, 1, 5, 9, 13, 17]
            const COLORS   = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#c77dff']
            const getColor = (idx) => {
                if (idx === 0) return '#ffffff'
                if (idx <= 4)  return COLORS[0]
                if (idx <= 8)  return COLORS[1]
                if (idx <= 12) return COLORS[2]
                if (idx <= 16) return COLORS[3]
                return COLORS[4]
            }
            const drawHand = (hand) => {
                ctx.save()
                ctx.strokeStyle = 'rgba(255,255,255,0.6)'
                ctx.lineWidth = 2
                for (const [a, b] of HAND_CONNECTIONS) {
                    ctx.beginPath()
                    ctx.moveTo((1 - hand[a].x) * W, hand[a].y * H)
                    ctx.lineTo((1 - hand[b].x) * W, hand[b].y * H)
                    ctx.stroke()
                }
                for (let i = 0; i < hand.length; i++) {
                    const x = (1 - hand[i].x) * W
                    const y = hand[i].y * H
                    const r = TIP_IDS.includes(i) ? 7 : BASE_IDS.includes(i) ? 5 : 4
                    ctx.beginPath()
                    ctx.arc(x, y, r + 2, 0, Math.PI * 2)
                    ctx.fillStyle = 'rgba(0,0,0,0.5)'
                    ctx.fill()
                    ctx.beginPath()
                    ctx.arc(x, y, r, 0, Math.PI * 2)
                    ctx.fillStyle = getColor(i)
                    ctx.fill()
                }
                ctx.restore()
            }
            if (rightHand) drawHand(rightHand)
            if (leftHand)  drawHand(leftHand)

            // ══════════════════════════════════════════════════
            //  엔진 실행 — TM / Holistic 분리
            // ══════════════════════════════════════════════════
            let hit = null

            if (engineModeRef.current === 'mediapipe') {
                // ── MediaPipe Holistic 전용 모드 ──────────────────
                // poseLm(몸 랜드마크)을 함께 전달 → 위치 구분 정확도 향상
                motionRef.current.push(lm, lm2, poseLm)
                hit = classify(lm, motionRef.current)

            } else {
                // ── TM 모드: TM 우선, Holistic 보조 ──────────────
                motionRef.current.push(lm, lm2, poseLm)

                // TM 비동기 추론
                if (tmRef.current && tmStatusRef.current === 'ready') {
                    tmRef.current.estimatePose(vRef.current)
                        .then(({ posenetOutput }) => tmRef.current.predict(posenetOutput))
                        .then(preds => {
                            if (!preds?.length) return
                            const best = preds.reduce((a, b) =>
                                a.probability > b.probability ? a : b)
                            if (best.probability >= TM_THRESHOLD) {
                                tmResultRef.current = {
                                    name: best.className,
                                    prob: best.probability,
                                    ts:   Date.now(),
                                }
                            } else {
                                tmResultRef.current = null
                            }
                        }).catch(() => { tmResultRef.current = null })
                }

                // TM 결과 500ms 이내면 우선 사용, 아니면 Holistic 보조
                const tmFresh = tmResultRef.current &&
                    (Date.now() - (tmResultRef.current.ts || 0)) < 500
                if (tmFresh) {
                    const tmName = tmResultRef.current.name
                    const r = RULES.find(r => r.name === tmName)
                    hit = r || {
                        name:    tmName,
                        emoji:   '🤖',
                        meaning: tmName,
                        pose:    A2P[tmName] || 'idle',
                    }
                } else {
                    // TM 결과 없으면 Holistic(MediaPipe) 전체 사용
                    hit = classify(lm, motionRef.current)
                }
            }

            // ── hit 확정 처리 ─────────────────────────────────
            if (hit) {
                setLiveG(hit)
                const name = hit.name
                if (name === stabName.current) {
                    stabCnt.current++
                } else {
                    stabName.current = name
                    stabCnt.current  = 1
                }
                setStabProg(Math.min((stabCnt.current / STABLE) * 100, 100))

                if (stabCnt.current >= STABLE) {
                    const now   = Date.now()
                    const isNew = name !== lastSignRef.current ||
                        (now - lastTimeRef.current > COOLDOWN)
                    if (isNew) {
                        lastSignRef.current  = name
                        lastTimeRef.current  = now
                        motionRef.current.confirmGesture(name)
                        if (ttsRef.current) speak(name)
                        pushTok(name)
                        stabCnt.current  = 0
                        stabName.current = null
                        setStabProg(0)
                    }
                }
            } else {
                setLiveG(null)
                stabCnt.current  = 0
                stabName.current = null
                setStabProg(0)
            }

        } else {
            setHandDet(false)
            stabCnt.current  = 0
            stabName.current = null
            setStabProg(0)
        }
    }, [pushTok, sendLandmarks])

    // ── 카메라 시작 ───────────────────────────────────────────
    const init = async () => {
        setMpError(null)
        try {
            await loadMP()
            if (handsRef.current) {
                try { handsRef.current.close() } catch (_) {}
                handsRef.current = null
            }
            // Holistic: 손 + 몸 + 얼굴 동시 감지
            const holistic = new window.Holistic({
                locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${f}`
            })
            holistic.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                refineFaceLandmarks: false,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.6,
            })
            holistic.onResults(onResults)
            handsRef.current = holistic
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            })
            vRef.current.srcObject = stream
            await vRef.current.play()
            runRef.current = true
            setCameraOn(true); setShowStopWarn(false)
            dtwRef.current.reset()
            const loop = async () => {
                if (!runRef.current) return
                if (vRef.current?.readyState >= 2)
                    await handsRef.current?.send({ image: vRef.current })
                rafRef.current = requestAnimationFrame(loop)
            }
            rafRef.current = requestAnimationFrame(loop)
        } catch (e) {
            setMpError(e.message || '카메라 초기화 실패')
        }
    }

    // ── 카메라 중지 ───────────────────────────────────────────
    const stopCam = () => {
        runRef.current = false
        cancelAnimationFrame(rafRef.current)
        const v = vRef.current
        if (v?.srcObject) {
            v.srcObject.getTracks().forEach(t => t.stop())
            v.srcObject = null
        }
        try { handsRef.current?.close() } catch (_) {}
        handsRef.current = null
        setCameraOn(false)
        setHandDet(false)
        setLiveG(null)
        setShowStopWarn(false)
        setStabProg(0)
        motionRef.current.reset()
        cvRef.current?.getContext('2d').clearRect(0, 0, 640, 480)
    }

    // ── 수어 전송 / 재시도 ────────────────────────────────────
    const sendSign = () => {
        if (!pendingSign) return
        addMsg('sign', pendingSign, signPose)
        setPendingSign(null); setSignMeaning(null); setSignPose('idle')
        lastSignRef.current = null
        if (!runRef.current) init()
    }
    const retakeSign = () => {
        setPendingSign(null); setSignMeaning(null); setSignPose('idle')
        if (!runRef.current) init()
    }

    // ── 문장 확정 ─────────────────────────────────────────────
    const confirmSentence = useCallback((sentence) => {
        if (!sentence) return
        addMsg('sign', sentence, null)
        const t = new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        })
        setSubHist(p => [...p.slice(-9), { text: sentence, time: t }])
        if (ttsRef.current) speak(sentence)
        setSubText(''); setSubTokens([]); tokRef.current = []
        prevSentRef.current = ''
        clearTimeout(flushTRef.current)
    }, [])

    // ── AI 수어 가이드 ────────────────────────────────────────
    const getAI = async (text) => {
        if (!text?.trim()) return
        setAiLoading(true); setAiGuide(null); setAvatarPlaying(false)
        const data = await fetchSignGuide(text)
        setAiGuide(data)
        setAiLoading(false)
        setAvatarPlaying(true)
    }

    // ── 음성 입력 ─────────────────────────────────────────────
    const startV = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SR) return
        const r = new SR(); r.lang = 'ko-KR'; r.interimResults = true; r.continuous = true
        recRef.current = r
        r.onresult = e => {
            const interim = Array.from(e.results).map(r => r[0].transcript).join('')
            setVoiceText(interim)
            if (e.results[e.results.length - 1].isFinal) {
                const f = e.results[e.results.length - 1][0].transcript.trim()
                if (f) { setPendingReply(f); setVoiceText(''); stopV() }
            }
        }
        r.onend = () => setListening(false)
        r.start(); setListening(true)
    }
    const stopV = () => { recRef.current?.stop(); setListening(false); setVoiceText('') }

    const htk = e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            const v = textInput.trim()
            if (v) { getAI(v); setPendingReply(v); setTextInput('') }
        }
    }

    const subTxt = () => {
        const v = textInput.trim()
        if (!v) return
        getAI(v)
        setPendingReply(v)
        setTextInput('')
    }

    const sendReply = () => {
        if (!pendingReply) return
        const text = pendingReply
        addMsg('voice', text)
        setAvatarPlaying(false)
        if (!aiGuide && !aiLoading) getAI(text)
        setPendingReply(null)
    }

    const addMsg = (type, text, pose = null) => {
        const m = {
            id:   Date.now() + Math.random(),
            type, text, pose,
            time: new Date().toLocaleTimeString('ko-KR', {
                hour: '2-digit', minute: '2-digit'
            }),
        }
        setMessages(p => { const n = [...p, m]; msgsRef.current = n; return n })
    }

    const handleEnd = () => {
        if (cameraOn) { setShowStopWarn(true); return }
        try { recRef.current?.stop() } catch (_) {}
        onEndConversation?.(msgsRef.current)
    }

    // ── 클린업 ───────────────────────────────────────────────
    useEffect(() => () => {
        runRef.current = false
        cancelAnimationFrame(rafRef.current)
        clearTimeout(flushTRef.current)
        const v = vRef.current
        if (v?.srcObject) v.srcObject.getTracks().forEach(t => t.stop())
        try { handsRef.current?.close() } catch (_) {}
        try { recRef.current?.stop() } catch (_) {}
        window.speechSynthesis?.cancel()
    }, [])

    // ══════════════════════════════════════════════════════════
    //  렌더 — 3열 레이아웃
    // ══════════════════════════════════════════════════════════
    return (
        <div className="tp">
            <div className="warn-banner">⚠️ 이 화면의 모든 내용은 기록됩니다.</div>
            {mpError && <div className="error-banner">❌ {mpError}</div>}
            {showStopWarn && (
                <div className="stop-warn">
                    ⚠️ 카메라가 켜져 있습니다. 먼저 <strong>⏹ Stop</strong>을 눌러주세요.
                    <button onClick={() => setShowStopWarn(false)}>✕</button>
                </div>
            )}

            {/* ── 상단 바 ── */}
            <div className="top-bar">
                <div className="place-badge">📍 {PLACE_LABEL[place] || place}</div>

                {/* ── 인식 엔진 선택 버튼 ── */}
                <div className="engine-toggle-wrap">
                    <span className="engine-toggle-label">인식 방식</span>
                    <button
                        className={`engine-btn ${engineMode === 'mediapipe' ? 'engine-btn-on' : ''}`}
                        onClick={() => {
                            setEngineMode('mediapipe')
                            tmResultRef.current  = null
                            lstmHitRef.current   = null
                        }}
                        title="MediaPipe rule-based 단독 모드"
                    >
                        👋 MediaPipe
                    </button>
                    <button
                        className={`engine-btn ${engineMode === 'tm' ? 'engine-btn-on' : ''}`}
                        onClick={() => { setEngineMode('tm'); stabCnt.current = 0 }}
                        title="TM 우선 + 사랑합니다만 MediaPipe 전담 (권장)"
                        disabled={!TM_ENABLED || tmStatus === 'error'}
                    >
                        🤖 TM
                        {tmStatus === 'loading' && <span className="engine-btn-loading"> ...</span>}
                        {tmStatus === 'ready'   && <span className="engine-btn-ready"> ✓</span>}
                        {tmStatus === 'error'   && <span className="engine-btn-err"> ✕</span>}
                    </button>
                </div>

                <label className="tts-toggle">
                    <input type="checkbox" checked={ttsOn} onChange={e => setTtsOn(e.target.checked)}/>
                    <span className="tts-slider"/>
                    <span>🔊 수어 읽기</span>
                </label>
                <div className="top-bar-r">
                    <span className="end-hint">종료 전 Stop 먼저</span>
                    <button className="btn-end" onClick={handleEnd}>대화 종료 →</button>
                </div>
            </div>

            <video ref={vRef} style={{ display: 'none' }} playsInline muted/>

            {/* ══════════════════════════════════════════════════
                3열 그리드: 수어 인식 | 3D 아바타 | 텍스트 입력
                ══════════════════════════════════════════════════ */}
            <div className="main-grid">

                {/* ── 좌측: 수어 인식 (청각장애인) ── */}
                <div className="col col-left">
                    <div className="card">
                        <div className="card-hd">
                            <span>🖐 수어 인식</span>
                            <span className="hd-sub">청각장애인</span>
                            {cameraOn && <span className="badge-rec">● REC</span>}
                        </div>
                        <div className="card-bd">
                            <div className="cam-row">
                                <button className="btn-start" onClick={init}    disabled={cameraOn}>▶ Start</button>
                                <button className="btn-stop"  onClick={stopCam} disabled={!cameraOn}>⏹ Stop</button>
                            </div>

                            <div className="vid-box">
                                <canvas
                                    ref={cvRef}
                                    width={640} height={480}
                                    className="cam-cv"
                                    style={{ display: cameraOn ? 'block' : 'none' }}
                                />
                                {!cameraOn && (
                                    <div className="vid-ph">
                                        <span>🤟</span>
                                        <p>▶ Start를 눌러<br/>카메라를 시작하세요</p>
                                    </div>
                                )}
                            </div>

                            <div className="live-box">
                                {!cameraOn
                                    ? <p className="live-idle">카메라를 켜면 수어 인식이 시작됩니다</p>
                                    : !handDet
                                        ? <p className="live-idle">✋ 손을 카메라 앞에 보여주세요</p>
                                        : liveG
                                            ? (
                                                <div className="live-hit">
                                                    <MiniHand pose={A2P[liveG.pose] || 'wave'} size={54} running={true}/>
                                                    <div className="live-info">
                                                        <div className="live-name">
                                                            {liveG.emoji} {liveG.name}
                                                        </div>
                                                        <div className="live-mean">{liveG.meaning}</div>
                                                        <div className="prog-bar">
                                                            <div className="prog-fill" style={{ width: `${stabProg}%` }}/>
                                                        </div>
                                                        <div className="prog-lbl">동작 유지 {Math.round(stabProg)}%</div>
                                                    </div>
                                                </div>
                                            )
                                            : <p className="live-idle">🔍 동작을 인식하고 있어요...</p>
                                }
                            </div>

                            {/* ── 엔진 상태 표시 ── */}
                            <div className="engine-status-bar">
                                <span className={`engine-badge ${tmStatus === 'ready' ? 'on' : tmStatus === 'loading' ? 'loading' : 'off'}`}>
                                    TM {tmStatus === 'ready' ? '✅' : tmStatus === 'loading' ? '⏳' : '❌'}
                                </span>
                                <span className={`engine-badge ${lstmStatus === 'ready' ? 'on' : lstmStatus === 'connecting' ? 'loading' : 'off'}`}>
                                    LSTM {lstmStatus === 'ready' ? '✅' : lstmStatus === 'connecting' ? '⏳' : '❌'}
                                </span>
                                <span className="engine-badge on">MP ✅</span>
                            </div>
                            {lstmGesture && lstmStatus === 'ready' && (
                                <div className="lstm-badge">
                                    🤖 LSTM: <strong>{lstmGesture.name}</strong>
                                    <span className="lstm-conf">{Math.round(lstmGesture.conf * 100)}%</span>
                                </div>
                            )}

                            {pendingSign && (
                                <div className="pending-card">
                                    <div className="pc-info">
                                        <div className="pc-name">{pendingSign}</div>
                                        <div className="pc-mean">{signMeaning}</div>
                                    </div>
                                    <div className="pc-acts">
                                        <button className="btn-retake" onClick={retakeSign}>↩ 재인식</button>
                                        <button className="btn-send"   onClick={sendSign}>전송 →</button>
                                    </div>
                                </div>
                            )}

                            <SubPanel
                                tokens={subTokens}
                                text={subText}
                                loading={subLoading}
                                history={subHist}
                                tmStatus={tmStatus}
                                lstmStatus={lstmStatus}
                                onFlush={() => flushSub([...tokRef.current])}
                                onClear={() => {
                                    setSubTokens([]); setSubText('')
                                    tokRef.current = []; prevSentRef.current = ''
                                    clearTimeout(flushTRef.current)
                                }}
                                onConfirm={confirmSentence}
                            />
                        </div>
                    </div>
                </div>

                {/* ── 가운데: 3D 아바타 생성 결과 ── */}
                <div className="col col-center">
                    <div className="card-avatar-center">
                        <div className="avatar-center-hd">
                            3D 아바타 생성 결과
                            <span className="avatar-center-badge">AI · 수어 시연</span>
                        </div>
                        <div className="avatar-center-body">
                            <AIPanel
                                guide={aiGuide}
                                loading={aiLoading}
                                playing={avatarPlaying}
                            />
                        </div>
                    </div>
                </div>

                {/* ── 우측: 텍스트 입력 (담당자) ── */}
                <div className="col col-right">
                    <div className="card-text-input">
                        <div className="text-input-hd">
                            텍스트 입력
                            <span className="hd-sub" style={{ marginLeft: 'auto' }}>담당자</span>
                        </div>
                        <div className="text-input-body">
                            {!pendingReply ? (
                                <>
                                    <div className="ai-textarea-wrap">
                                        <textarea
                                            ref={taRef}
                                            className="ai-textarea"
                                            placeholder="담당자가 전달할 내용을 입력하세요..."
                                            value={textInput}
                                            onChange={e => setTextInput(e.target.value)}
                                            onKeyDown={htk}
                                            rows={4}
                                        />
                                        <button
                                            className={`ai-suggest-btn ${textInput.trim() ? 'ai-suggest-on' : ''}`}
                                            onClick={subTxt}
                                            disabled={!textInput.trim()}
                                        >
                                            수어문 추출 →
                                        </button>
                                    </div>

                                    {aiGuide?.steps?.length > 0 && (
                                        <div className="ai-word-chips-wrap" style={{ marginTop: 12 }}>
                                            <div className="ai-word-chips-label">추출 결과</div>
                                            <div className="ai-word-chips">
                                                {aiGuide.steps.map((s, i) => (
                                                    <span key={i} className="ai-word-chip">
                                                        {s.word} <span className="chip-arrow">▶</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="ai-input-tabs" style={{ marginTop: 14 }}>
                                        <button
                                            className={`ai-itab ${inputMode === 'text' ? 'on' : ''}`}
                                            onClick={() => setInputMode('text')}
                                        >⌨️ 텍스트</button>
                                        <button
                                            className={`ai-itab ${inputMode === 'voice' ? 'on' : ''}`}
                                            onClick={() => setInputMode('voice')}
                                        >🎙️ 음성</button>
                                    </div>

                                    {inputMode === 'voice' && (
                                        <div className="ai-voice-row">
                                            <button
                                                className={`mic-btn ${listening ? 'mic-on' : ''}`}
                                                onClick={listening ? stopV : startV}
                                            >
                                                <span>🎙️</span>
                                                {listening && <div className="mic-ring"/>}
                                            </button>
                                            <p className="mic-stat">
                                                {listening ? voiceText || '듣고 있어요...' : '버튼을 눌러 말하세요'}
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="preview-card">
                                    <div className="pv-ico">🙋</div>
                                    <div className="pv-lbl">전송할 내용</div>
                                    <div className="pv-txt">{pendingReply}</div>
                                    <button className="btn-tts" onClick={() => speak(pendingReply)}>🔊 음성으로 듣기</button>
                                    <p className="pv-q">이 내용을 전송할까요?</p>
                                    <div className="pv-acts">
                                        <button className="btn-retake"      onClick={() => setPendingReply(null)}>↩ 다시 입력</button>
                                        <button className="btn-send-reply"  onClick={sendReply}>전송하기 →</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* ── 하단: 대화 기록 (전체 너비) ── */}
            <div className="card chat-row-card">
                <div className="card-hd">💬 대화 기록</div>
                <div className="card-bd">
                    <div className="chat-log chat-log-row">
                        {messages.length === 0
                            ? (
                                <div className="chat-empty">
                                    <span>💬</span>
                                    <p>수어 또는 텍스트로 대화를 시작하세요</p>
                                </div>
                            )
                            : messages.map(msg => (
                                <div key={msg.id} className={`msg msg-${msg.type}`}>
                                    <div className="msg-nm">
                                        {msg.type === 'sign' ? '🧏 청각장애인' : '🙋 담당자'}
                                    </div>
                                    <div className="msg-bd">
                                        <span className="msg-ico">
                                            {msg.type === 'sign' ? '🧏' : '🙋'}
                                        </span>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: msg.type === 'voice' ? 'flex-end' : 'flex-start'
                                        }}>
                                            {msg.pose && msg.type === 'sign' && (
                                                <div className="msg-mini">
                                                    <MiniHand pose={msg.pose} size={36} running={false}/>
                                                </div>
                                            )}
                                            <div className="msg-txt">{msg.text}</div>
                                        </div>
                                    </div>
                                    <div className="msg-ft">
                                        <button
                                            className="btn-msg-tts"
                                            onClick={() => speak(msg.text.replace(/\p{Emoji}/gu, '').trim())}
                                        >🔊</button>
                                        <span className="msg-time">{msg.time}</span>
                                    </div>
                                </div>
                            ))
                        }
                        <div ref={chatRef}/>
                    </div>
                </div>
            </div>
        </div>
    )
}