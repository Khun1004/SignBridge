import { useEffect, useRef, useState, useCallback } from 'react'
import './TranslatePage.css'
import useLSTMSign from '../../ai/Uselstmsign.js'
import { translateApi } from '../../../assets/components/api/api.jsx'

// ══════════════════════════════════════════════════════════════
//  ❶ Teachable Machine 설정
// ══════════════════════════════════════════════════════════════
const TM_MODEL_URL = 'https://teachablemachine.withgoogle.com/models/3B70MNM8c/'
const TM_THRESHOLD = 0.80
const TM_ENABLED   = !TM_MODEL_URL.includes('3B70MNM8c')

// ══════════════════════════════════════════════════════════════
//  ❷ 장소 라벨 매핑
// ══════════════════════════════════════════════════════════════
const PLACE_LABEL = {
    personal:    '개인 사용자',
    immigration: '출입국관리소',
    airport:     '공항',
    hospital:    '병원',
    police:      '경찰서',
}

// ══════════════════════════════════════════════════════════════
//  ❸ API 호출
// ══════════════════════════════════════════════════════════════
async function buildSubtitle(words, place = 'immigration', prevSentence = '') {
    if (!words.length) return null
    try {
        const d = await translateApi.buildSubtitle(words, place, prevSentence)
        return d.sentence || null
    } catch (e) {
        return words.join(' ') + '.'
    }
}

async function fetchSignGuide(text) {
    try {
        return await translateApi.getSignGuide(text)
    } catch (e) {
        return null
    }
}

// ══════════════════════════════════════════════════════════════
//  ❹ DTW 엔진
// ══════════════════════════════════════════════════════════════
function normalizeLandmarks(lm) {
    const w = lm[0], m = lm[9]
    const s = Math.sqrt((m.x - w.x) ** 2 + (m.y - w.y) ** 2) || 1
    return lm.map(p => [(p.x - w.x) / s, (p.y - w.y) / s, (p.z - w.z) / s])
}

const KP = [4, 8, 12, 16, 20, 5, 9, 13]

function frameDist(a, b) {
    let s = 0
    for (const i of KP)
        s += (a[i][0] - b[i][0]) ** 2 + (a[i][1] - b[i][1]) ** 2 + (a[i][2] - b[i][2]) ** 2
    return Math.sqrt(s / KP.length)
}

function dtwDist(A, B) {
    const n = A.length, m = B.length
    if (!n || !m) return Infinity
    const w = Math.max(3, Math.abs(n - m)), I = 1e9
    const dp = Array.from({ length: n }, () => new Float32Array(m).fill(I))
    dp[0][0] = frameDist(A[0], B[0])
    for (let i = 1; i < n; i++) {
        const j0 = Math.max(0, i - w), j1 = Math.min(m - 1, i + w)
        for (let j = j0; j <= j1; j++) {
            const c = frameDist(A[i], B[j])
            const p = Math.min(
                j > 0 && dp[i][j - 1] < I ? dp[i][j - 1] : I,
                i > 0 && dp[i - 1][j] < I ? dp[i - 1][j] : I,
                i > 0 && j > 0 && dp[i - 1][j - 1] < I ? dp[i - 1][j - 1] : I,
            )
            dp[i][j] = c + (p === I ? 0 : p)
        }
    }
    return dp[n - 1][m - 1] / (n + m)
}

const DTW_WIN = 40, DTW_TH = 0.28, SEQ_MIN = 12

class DTWRec {
    constructor() { this.buf = []; this.tpl = {} }
    push(lm) {
        this.buf.push(normalizeLandmarks(lm))
        if (this.buf.length > DTW_WIN) this.buf.shift()
    }
    recognize() {
        if (this.buf.length < SEQ_MIN) return null
        let best = null, bd = DTW_TH
        for (const [n, t] of Object.entries(this.tpl)) {
            const d = dtwDist(this.buf, t)
            if (d < bd) { bd = d; best = n }
        }
        return best ? { name: best, score: bd } : null
    }
    learn(name) {
        if (this.buf.length >= SEQ_MIN) this.tpl[name] = [...this.buf]
    }
    reset() { this.buf = [] }
}

// ══════════════════════════════════════════════════════════════
//  ❺ Rule-based 제스처
// ══════════════════════════════════════════════════════════════
const d2 = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
const fsc = (lm, t, p) => ({ up: lm[p].y - lm[t].y > 0.02, yd: lm[p].y - lm[t].y })
const tsc = (lm) => ({ up: lm[3].y - lm[4].y > 0.01, yd: lm[3].y - lm[4].y })
const isOK   = (lm) => d2(lm[4], lm[8]) < 0.06 && fsc(lm, 12, 10).up && fsc(lm, 16, 14).up && fsc(lm, 20, 18).up
const isOpen = (lm) => [fsc(lm, 8, 6), fsc(lm, 12, 10), fsc(lm, 16, 14), fsc(lm, 20, 18)].every(f => f.up) && tsc(lm).up && d2(lm[5], lm[17]) > 0.15
const isFist = (lm) => [fsc(lm, 8, 6), fsc(lm, 12, 10), fsc(lm, 16, 14), fsc(lm, 20, 18)].every(f => !f.up && f.yd < 0)
const fu = (lm, t, p) => fsc(lm, t, p).up

const RULES = [
    { name: '안녕하세요',    emoji: '👋', meaning: '손을 펼쳐 가볍게 흔드는 인사 동작',     pose: 'wave',      chk: isOpen },
    { name: '괜찮아요',      emoji: '👍', meaning: '엄지손가락을 위로 세우는 동작',          pose: 'thumbUp',   chk: lm => tsc(lm).up && !fu(lm, 8, 6) && !fu(lm, 12, 10) && !fu(lm, 16, 14) && !fu(lm, 20, 18) },
    { name: '싫어요/아니요', emoji: '👎', meaning: '엄지손가락을 아래로 내리는 동작',        pose: 'thumbDown', chk: lm => !tsc(lm).up && tsc(lm).yd < -0.04 && !fu(lm, 8, 6) && !fu(lm, 12, 10) && !fu(lm, 16, 14) && !fu(lm, 20, 18) },
    { name: '맞아요/좋아요', emoji: '✌️', meaning: '검지·중지를 V자로 펼치는 동작',          pose: 'peace',     chk: lm => fu(lm, 8, 6) && fu(lm, 12, 10) && !fu(lm, 16, 14) && !fu(lm, 20, 18) },
    { name: 'OK/알겠어요',   emoji: '👌', meaning: '엄지·검지 끝을 붙여 원을 만드는 동작',   pose: 'ok',        chk: isOK },
    { name: '가리키기',      emoji: '☝️', meaning: '검지만 펴서 위를 가리키는 동작',          pose: 'point',     chk: lm => fu(lm, 8, 6) && !fu(lm, 12, 10) && !fu(lm, 16, 14) && !fu(lm, 20, 18) },
    { name: '사랑해요',      emoji: '🤟', meaning: '엄지·검지·새끼를 펴는 ILY 동작',         pose: 'love',      chk: lm => tsc(lm).up && fu(lm, 8, 6) && !fu(lm, 12, 10) && !fu(lm, 16, 14) && fu(lm, 20, 18) },
    { name: '잠깐만요',      emoji: '✋', meaning: '손바닥 전체를 앞으로 펼치는 동작',        pose: 'stop',      chk: lm => !tsc(lm).up && fu(lm, 8, 6) && fu(lm, 12, 10) && fu(lm, 16, 14) && fu(lm, 20, 18) },
    { name: '전화해요',      emoji: '🤙', meaning: '엄지·새끼를 펴고 귀에 대는 동작',        pose: 'call',      chk: lm => tsc(lm).up && !fu(lm, 8, 6) && !fu(lm, 12, 10) && !fu(lm, 16, 14) && fu(lm, 20, 18) },
    { name: '주먹/힘내요',   emoji: '✊', meaning: '손을 꽉 쥔 주먹 동작',                   pose: 'fist',      chk: isFist },
]

const classify = lm => {
    if (!lm || lm.length < 21) return null
    for (const r of RULES) if (r.chk(lm)) return r
    return null
}

// ══════════════════════════════════════════════════════════════
//  ❻ 3중 투표
// ══════════════════════════════════════════════════════════════
function vote({ ruleName, dtwResult, lstmName, lstmConf, tmName, tmProb }) {
    const sc = {}
    const add = (n, w) => { if (n) sc[n] = (sc[n] || 0) + w }
    add(ruleName, 1.0)
    add(dtwResult?.name, 1.5)
    if (lstmName && lstmConf >= 0.75) add(lstmName, lstmConf * 3.0)
    if (tmName && tmProb >= TM_THRESHOLD) add(tmName, 2.5)
    const e = Object.entries(sc)
    if (!e.length) return null
    const [name, score] = e.sort((a, b) => b[1] - a[1])[0]
    return {
        name, score,
        sources: [
            ruleName && 'Rule',
            dtwResult?.name && 'DTW',
            lstmName && lstmConf >= 0.75 && 'LSTM',
            tmName && tmProb >= TM_THRESHOLD && 'TM',
        ].filter(Boolean),
    }
}

// ══════════════════════════════════════════════════════════════
//  ❼ 상수
// ══════════════════════════════════════════════════════════════
const STABLE   = 15
const COOLDOWN = 2000
const FLUSH    = 10000
const MAX_TOKS = 20

// ══════════════════════════════════════════════════════════════
//  ❽ animType 매핑 (16종)
// ══════════════════════════════════════════════════════════════
const A2P = {
    wave: 'wave', thumbUp: 'thumbUp', thumbDown: 'thumbDown',
    peace: 'peace', ok: 'ok', point: 'point',
    love: 'love', stop: 'stop', call: 'call', fist: 'fist',
    open: 'open', number: 'number', flat: 'flat',
    cup: 'cup', pinch: 'pinch', cross: 'cross',
}

// ══════════════════════════════════════════════════════════════
//  ❾ POSE_CFG — 색상·라벨 (AIPanel 말풍선·칩용)
// ══════════════════════════════════════════════════════════════
const POSE_CFG = {
    idle:      { c: '#7c6fff', l: '' },
    wave:      { c: '#7c6fff', l: '안녕하세요!' },
    thumbUp:   { c: '#f59e0b', l: '좋아요!' },
    thumbDown: { c: '#ef4444', l: '싫어요' },
    peace:     { c: '#10b981', l: 'V! 좋아요' },
    ok:        { c: '#8b5cf6', l: 'OK!' },
    point:     { c: '#06b6d4', l: '저기요!' },
    love:      { c: '#e11d48', l: '사랑해요♥' },
    stop:      { c: '#0ea5e9', l: '잠깐만요!' },
    call:      { c: '#0ea5e9', l: '전화해요!' },
    fist:      { c: '#ef4444', l: '힘내요!' },
    open:      { c: '#22c55e', l: '펼치세요' },
    number:    { c: '#f97316', l: '숫자!' },
    flat:      { c: '#64748b', l: '수평으로' },
    cup:       { c: '#a855f7', l: '오목하게' },
    pinch:     { c: '#ec4899', l: '집기' },
    cross:     { c: '#14b8a6', l: '교차!' },
}

// ══════════════════════════════════════════════════════════════
//  ❿ HandSVG (16종 손 모양)
// ══════════════════════════════════════════════════════════════
function HandSVG({ type: t, color: c }) {
    if (t === 'open') return (
        <g>
            <ellipse cx="0" cy="3" rx="11" ry="9" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5"/>
            {[[-7,-2,-7,-17],[-3,-1,-3,-20],[1,-1,1,-20],[5,-1,5,-17],[8,2,13,-5]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
        </g>
    )
    if (t === 'thumbUp') return (
        <g>
            <ellipse cx="0" cy="5" rx="10" ry="8" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5"/>
            {[[-4,1,-4,9],[-1,1,-1,9],[2,1,2,9],[5,1,5,9]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
            <line x1="-8" y1="2" x2="-15" y2="-11" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
            <circle cx="-15" cy="-11" r="2.8" fill={c}/>
        </g>
    )
    if (t === 'thumbDown') return (
        <g>
            <ellipse cx="0" cy="-4" rx="10" ry="8" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5"/>
            {[[-4,-2,-4,-10],[-1,-2,-1,-10],[2,-2,2,-10],[5,-2,5,-10]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
            <line x1="-8" y1="-2" x2="-15" y2="10" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
            <circle cx="-15" cy="10" r="2.8" fill={c}/>
        </g>
    )
    if (t === 'peace') return (
        <g>
            <ellipse cx="0" cy="3" rx="11" ry="9" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5"/>
            <line x1="-5" y1="-1" x2="-5" y2="-19" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
            <line x1="-1" y1="-1" x2="-1" y2="-21" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
            {[[3,-1,3,6],[7,-1,7,5]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
            <line x1="-9" y1="2" x2="-13" y2="8" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
        </g>
    )
    if (t === 'ok') return (
        <g>
            <ellipse cx="0" cy="3" rx="11" ry="9" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5"/>
            <circle cx="-8" cy="-8" r="6" fill="none" stroke={c} strokeWidth="2.5"/>
            {[[1,0,1,-17],[5,0,5,-19],[9,0,9,-15]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
        </g>
    )
    if (t === 'point') return (
        <g>
            <ellipse cx="0" cy="3" rx="10" ry="8" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5"/>
            <line x1="-4" y1="-1" x2="-4" y2="-21" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
            <circle cx="-4" cy="-21" r="3.5" fill={c}/>
            {[[0,-1,0,6],[4,-1,4,5],[7,-1,7,4]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
            <line x1="-8" y1="2" x2="-12" y2="8" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
        </g>
    )
    if (t === 'love') return (
        <g>
            <ellipse cx="0" cy="3" rx="12" ry="9" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5"/>
            <line x1="-6" y1="-1" x2="-6" y2="-19" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
            {[[-1,-1,-1,6],[3,-1,3,5]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
            <line x1="7" y1="-1" x2="7" y2="-17" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
            <line x1="-10" y1="2" x2="-15" y2="-11" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
        </g>
    )
    if (t === 'stop') return (
        <g>
            <ellipse cx="0" cy="3" rx="11" ry="9" fill={c} opacity="0.35" stroke={c} strokeWidth="2"/>
            {[[-7,-2,-7,-18],[-3,-1,-3,-21],[1,-1,1,-21],[5,-1,5,-18],[8,2,13,-5]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
            <line x1="-10" y1="5" x2="14" y2="5" stroke={c} strokeWidth="2" strokeOpacity="0.5"/>
        </g>
    )
    if (t === 'call') return (
        <g>
            <ellipse cx="0" cy="3" rx="10" ry="8" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5"/>
            {[[-1,-1,-1,6],[3,-1,3,5],[-3,-1,-3,5]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
            <line x1="-7" y1="-1" x2="-7" y2="-17" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
            <line x1="6" y1="-1" x2="6" y2="-15" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
        </g>
    )
    if (t === 'fist') return (
        <g>
            <ellipse cx="0" cy="2" rx="12" ry="10" fill={c} opacity="0.4" stroke={c} strokeWidth="2"/>
            <rect x="-10" y="-3" width="20" height="10" rx="5" fill={c} opacity="0.5"/>
        </g>
    )
    if (t === 'number') return (
        <g>
            <ellipse cx="0" cy="4" rx="10" ry="8" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5"/>
            <line x1="-2" y1="0" x2="-2" y2="-22" stroke={c} strokeWidth="5" strokeLinecap="round"/>
            <circle cx="-2" cy="-22" r="4" fill={c}/>
            {[[-6,0,-6,8],[2,0,2,8],[6,0,6,7]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
            <line x1="-9" y1="2" x2="-14" y2="9" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
        </g>
    )
    if (t === 'flat') return (
        <g>
            <ellipse cx="0" cy="0" rx="14" ry="7" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5"/>
            {[[-9,-2,-20,-2],[-4,-3,-4,-14],[0,-3,0,-16],[4,-3,4,-14],[8,-2,8,-12]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
        </g>
    )
    if (t === 'cup') return (
        <g>
            <path d="M -12 0 Q -6 14 0 14 Q 6 14 12 0" fill={c} opacity="0.2" stroke={c} strokeWidth="2"/>
            {[[-10,-2,-10,8],[-5,-3,-5,10],[0,-3,0,11],[5,-3,5,10],[9,-2,9,8]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4" strokeLinecap="round"/>)}
            <line x1="-13" y1="3" x2="-16" y2="10" stroke={c} strokeWidth="4" strokeLinecap="round"/>
        </g>
    )
    if (t === 'pinch') return (
        <g>
            <ellipse cx="0" cy="3" rx="10" ry="8" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5"/>
            <circle cx="-6" cy="-10" r="5.5" fill="none" stroke={c} strokeWidth="2.5"/>
            <circle cx="-6" cy="-10" r="2" fill={c}/>
            {[[2,-1,2,6],[6,-1,6,5],[9,-1,9,4]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
        </g>
    )
    if (t === 'cross') return (
        <g>
            <line x1="-14" y1="-14" x2="14" y2="14" stroke={c} strokeWidth="10" strokeLinecap="round" opacity="0.7"/>
            <line x1="14" y1="-14" x2="-14" y2="14" stroke={c} strokeWidth="10" strokeLinecap="round" opacity="0.7"/>
            <circle cx="0" cy="0" r="5" fill={c}/>
        </g>
    )
    // relaxed (idle)
    return (
        <g>
            <ellipse cx="0" cy="5" rx="10" ry="9" fill={c} opacity="0.2" stroke={c} strokeWidth="1.5"/>
            {[[-5,0,-5,10],[-2,0,-2,12],[2,0,2,12],[5,0,5,10]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4" strokeLinecap="round"/>)}
            <line x1="-8" y1="2" x2="-12" y2="10" stroke={c} strokeWidth="4" strokeLinecap="round"/>
        </g>
    )
}

// ══════════════════════════════════════════════════════════════
//  ⓫ Person3D — GLB 아바타 수어 시연 (Three.js + GLTFLoader)
//  public/avatar.glb 가 필요합니다.
// ══════════════════════════════════════════════════════════════

const BONES = {
    hips:'hips_JNT', spine:'spine_JNT', spine1:'spine1_JNT', spine2:'spine2_JNT',
    neck:'neck_JNT', head:'head_JNT',
    lShoulder:'l_shoulder_JNT', lArm:'l_arm_JNT', lForearm:'l_forearm_JNT', lHand:'l_hand_JNT',
    lThumb1:'l_handThumb1_JNT', lThumb2:'l_handThumb2_JNT', lThumb3:'l_handThumb3_JNT',
    lIndex1:'l_handIndex1_JNT', lIndex2:'l_handIndex2_JNT', lIndex3:'l_handIndex3_JNT',
    lMiddle1:'l_handMiddle1_JNT',lMiddle2:'l_handMiddle2_JNT',lMiddle3:'l_handMiddle3_JNT',
    lRing1:'l_handRing1_JNT',   lRing2:'l_handRing2_JNT',   lRing3:'l_handRing3_JNT',
    lPinky1:'l_handPinky1_JNT', lPinky2:'l_handPinky2_JNT', lPinky3:'l_handPinky3_JNT',
    rShoulder:'r_shoulder_JNT', rArm:'r_arm_JNT', rForearm:'r_forearm_JNT', rHand:'r_hand_JNT',
    rThumb1:'r_handThumb1_JNT', rThumb2:'r_handThumb2_JNT', rThumb3:'r_handThumb3_JNT',
    rIndex1:'r_handIndex1_JNT', rIndex2:'r_handIndex2_JNT', rIndex3:'r_handIndex3_JNT',
    rMiddle1:'r_handMiddle1_JNT',rMiddle2:'r_handMiddle2_JNT',rMiddle3:'r_handMiddle3_JNT',
    rRing1:'r_handRing1_JNT',   rRing2:'r_handRing2_JNT',   rRing3:'r_handRing3_JNT',
    rPinky1:'r_handPinky1_JNT', rPinky2:'r_handPinky2_JNT', rPinky3:'r_handPinky3_JNT',
}

const CURL_ALL  = [{x:1.35,y:0,z:0},{x:1.25,y:0,z:0},{x:1.05,y:0,z:0}]
const OPEN_ALL  = [{x:-.05,y:0,z:0},{x:-.02,y:0,z:0},{x:0,y:0,z:0}   ]
const IDLE_ALL  = [{x:.2,y:0,z:0},  {x:.16,y:0,z:0}, {x:.1,y:0,z:0}  ]
const HALF_CURL = [{x:.7,y:0,z:0},  {x:.6,y:0,z:0},  {x:.5,y:0,z:0}  ]

const mkFinger = (segs, key) => ({
    [`${key}1`]: segs[0], [`${key}2`]: segs[1], [`${key}3`]: segs[2]
})

// 자연스러운 대기 자세 — 양팔을 약간 앞으로 내리고 손가락 살짝 굽힘
const basePose = (lArm={x:0,y:0,z:-1.3}, rArm={x:0,y:0,z:1.3}) => ({
    head:{x:0,y:0,z:0}, neck:{x:0,y:0,z:0},
    spine:{x:.02,y:0,z:0}, spine1:{x:.02,y:0,z:0}, spine2:{x:.02,y:0,z:0},
    lShoulder:{x:0,y:0,z:.05}, lArm, lForearm:{x:.2,y:0,z:0}, lHand:{x:0,y:-.05,z:0},
    rShoulder:{x:0,y:0,z:-.05}, rArm, rForearm:{x:.2,y:0,z:0}, rHand:{x:0,y:.05,z:0},
    ...mkFinger(IDLE_ALL,'lIndex'),  ...mkFinger(IDLE_ALL,'lMiddle'),
    ...mkFinger(IDLE_ALL,'lRing'),
    lPinky1:{x:.25,y:0,z:.06},lPinky2:{x:.2,y:0,z:0},lPinky3:{x:.14,y:0,z:0},
    lThumb1:{x:.2,y:.2,z:-.1},lThumb2:{x:.18,y:.1,z:0},lThumb3:{x:.1,y:0,z:0},
    ...mkFinger(IDLE_ALL,'rIndex'),  ...mkFinger(IDLE_ALL,'rMiddle'),
    ...mkFinger(IDLE_ALL,'rRing'),
    rPinky1:{x:.25,y:0,z:-.06},rPinky2:{x:.2,y:0,z:0},rPinky3:{x:.14,y:0,z:0},
    rThumb1:{x:.2,y:-.2,z:.1},rThumb2:{x:.18,y:-.1,z:0},rThumb3:{x:.1,y:0,z:0},
})

const SIGN_POSES = {
    // ── idle: 자연스러운 대기 ──
    idle: basePose(),

    // ── wave: 오른손 들어 손 흔들기 ──
    wave: {
        ...basePose({x:.08,y:0,z:.32}, {x:-.55,y:0,z:-.22}),
        head:{x:.05,y:.1,z:0},
        rShoulder:{x:-1.15,y:0,z:-.38}, rArm:{x:-.55,y:0,z:-.22},
        rForearm:{x:-.5,y:0,z:0}, rHand:{x:0,y:.25,z:-.1},
        ...mkFinger(OPEN_ALL,'rIndex'),  ...mkFinger(OPEN_ALL,'rMiddle'),
        ...mkFinger(OPEN_ALL,'rRing'),
        rPinky1:{x:-.05,y:0,z:0},rPinky2:{x:-.02,y:0,z:0},rPinky3:{x:0,y:0,z:0},
        rThumb1:{x:.25,y:-.1,z:.1},rThumb2:{x:.1,y:0,z:0},rThumb3:{x:0,y:0,z:0},
    },

    // ── thumbUp: 엄지 위로 ──
    thumbUp: {
        ...basePose({x:.08,y:0,z:.32}, {x:-.35,y:0,z:-.12}),
        head:{x:.04,y:.04,z:0},
        rShoulder:{x:-.8,y:0,z:-.28}, rForearm:{x:-.35,y:.1,z:0}, rHand:{x:0,y:-.15,z:.1},
        ...mkFinger(CURL_ALL,'rIndex'), ...mkFinger(CURL_ALL,'rMiddle'),
        ...mkFinger(CURL_ALL,'rRing'),
        rPinky1:{x:1.35,y:0,z:0},rPinky2:{x:1.25,y:0,z:0},rPinky3:{x:1.05,y:0,z:0},
        rThumb1:{x:-.35,y:.1,z:.05},rThumb2:{x:-.1,y:0,z:0},rThumb3:{x:0,y:0,z:0},
    },

    // ── thumbDown: 엄지 아래로 ──
    thumbDown: {
        ...basePose({x:.08,y:0,z:.32}, {x:-.35,y:0,z:-.12}),
        head:{x:-.04,y:0,z:0},
        rShoulder:{x:-.78,y:0,z:-.26}, rForearm:{x:-.35,y:0,z:0}, rHand:{x:.3,y:.2,z:.15},
        ...mkFinger(CURL_ALL,'rIndex'), ...mkFinger(CURL_ALL,'rMiddle'),
        ...mkFinger(CURL_ALL,'rRing'),
        rPinky1:{x:1.35,y:0,z:0},rPinky2:{x:1.25,y:0,z:0},rPinky3:{x:1.05,y:0,z:0},
        rThumb1:{x:-.35,y:-.1,z:.05},rThumb2:{x:-.1,y:0,z:0},rThumb3:{x:0,y:0,z:0},
    },

    // ── peace: 브이 ──
    peace: {
        ...basePose({x:.08,y:0,z:.32}, {x:-.45,y:0,z:-.16}),
        head:{x:.04,y:.06,z:0},
        rShoulder:{x:-.92,y:0,z:-.32}, rForearm:{x:-.42,y:.05,z:0}, rHand:{x:0,y:-.1,z:.05},
        ...mkFinger(OPEN_ALL,'rIndex'),  ...mkFinger(OPEN_ALL,'rMiddle'),
        ...mkFinger(CURL_ALL,'rRing'),
        rPinky1:{x:1.35,y:0,z:0},rPinky2:{x:1.25,y:0,z:0},rPinky3:{x:1.05,y:0,z:0},
        rThumb1:{x:.38,y:-.1,z:.08},rThumb2:{x:.18,y:0,z:0},rThumb3:{x:.05,y:0,z:0},
    },

    // ── ok: OK 사인 ──
    ok: {
        ...basePose({x:.08,y:0,z:.32}, {x:-.36,y:0,z:-.13}),
        head:{x:.03,y:.05,z:0},
        rShoulder:{x:-.72,y:0,z:-.28}, rForearm:{x:-.36,y:.08,z:0}, rHand:{x:0,y:-.12,z:.06},
        rIndex1:{x:.12,y:.05,z:0},rIndex2:{x:.12,y:0,z:0},rIndex3:{x:.1,y:0,z:0},
        ...mkFinger(CURL_ALL,'rMiddle'), ...mkFinger(CURL_ALL,'rRing'),
        rPinky1:{x:1.3,y:0,z:0},rPinky2:{x:1.2,y:0,z:0},rPinky3:{x:1.0,y:0,z:0},
        rThumb1:{x:-.05,y:-.15,z:.1},rThumb2:{x:.85,y:0,z:0},rThumb3:{x:.45,y:0,z:0},
    },

    // ── point: 검지 가리키기 ──
    point: {
        ...basePose({x:.08,y:0,z:.32}, {x:-.55,y:0,z:-.14}),
        head:{x:0,y:.08,z:0},
        rShoulder:{x:-1.05,y:0,z:-.3}, rForearm:{x:-.52,y:0,z:0}, rHand:{x:0,y:-.08,z:.05},
        ...mkFinger(OPEN_ALL,'rIndex'),
        ...mkFinger(CURL_ALL,'rMiddle'), ...mkFinger(CURL_ALL,'rRing'),
        rPinky1:{x:1.35,y:0,z:0},rPinky2:{x:1.25,y:0,z:0},rPinky3:{x:1.05,y:0,z:0},
        rThumb1:{x:.28,y:-.12,z:.1},rThumb2:{x:.18,y:0,z:0},rThumb3:{x:.05,y:0,z:0},
    },

    // ── love: ILY (엄지+검지+새끼) ──
    love: {
        ...basePose({x:-.3,y:0,z:.18}, {x:-.3,y:0,z:-.18}),
        head:{x:.08,y:.05,z:.04},
        lShoulder:{x:-.8,y:0,z:.32}, lForearm:{x:-.28,y:0,z:0}, lHand:{x:0,y:.1,z:0},
        rShoulder:{x:-.8,y:0,z:-.32}, rForearm:{x:-.28,y:0,z:0}, rHand:{x:0,y:-.1,z:0},
        ...mkFinger(CURL_ALL,'lIndex'),  ...mkFinger(CURL_ALL,'lMiddle'),  ...mkFinger(CURL_ALL,'lRing'),
        lPinky1:{x:-.05,y:0,z:0},lPinky2:{x:-.02,y:0,z:0},lPinky3:{x:0,y:0,z:0},
        lThumb1:{x:-.25,y:.15,z:-.08},lThumb2:{x:-.08,y:0,z:0},lThumb3:{x:0,y:0,z:0},
        ...mkFinger(CURL_ALL,'rIndex'),  ...mkFinger(CURL_ALL,'rMiddle'),  ...mkFinger(CURL_ALL,'rRing'),
        rPinky1:{x:-.05,y:0,z:0},rPinky2:{x:-.02,y:0,z:0},rPinky3:{x:0,y:0,z:0},
        rThumb1:{x:-.25,y:-.15,z:.08},rThumb2:{x:-.08,y:0,z:0},rThumb3:{x:0,y:0,z:0},
    },

    // ── stop: 손바닥 앞으로 ──
    stop: {
        ...basePose({x:.08,y:0,z:.32}, {x:-.08,y:0,z:-.1}),
        head:{x:0,y:.04,z:0},
        rShoulder:{x:-1.32,y:0,z:-.18}, rForearm:{x:-.06,y:0,z:0}, rHand:{x:-.35,y:.05,z:.05},
        ...mkFinger(OPEN_ALL,'rIndex'),  ...mkFinger(OPEN_ALL,'rMiddle'),  ...mkFinger(OPEN_ALL,'rRing'),
        rPinky1:{x:-.05,y:0,z:0},rPinky2:{x:-.02,y:0,z:0},rPinky3:{x:0,y:0,z:0},
        rThumb1:{x:.38,y:-.05,z:.1},rThumb2:{x:.1,y:0,z:0},rThumb3:{x:0,y:0,z:0},
    },

    // ── call: 전화 손 ──
    call: {
        ...basePose({x:.08,y:0,z:.32}, {x:-.4,y:0,z:-.14}),
        head:{x:.05,y:.12,z:.1},
        rShoulder:{x:-.72,y:0,z:-.28}, rForearm:{x:-.4,y:.12,z:0}, rHand:{x:.22,y:.18,z:.08},
        ...mkFinger(CURL_ALL,'rIndex'), ...mkFinger(CURL_ALL,'rMiddle'), ...mkFinger(CURL_ALL,'rRing'),
        rPinky1:{x:-.05,y:0,z:0},rPinky2:{x:-.02,y:0,z:0},rPinky3:{x:0,y:0,z:0},
        rThumb1:{x:-.22,y:-.18,z:.08},rThumb2:{x:-.06,y:0,z:0},rThumb3:{x:0,y:0,z:0},
    },

    // ── fist: 주먹 ──
    fist: {
        ...basePose({x:.08,y:0,z:.32}, {x:-.3,y:0,z:-.12}),
        head:{x:.02,y:0,z:0},
        rShoulder:{x:-.68,y:0,z:-.26}, rForearm:{x:-.3,y:0,z:0}, rHand:{x:0,y:0,z:.05},
        ...mkFinger(CURL_ALL,'rIndex'), ...mkFinger(CURL_ALL,'rMiddle'),
        ...mkFinger(CURL_ALL,'rRing'),
        rPinky1:{x:1.35,y:0,z:0},rPinky2:{x:1.25,y:0,z:0},rPinky3:{x:1.05,y:0,z:0},
        rThumb1:{x:.5,y:-.1,z:.12},rThumb2:{x:.28,y:0,z:0},rThumb3:{x:.1,y:0,z:0},
    },

    // ── flat: 손바닥 수평으로 ──
    flat: {
        ...basePose({x:.08,y:0,z:.32}, {x:-.18,y:0,z:-.22}),
        head:{x:.02,y:.05,z:0},
        rShoulder:{x:-.5,y:0,z:-.32}, rForearm:{x:-.18,y:0,z:0}, rHand:{x:-.5,y:0,z:.3},
        ...mkFinger(OPEN_ALL,'rIndex'),  ...mkFinger(OPEN_ALL,'rMiddle'),  ...mkFinger(OPEN_ALL,'rRing'),
        rPinky1:{x:-.05,y:0,z:0},rPinky2:{x:-.02,y:0,z:0},rPinky3:{x:0,y:0,z:0},
        rThumb1:{x:.2,y:-.1,z:.15},rThumb2:{x:.08,y:0,z:0},rThumb3:{x:0,y:0,z:0},
    },

    // ── cup: 손 오목하게 ──
    cup: {
        ...basePose({x:.08,y:0,z:.32}, {x:-.25,y:0,z:-.18}),
        head:{x:.03,y:.04,z:0},
        rShoulder:{x:-.6,y:0,z:-.3}, rForearm:{x:-.25,y:0,z:0}, rHand:{x:-.2,y:.05,z:.1},
        ...mkFinger(HALF_CURL,'rIndex'),  ...mkFinger(HALF_CURL,'rMiddle'),  ...mkFinger(HALF_CURL,'rRing'),
        rPinky1:{x:.65,y:0,z:0},rPinky2:{x:.58,y:0,z:0},rPinky3:{x:.48,y:0,z:0},
        rThumb1:{x:.15,y:-.1,z:.2},rThumb2:{x:.1,y:0,z:0},rThumb3:{x:.05,y:0,z:0},
    },

    // ── pinch: 집기 ──
    pinch: {
        ...basePose({x:.08,y:0,z:.32}, {x:-.36,y:0,z:-.13}),
        head:{x:.03,y:.05,z:0},
        rShoulder:{x:-.72,y:0,z:-.28}, rForearm:{x:-.36,y:.08,z:0}, rHand:{x:0,y:-.1,z:.06},
        rIndex1:{x:.55,y:.1,z:0},rIndex2:{x:.5,y:0,z:0},rIndex3:{x:.4,y:0,z:0},
        ...mkFinger(CURL_ALL,'rMiddle'), ...mkFinger(CURL_ALL,'rRing'),
        rPinky1:{x:1.3,y:0,z:0},rPinky2:{x:1.2,y:0,z:0},rPinky3:{x:1.0,y:0,z:0},
        rThumb1:{x:.2,y:-.12,z:.15},rThumb2:{x:.55,y:0,z:0},rThumb3:{x:.38,y:0,z:0},
    },

    // ── cross: 양팔 교차 ──
    cross: {
        ...basePose({x:-.55,y:0,z:.12}, {x:-.55,y:0,z:-.12}),
        head:{x:.04,y:0,z:0},
        lShoulder:{x:-1.0,y:0,z:.15}, lArm:{x:-.55,y:.3,z:.12}, lForearm:{x:-.4,y:0,z:0}, lHand:{x:0,y:.1,z:.2},
        rShoulder:{x:-1.0,y:0,z:-.15}, rArm:{x:-.55,y:-.3,z:-.12}, rForearm:{x:-.4,y:0,z:0}, rHand:{x:0,y:-.1,z:-.2},
        ...mkFinger(CURL_ALL,'lIndex'), ...mkFinger(CURL_ALL,'lMiddle'), ...mkFinger(CURL_ALL,'lRing'),
        lPinky1:{x:1.3,y:0,z:0},lPinky2:{x:1.2,y:0,z:0},lPinky3:{x:1.0,y:0,z:0},
        lThumb1:{x:.4,y:.12,z:-.1},lThumb2:{x:.2,y:0,z:0},lThumb3:{x:.08,y:0,z:0},
        ...mkFinger(CURL_ALL,'rIndex'), ...mkFinger(CURL_ALL,'rMiddle'), ...mkFinger(CURL_ALL,'rRing'),
        rPinky1:{x:1.3,y:0,z:0},rPinky2:{x:1.2,y:0,z:0},rPinky3:{x:1.0,y:0,z:0},
        rThumb1:{x:.4,y:-.12,z:.1},rThumb2:{x:.2,y:0,z:0},rThumb3:{x:.08,y:0,z:0},
    },

    // ── number: 검지 들기 (숫자 가리키기) ──
    number: {
        ...basePose({x:.08,y:0,z:.32}, {x:-.6,y:0,z:-.16}),
        head:{x:.02,y:.05,z:0},
        rShoulder:{x:-1.1,y:0,z:-.32}, rForearm:{x:-.55,y:.05,z:0}, rHand:{x:0,y:-.08,z:.04},
        ...mkFinger(OPEN_ALL,'rIndex'),
        ...mkFinger(CURL_ALL,'rMiddle'), ...mkFinger(CURL_ALL,'rRing'),
        rPinky1:{x:1.35,y:0,z:0},rPinky2:{x:1.25,y:0,z:0},rPinky3:{x:1.05,y:0,z:0},
        rThumb1:{x:.3,y:-.1,z:.12},rThumb2:{x:.2,y:0,z:0},rThumb3:{x:.06,y:0,z:0},
    },

    // ── open: 손 펼치기 (인사/제스처) — wave와 유사하나 손을 앞으로 ──
    open: {
        ...basePose({x:.08,y:0,z:.32}, {x:-.48,y:0,z:-.2}),
        head:{x:.04,y:.08,z:0},
        rShoulder:{x:-1.0,y:0,z:-.35}, rForearm:{x:-.45,y:0,z:0}, rHand:{x:-.2,y:.15,z:-.05},
        ...mkFinger(OPEN_ALL,'rIndex'),  ...mkFinger(OPEN_ALL,'rMiddle'),  ...mkFinger(OPEN_ALL,'rRing'),
        rPinky1:{x:-.05,y:0,z:0},rPinky2:{x:-.02,y:0,z:0},rPinky3:{x:0,y:0,z:0},
        rThumb1:{x:.25,y:-.1,z:.12},rThumb2:{x:.1,y:0,z:0},rThumb3:{x:0,y:0,z:0},
    },
}

function lerpV(a, b, t) { return a + (b - a) * t }

function Person3D({ pose = 'idle', playing = true }) {
    const mountRef = useRef(null)
    const stateRef = useRef({ pose, playing })
    useEffect(() => { stateRef.current = { pose, playing } }, [pose, playing])

    useEffect(() => {
        const el = mountRef.current
        if (!el) return
        let cancelled = false, animId = null

        const run = async () => {
            if (!window.THREE) {
                await new Promise((res, rej) => {
                    const s = document.createElement('script')
                    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
                    s.onload = res; s.onerror = rej; document.head.appendChild(s)
                })
            }
            if (!window.THREE.GLTFLoader) {
                await new Promise((res, rej) => {
                    const s = document.createElement('script')
                    s.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js'
                    s.onload = res; s.onerror = rej; document.head.appendChild(s)
                })
            }
            if (cancelled) return
            const THREE = window.THREE

            // 부모(.ai-char-area)의 실제 크기를 읽음
            const parent = el.parentElement || el
            const W = parent.clientWidth  || el.clientWidth  || 600
            const H = parent.clientHeight || el.clientHeight || 600

            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
            renderer.setSize(W, H)
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
            renderer.shadowMap.enabled = true
            // canvas가 부모를 완전히 채우도록 강제
            renderer.domElement.style.cssText = 'display:block;width:100%!important;height:100%!important;position:absolute;top:0;left:0;'
            el.appendChild(renderer.domElement)

            const scene  = new THREE.Scene()
            // hips Y≈1.01, head top Y≈1.66 → 카메라를 가까이 당겨 아바타를 크게
            const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 50)
            camera.position.set(0, 1.3, 1.8)
            camera.lookAt(0, 1.1, 0)

            // ResizeObserver — 컨테이너 크기 변경 시 렌더러/카메라 갱신
            const ro = new ResizeObserver(() => {
                const nW = parent.clientWidth  || 320
                const nH = parent.clientHeight || 280
                if (!cancelled && nW > 0 && nH > 0) {
                    renderer.setSize(nW, nH)
                    renderer.domElement.style.width  = nW + 'px'
                    renderer.domElement.style.height = nH + 'px'
                    camera.aspect = nW / nH
                    camera.position.set(0, 1.3, 1.8)
                    camera.lookAt(0, 1.1, 0)
                    camera.updateProjectionMatrix()
                }
            })
            ro.observe(parent)

            scene.add(new THREE.Mesh(
                new THREE.SphereGeometry(20,16,10),
                new THREE.MeshBasicMaterial({ color: 0xdde8f5, side: THREE.BackSide })
            ))
            scene.add(new THREE.AmbientLight(0xfff8f0, 0.65))
            const key = new THREE.DirectionalLight(0xfff8f0, 1.5)
            key.position.set(2,5,4); key.castShadow = true; scene.add(key)
            const fill = new THREE.DirectionalLight(0xd0e8ff, 0.5)
            fill.position.set(-3,2,3); scene.add(fill)

            const boneMap = {}, curRot = {}
            const loader  = new THREE.GLTFLoader()
            loader.load(
                '/avatar.glb',
                (gltf) => {
                    if (cancelled) return
                    const model = gltf.scene
                    model.position.set(0, 0, 0)
                    model.traverse(node => {
                        if (node.name?.endsWith('_JNT')) {
                            boneMap[node.name] = node
                            curRot[node.name]  = { x: 0, y: 0, z: 0 }
                        }
                        if (node.isMesh) { node.castShadow = true; node.receiveShadow = true }
                    })
                    scene.add(model)
                },
                undefined,
                (err) => console.error('[Person3D] GLB 로드 실패:', err)
            )

            let t = 0, wavePhase = 0, breathPhase = 0, nodPhase = 0, idleArmPhase = 0

            // easeInOut — 로봇 같은 선형 lerp 대신 부드러운 가속/감속
            const easeIO = x => x < 0.5 ? 2*x*x : 1 - Math.pow(-2*x+2,2)/2

            const tick = () => {
                if (cancelled) return
                animId = requestAnimationFrame(tick)
                t += 0.016
                breathPhase  += 0.018   // 약 0.9Hz — 자연스러운 호흡
                nodPhase     += 0.008   // 머리 고개 미세 끄덕
                idleArmPhase += 0.012   // idle 팔 미세 흔들

                const { pose: cp, playing: pl } = stateRef.current
                const tp = SIGN_POSES[cp] || SIGN_POSES.idle

                // lerp 속도: idle 복귀 빠름, 포즈 진입 약간 느림 (더 자연스럽게)
                const sp = cp === 'idle' ? 0.14 : 0.10

                Object.entries(tp).forEach(([key, target]) => {
                    const fullName = BONES[key]
                    if (!fullName || !target) return
                    const bone = boneMap[fullName]
                    if (!bone) return
                    if (!curRot[fullName]) curRot[fullName] = { x: 0, y: 0, z: 0 }
                    // easing 적용 lerp
                    const ex = easeIO(Math.min(sp * 1.5, 1))
                    curRot[fullName].x = lerpV(curRot[fullName].x, target.x ?? 0, ex)
                    curRot[fullName].y = lerpV(curRot[fullName].y, target.y ?? 0, ex)
                    curRot[fullName].z = lerpV(curRot[fullName].z, target.z ?? 0, ex)
                    bone.rotation.x = curRot[fullName].x
                    bone.rotation.y = curRot[fullName].y
                    bone.rotation.z = curRot[fullName].z
                })

                // ── secondary motion (포즈별) ──────────────────────────
                if (pl) {
                    // wave: 손목 좌우 흔들기 — 더 크고 자연스럽게
                    if (cp === 'wave') {
                        wavePhase += 0.12
                        const rHand = boneMap[BONES.rHand]
                        const rArm  = boneMap[BONES.rArm]
                        const rForearm = boneMap[BONES.rForearm]
                        if (rHand) rHand.rotation.y += Math.sin(wavePhase) * 0.38
                        if (rArm)  rArm.rotation.z  += Math.sin(wavePhase * 0.5) * 0.02
                        if (rForearm) rForearm.rotation.z += Math.sin(wavePhase * 0.7) * 0.06
                    } else { wavePhase = 0 }

                    // thumbUp: 엄지 살짝 위아래 펄스 — 더 강하게
                    if (cp === 'thumbUp') {
                        const rThumb = boneMap[BONES.rThumb1]
                        const rArm   = boneMap[BONES.rArm]
                        if (rThumb) rThumb.rotation.x += Math.sin(t * 3.0) * 0.04
                        if (rArm)   rArm.rotation.z   += Math.sin(t * 2.5) * 0.02
                    }

                    // point: 검지 앞뒤 미세 강조
                    if (cp === 'point' || cp === 'number') {
                        const rIndex = boneMap[BONES.rIndex1]
                        const rForearm = boneMap[BONES.rForearm]
                        if (rIndex)   rIndex.rotation.x   += Math.sin(t * 2.8) * 0.025
                        if (rForearm) rForearm.rotation.x += Math.sin(t * 2.0) * 0.018
                    }

                    // stop: 손바닥 약간 앞뒤 — 강조
                    if (cp === 'stop' || cp === 'flat') {
                        const rArm  = boneMap[BONES.rArm]
                        const rHand = boneMap[BONES.rHand]
                        if (rArm)  rArm.rotation.x  += Math.sin(t * 2.0) * 0.022
                        if (rHand) rHand.rotation.y += Math.sin(t * 1.5) * 0.03
                    }

                    // call: 손목 귀 쪽으로 살살
                    if (cp === 'call') {
                        const rHand = boneMap[BONES.rHand]
                        const rForearm = boneMap[BONES.rForearm]
                        if (rHand)    rHand.rotation.z    += Math.sin(t * 1.8) * 0.025
                        if (rForearm) rForearm.rotation.y += Math.sin(t * 1.2) * 0.02
                    }

                    // love: 양팔 살짝 앞뒤
                    if (cp === 'love') {
                        const lArm = boneMap[BONES.lArm]
                        const rArm = boneMap[BONES.rArm]
                        if (lArm) lArm.rotation.x += Math.sin(t * 1.6) * 0.024
                        if (rArm) rArm.rotation.x += Math.sin(t * 1.6) * 0.024
                    }

                    // cross: 양팔 교차 강조 (진폭 크게)
                    if (cp === 'cross') {
                        const lArm = boneMap[BONES.lArm]
                        const rArm = boneMap[BONES.rArm]
                        if (lArm) lArm.rotation.y += Math.sin(t * 1.4) * 0.03
                        if (rArm) rArm.rotation.y += Math.sin(t * 1.4 + Math.PI) * 0.03
                    }

                    // ok: OK 원 강조 — 손 미세 떨림
                    if (cp === 'ok') {
                        const rHand = boneMap[BONES.rHand]
                        if (rHand) {
                            rHand.rotation.x += Math.sin(t * 2.2) * 0.018
                            rHand.rotation.z += Math.sin(t * 3.0) * 0.012
                        }
                    }

                    // peace: 브이 — 손 약간 흔들
                    if (cp === 'peace') {
                        const rHand = boneMap[BONES.rHand]
                        if (rHand) rHand.rotation.y += Math.sin(t * 2.0) * 0.025
                    }

                    // fist: 주먹 강조
                    if (cp === 'fist') {
                        const rArm = boneMap[BONES.rArm]
                        if (rArm) rArm.rotation.x += Math.sin(t * 2.5) * 0.025
                    }

                    // idle: 팔 미세 흔들림 (살아있는 느낌)
                    if (cp === 'idle') {
                        const lArm = boneMap[BONES.lArm]
                        const rArm = boneMap[BONES.rArm]
                        if (lArm) lArm.rotation.z += Math.sin(idleArmPhase) * 0.005
                        if (rArm) rArm.rotation.z += Math.sin(idleArmPhase + 1.2) * 0.005
                    }

                    // 호흡: hips + spine 위아래
                    const hips = boneMap[BONES.hips]
                    if (hips) hips.position.y = (hips.userData.baseY ?? 0) + Math.sin(breathPhase) * 0.005
                    const spine = boneMap[BONES.spine]
                    if (spine) spine.rotation.x = (SIGN_POSES[cp]?.spine?.x ?? 0.02) + Math.sin(breathPhase) * 0.006

                    // 머리 미세 끄덕 (살아있는 느낌)
                    const head = boneMap[BONES.head]
                    if (head) head.rotation.x += Math.sin(nodPhase) * 0.004
                }

                renderer.render(scene, camera)
            }
            tick()
        }

        run().catch(console.error)
        return () => {
            cancelled = true
            if (animId) cancelAnimationFrame(animId)
            // canvas 정리
            const canvas = el.querySelector('canvas')
            if (canvas) el.removeChild(canvas)
        }
    }, [])

    return (
        <div
            ref={mountRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
    )
}

// ══════════════════════════════════════════════════════════════
//  ⓮ TTS
// ══════════════════════════════════════════════════════════════
const speak = (text, rate = 0.9) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ko-KR'; u.rate = rate
    const v = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('ko'))
    if (v) u.voice = v
    window.speechSynthesis.speak(u)
}

// ══════════════════════════════════════════════════════════════
//  ⓯ SubPanel
// ══════════════════════════════════════════════════════════════
function SubPanel({ tokens, text, loading, history, onFlush, onClear, onConfirm, tmStatus, lstmStatus }) {
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

// ══════════════════════════════════════════════════════════════
//  ⓰ fixAnim — 16종 animType 보정
// ══════════════════════════════════════════════════════════════
const VAT = new Set([
    'wave','thumbUp','thumbDown','peace','ok','point',
    'love','stop','call','fist',
    'open','number','flat','cup','pinch','cross',
])

const fixAnim = s => {
    if (!s) return { animType: 'wave' }
    if (VAT.has(s.animType)) return s
    const word  = s.word      || ''
    const shape = s.handShape || ''
    const move  = s.movement  || ''
    const w = (word + shape + move).toLowerCase()
    let f = 'wave'
    if      (w.includes('엄지') && (w.includes('위') || w.includes('좋'))) f = 'thumbUp'
    else if (w.includes('엄지') && w.includes('아래'))                     f = 'thumbDown'
    else if (w.includes('v') || w.includes('브이'))                        f = 'peace'
    else if (w.includes('ok') || w.includes('알겠'))                       f = 'ok'
    else if (w.includes('가리'))                                            f = 'point'
    else if (w.includes('사랑'))                                            f = 'love'
    else if (w.includes('잠깐') || w.includes('정지') || w.includes('멈')) f = 'stop'
    else if (w.includes('전화'))                                            f = 'call'
    else if (w.includes('주먹'))                                            f = 'fist'
    else if (w.includes('펼') || w.includes('열'))                         f = 'open'
    else if (w.includes('숫자') || w.includes('번'))                       f = 'number'
    else if (w.includes('수평') || w.includes('납작'))                     f = 'flat'
    else if (w.includes('오목') || w.includes('컵'))                       f = 'cup'
    else if (w.includes('집') || w.includes('꼬집'))                       f = 'pinch'
    else if (w.includes('교차') || w.includes('겹'))                       f = 'cross'
    // ── 단어 자체로 포즈 매핑 ──
    else if (word.includes('안녕'))                                         f = 'wave'
    else if (word.includes('반갑') || word.includes('만나'))                f = 'peace'
    else if (word.includes('감사') || word.includes('고맙'))                f = 'thumbUp'
    else if (word.includes('부탁') || word.includes('도와'))                f = 'point'
    else if (word.includes('좋') || word.includes('네') || word.includes('예')) f = 'thumbUp'
    else if (word.includes('아니') || word.includes('싫'))                  f = 'thumbDown'
    else if (word.includes('사랑') || word.includes('좋아해'))              f = 'love'
    else if (word.includes('잠깐') || word.includes('기다'))                f = 'stop'
    else if (word.includes('전화'))                                         f = 'call'
    else if (word.includes('힘') || word.includes('파이팅'))                f = 'fist'
    else if (word.includes('ok') || word.includes('알'))                    f = 'ok'
    return { ...s, animType: f }
}

// ══════════════════════════════════════════════════════════════
//  ⓰ AIPanel — GLB 아바타 수어 시연 패널
//  핵심: Person3D는 항상 단 하나만 마운트, pose prop만 교체
// ══════════════════════════════════════════════════════════════
function AIPanel({ guide, loading }) {
    const [idx,        setIdx]        = useState(0)
    const [play,       setPlay]       = useState(true)
    const [activePose, setActivePose] = useState('idle')
    const [transitioning, setTransitioning] = useState(false)
    const autoRef  = useRef(null)
    const transRef = useRef(null)

    // ── guide 바뀌면 처음부터 ──
    useEffect(() => {
        setIdx(0)
        setPlay(true)
    }, [guide])

    // ── idx · guide 바뀌면 포즈 전환 ──
    useEffect(() => {
        clearTimeout(transRef.current)
        if (!guide?.steps?.length) {
            setActivePose('idle')
            setTransitioning(false)
            return
        }
        const st    = guide.steps[idx]
        const fixed = fixAnim(st || {})
        const po    = A2P[fixed?.animType] || 'wave'

        // idle → 잠깐 → 목표 포즈 (시각적 전환)
        setActivePose('idle')
        setTransitioning(true)
        transRef.current = setTimeout(() => {
            setActivePose(po)
            setTransitioning(false)
        }, 400)
    }, [idx, guide])

    // ── 자동 재생 타이머 ──
    useEffect(() => {
        clearTimeout(autoRef.current)
        if (!play || !guide?.steps?.length) return
        const stepCount = guide.steps.length
        // step 1개짜리도 포즈 보여주기 위해 왕복 (idle → pose → idle → pose ...)
        autoRef.current = setTimeout(() => {
            setIdx(s => (s + 1) % stepCount)
        }, 3000)
        return () => clearTimeout(autoRef.current)
    }, [play, idx, guide])

    // ── 현재 step 메타 ──
    const st    = guide?.steps?.[idx]
    const fixed = fixAnim(st || {})
    const po    = A2P[fixed?.animType] || 'wave'
    const cfg   = POSE_CFG[activePose] || POSE_CFG.idle
    const total = guide?.steps?.length || 0

    return (
        <div className="ai-panel">
            {/* ── 아바타 영역 — 항상 렌더링, pose만 교체 ── */}
            <div className="ai-char-area" style={{ position: 'relative' }}>
                {cfg.l && !transitioning && activePose !== 'idle' && (
                    <div className="speech-bubble" style={{ '--bc': cfg.c }}>{cfg.l}</div>
                )}
                {/* Person3D는 이 div 안에서 단 1번만 마운트됨 */}
                <Person3D
                    pose={activePose}
                    jointData={st?.jointData} // 이 부분이 추가되어야 합니다!
                    playing={!transitioning && play}
                />

                {/* 로딩 오버레이 */}
                {loading && (
                    <div style={{
                        position:'absolute', inset:0, display:'flex',
                        flexDirection:'column', alignItems:'center', justifyContent:'center',
                        background:'rgba(255,255,255,0.75)', gap:8
                    }}>
                        <div className="typing-dots"><span/><span/><span/></div>
                        <p style={{ fontSize:13, color:'#64748b' }}>수어 가이드 생성 중...</p>
                    </div>
                )}

                {/* 가이드 없을 때 안내 */}
                {!guide && !loading && (
                    <div style={{
                        position:'absolute', bottom:20, left:0, right:0,
                        textAlign:'center', pointerEvents:'none'
                    }}>
                        <p style={{ fontSize:14, color:'#64748b', lineHeight:1.8, fontWeight:600 }}>
                            텍스트 답장을 전송하면<br/>아바타가 수어로<br/>직접 표현해드립니다 🤟
                        </p>
                    </div>
                )}
            </div>

            {/* ── 이하 — guide 있을 때만 표시 ── */}
            {guide && (
                <>
                    <div className="ai-summary" style={{ borderColor: cfg.c + '55', background: cfg.c + '0e' }}>
                        <span className="ai-summary-icon">💬</span>
                        <span className="ai-summary-txt">{guide.summary}</span>
                    </div>

                    <div className="ai-progress-track">
                        {guide.steps.map((_, i) => (
                            <div key={i}
                                 className={`ai-progress-dot ${i === idx ? 'ai-progress-dot-active' : i < idx ? 'ai-progress-dot-done' : ''}`}
                                 style={i === idx ? { background: cfg.c } : i < idx ? { background: cfg.c, opacity: 0.4 } : {}}
                                 onClick={() => { setIdx(i); setPlay(false) }}
                            />
                        ))}
                    </div>

                    <div className="ai-step-box" style={{ borderLeftColor: po !== 'idle' ? POSE_CFG[po]?.c || cfg.c : cfg.c }}>
                        <div className="ai-step-top">
                            <span className="ai-step-num" style={{ background: cfg.c }}>
                                {idx + 1} / {total}
                            </span>
                            <span className="ai-step-word" style={{ color: cfg.c }}>{st?.word}</span>
                            <span className="ai-anim-badge" style={{
                                color: POSE_CFG[po]?.c || '#7c6fff',
                                borderColor: POSE_CFG[po]?.c || '#7c6fff',
                            }}>{fixed?.animType || 'wave'}</span>
                        </div>
                    </div>

                    <div className="ai-controls">
                        <div className="ai-chips">
                            {guide.steps.map((s, i) => {
                                const sf = fixAnim(s)
                                const sp = A2P[sf?.animType] || 'wave'
                                return (
                                    <button key={i}
                                            className={`ai-chip ${i === idx ? 'ai-chip-on' : ''}`}
                                            style={i === idx ? { background: POSE_CFG[sp]?.c || '#7c6fff', borderColor: 'transparent' } : {}}
                                            onClick={() => { setIdx(i); setPlay(false) }}>
                                        {i + 1}. {s.word}
                                    </button>
                                )
                            })}
                        </div>
                        <div className="ai-ctrl-row">
                            <button className="ai-nav-btn"
                                    disabled={idx === 0}
                                    onClick={() => { setIdx(i => Math.max(0, i - 1)); setPlay(false) }}>
                                ◀ 이전
                            </button>
                            <button className="ai-play-btn" style={{ background: cfg.c }}
                                    onClick={() => setPlay(p => !p)}>
                                {play ? '⏸ 일시정지' : '▶ 재생'}
                            </button>
                            <button className="ai-nav-btn"
                                    disabled={idx === total - 1}
                                    onClick={() => { setIdx(i => Math.min(total - 1, i + 1)); setPlay(false) }}>
                                다음 ▶
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════
//  ⓱ 메인 컴포넌트
// ══════════════════════════════════════════════════════════════
export default function TranslatePage({ onEndConversation, place = 'immigration' }) {
    const [mpError,      setMpError]      = useState(null)
    const [cameraOn,     setCameraOn]     = useState(false)
    const [messages,     setMessages]     = useState([])
    const [textInput,    setTextInput]    = useState('')
    const [voiceText,    setVoiceText]    = useState('')
    const [listening,    setListening]    = useState(false)
    const [inputMode,    setInputMode]    = useState('text')
    const [pendingSign,  setPendingSign]  = useState(null)
    const [signMeaning,  setSignMeaning]  = useState(null)
    const [signPose,     setSignPose]     = useState('idle')
    const [pendingReply, setPendingReply] = useState(null)
    const [aiGuide,      setAiGuide]      = useState(null)
    const [aiLoading,    setAiLoading]    = useState(false)
    const [showStopWarn, setShowStopWarn] = useState(false)
    const [liveG,        setLiveG]        = useState(null)
    const [handDet,      setHandDet]      = useState(false)
    const [stabProg,     setStabProg]     = useState(0)
    const [ttsOn,        setTtsOn]        = useState(true)
    const [subTokens,    setSubTokens]    = useState([])
    const [subText,      setSubText]      = useState('')
    const [subLoading,   setSubLoading]   = useState(false)
    const [subHist,      setSubHist]      = useState([])
    const [tmStatus,     setTmStatus]     = useState(TM_ENABLED ? 'loading' : 'off')

    const vRef         = useRef(null)
    const cvRef        = useRef(null)
    const handsRef     = useRef(null)
    const rafRef       = useRef(null)
    const recRef       = useRef(null)
    const chatRef      = useRef(null)
    const taRef        = useRef(null)
    const lastSignRef  = useRef(null)
    const lastTimeRef  = useRef(0)
    const runRef       = useRef(false)
    const msgsRef      = useRef([])
    const stabCnt      = useRef(0)
    const stabName     = useRef(null)
    const ttsRef       = useRef(true)
    const dtwRef       = useRef(new DTWRec())
    const tmRef        = useRef(null)
    const tmResultRef  = useRef(null)
    const flushTRef    = useRef(null)
    const tokRef       = useRef([])
    const prevSentRef  = useRef('')

    const { lstmStatus, lstmGesture, sendLandmarks } = useLSTMSign({
        onGesture: useCallback((name, conf) => {
            if (name && conf >= 0.75) pushTok(name)
        }, []),
        onSentence: useCallback((sentence) => {
            if (sentence) setSubText(sentence)
        }, []),
    })

    useEffect(() => { ttsRef.current = ttsOn }, [ttsOn])
    useEffect(() => { chatRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

    // TM 로드
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
                tmRef.current = await window.tmPose.load(TM_MODEL_URL + 'model.json', TM_MODEL_URL + 'metadata.json')
                setTmStatus('ready')
            } catch (e) {
                console.error('[TM]', e); setTmStatus('error')
            }
        })()
    }, [])

    // 자막 생성
    const flushSub = useCallback(async (toks) => {
        if (!toks?.length) return
        setSubLoading(true)
        setSubTokens([])
        tokRef.current = []
        const s = await buildSubtitle(toks, place, prevSentRef.current)
        setSubLoading(false)
        if (s) {
            setSubText(prev => prev ? prev + ' ' + s : s)
            prevSentRef.current = s
        }
    }, [place])

    // 토큰 추가
    const pushTok = useCallback((name) => {
        const w = name.replace(/\p{Emoji}/gu, '').trim()
        if (!w) return
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

    // MediaPipe 로드
    const loadMP = () => new Promise((res, rej) => {
        if (window.Hands) { res(); return }
        const ld = src => new Promise((r, j) => {
            const s = document.createElement('script')
            s.src = src; s.crossOrigin = 'anonymous'
            s.onload = r; s.onerror = () => j(new Error(src))
            document.head.appendChild(s)
        })
        ld('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.min.js')
            .then(() => ld('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1640029074/camera_utils.min.js'))
            .then(() => ld('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1620248257/drawing_utils.min.js'))
            .then(res).catch(rej)
    })

    // 카메라 시작
    const init = async () => {
        setMpError(null)
        try {
            await loadMP()
            if (handsRef.current) { try { handsRef.current.close() } catch (_) {} handsRef.current = null }
            const hands = new window.Hands({
                locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${f}`
            })
            hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.75, minTrackingConfidence: 0.65 })
            hands.onResults(onResults)
            handsRef.current = hands
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
            vRef.current.srcObject = stream
            await vRef.current.play()
            runRef.current = true
            setCameraOn(true)
            setShowStopWarn(false)
            dtwRef.current.reset()
            const loop = async () => {
                if (!runRef.current) return
                if (vRef.current?.readyState >= 2) await handsRef.current?.send({ image: vRef.current })
                rafRef.current = requestAnimationFrame(loop)
            }
            rafRef.current = requestAnimationFrame(loop)
        } catch (e) {
            setMpError(e.message || '카메라 초기화 실패')
        }
    }

    const tmStatusRef = useRef(tmStatus)
    useEffect(() => { tmStatusRef.current = tmStatus }, [tmStatus])

    const onResults = useCallback((results) => {
        if (!runRef.current) return
        const cv = cvRef.current; if (!cv) return
        const ctx = cv.getContext('2d')
        ctx.save()
        ctx.clearRect(0, 0, cv.width, cv.height)
        ctx.scale(-1, 1)
        ctx.drawImage(results.image, -cv.width, 0, cv.width, cv.height)
        ctx.restore()

        if (results.multiHandLandmarks?.length > 0) {
            setHandDet(true)
            const lm = results.multiHandLandmarks[0]
            window.drawConnectors?.(ctx, lm, window.HAND_CONNECTIONS, { color: '#7c6fff', lineWidth: 2 })
            window.drawLandmarks?.(ctx, lm, { color: '#fff', lineWidth: 1, radius: 3, fillColor: '#7c6fff' })

            sendLandmarks(lm)
            dtwRef.current.push(lm)

            if (tmRef.current && tmStatusRef.current === 'ready') {
                tmRef.current.estimatePose(vRef.current)
                    .then(({ posenetOutput }) => tmRef.current.predict(posenetOutput))
                    .then(preds => {
                        if (!preds?.length) return
                        const best = preds.reduce((a, b) => a.probability > b.probability ? a : b)
                        if (best.probability >= TM_THRESHOLD) {
                            tmResultRef.current = { name: best.className, prob: best.probability }
                        } else {
                            tmResultRef.current = null
                        }
                    })
                    .catch(() => { tmResultRef.current = null })
            }

            const rg   = classify(lm)
            const dtwR = dtwRef.current.recognize()
            const fv   = vote({
                ruleName:  rg?.name || null,
                dtwResult: dtwR,
                lstmName:  lstmGesture?.name || null,
                lstmConf:  lstmGesture?.conf || 0,
                tmName:    tmResultRef.current?.name || null,
                tmProb:    tmResultRef.current?.prob || 0,
            })

            if (rg) {
                if (rg.name === stabName.current) stabCnt.current++
                else { stabName.current = rg.name; stabCnt.current = 1 }
                setStabProg(Math.min((stabCnt.current / STABLE) * 100, 100))
                if (stabCnt.current >= 3) setLiveG(rg)

                if (stabCnt.current >= STABLE) {
                    const now = Date.now()
                    if (rg.name !== lastSignRef.current || now - lastTimeRef.current > COOLDOWN) {
                        lastSignRef.current = rg.name
                        lastTimeRef.current = now
                        stabCnt.current = 0; stabName.current = null; setStabProg(0)
                        dtwRef.current.learn(rg.name)
                        const fin = (fv?.name ? RULES.find(r => r.name === fv.name) || rg : rg)
                        setPendingSign(`${fin.emoji} ${fin.name}`)
                        setSignMeaning(fin.meaning)
                        setSignPose(A2P[fin.pose] || 'wave')
                        if (ttsRef.current) speak(fin.name)
                        pushTok(fin.name)
                        dtwRef.current.reset()
                        tmResultRef.current = null
                    }
                }
            } else {
                stabCnt.current = 0; stabName.current = null; setStabProg(0)
                if (dtwR && dtwR.score < DTW_TH * 0.7) {
                    const m = RULES.find(r => r.name === dtwR.name)
                    if (m) setLiveG({ ...m, dtwOnly: true })
                } else {
                    setLiveG(null)
                }
            }
        } else {
            setHandDet(false); setLiveG(null)
            stabCnt.current = 0; stabName.current = null; setStabProg(0)
        }
    }, [pushTok, sendLandmarks, lstmGesture])

    // 카메라 중지
    const stopCam = () => {
        runRef.current = false
        cancelAnimationFrame(rafRef.current)
        const v = vRef.current
        if (v?.srcObject) { v.srcObject.getTracks().forEach(t => t.stop()); v.srcObject = null }
        try { handsRef.current?.close() } catch (_) {}
        handsRef.current = null
        setCameraOn(false); setHandDet(false); setLiveG(null)
        setShowStopWarn(false); setStabProg(0)
        cvRef.current?.getContext('2d').clearRect(0, 0, 640, 480)
    }

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

    const confirmSentence = useCallback((sentence) => {
        if (!sentence) return
        addMsg('sign', sentence, null)
        const t = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        setSubHist(p => [...p.slice(-9), { text: sentence, time: t }])
        if (ttsRef.current) speak(sentence)
        setSubText('')
        setSubTokens([])
        tokRef.current = []
        prevSentRef.current = ''
    }, [])

    // AI 수어 가이드
    const getAI = async (text) => {
        setAiLoading(true); setAiGuide(null)
        try {
            const data = await fetchSignGuide(text)
            if (!data?.steps?.length) throw new Error('no steps')
            data.steps = data.steps.map(fixAnim)
            setAiGuide(data)
        } catch (e) {
            setAiGuide(null)
        }
        setAiLoading(false)
    }

    // 음성 입력
    const startV = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SR) return
        const r = new SR(); r.lang = 'ko-KR'; r.interimResults = true; r.continuous = true
        recRef.current = r
        r.onresult = e => {
            const t = Array.from(e.results).map(r => r[0].transcript).join('')
            setVoiceText(t)
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
            const v = textInput.trim(); if (v) { setPendingReply(v); setTextInput('') }
        }
    }
    const subTxt = () => { const v = textInput.trim(); if (!v) return; setPendingReply(v); setTextInput('') }

    const sendReply = () => {
        if (!pendingReply) return
        addMsg('voice', pendingReply)
        getAI(pendingReply)
        setPendingReply(null)
    }

    const addMsg = (type, text, pose = null) => {
        const m = {
            id: Date.now() + Math.random(), type, text, pose,
            time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages(p => { const n = [...p, m]; msgsRef.current = n; return n })
    }

    const handleEnd = () => {
        if (cameraOn) { setShowStopWarn(true); return }
        try { recRef.current?.stop() } catch (_) {}
        onEndConversation?.(msgsRef.current)
    }

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
    //  렌더
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

            <div className="top-bar">
                <div className="place-badge">📍 {PLACE_LABEL[place] || place}</div>
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

            <div className="main-grid">
                {/* ── 좌측: 수어 인식 ── */}
                <div className="col col-left">
                    <div className="card">
                        <div className="card-hd">
                            <span>🖐 수어 인식</span>
                            <span className="hd-sub">청각장애인</span>
                            {cameraOn && <span className="badge-rec">● REC</span>}
                        </div>
                        <div className="card-bd">
                            <div className="cam-row">
                                <button className="btn-start" onClick={init} disabled={cameraOn}>▶ Start</button>
                                <button className="btn-stop"  onClick={stopCam} disabled={!cameraOn}>⏹ Stop</button>
                            </div>
                            <div className="vid-box">
                                <canvas ref={cvRef} width={640} height={480} className="cam-cv"
                                        style={{ display: cameraOn ? 'block' : 'none' }}/>
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
                                                            {liveG.dtwOnly && <span className="dtw-badge dtw-only">🔍 DTW</span>}
                                                        </div>
                                                        <div className="live-mean">{liveG.meaning}</div>
                                                        <div className="prog-bar">
                                                            <div className="prog-fill" style={{ width: `${stabProg}%` }}/>
                                                        </div>
                                                        <div className="prog-lbl">동작 유지 {Math.round(stabProg)}%</div>
                                                    </div>
                                                </div>
                                            )
                                            : <p className="live-idle">🔍 동작을 인식하고 있어요...</p>}
                            </div>

                            {lstmGesture && lstmStatus === 'ready' && (
                                <div className="lstm-badge">
                                    🤖 LSTM: <strong>{lstmGesture.name}</strong>
                                    <span className="lstm-conf">{Math.round(lstmGesture.conf * 100)}%</span>
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
                                    setSubTokens([])
                                    setSubText('')
                                    tokRef.current = []
                                    prevSentRef.current = ''
                                    clearTimeout(flushTRef.current)
                                }}
                                onConfirm={confirmSentence}
                            />
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-hd">💬 대화 기록</div>
                        <div className="card-bd">
                            <div className="chat-log">
                                {messages.length === 0
                                    ? (
                                        <div className="chat-empty">
                                            <span>💬</span>
                                            <p>수어 또는 텍스트로<br/>대화를 시작하세요</p>
                                        </div>
                                    )
                                    : messages.map(msg => (
                                        <div key={msg.id} className={`msg msg-${msg.type}`}>
                                            <span className="msg-ico">{msg.type === 'sign' ? '🧏' : '🙋'}</span>
                                            <div className="msg-bd">
                                                <div className="msg-nm">
                                                    {msg.type === 'sign' ? '청각장애인 (수어)' : '담당자 (텍스트)'}
                                                </div>
                                                {msg.pose && msg.type === 'sign' && (
                                                    <div className="msg-mini">
                                                        <MiniHand pose={msg.pose} size={42} running={false}/>
                                                    </div>
                                                )}
                                                <div className="msg-txt">{msg.text}</div>
                                                <div className="msg-ft">
                                                    <button className="btn-msg-tts"
                                                            onClick={() => speak(msg.text.replace(/\p{Emoji}/gu, '').trim())}>
                                                        🔊
                                                    </button>
                                                    <span className="msg-time">{msg.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                <div ref={chatRef}/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 우측: AI 수어 시연 (이미지처럼 좌-입력 / 우-아바타 분할) ── */}
                <div className="col col-right">
                    <div className="card card-ai-redesign">
                        <div className="ai-redesign-wrap">

                            {/* ── 왼쪽: 텍스트 입력 패널 ── */}
                            <div className="ai-input-panel">
                                <div className="ai-input-hd">텍스트 입력</div>

                                <div className="ai-input-body">
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
                                                    disabled={!textInput.trim()}>
                                                    수어문 수출
                                                </button>
                                            </div>

                                            {/* 수어 단어 칩 (guide 있을 때) */}
                                            {aiGuide?.steps?.length > 0 && (
                                                <div className="ai-word-chips-wrap">
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

                                            {/* 음성 입력 토글 */}
                                            <div className="ai-input-tabs">
                                                <button
                                                    className={`ai-itab ${inputMode === 'text' ? 'on' : ''}`}
                                                    onClick={() => setInputMode('text')}>⌨️ 텍스트</button>
                                                <button
                                                    className={`ai-itab ${inputMode === 'voice' ? 'on' : ''}`}
                                                    onClick={() => setInputMode('voice')}>🎙️ 음성</button>
                                            </div>

                                            {inputMode === 'voice' && (
                                                <div className="ai-voice-row">
                                                    <button className={`mic-btn ${listening ? 'mic-on' : ''}`}
                                                            onClick={listening ? stopV : startV}>
                                                        <span>🎙️</span>
                                                        {listening && <div className="mic-ring"/>}
                                                    </button>
                                                    <p className="mic-stat">{listening ? voiceText || '듣고 있어요...' : '버튼을 눌러 말하세요'}</p>
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
                                                <button className="btn-retake" onClick={() => setPendingReply(null)}>↩ 다시 입력</button>
                                                <button className="btn-send-reply" onClick={sendReply}>전송하기 →</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* 3D 아바타 생성 버튼 */}
                                    <button
                                        className={`ai-gen-btn ${aiLoading ? 'ai-gen-loading' : ''}`}
                                        onClick={() => { const v = textInput.trim(); if (v) { setPendingReply(v); setTextInput('') } else if (pendingReply) sendReply() }}
                                        disabled={aiLoading || (!textInput.trim() && !pendingReply)}>
                                        {aiLoading ? '⏳ 변환 중...' : '3D 아바타 생성'}
                                    </button>

                                    <div className="ai-notice">
                                        <p>* 수어문 수출 버튼 클릭 시 텍스트를 기준으로 수어 어휘가 수출되며, 추가, 수정, 삭제를 할 수 있습니다.</p>
                                        <p>* 구성된 수어문은 조합 엔진을 통해 3D아바타로 생성됩니다.</p>
                                    </div>
                                </div>
                            </div>

                            {/* ── 오른쪽: 3D 아바타 패널 ── */}
                            <div className="ai-avatar-panel">
                                <div className="ai-avatar-hd">3D 아바타 생성 결과</div>
                                <div className="ai-avatar-body">
                                    <AIPanel guide={aiGuide} loading={aiLoading}/>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}