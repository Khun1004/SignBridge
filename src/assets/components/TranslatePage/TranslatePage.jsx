// ══════════════════════════════════════════════════════════════
//  TranslatePage — 3열 레이아웃 (수어 인식 | 3D 아바타 | 텍스트 입력)
//  ✅ MediaRecorder로 카메라 스트림 녹화 — Blob을 ConversationPage로 전달
//  ✅ 대화 종료 시 messages + videoBlob 함께 전달
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

// ── 녹화 시간 포맷 헬퍼 ──────────────────────────────────────
function fmtTime(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0')
    const s = String(sec % 60).padStart(2, '0')
    return `${m}:${s}`
}

// ══════════════════════════════════════════════════════════════
//  메인 컴포넌트
// ══════════════════════════════════════════════════════════════
/**
 * TranslatePage
 * props:
 *   onEndConversation(messages, videoBlob) — 대화 종료 콜백
 *   place   — 'immigration' | 'police' 등
 *   userEmail — 현재 로그인 사용자 이메일 (녹화 업로드 시 사용)
 */
export default function TranslatePage({ onEndConversation, place = 'immigration', userEmail, initialMessages = [], onLoginRequired }) {
    const [mpError,       setMpError]       = useState(null)
    const [cameraOn,      setCameraOn]      = useState(false)
    const [messages,      setMessages]      = useState(initialMessages)
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
    const [showEndConfirm, setShowEndConfirm] = useState(false)  // 종료 확인 모달
    const [liveG,         setLiveG]         = useState(null)
    const [handDet,       setHandDet]       = useState(false)
    const [stabProg,      setStabProg]      = useState(0)
    const [ttsOn,         setTtsOn]         = useState(true)
    const [subTokens,     setSubTokens]     = useState([])
    const [subText,       setSubText]       = useState('')
    const [subLoading,    setSubLoading]    = useState(false)
    const [subHist,       setSubHist]       = useState([])
    const [tmStatus,      setTmStatus]      = useState(TM_ENABLED ? 'loading' : 'off')
    const [engineMode,    setEngineMode]    = useState('tm')  // 'mediapipe' | 'tm' | 'lstm'
    const engineModeRef   = useRef('tm')
    const [tmDebugPreds,  setTmDebugPreds]  = useState([])
    const [tmDebugShow,   setTmDebugShow]   = useState(true)

    // ── 녹화 관련 state ──────────────────────────────────────
    const [isRecording,   setIsRecording]   = useState(false)  // MediaRecorder 녹화 중 여부
    const [recSec,        setRecSec]        = useState(0)      // 녹화 경과 시간(초)
    const [videoBlob,     setVideoBlob]     = useState(null)   // 완성된 녹화 Blob

    const vRef          = useRef(null)
    const cvRef         = useRef(null)
    const handsRef      = useRef(null)
    const rafRef        = useRef(null)
    const recRef        = useRef(null)   // SpeechRecognition
    const chatRef       = useRef(null)
    const taRef         = useRef(null)
    const lastSignRef   = useRef(null)
    const lastTimeRef   = useRef(0)
    const runRef        = useRef(false)
    const msgsRef       = useRef(initialMessages)
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
    const subTextRef      = useRef('')      // canvas 자막용 최신 생성 문장
    const confirmedTextRef = useRef('')   // 대화에 추가된 확정 문장 (canvas와 완전 일치)
    const liveGRef        = useRef(null)  // canvas 자막용 최신 제스처
    const subOpacityRef   = useRef(0)     // 자막 페이드 애니메이션 (0~1)
    const prevSubRef      = useRef('')    // 이전 자막 (변경 감지용)

    // ── 녹화 전용 ref ────────────────────────────────────────
    const mediaRecRef   = useRef(null)   // MediaRecorder 인스턴스
    const recChunksRef  = useRef([])     // 녹화 청크 배열
    const recTimerRef   = useRef(null)   // 초 카운터 interval

    const pushTokRef = useRef(null)
    const confirmSentenceRef = useRef(null)
    const { lstmStatus, lstmGesture, sendLandmarks } = useLSTMSign({
        onGesture: useCallback((name, conf) => {
            if (name && conf >= 0.75) {
                const r = RULES.find(r => r.name === name)
                lstmHitRef.current = r || { name, emoji: '🧠', meaning: name, pose: A2P[name] || 'idle' }
                setTimeout(() => { lstmHitRef.current = null }, 2000)
                // LSTM 모드: 단어를 자막 박스에 쌓기 (자동 flush 없이)
                // 사용자가 전송하기 버튼을 누를 때 문장 완성
                if (engineModeRef.current === 'lstm' && pushTokRef.current) {
                    pushTokRef.current(name)
                }
            }
        }, []),
        onSentence: useCallback((sentence) => {
            if (!sentence) return
            console.log('[LSTM] 문장 수신:', sentence)
            setSubText(sentence)
        }, []),
    })

    useEffect(() => { ttsRef.current = ttsOn }, [ttsOn])
    useEffect(() => { subTextRef.current = subText }, [subText])
    useEffect(() => { liveGRef.current = liveG }, [liveG])
    useEffect(() => { tmStatusRef.current = tmStatus }, [tmStatus])
    useEffect(() => { engineModeRef.current = engineMode }, [engineMode])
    useEffect(() => { chatRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

    // ── TM 로드 — 페이지 진입 즉시 백그라운드 로드 ───────────
    const loadTM = useCallback(async () => {
        if (!TM_ENABLED) return
        if (tmRef.current) return
        if (tmStatusRef.current === 'loading') return
        try {
            setTmStatus('loading')
            if (!window.tmPose) {
                await new Promise((res, rej) => {
                    const s = document.createElement('script')
                    s.src = 'https://cdn.jsdelivr.net/npm/@teachablemachine/pose@0.8/dist/teachablemachine-pose.min.js'
                    s.onload = res; s.onerror = rej
                    document.head.appendChild(s)
                })
            }
            tmRef.current = await window.tmPose.load(
                TM_MODEL_URL + 'model.json',
                TM_MODEL_URL + 'metadata.json'
            )
            setTmStatus('ready')
        } catch (e) {
            console.error('[TM]', e); setTmStatus('error')
        }
    }, [])

    // ── 페이지 마운트 시 TM 즉시 로드 ────────────────────────
    useEffect(() => {
        loadTM()
    }, [loadTM])

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
            // LSTM 모드에서는 자동 flush 안 함 — 사용자가 전송하기 버튼으로 수동 전송
            if (next.length >= MAX_TOKS && engineModeRef.current !== 'lstm') {
                clearTimeout(flushTRef.current)
                setTimeout(() => flushSub([...next]), 0)
            }
            return next
        })
        clearTimeout(flushTRef.current)
        // LSTM 모드에서는 자동 flush 타이머 안 함 — 수동 전송만 사용
        if (engineModeRef.current !== 'lstm') {
            flushTRef.current = setTimeout(() => {
                if (tokRef.current.length > 0) flushSub([...tokRef.current])
            }, FLUSH)
        }
    }, [flushSub])
    useEffect(() => { pushTokRef.current = pushTok }, [pushTok])

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

        const lm  = rightHand || leftHand
        const lm2 = (rightHand && leftHand) ? leftHand : null

        const W = cv.width
        const H = cv.height

        // ── ① 팔 스켈레톤 그리기 ──────────────────────────────
        if (poseLm && poseLm.length >= 17) {
            const ARM_CONNECTIONS = [
                [12, 14], [14, 16],
                [11, 13], [13, 15],
                [11, 12],
            ]
            ctx.save()
            ctx.strokeStyle = 'rgba(150, 200, 255, 0.80)'
            ctx.lineWidth   = 5
            ctx.lineCap     = 'round'
            ctx.lineJoin    = 'round'
            for (const [a, b] of ARM_CONNECTIONS) {
                const pa = poseLm[a], pb = poseLm[b]
                if (!pa || !pb) continue
                if ((pa.visibility ?? 1) < 0.3 || (pb.visibility ?? 1) < 0.3) continue
                ctx.beginPath()
                ctx.moveTo((1 - pa.x) * W, pa.y * H)
                ctx.lineTo((1 - pb.x) * W, pb.y * H)
                ctx.stroke()
            }
            const JOINT_CFG = {
                11: { color: '#60a5fa', r: 7 },
                12: { color: '#60a5fa', r: 7 },
                13: { color: '#34d399', r: 7 },
                14: { color: '#34d399', r: 7 },
                15: { color: '#f9a8d4', r: 6 },
                16: { color: '#f9a8d4', r: 6 },
            }
            for (const [idxStr, cfg] of Object.entries(JOINT_CFG)) {
                const i = Number(idxStr)
                const p = poseLm[i]
                if (!p || (p.visibility ?? 1) < 0.3) continue
                const x = (1 - p.x) * W
                const y = p.y * H
                ctx.beginPath()
                ctx.arc(x, y, cfg.r + 2, 0, Math.PI * 2)
                ctx.fillStyle = 'rgba(0,0,0,0.55)'
                ctx.fill()
                ctx.beginPath()
                ctx.arc(x, y, cfg.r, 0, Math.PI * 2)
                ctx.fillStyle = cfg.color
                ctx.fill()
            }
            ctx.restore()
        }

        if (lm) {
            setHandDet(true)
            sendLandmarks(lm)

            // ── ② 손 랜드마크 그리기 ────────────────────────────
            const HAND_CONNECTIONS = [
                [0,1],[1,2],[2,3],[3,4],
                [0,5],[5,6],[6,7],[7,8],
                [0,9],[9,10],[10,11],[11,12],
                [0,13],[13,14],[14,15],[15,16],
                [0,17],[17,18],[18,19],[19,20],
                [5,9],[9,13],[13,17],
            ]
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

            if (engineModeRef.current === 'lstm') {
                // LSTM 전용 모드 — server.py의 인식 결과를 직접 사용
                motionRef.current.push(lm, lm2, poseLm)
                if (lstmHitRef.current) {
                    hit = lstmHitRef.current
                }
            } else if (engineModeRef.current === 'mediapipe') {
                motionRef.current.push(lm, lm2, poseLm)
                hit = classify(lm, motionRef.current)
            } else {
                motionRef.current.push(lm, lm2, poseLm)

                if (tmRef.current && tmStatusRef.current === 'ready') {
                    const now = Date.now()
                    if (!tmRef.current._lastCall || now - tmRef.current._lastCall > 200) {
                        tmRef.current._lastCall = now
                        tmRef.current.estimatePose(cvRef.current)
                            .then(({ posenetOutput }) => tmRef.current.predict(posenetOutput))
                            .then(preds => {
                                if (!preds?.length) return
                                const best = preds.reduce((a, b) =>
                                    a.probability > b.probability ? a : b)
                                setTmDebugPreds(preds.map(p => ({ name: p.className, prob: p.probability })))
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
                }

                const tmReady = tmRef.current && tmStatusRef.current === 'ready'
                const tmFresh = tmResultRef.current &&
                    (Date.now() - (tmResultRef.current.ts || 0)) < 1500
                if (tmFresh) {
                    const tmName = tmResultRef.current.name
                    const r = RULES.find(r => r.name === tmName)
                    hit = r || {
                        name:    tmName,
                        emoji:   '🤖',
                        meaning: tmName,
                        pose:    A2P[tmName] || 'idle',
                    }
                    motionRef.current._helloPhase  = 0
                    motionRef.current._sorryPhase  = 0
                    motionRef.current._greetFrames = 0
                } else if (!tmReady) {
                    hit = classify(lm, motionRef.current)
                } else {
                    if (tmResultRef.current) tmResultRef.current = null
                    motionRef.current._helloPhase  = 0
                    motionRef.current._sorryPhase  = 0
                    motionRef.current._greetFrames = 0
                    hit = null
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

        // ══════════════════════════════════════════════════════
        //  ③ Canvas 자막 오버레이 — 녹화 영상에 수어 뜻이 포함됨
        // ══════════════════════════════════════════════════════
        // ── 자막 텍스트 결정 (우선순위) ─────────────────────────
        // 1순위: 확정된 문장 (confirmSentence에서 설정 — 대화 기록과 100% 일치)
        // 2순위: AI 생성 중인 문장 (subText)
        // 3순위: 현재 인식 중인 제스처명
        const confirmed   = confirmedTextRef.current
        const generating  = subTextRef.current
        const gesture     = liveGRef.current
        const displayText = confirmed
            || generating
            || (gesture ? `${gesture.emoji || ''} ${gesture.name}` : '')

        // ── 페이드 인/아웃: 자막 등장/소멸 부드럽게 ──────────
        // prevSubRef: 마지막으로 표시된 텍스트 (페이드 아웃 중에도 보여줌)
        if (displayText && displayText !== prevSubRef.current) {
            prevSubRef.current = displayText
        }
        if (displayText) {
            subOpacityRef.current = Math.min(1, subOpacityRef.current + 0.12)
        } else {
            subOpacityRef.current = Math.max(0, subOpacityRef.current - 0.08)
        }

        if (subOpacityRef.current > 0) {
            const op     = subOpacityRef.current
            const barH   = 54
            const barY   = H - barH
            const pad    = 16
            const showTxt = displayText || prevSubRef.current

            ctx.save()
            ctx.globalAlpha = op

            // 반투명 그라디언트 배경
            const grad = ctx.createLinearGradient(0, barY - 16, 0, H)
            grad.addColorStop(0, 'rgba(0,0,0,0)')
            grad.addColorStop(0.3, `rgba(0,0,0,${0.72 * op})`)
            grad.addColorStop(1, `rgba(0,0,0,${0.72 * op})`)
            ctx.fillStyle = grad
            ctx.fillRect(0, barY - 16, W, barH + 16)

            // 왼쪽 — 🧏 아이콘
            ctx.globalAlpha = op
            ctx.font = '20px sans-serif'
            ctx.textBaseline = 'middle'
            ctx.fillText('🧏', pad, barY + barH / 2)

            // 가운데 — 수어 텍스트 (흰색 + 그림자)
            ctx.shadowColor   = 'rgba(0,0,0,0.8)'
            ctx.shadowBlur    = 6
            ctx.shadowOffsetX = 1
            ctx.shadowOffsetY = 1
            ctx.fillStyle     = '#ffffff'
            ctx.font          = 'bold 21px "Pretendard", "Noto Sans KR", sans-serif'
            ctx.textAlign     = 'center'
            ctx.textBaseline  = 'middle'

            // 긴 텍스트 말줄임 (최대 W - 130px)
            const maxW = W - 130
            let   txt  = showTxt
            if (ctx.measureText(txt).width > maxW) {
                while (ctx.measureText(txt + '…').width > maxW && txt.length > 0)
                    txt = txt.slice(0, -1)
                txt += '…'
            }
            ctx.fillText(txt, W / 2, barY + barH / 2)

            // 오른쪽 — SignBridge 워터마크
            ctx.shadowBlur    = 0
            ctx.fillStyle     = 'rgba(255,255,255,0.4)'
            ctx.font          = '11px "Pretendard", sans-serif'
            ctx.textAlign     = 'right'
            ctx.textBaseline  = 'middle'
            ctx.fillText('SignBridge', W - pad, barY + barH / 2)

            ctx.restore()
        }
    }, [pushTok, sendLandmarks])

    // ══════════════════════════════════════════════════════════
    //  녹화 시작 — canvas 스트림 캡처
    // ══════════════════════════════════════════════════════════
    const startRecording = useCallback((stream) => {
        if (mediaRecRef.current) return  // 이미 녹화 중

        // canvas 스트림 (랜드마크 오버레이 포함) + 오디오 트랙(있으면) 합성
        const canvasStream = cvRef.current?.captureStream(30) || new MediaStream()
        const audioTracks  = stream?.getAudioTracks() || []
        audioTracks.forEach(t => canvasStream.addTrack(t))

        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : MediaRecorder.isTypeSupported('video/webm')
                ? 'video/webm'
                : 'video/mp4'

        recChunksRef.current = []
        const mr = new MediaRecorder(canvasStream, { mimeType })
        mr.ondataavailable = e => {
            if (e.data && e.data.size > 0) recChunksRef.current.push(e.data)
        }
        mr.onstop = () => {
            const blob = new Blob(recChunksRef.current, { type: mimeType })
            setVideoBlob(blob)
            recChunksRef.current = []
        }
        mr.start(500)  // 500ms 단위로 청크 수집
        mediaRecRef.current = mr

        // 초 카운터
        setRecSec(0)
        recTimerRef.current = setInterval(() => {
            setRecSec(s => s + 1)
        }, 1000)

        setIsRecording(true)
    }, [])

    // ══════════════════════════════════════════════════════════
    //  녹화 중지
    // ══════════════════════════════════════════════════════════
    const stopRecording = useCallback(() => {
        if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
            mediaRecRef.current.stop()
        }
        mediaRecRef.current = null
        clearInterval(recTimerRef.current)
        recTimerRef.current = null
        setIsRecording(false)
    }, [])

    // ── 카메라 시작 ───────────────────────────────────────────
    const init = async () => {
        setMpError(null)
        try {
            await Promise.all([loadMP(), loadTM()])
            if (handsRef.current) {
                try { handsRef.current.close() } catch (_) {}
                handsRef.current = null
            }
            const holistic = new window.Holistic({
                locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${f}`
            })
            holistic.setOptions({
                modelComplexity: 0,
                smoothLandmarks: true,
                enableSegmentation: false,
                refineFaceLandmarks: false,
                minDetectionConfidence: 0.6,
                minTrackingConfidence: 0.5,
            })
            holistic.onResults(onResults)
            handsRef.current = holistic

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            })
            vRef.current.srcObject = stream
            await vRef.current.play()
            runRef.current = true
            setCameraOn(true)
            setShowStopWarn(false)
            dtwRef.current.reset()

            // ── 녹화 자동 시작 ──────────────────────────────────
            startRecording(stream)

            // ── 이중 send 방지 + 프레임 스로틀 ──────────────────
            let sending   = false
            let frameSkip = 0
            const loop = () => {
                if (!runRef.current) return
                rafRef.current = requestAnimationFrame(loop)
                if (sending) return
                frameSkip++
                if (frameSkip < 2) return
                frameSkip = 0
                if (vRef.current?.readyState >= 2 && handsRef.current) {
                    sending = true
                    handsRef.current.send({ image: vRef.current })
                        .catch(() => {})
                        .finally(() => { sending = false })
                }
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

        // 녹화 중지
        stopRecording()

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

        // ── canvas 자막과 대화 기록을 완전히 동일한 텍스트로 확정 ──
        confirmedTextRef.current = sentence   // canvas에 이 텍스트가 표시됨
        addMsg('sign', sentence, null)        // 대화 기록에도 동일 텍스트 추가

        const t = new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        })
        setSubHist(p => [...p.slice(-9), { text: sentence, time: t }])
        if (ttsRef.current) speak(sentence)

        // 3초 후 canvas 자막 클리어 (영상에서 잠시 보이다가 사라짐)
        setTimeout(() => {
            confirmedTextRef.current = ''
        }, 3000)

        setSubText(''); setSubTokens([]); tokRef.current = []
        prevSentRef.current = ''
        clearTimeout(flushTRef.current)
    }, [])
    useEffect(() => { confirmSentenceRef.current = confirmSentence }, [confirmSentence])

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

    // ── 대화 종료 버튼 클릭 ──────────────────────────────────
    const handleEnd = () => {
        // ① 카메라가 켜져 있으면 Stop 먼저 요구
        if (cameraOn) { setShowStopWarn(true); return }
        // ② Stop 완료 → 종료 확인 모달 표시
        setShowEndConfirm(true)
    }

    // ── 종료 확인 "네" → 실제 종료 실행 ─────────────────────
    const handleEndConfirmed = () => {
        setShowEndConfirm(false)
        try { recRef.current?.stop() } catch (_) {}

        if (videoBlob) {
            onEndConversation?.(msgsRef.current, videoBlob)
        } else if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
            const mr       = mediaRecRef.current
            const chunks   = recChunksRef.current
            const mimeType = mr.mimeType || 'video/webm'
            mr.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType })
                recChunksRef.current = []
                mediaRecRef.current  = null
                clearInterval(recTimerRef.current)
                setIsRecording(false)
                setVideoBlob(blob)
                onEndConversation?.(msgsRef.current, blob)
            }
            mr.stop()
        } else {
            onEndConversation?.(msgsRef.current, null)
        }
    }

    // ── 클린업 ───────────────────────────────────────────────
    useEffect(() => () => {
        runRef.current = false
        cancelAnimationFrame(rafRef.current)
        clearTimeout(flushTRef.current)
        clearInterval(recTimerRef.current)
        if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
            try { mediaRecRef.current.stop() } catch (_) {}
        }
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
            {/* ── Stop 먼저 경고 ── */}
            {showStopWarn && (
                <div className="stop-warn">
                    ⚠️ 카메라가 켜져 있습니다. 먼저 <strong>⏹ Stop</strong>을 눌러 녹화를 중지해 주세요.
                    <button onClick={() => setShowStopWarn(false)}>✕</button>
                </div>
            )}

            {/* ── 종료 확인 모달 ── */}
            {showEndConfirm && (
                <div className="end-confirm-overlay" onClick={() => setShowEndConfirm(false)}>
                    <div className="end-confirm-modal" onClick={e => e.stopPropagation()}>
                        <div className="end-confirm-icon">⚠️</div>
                        <h3 className="end-confirm-title">대화를 종료하시겠습니까?</h3>
                        <p className="end-confirm-desc">
                            종료하면 대화 내용을 다시 수정할 수 없습니다.<br />
                            정말로 종료하시겠습니까?
                        </p>
                        <div className="end-confirm-actions">
                            <button
                                className="end-confirm-btn end-confirm-cancel"
                                onClick={() => setShowEndConfirm(false)}
                            >
                                아니요, 계속하기
                            </button>
                            <button
                                className="end-confirm-btn end-confirm-ok"
                                onClick={handleEndConfirmed}
                            >
                                네, 종료합니다
                            </button>
                        </div>
                    </div>
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
                        title="TM 우선 + MediaPipe 보조 (권장)"
                        disabled={!TM_ENABLED || tmStatus === 'error'}
                    >
                        🤖 TM
                        {tmStatus === 'loading' && <span className="engine-btn-loading"> ...</span>}
                        {tmStatus === 'ready'   && <span className="engine-btn-ready"> ✓</span>}
                        {tmStatus === 'error'   && <span className="engine-btn-err"> ✕</span>}
                    </button>
                    <button
                        className={`engine-btn ${engineMode === 'lstm' ? 'engine-btn-on' : ''}`}
                        onClick={() => {
                            setEngineMode('lstm')
                            tmResultRef.current = null
                            stabCnt.current = 0
                        }}
                        title="LSTM 전용 모드 — 더 많은 단어 인식 (server.py 실행 필요)"
                        disabled={lstmStatus !== 'ready'}
                    >
                        🧠 LSTM
                        {lstmStatus === 'ready'       && <span className="engine-btn-ready"> ✓</span>}
                        {lstmStatus === 'connecting'  && <span className="engine-btn-loading"> ...</span>}
                        {lstmStatus === 'unavailable' && <span className="engine-btn-err"> 🚫</span>}
                    </button>
                </div>

                <label className="tts-toggle">
                    <input type="checkbox" checked={ttsOn} onChange={e => setTtsOn(e.target.checked)}/>
                    <span className="tts-slider"/>
                    <span>🔊 수어 읽기</span>
                </label>

                {/* ── 녹화 상태 배지 ── */}
                {isRecording && (
                    <div className="rec-status-badge">
                        <span className="rec-dot-anim"/>
                        🔴 REC {fmtTime(recSec)}
                    </div>
                )}
                {!isRecording && videoBlob && (
                    <div className="rec-saved-badge">
                        ✅ 녹화 저장됨
                    </div>
                )}

                <div className="top-bar-r">
                    <span className="end-hint">종료 전 Stop 먼저</span>
                    <button className="btn-end" onClick={() => {
                        if (!userEmail) {
                            if (window.confirm('대화를 저장하려면 로그인이 필요합니다.\n로그인 하시겠습니까?')) {
                                onLoginRequired?.()
                            }
                            return
                        }
                        handleEnd()
                    }}>대화 종료 →</button>
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
                            {cameraOn && (
                                <span className="badge-rec">
                                    ● REC
                                    {isRecording && (
                                        <span className="badge-rec-time"> {fmtTime(recSec)}</span>
                                    )}
                                </span>
                            )}
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
                                        {videoBlob ? (
                                            <>
                                                <span>🎬</span>
                                                <p>녹화 완료<br/>대화를 종료하면<br/>영상을 확인할 수 있어요</p>
                                            </>
                                        ) : (
                                            <>
                                                <span>🤟</span>
                                                <p>▶ Start를 눌러<br/>카메라를 시작하세요</p>
                                            </>
                                        )}
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

                            {/* ── TM debug panel ── */}
                            {cameraOn && tmDebugShow && tmDebugPreds.length > 0 && (
                                <div style={{ background: 'rgba(0,0,0,0.85)', borderRadius: 8, padding: '8px 12px', margin: '6px 0', fontSize: 12, color: '#fff', fontFamily: 'monospace' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ color: '#facc15', fontWeight: 'bold' }}>🔮 TM 실시간 진단</span>
                                        <button onClick={() => setTmDebugShow(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>✕</button>
                                    </div>
                                    {[...tmDebugPreds].sort((a,b)=>b.prob-a.prob).map((p,i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                            <span style={{ width: 130, color: p.prob >= TM_THRESHOLD ? '#4ade80' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                                            <div style={{ flex: 1, height: 6, background: '#334155', borderRadius: 3 }}>
                                                <div style={{ width: `${(p.prob*100).toFixed(0)}%`, height: '100%', background: p.prob >= TM_THRESHOLD ? '#4ade80' : p.prob > 0.4 ? '#facc15' : '#475569', borderRadius: 3 }}/>
                                            </div>
                                            <span style={{ width: 36, textAlign: 'right', color: p.prob >= TM_THRESHOLD ? '#4ade80' : '#64748b' }}>{(p.prob*100).toFixed(0)}%</span>
                                        </div>
                                    ))}
                                    <div style={{ color: '#475569', fontSize: 10, marginTop: 4 }}>임계값 {(TM_THRESHOLD*100).toFixed(0)}% | 녹색=인식 확정</div>
                                </div>
                            )}

                            {/* ── 엔진 상태 표시 ── */}
                            <div className="engine-status-bar">
                                {/* TM: loading=⏳ ready=✅ error/off=❌ */}
                                <span className={`engine-badge ${
                                    tmStatus === 'ready'   ? 'on'      :
                                        tmStatus === 'loading' ? 'loading' : 'off'
                                }`}>
                                    TM&nbsp;
                                    {tmStatus === 'ready'   && '✅'}
                                    {tmStatus === 'loading' && '⏳'}
                                    {(tmStatus === 'error' || tmStatus === 'off') && '❌'}
                                </span>

                                {/* LSTM: connecting=⏳ ready=✅ unavailable=서버없음(회색) disconnected/error=❌ */}
                                <span className={`engine-badge ${
                                    lstmStatus === 'ready'       ? 'on'          :
                                        lstmStatus === 'connecting'  ? 'loading'     :
                                            lstmStatus === 'unavailable' ? 'unavailable' : 'off'
                                }`}>
                                    LSTM&nbsp;
                                    {lstmStatus === 'ready'       && '✅'}
                                    {lstmStatus === 'connecting'  && '⏳'}
                                    {lstmStatus === 'unavailable' && '🚫'}
                                    {(lstmStatus === 'disconnected' || lstmStatus === 'error') && '❌'}
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
                                currentWord={liveG?.name || ''}
                                currentConf={liveG?.conf || 0}
                                onAccept={() => {
                                    setLiveG(null)
                                    liveGRef.current = null
                                }}
                                onFlush={async (words, callback) => {
                                    // words 배열을 받아서 AI로 문장 생성
                                    try {
                                        const { buildSubtitle } = await import('./translateApis.js')
                                        const sentence = await buildSubtitle(words, place)
                                        callback?.(sentence || words.join(' '))
                                    } catch {
                                        callback?.(words.join(' '))
                                    }
                                }}
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

                {/* ── 가운데: 대화 기록 ── */}
                <div className="col col-center">
                    <div className="card" style={{height:'100%',display:'flex',flexDirection:'column'}}>
                        <div className="card-hd">
                            💬 대화 기록
                            {messages.length > 0 && (
                                <span style={{marginLeft:8,fontSize:12,fontWeight:600,color:'#888'}}>
                                    {messages.length}개
                                </span>
                            )}
                        </div>
                        <div className="card-bd chat-log-inner">
                            {messages.length === 0 ? (
                                <div className="chat-empty">
                                    <span>💬</span>
                                    <p>수어 또는 텍스트로 대화를 시작하세요</p>
                                </div>
                            ) : messages.map(msg => (
                                <div key={msg.id} className={`msg msg-${msg.type}`}>
                                    <div className="msg-nm">
                                        {msg.type === 'sign' ? '🧏 청각장애인' : '🙋 담당자'}
                                    </div>
                                    <div className="msg-bd">
                                        <span className="msg-ico">
                                            {msg.type === 'sign' ? '🧏' : '🙋'}
                                        </span>
                                        <div style={{display:'flex',flexDirection:'column',
                                            alignItems:msg.type==='voice'?'flex-end':'flex-start'}}>
                                            {msg.pose && msg.type === 'sign' && (
                                                <div className="msg-mini">
                                                    <MiniHand pose={msg.pose} size={36} running={false}/>
                                                </div>
                                            )}
                                            <div className={`bubble bubble-${msg.type}`}>
                                                {msg.text}
                                            </div>
                                            <span className="msg-time">{msg.time}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatRef}/>
                        </div>
                    </div>
                </div>

                {/* ── 우측: 위=텍스트 입력, 아래=아바타 ── */}
                <div className="col col-right" style={{display:'flex',flexDirection:'column',gap:12}}>
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

                    {/* ── 아바타 (텍스트 입력 아래) ── */}
                    <div className="card" style={{flex:1}}>
                        <div className="card-hd">
                            🤟 3D 아바타
                            <span className="avatar-center-badge">AI · 수어 시연</span>
                        </div>
                        <div className="card-bd" style={{padding:0}}>
                            <AIPanel
                                guide={aiGuide}
                                loading={aiLoading}
                                playing={avatarPlaying}
                            />
                        </div>
                    </div>
                </div>

            </div>

            {/* ── 하단 대화 기록 제거됨 (가운데 열로 이동) ── */}
            <div className="card chat-row-card" style={{display:'none'}}>
                <div className="card-hd">
                    💬 대화 기록
                    {messages.length > 0 && (
                        <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: '#888' }}>
                            {messages.length}개 메시지
                        </span>
                    )}
                </div>
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