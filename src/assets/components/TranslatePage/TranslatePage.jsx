import { useEffect, useRef, useState, useCallback } from 'react'
import './TranslatePage.css'
import useLSTMSign from '../../ai/Uselstmsign.js'

// ══════════════════════════════════════════════════════════════
//  ❶ Teachable Machine 설정 (선택사항)
//  teachablemachine.withgoogle.com/train/pose 에서 학습 후
//  아래 URL을 본인 모델 주소로 교체하세요.
// ══════════════════════════════════════════════════════════════
const TM_MODEL_URL = 'https://teachablemachine.withgoogle.com/models/YOUR_MODEL_ID/'
const TM_THRESHOLD = 0.80
const TM_ENABLED   = !TM_MODEL_URL.includes('YOUR_MODEL_ID')

// ══════════════════════════════════════════════════════════════
//  ❷ API 호출 — 백엔드 프록시 (API 키 브라우저 노출 방지)
// ══════════════════════════════════════════════════════════════
const API_BASE = 'http://localhost:8000'

async function buildSubtitle(words) {
    if (!words.length) return null
    try {
        const res = await fetch(`${API_BASE}/api/subtitle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ words }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const d = await res.json()
        return d.sentence || null
    } catch (e) {
        // 서버 연결 실패 시 단순 연결로 fallback
        return words.join(' ') + '.'
    }
}

async function fetchSignGuide(text) {
    try {
        const res = await fetch(`${API_BASE}/api/sign-guide`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return await res.json()
    } catch (e) {
        return null
    }
}

// ══════════════════════════════════════════════════════════════
//  ❸ DTW 엔진 — 동적 시간 왜곡 거리 기반 동작 인식
// ══════════════════════════════════════════════════════════════
function normalizeLandmarks(lm) {
    const w = lm[0], m = lm[9]
    const s = Math.sqrt((m.x - w.x) ** 2 + (m.y - w.y) ** 2) || 1
    return lm.map(p => [(p.x - w.x) / s, (p.y - w.y) / s, (p.z - w.z) / s])
}

// 핵심 키포인트만 사용해 거리 계산 (손가락 끝 + MCP)
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
//  ❹ Rule-based 제스처 (1차 빠른 필터)
//  손가락 관절 각도로 정적 포즈를 즉시 판단
// ══════════════════════════════════════════════════════════════
const d2 = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
// fsc: 손가락 굽힘 상태 (tip이 pip보다 위에 있으면 펴진 것)
const fsc = (lm, t, p) => ({ up: lm[p].y - lm[t].y > 0.02, yd: lm[p].y - lm[t].y })
// tsc: 엄지 상태
const tsc = (lm) => ({ up: lm[3].y - lm[4].y > 0.01, yd: lm[3].y - lm[4].y })
const isOK   = (lm) => d2(lm[4], lm[8]) < 0.06 && fsc(lm, 12, 10).up && fsc(lm, 16, 14).up && fsc(lm, 20, 18).up
const isOpen = (lm) => [fsc(lm, 8, 6), fsc(lm, 12, 10), fsc(lm, 16, 14), fsc(lm, 20, 18)].every(f => f.up) && tsc(lm).up && d2(lm[5], lm[17]) > 0.15
const isFist = (lm) => [fsc(lm, 8, 6), fsc(lm, 12, 10), fsc(lm, 16, 14), fsc(lm, 20, 18)].every(f => !f.up && f.yd < 0)
const fu = (lm, t, p) => fsc(lm, t, p).up

const RULES = [
    { name: '안녕하세요',    emoji: '👋', meaning: '손을 펼쳐 가볍게 흔드는 인사 동작',          pose: 'wave',      chk: isOpen },
    { name: '괜찮아요',      emoji: '👍', meaning: '엄지손가락을 위로 세우는 동작',              pose: 'thumbUp',   chk: lm => tsc(lm).up && !fu(lm, 8, 6) && !fu(lm, 12, 10) && !fu(lm, 16, 14) && !fu(lm, 20, 18) },
    { name: '싫어요/아니요', emoji: '👎', meaning: '엄지손가락을 아래로 내리는 동작',            pose: 'thumbDown', chk: lm => !tsc(lm).up && tsc(lm).yd < -0.04 && !fu(lm, 8, 6) && !fu(lm, 12, 10) && !fu(lm, 16, 14) && !fu(lm, 20, 18) },
    { name: '맞아요/좋아요', emoji: '✌️', meaning: '검지·중지를 V자로 펼치는 동작',             pose: 'peace',     chk: lm => fu(lm, 8, 6) && fu(lm, 12, 10) && !fu(lm, 16, 14) && !fu(lm, 20, 18) },
    { name: 'OK/알겠어요',   emoji: '👌', meaning: '엄지·검지 끝을 붙여 원을 만드는 동작',      pose: 'ok',        chk: isOK },
    { name: '가리키기',      emoji: '☝️', meaning: '검지만 펴서 위를 가리키는 동작',             pose: 'point',     chk: lm => fu(lm, 8, 6) && !fu(lm, 12, 10) && !fu(lm, 16, 14) && !fu(lm, 20, 18) },
    { name: '사랑해요',      emoji: '🤟', meaning: '엄지·검지·새끼를 펴는 ILY 동작',           pose: 'love',      chk: lm => tsc(lm).up && fu(lm, 8, 6) && !fu(lm, 12, 10) && !fu(lm, 16, 14) && fu(lm, 20, 18) },
    { name: '잠깐만요',      emoji: '✋', meaning: '손바닥 전체를 앞으로 펼치는 동작',           pose: 'stop',      chk: lm => !tsc(lm).up && fu(lm, 8, 6) && fu(lm, 12, 10) && fu(lm, 16, 14) && fu(lm, 20, 18) },
    { name: '전화해요',      emoji: '🤙', meaning: '엄지·새끼를 펴고 귀에 대는 동작',           pose: 'call',      chk: lm => tsc(lm).up && !fu(lm, 8, 6) && !fu(lm, 12, 10) && !fu(lm, 16, 14) && fu(lm, 20, 18) },
    { name: '주먹/힘내요',   emoji: '✊', meaning: '손을 꽉 쥔 주먹 동작',                      pose: 'fist',      chk: isFist },
]

const classify = lm => {
    if (!lm || lm.length < 21) return null
    for (const r of RULES) if (r.chk(lm)) return r
    return null
}

// ══════════════════════════════════════════════════════════════
//  ❺ 3중 투표 — Rule(1.0) + DTW(1.5) + LSTM(3.0) + TM(2.5)
//  LSTM이 가장 높은 가중치를 갖습니다
// ══════════════════════════════════════════════════════════════
function vote({ ruleName, dtwResult, lstmName, lstmConf, tmName, tmProb }) {
    const sc = {}
    const add = (n, w) => { if (n) sc[n] = (sc[n] || 0) + w }
    add(ruleName, 1.0)
    add(dtwResult?.name, 1.5)
    // LSTM: 신뢰도에 비례한 가중치 (최대 3.0)
    if (lstmName && lstmConf >= 0.75) add(lstmName, lstmConf * 3.0)
    // TM
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
//  ❻ 상수
// ══════════════════════════════════════════════════════════════
const STABLE   = 15      // Rule이 이 프레임 이상 유지되어야 확정
const COOLDOWN = 2500    // 같은 단어 재인식 최소 간격 (ms)
const FLUSH    = 6000    // 마지막 토큰 후 자막 자동 생성 대기 (ms)

const A2P = {
    wave: 'wave', thumbUp: 'thumbUp', thumbDown: 'thumbDown',
    peace: 'peace', ok: 'ok', point: 'point',
    love: 'love', stop: 'stop', call: 'call', fist: 'fist',
}

// ══════════════════════════════════════════════════════════════
//  ❼ SVG 캐릭터 + 손 모양
// ══════════════════════════════════════════════════════════════
const POSE = {
    idle:      { a: -15,  h: 'relaxed',   c: '#7c6fff', l: '',           m: 'neutral' },
    wave:      { a: -80,  h: 'open',      c: '#7c6fff', l: '안녕하세요!', m: 'happy', wv: true },
    thumbUp:   { a: -70,  h: 'thumbUp',   c: '#f59e0b', l: '좋아요!',    m: 'happy' },
    thumbDown: { a: -10,  h: 'thumbDown', c: '#ef4444', l: '싫어요',     m: 'sad' },
    peace:     { a: -85,  h: 'peace',     c: '#10b981', l: 'V! 좋아요',  m: 'happy' },
    ok:        { a: -75,  h: 'ok',        c: '#8b5cf6', l: 'OK!',        m: 'happy' },
    point:     { a: -90,  h: 'point',     c: '#06b6d4', l: '저기요!',    m: 'focused' },
    love:      { a: -78,  h: 'love',      c: '#e11d48', l: '사랑해요♥',  m: 'happy' },
    stop:      { a: -60,  h: 'open',      c: '#0ea5e9', l: '잠깐만요!',  m: 'focused' },
    call:      { a: -72,  h: 'call',      c: '#0ea5e9', l: '전화해요!',  m: 'happy' },
    fist:      { a: -65,  h: 'fist',      c: '#ef4444', l: '힘내요!',    m: 'determined' },
}

function HandSVG({ type: t, color: c }) {
    if (t === 'open') return (
        <g>
            <ellipse cx="0" cy="3" rx="11" ry="9" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5" />
            {[[-7,-2,-7,-17],[-3,-1,-3,-20],[1,-1,1,-20],[5,-1,5,-17],[8,2,13,-5]].map(([x1,y1,x2,y2], i) =>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round" />)}
        </g>
    )
    if (t === 'thumbUp') return (
        <g>
            <ellipse cx="0" cy="5" rx="10" ry="8" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5" />
            {[[-4,1,-4,9],[-1,1,-1,9],[2,1,2,9],[5,1,5,9]].map(([x1,y1,x2,y2], i) =>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round" />)}
            <line x1="-8" y1="2" x2="-15" y2="-11" stroke={c} strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="-15" cy="-11" r="2.8" fill={c} />
        </g>
    )
    if (t === 'thumbDown') return (
        <g>
            <ellipse cx="0" cy="-4" rx="10" ry="8" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5" />
            {[[-4,-2,-4,-10],[-1,-2,-1,-10],[2,-2,2,-10],[5,-2,5,-10]].map(([x1,y1,x2,y2], i) =>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round" />)}
            <line x1="-8" y1="-2" x2="-15" y2="10" stroke={c} strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="-15" cy="10" r="2.8" fill={c} />
        </g>
    )
    if (t === 'peace') return (
        <g>
            <ellipse cx="0" cy="3" rx="11" ry="9" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5" />
            <line x1="-5" y1="-1" x2="-5" y2="-19" stroke={c} strokeWidth="4.5" strokeLinecap="round" />
            <line x1="-1" y1="-1" x2="-1" y2="-21" stroke={c} strokeWidth="4.5" strokeLinecap="round" />
            {[[3,-1,3,6],[7,-1,7,5]].map(([x1,y1,x2,y2], i) =>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round" />)}
            <line x1="-9" y1="2" x2="-13" y2="8" stroke={c} strokeWidth="4.5" strokeLinecap="round" />
        </g>
    )
    if (t === 'ok') return (
        <g>
            <ellipse cx="0" cy="3" rx="11" ry="9" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5" />
            <circle cx="-8" cy="-8" r="6" fill="none" stroke={c} strokeWidth="2.5" />
            {[[1,0,1,-17],[5,0,5,-19],[9,0,9,-15]].map(([x1,y1,x2,y2], i) =>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round" />)}
        </g>
    )
    if (t === 'point') return (
        <g>
            <ellipse cx="0" cy="3" rx="10" ry="8" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5" />
            <line x1="-4" y1="-1" x2="-4" y2="-21" stroke={c} strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="-4" cy="-21" r="3.5" fill={c} />
            {[[0,-1,0,6],[4,-1,4,5],[7,-1,7,4]].map(([x1,y1,x2,y2], i) =>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round" />)}
            <line x1="-8" y1="2" x2="-12" y2="8" stroke={c} strokeWidth="4.5" strokeLinecap="round" />
        </g>
    )
    if (t === 'love') return (
        <g>
            <ellipse cx="0" cy="3" rx="12" ry="9" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5" />
            <line x1="-6" y1="-1" x2="-6" y2="-19" stroke={c} strokeWidth="4.5" strokeLinecap="round" />
            {[[-1,-1,-1,6],[3,-1,3,5]].map(([x1,y1,x2,y2], i) =>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round" />)}
            <line x1="7" y1="-1" x2="7" y2="-17" stroke={c} strokeWidth="4.5" strokeLinecap="round" />
            <line x1="-10" y1="2" x2="-15" y2="-11" stroke={c} strokeWidth="4.5" strokeLinecap="round" />
        </g>
    )
    if (t === 'call') return (
        <g>
            <ellipse cx="0" cy="3" rx="10" ry="8" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5" />
            {[[-1,-1,-1,6],[3,-1,3,5],[-3,-1,-3,5]].map(([x1,y1,x2,y2], i) =>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round" />)}
            <line x1="-7" y1="-1" x2="-7" y2="-17" stroke={c} strokeWidth="4.5" strokeLinecap="round" />
            <line x1="6" y1="-1" x2="6" y2="-15" stroke={c} strokeWidth="4.5" strokeLinecap="round" />
        </g>
    )
    if (t === 'fist') return (
        <g>
            <ellipse cx="0" cy="2" rx="12" ry="10" fill={c} opacity="0.4" stroke={c} strokeWidth="2" />
            <rect x="-10" y="-3" width="20" height="10" rx="5" fill={c} opacity="0.5" />
        </g>
    )
    // relaxed (idle)
    return (
        <g>
            <ellipse cx="0" cy="5" rx="10" ry="9" fill={c} opacity="0.2" stroke={c} strokeWidth="1.5" />
            {[[-5,0,-5,10],[-2,0,-2,12],[2,0,2,12],[5,0,5,10]].map(([x1,y1,x2,y2], i) =>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4" strokeLinecap="round" />)}
            <line x1="-8" y1="2" x2="-12" y2="10" stroke={c} strokeWidth="4" strokeLinecap="round" />
        </g>
    )
}

function CharSVG({ pose = 'idle', anim = false }) {
    const cfg = POSE[pose] || POSE.idle, c = cfg.c
    const ang = cfg.a * (Math.PI / 180), L = 62
    const ex = 195 + Math.cos(ang) * L * 0.5, ey = 148 + Math.sin(ang) * L * 0.5
    const hx = 195 + Math.cos(ang) * L,       hy = 148 + Math.sin(ang) * L
    const hp = cfg.m === 'happy', sd = cfg.m === 'sad', fc = cfg.m === 'focused'
    return (
        <svg viewBox="0 0 320 295" xmlns="http://www.w3.org/2000/svg" className="char-svg">
            <defs>
                <radialGradient id={`bg_${pose}`} cx="50%" cy="65%" r="55%">
                    <stop offset="0%" stopColor={c} stopOpacity="0.1" />
                    <stop offset="100%" stopColor={c} stopOpacity="0" />
                </radialGradient>
                <radialGradient id="sk" cx="38%" cy="32%" r="65%">
                    <stop offset="0%" stopColor="#fde8d8" />
                    <stop offset="100%" stopColor="#f4ba94" />
                </radialGradient>
                <filter id="dr">
                    <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.1" />
                </filter>
            </defs>
            <ellipse cx="160" cy="230" rx="115" ry="28" fill={c} opacity="0.07" />
            <circle cx="160" cy="185" r="125" fill={`url(#bg_${pose})`} />
            <path d="M 108 165 Q 90 172 86 248 L 234 248 Q 230 172 212 165 Q 188 154 160 157 Q 132 154 108 165 Z"
                  fill={c} opacity="0.82" filter="url(#dr)" />
            <path d="M 143 162 Q 155 170 160 170 Q 165 170 177 162 L 172 182 Q 160 190 148 182 Z"
                  fill="white" opacity="0.88" />
            <line x1="125" y1="165" x2="112" y2="220" stroke={c} strokeWidth="19" strokeLinecap="round" opacity="0.80" />
            <line x1="195" y1="148" x2={ex} y2={ey} stroke={c} strokeWidth="19" strokeLinecap="round" opacity="0.82"
                  className={anim && cfg.wv ? 'arm-wave' : ''} style={{ transformOrigin: '195px 148px' }} />
            <line x1={ex} y1={ey} x2={hx} y2={hy} stroke={c} strokeWidth="18" strokeLinecap="round" opacity="0.78"
                  className={anim && cfg.wv ? 'arm-wave' : ''} style={{ transformOrigin: '195px 148px' }} />
            <g transform={`translate(${hx},${hy})`}><HandSVG type={cfg.h} color={c} /></g>
            {anim && pose !== 'idle' && [
                { cx: hx - 14, cy: hy - 14, r: 4, k: 'p1' },
                { cx: hx + 9,  cy: hy - 18, r: 3, k: 'p2' },
                { cx: hx - 4,  cy: hy - 26, r: 2.5, k: 'p3' },
            ].map((p, i) =>
                <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={c} opacity="0.38" className={`char-particle ${p.k}`} />
            )}
            <rect x="151" y="133" width="18" height="30" rx="9" fill="url(#sk)" stroke="#e09070" strokeWidth="0.8" />
            <ellipse cx="160" cy="100" rx="40" ry="44" fill="url(#sk)" stroke="#e09070" strokeWidth="1.3" filter="url(#dr)" />
            <ellipse cx="132" cy="110" rx="9" ry="6" fill="#f9a8a8" opacity="0.38" />
            <ellipse cx="188" cy="110" rx="9" ry="6" fill="#f9a8a8" opacity="0.38" />
            <ellipse cx="160" cy="72" rx="42" ry="24" fill="#222" />
            <path d="M 120 90 Q 114 75 122 61 Q 132 50 160 55 Q 188 50 198 61 Q 206 75 200 90" fill="#222" />
            <ellipse cx="120" cy="105" rx="6.5" ry="8" fill="url(#sk)" stroke="#e09070" strokeWidth="0.8" />
            <ellipse cx="200" cy="105" rx="6.5" ry="8" fill="url(#sk)" stroke="#e09070" strokeWidth="0.8" />
            {fc ? (
                <>
                    <path d="M 141 90 Q 147 86 153 89" fill="none" stroke="#222" strokeWidth="2.2" strokeLinecap="round" />
                    <path d="M 167 89 Q 173 86 179 90" fill="none" stroke="#222" strokeWidth="2.2" strokeLinecap="round" />
                </>
            ) : sd ? (
                <>
                    <path d="M 141 91 Q 147 95 153 90" fill="none" stroke="#222" strokeWidth="2.2" strokeLinecap="round" />
                    <path d="M 167 90 Q 173 95 179 91" fill="none" stroke="#222" strokeWidth="2.2" strokeLinecap="round" />
                </>
            ) : (
                <>
                    <path d="M 141 91 Q 147 88 153 90" fill="none" stroke="#222" strokeWidth="2.2" strokeLinecap="round" />
                    <path d="M 167 90 Q 173 88 179 91" fill="none" stroke="#222" strokeWidth="2.2" strokeLinecap="round" />
                </>
            )}
            <ellipse cx="147" cy="98" rx="7.5" ry="7.5" fill="white" stroke="#ddd" strokeWidth="0.5" />
            <ellipse cx="173" cy="98" rx="7.5" ry="7.5" fill="white" stroke="#ddd" strokeWidth="0.5" />
            <circle cx="148" cy="99" r="5" fill="#1a1a1a" />
            <circle cx="174" cy="99" r="5" fill="#1a1a1a" />
            <circle cx="150" cy="97" r="1.7" fill="white" />
            <circle cx="176" cy="97" r="1.7" fill="white" />
            <path d="M 157 104 Q 155 111 158 113 Q 162 115 166 113 Q 169 111 163 104"
                  fill="none" stroke="#c8805a" strokeWidth="1.4" strokeLinecap="round" />
            {hp
                ? <path d="M 149 120 Q 160 130 171 120" fill="none" stroke="#b85540" strokeWidth="2.3" strokeLinecap="round" />
                : sd
                    ? <path d="M 149 126 Q 160 118 171 126" fill="none" stroke="#b85540" strokeWidth="2.3" strokeLinecap="round" />
                    : <path d="M 151 123 Q 160 127 169 123" fill="none" stroke="#b85540" strokeWidth="2" strokeLinecap="round" />}
        </svg>
    )
}

// ══════════════════════════════════════════════════════════════
//  ❽ AIPanel — AI 수어 시연 패널
// ══════════════════════════════════════════════════════════════
function AIPanel({ guide, loading }) {
    const [idx, setIdx] = useState(0)
    const [play, setPlay] = useState(true)
    const tr = useRef(null)
    useEffect(() => { setIdx(0); setPlay(true) }, [guide])
    useEffect(() => {
        if (!play || !guide?.steps?.length) return
        clearTimeout(tr.current)
        tr.current = setTimeout(() => setIdx(s => (s + 1) % guide.steps.length), 3000)
        return () => clearTimeout(tr.current)
    }, [play, idx, guide])

    if (loading) return (
        <div className="ai-panel ai-panel-loading">
            <div className="ai-char-area"><CharSVG pose="idle" /></div>
            <div className="ai-loading-msg">
                <div className="typing-dots"><span /><span /><span /></div>
                <p>답장을 수어로 변환하는 중...</p>
            </div>
        </div>
    )
    if (!guide) return (
        <div className="ai-panel ai-panel-empty">
            <div className="ai-char-area"><CharSVG pose="idle" /></div>
            <p className="ai-empty-txt">텍스트 답장을 전송하면<br />이 캐릭터가 수어로<br />직접 설명해드립니다 🤟</p>
        </div>
    )

    const st = guide.steps[idx]
    const po = A2P[st?.animType] || 'wave'
    const cfg = POSE[po] || POSE.idle
    return (
        <div className="ai-panel">
            <div className="ai-char-area">
                {cfg.l && play && <div className="speech-bubble" style={{ '--bc': cfg.c }}>{cfg.l}</div>}
                <CharSVG pose={po} anim={play} />
            </div>
            <div className="ai-summary" style={{ borderColor: cfg.c + '55', background: cfg.c + '0e' }}>
                <span className="ai-summary-icon">💬</span>
                <span className="ai-summary-txt">{guide.summary}</span>
            </div>
            <div className="ai-step-box" style={{ borderLeftColor: cfg.c }}>
                <div className="ai-step-top">
                    <span className="ai-step-num" style={{ background: cfg.c }}>{idx + 1}/{guide.steps.length}</span>
                    <span className="ai-step-word" style={{ color: cfg.c }}>{st?.word}</span>
                </div>
                <div className="ai-step-rows">
                    <div className="ai-step-row"><span>✋</span>{st?.handShape}</div>
                    <div className="ai-step-row"><span>🔄</span>{st?.movement}</div>
                    <div className="ai-step-row"><span>😊</span>{st?.expression}</div>
                </div>
            </div>
            <div className="ai-controls">
                <div className="ai-chips">
                    {guide.steps.map((s, i) => (
                        <button key={i}
                                className={`ai-chip ${i === idx ? 'ai-chip-on' : ''}`}
                                style={i === idx ? { background: cfg.c, borderColor: cfg.c } : {}}
                                onClick={() => { setIdx(i); setPlay(false) }}>
                            {i + 1}. {s.word}
                        </button>
                    ))}
                </div>
                <button className="ai-play-btn" style={{ background: cfg.c }} onClick={() => setPlay(p => !p)}>
                    {play ? '⏸ 일시정지' : '▶ 재생'}
                </button>
            </div>
            {guide.tip && <div className="ai-tip">💡 {guide.tip}</div>}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════
//  ❾ 미니 손 캔버스 애니메이션
// ══════════════════════════════════════════════════════════════
function drawMiniHand(ctx, { thumb, index, middle, ring, pinky, td = 'up' }, color) {
    ctx.beginPath(); ctx.ellipse(0, 7, 20, 16, 0, 0, Math.PI * 2)
    ctx.fillStyle = color + '22'; ctx.fill()
    ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.stroke()
    ;[
        { x: -11, fL: 12, eL: 32, show: index },
        { x: -4,  fL: 10, eL: 38, show: middle },
        { x: 4,   fL: 10, eL: 34, show: ring },
        { x: 12,  fL: 9,  eL: 27, show: pinky },
    ].forEach(f => {
        const len = f.show ? f.eL : f.fL, ey = -5 - len
        ctx.beginPath(); ctx.moveTo(f.x, -4); ctx.lineTo(f.x, ey)
        ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke()
        ctx.beginPath(); ctx.arc(f.x, ey, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = color; ctx.fill()
    })
    if (thumb) {
        const [sx, sy, ex, ey] = td === 'up' ? [-19, 2, -28, -13] : [-19, 10, -28, 23]
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey)
        ctx.strokeStyle = color; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.stroke()
        ctx.beginPath(); ctx.arc(ex, ey, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = color; ctx.fill()
    } else {
        ctx.beginPath(); ctx.moveTo(-16, 3); ctx.lineTo(-21, 12)
        ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke()
    }
}

const MA = {
    wave:      { fr: 18, draw: (c, t, W, H) => { c.save(); c.translate(W/2, H*.62); c.rotate(Math.sin(t*Math.PI*2)*.28); drawMiniHand(c, { thumb: true, index: 1, middle: 1, ring: 1, pinky: 1 }, '#7c6fff'); c.restore() } },
    thumbUp:   { fr: 10, draw: (c, t, W, H) => { const b = Math.abs(Math.sin(t*Math.PI))*7; c.save(); c.translate(W/2, H*.6-b); drawMiniHand(c, { thumb: true, index: 0, middle: 0, ring: 0, pinky: 0, td: 'up' }, '#f59e0b'); c.restore() } },
    thumbDown: { fr: 10, draw: (c, t, W, H) => { const b = Math.abs(Math.sin(t*Math.PI))*7; c.save(); c.translate(W/2, H*.5+b); drawMiniHand(c, { thumb: true, index: 0, middle: 0, ring: 0, pinky: 0, td: 'down' }, '#ef4444'); c.restore() } },
    peace:     { fr: 8,  draw: (c, t, W, H) => { const s = 1+Math.sin(t*Math.PI*2)*.04; c.save(); c.translate(W/2, H*.6); c.scale(s,s); drawMiniHand(c, { thumb: false, index: 1, middle: 1, ring: 0, pinky: 0 }, '#10b981'); c.restore() } },
    ok:        { fr: 14, draw: (c, t, W, H) => { c.save(); c.translate(W/2, H*.6); drawMiniHand(c, { thumb: false, index: 0, middle: 1, ring: 1, pinky: 1 }, '#8b5cf6'); const r = 9+Math.sin(t*Math.PI*2)*2; c.beginPath(); c.arc(-14,-18,r,0,Math.PI*2); c.strokeStyle='#8b5cf6'; c.lineWidth=2.2; c.stroke(); c.restore() } },
    point:     { fr: 10, draw: (c, t, W, H) => { const my = Math.sin(t*Math.PI*2)*5; c.save(); c.translate(W/2, H*.62+my); drawMiniHand(c, { thumb: false, index: 1, middle: 0, ring: 0, pinky: 0 }, '#06b6d4'); c.restore() } },
    love:      { fr: 12, draw: (c, t, W, H) => { const p = 1+Math.sin(t*Math.PI*2)*.05; c.save(); c.translate(W/2, H*.6); c.scale(p,p); drawMiniHand(c, { thumb: true, index: 1, middle: 0, ring: 0, pinky: 1 }, '#e11d48'); c.restore() } },
    stop:      { fr: 12, draw: (c, t, W, H) => { const p = Math.sin(t*Math.PI*2)*4; c.save(); c.translate(W/2+p, H*.6); drawMiniHand(c, { thumb: false, index: 1, middle: 1, ring: 1, pinky: 1 }, '#0ea5e9'); c.restore() } },
    call:      { fr: 14, draw: (c, t, W, H) => { const tl = Math.sin(t*Math.PI*2)*.14; c.save(); c.translate(W/2, H*.6); c.rotate(tl); drawMiniHand(c, { thumb: true, index: 0, middle: 0, ring: 0, pinky: 1 }, '#0ea5e9'); c.restore() } },
    fist:      { fr: 10, draw: (c, t, W, H) => { const sh = Math.sin(t*Math.PI*4)*2.5; c.save(); c.translate(W/2+sh, H*.6); drawMiniHand(c, { thumb: false, index: 0, middle: 0, ring: 0, pinky: 0 }, '#ef4444'); c.restore() } },
}

function MiniHand({ pose = 'wave', size = 60, running = true }) {
    const ref = useRef(null), raf = useRef(null)
    const am = MA[pose] || MA.wave
    useEffect(() => {
        const cv = ref.current; if (!cv) return
        const ctx = cv.getContext('2d'); let f = 0
        const r = () => {
            ctx.clearRect(0, 0, cv.width, cv.height)
            am.draw(ctx, (f % am.fr) / am.fr, cv.width, cv.height)
            f++
            if (running) raf.current = requestAnimationFrame(r)
        }
        if (running) raf.current = requestAnimationFrame(r)
        else am.draw(ctx, 0, cv.width, cv.height)
        return () => cancelAnimationFrame(raf.current)
    }, [pose, running])
    return <canvas ref={ref} width={size} height={size} className="mini-hand" />
}

// ══════════════════════════════════════════════════════════════
//  ❿ TTS
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
//  ⓫ 자막 패널 — 문장 생성 → 맞음 확인 → 전송 흐름
// ══════════════════════════════════════════════════════════════
function SubPanel({ tokens, text, loading, history, onFlush, onClear, onConfirm, tmStatus, lstmStatus }) {
    const tmDot  = { ready: '#10b981', loading: '#f59e0b', error: '#ef4444', off: '#94a3b8' }[tmStatus]  || '#94a3b8'
    const tmLbl  = { ready: 'TM 준비됨 ✓', loading: 'TM 로딩 중...', error: 'TM 실패 — DTW 모드', off: 'TM 비활성' }[tmStatus]
    const lstmDot = { ready: '#10b981', connecting: '#f59e0b', disconnected: '#94a3b8', error: '#ef4444' }[lstmStatus] || '#94a3b8'
    const lstmLbl = { ready: 'LSTM 연결됨 ✓', connecting: 'LSTM 연결 중...', disconnected: 'LSTM 미연결', error: 'LSTM 오류' }[lstmStatus] || 'LSTM 미연결'

    // 문장이 생성된 상태 (확인 대기)
    const hasSentence = !loading && !!text

    return (
        <div className="subtitle-panel">
            {/* 상태 바 */}
            <div className="tm-status-bar">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: tmDot, display: 'inline-block', marginRight: 4 }} />
                <span className="tm-label">{tmLbl}</span>
                <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: lstmDot, display: 'inline-block', marginRight: 4 }} />
                <span className="tm-label">{lstmLbl}</span>
            </div>

            {/* ── 문장 생성 중 ── */}
            {loading && (
                <div className="subtitle-loading">
                    <div className="typing-dots"><span /><span /><span /></div>
                    <span>문장을 만드는 중...</span>
                </div>
            )}

            {/* ── 문장 생성 전: 안내 + 수동 생성 버튼 ── */}
            {!loading && !text && (
                <div className="sub-idle-area">
                    <p className="subtitle-hint">수어 동작을 하면 자동으로 문장이 생성됩니다</p>
                    {tokens.length > 0 && (
                        <button className="token-flush-btn" onClick={onFlush}>✨ 지금 문장 생성</button>
                    )}
                </div>
            )}

            {/* ── 문장 생성 완료: 확인 카드 ── */}
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

            {/* ── 이전 대화 이력 ── */}
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
//  ⓬ 메인 컴포넌트
// ══════════════════════════════════════════════════════════════
export default function TranslatePage({ onEndConversation }) {
    // ── 상태 ──────────────────────────────────────────────────
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

    // ── Refs ──────────────────────────────────────────────────
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
    const tmResultRef  = useRef(null)   // TM 비동기 결과 보관 (중복 pushTok 방지)
    const flushTRef    = useRef(null)
    const tokRef       = useRef([])

    // ── LSTM WebSocket 훅 ─────────────────────────────────────
    // useLSTMSign이 server.py와 WebSocket으로 연결됩니다.
    // onGesture: LSTM이 단어를 확정하면 호출됨
    // onSentence: server.py가 자동으로 자막을 생성하면 호출됨
    const { lstmStatus, lstmGesture, sendLandmarks } = useLSTMSign({
        onGesture: useCallback((name, conf) => {
            // LSTM이 인식한 결과를 토큰 버퍼에 추가
            // (이미 Rule/DTW에서 같은 단어가 추가됐을 경우를 대비해
            //  COOLDOWN 체크는 server.py에서 이미 처리함)
            if (name && conf >= 0.75) {
                pushTok(name)
            }
        }, []),  // pushTok은 아래에서 선언되므로 의존성 별도 처리
        onSentence: useCallback((sentence) => {
            // server.py 자동 생성 문장 → SubPanel 확인 카드로 표시
            if (sentence) {
                setSubText(sentence)
                // TTS·전송은 사용자가 "맞음·전송하기" 눌렀을 때 confirmSentence에서 처리
            }
        }, []),
    })

    // ── ttsRef 동기화 ────────────────────────────────────────
    useEffect(() => { ttsRef.current = ttsOn }, [ttsOn])

    // ── 채팅 자동 스크롤 ─────────────────────────────────────
    useEffect(() => { chatRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

    // ── TM 로드 ───────────────────────────────────────────────
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

    // ── 자막 생성 ─────────────────────────────────────────────
    const flushSub = useCallback(async (toks) => {
        if (!toks?.length) return
        setSubLoading(true)
        setSubTokens([])
        tokRef.current = []
        const s = await buildSubtitle(toks)
        setSubLoading(false)
        if (s) {
            setSubText(s)
            // TTS는 사용자가 "맞음·전송" 확인 후에만 재생
        }
    }, [])

    // ── 토큰 추가 ─────────────────────────────────────────────
    // setSubTokens 콜백 안에서 tokRef를 동기화해 stale 문제 방지
    const pushTok = useCallback((name) => {
        const w = name.replace(/\p{Emoji}/gu, '').trim()
        if (!w) return
        setSubTokens(prev => {
            const next = [...prev, w]
            tokRef.current = next   // setState 콜백 내부에서 동기화
            return next
        })
        clearTimeout(flushTRef.current)
        flushTRef.current = setTimeout(() => {
            if (tokRef.current.length > 0) flushSub([...tokRef.current])
        }, FLUSH)
    }, [flushSub])

    // ── MediaPipe 로드 ────────────────────────────────────────
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

    // ── 카메라 시작 ───────────────────────────────────────────
    const init = async () => {
        setMpError(null)
        try {
            await loadMP()
            if (handsRef.current) { try { handsRef.current.close() } catch (_) { } handsRef.current = null }
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

    // ══════════════════════════════════════════════════════════
    //  onResults — Rule + DTW + TM 3중 투표
    //  (LSTM은 useLSTMSign의 onGesture 콜백으로 별도 수신)
    //
    //  핵심 수정사항:
    //  1. tmStatusRef를 사용해 stale closure 방지
    //  2. TM 결과를 tmResultRef에만 저장 (pushTok은 vote 후 1번만)
    //  3. LSTM 랜드마크를 sendLandmarks로 전달
    // ══════════════════════════════════════════════════════════
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

            // ── LSTM 서버로 랜드마크 전송 (useLSTMSign이 처리) ──
            sendLandmarks(lm)

            // ── DTW 버퍼 업데이트 ──
            dtwRef.current.push(lm)

            // ── TM 비동기 실행 — 결과만 ref에 저장, pushTok 안 함 ──
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

            // ── Rule + DTW 동기 실행 ──
            const rg   = classify(lm)
            const dtwR = dtwRef.current.recognize()

            // TM 결과를 ref에서 읽어와 함께 vote
            const fv = vote({
                ruleName:  rg?.name || null,
                dtwResult: dtwR,
                lstmName:  lstmGesture?.name || null,  // 최신 LSTM 결과 참조
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

                        // vote 결과 우선, 없으면 Rule 결과 사용
                        const fin = (fv?.name ? RULES.find(r => r.name === fv.name) || rg : rg)
                        setPendingSign(`${fin.emoji} ${fin.name}`)
                        setSignMeaning(fin.meaning)
                        setSignPose(A2P[fin.pose] || 'wave')
                        if (ttsRef.current) speak(fin.name)
                        pushTok(fin.name)   // 이모지 없이 클린 텍스트로 저장
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

    // ── 카메라 중지 ───────────────────────────────────────────
    const stopCam = () => {
        runRef.current = false
        cancelAnimationFrame(rafRef.current)
        const v = vRef.current
        if (v?.srcObject) { v.srcObject.getTracks().forEach(t => t.stop()); v.srcObject = null }
        try { handsRef.current?.close() } catch (_) { }
        handsRef.current = null
        setCameraOn(false); setHandDet(false); setLiveG(null)
        setShowStopWarn(false); setStabProg(0)
        cvRef.current?.getContext('2d').clearRect(0, 0, 640, 480)
    }

    // ── 수어 확정 / 재촬영 ───────────────────────────────────
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

    // ── 생성 문장 확인 후 전송 ("맞음·전송하기" 버튼) ────────
    const confirmSentence = useCallback((sentence) => {
        if (!sentence) return
        // 대화 기록에 추가
        addMsg('sign', sentence, null)
        // 이력에 저장
        const t = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        setSubHist(p => [...p.slice(-9), { text: sentence, time: t }])
        // TTS 재생 (확인 완료 후)
        if (ttsRef.current) speak(sentence)
        // 자막 초기화 → 다음 인식 준비
        setSubText('')
        setSubTokens([])
        tokRef.current = []
    }, [])

    // ── animType 유효성 보정 ─────────────────────────────────
    const VAT = new Set(['wave','thumbUp','thumbDown','peace','ok','point','love','stop','call','fist'])
    const fixAnim = s => {
        if (VAT.has(s.animType)) return s
        const w = (s.word + s.handShape + s.movement).toLowerCase()
        let f = 'wave'
        if (w.includes('엄지') && (w.includes('위') || w.includes('좋'))) f = 'thumbUp'
        else if (w.includes('엄지') && w.includes('아래')) f = 'thumbDown'
        else if (w.includes('v') || w.includes('브이')) f = 'peace'
        else if (w.includes('ok') || w.includes('알겠')) f = 'ok'
        else if (w.includes('가리')) f = 'point'
        else if (w.includes('사랑')) f = 'love'
        else if (w.includes('잠깐') || w.includes('정지')) f = 'stop'
        else if (w.includes('전화')) f = 'call'
        else if (w.includes('주먹')) f = 'fist'
        return { ...s, animType: f }
    }

    // ── AI 수어 가이드 (백엔드 프록시) ──────────────────────
    const getAI = async (text) => {
        setAiLoading(true); setAiGuide(null)
        try {
            const data = await fetchSignGuide(text)
            if (!data?.steps?.length) throw new Error('no steps')
            data.steps = data.steps.map(fixAnim)
            setAiGuide(data)
        } catch (e) {
            // 서버 연결 실패 시 간단한 fallback 가이드
            const gi = /안녕|반갑/i.test(text), po = /좋|네|감사/i.test(text), ne = /아니|싫/i.test(text)
            setAiGuide({
                summary: text.slice(0, 12), urgency: gi ? 'greeting' : 'normal',
                steps: [{ order: 1, word: text.slice(0, 10), handShape: '손을 앞으로 펼침', movement: '천천히 또렷하게', expression: '밝은 표정', animType: gi ? 'wave' : po ? 'thumbUp' : ne ? 'thumbDown' : 'wave' }],
                tip: 'server.py가 실행 중인지 확인하세요.', difficulty: 'easy',
            })
        }
        setAiLoading(false)
    }

    // ── 음성 입력 ─────────────────────────────────────────────
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

    // ── 텍스트 입력 ───────────────────────────────────────────
    const htk = e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            const v = textInput.trim(); if (v) { setPendingReply(v); setTextInput('') }
        }
    }
    const subTxt = () => { const v = textInput.trim(); if (!v) return; setPendingReply(v); setTextInput('') }

    // ── 답장 전송 ─────────────────────────────────────────────
    const sendReply = () => {
        if (!pendingReply) return
        addMsg('voice', pendingReply)
        getAI(pendingReply)
        setPendingReply(null)
    }

    // ── 메시지 추가 ───────────────────────────────────────────
    const addMsg = (type, text, pose = null) => {
        const m = {
            id: Date.now() + Math.random(), type, text, pose,
            time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages(p => { const n = [...p, m]; msgsRef.current = n; return n })
    }

    // ── 대화 종료 ─────────────────────────────────────────────
    const handleEnd = () => {
        if (cameraOn) { setShowStopWarn(true); return }
        try { recRef.current?.stop() } catch (_) { }
        onEndConversation?.(msgsRef.current)
    }

    // ── 언마운트 정리 ─────────────────────────────────────────
    useEffect(() => () => {
        runRef.current = false
        cancelAnimationFrame(rafRef.current)
        clearTimeout(flushTRef.current)
        const v = vRef.current
        if (v?.srcObject) v.srcObject.getTracks().forEach(t => t.stop())
        try { handsRef.current?.close() } catch (_) { }
        try { recRef.current?.stop() } catch (_) { }
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
                <label className="tts-toggle">
                    <input type="checkbox" checked={ttsOn} onChange={e => setTtsOn(e.target.checked)} />
                    <span className="tts-slider" />
                    <span>🔊 수어 읽기</span>
                </label>
                <div className="top-bar-r">
                    <span className="end-hint">종료 전 Stop 먼저</span>
                    <button className="btn-end" onClick={handleEnd}>대화 종료 →</button>
                </div>
            </div>

            <video ref={vRef} style={{ display: 'none' }} playsInline muted />

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
                                        style={{ display: cameraOn ? 'block' : 'none' }} />
                                {!cameraOn && (
                                    <div className="vid-ph">
                                        <span>🤟</span>
                                        <p>▶ Start를 눌러<br />카메라를 시작하세요</p>
                                    </div>
                                )}
                            </div>

                            {/* 실시간 인식 표시 */}
                            <div className="live-box">
                                {!cameraOn
                                    ? <p className="live-idle">카메라를 켜면 수어 인식이 시작됩니다</p>
                                    : !handDet
                                        ? <p className="live-idle">✋ 손을 카메라 앞에 보여주세요</p>
                                        : liveG
                                            ? (
                                                <div className="live-hit">
                                                    <MiniHand pose={A2P[liveG.pose] || 'wave'} size={54} running={true} />
                                                    <div className="live-info">
                                                        <div className="live-name">
                                                            {liveG.emoji} {liveG.name}
                                                            {liveG.dtwOnly && <span className="dtw-badge dtw-only">🔍 DTW</span>}
                                                        </div>
                                                        <div className="live-mean">{liveG.meaning}</div>
                                                        <div className="prog-bar">
                                                            <div className="prog-fill" style={{ width: `${stabProg}%` }} />
                                                        </div>
                                                        <div className="prog-lbl">동작 유지 {Math.round(stabProg)}%</div>
                                                    </div>
                                                </div>
                                            )
                                            : <p className="live-idle">🔍 동작을 인식하고 있어요...</p>}
                            </div>

                            {/* LSTM 실시간 표시 */}
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
                                    clearTimeout(flushTRef.current)
                                }}
                                onConfirm={confirmSentence}
                            />
                        </div>
                    </div>

                    {/* 대화 기록 */}
                    <div className="card">
                        <div className="card-hd">💬 대화 기록</div>
                        <div className="card-bd">
                            <div className="chat-log">
                                {messages.length === 0
                                    ? (
                                        <div className="chat-empty">
                                            <span>💬</span>
                                            <p>수어 또는 텍스트로<br />대화를 시작하세요</p>
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
                                                        <MiniHand pose={msg.pose} size={42} running={false} />
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
                                <div ref={chatRef} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 우측: 텍스트 입력 + AI 시연 ── */}
                <div className="col col-right">
                    <div className="card">
                        <div className="card-hd">
                            <span>{inputMode === 'voice' ? '🎙️ 음성 답장' : '⌨️ 텍스트 답장'}</span>
                            {listening && <span className="badge-live">● LIVE</span>}
                            <div className="itabs">
                                <button className={`itab ${inputMode === 'text' ? 'itab-on' : ''}`} onClick={() => setInputMode('text')}>⌨️ 텍스트</button>
                                <button className={`itab ${inputMode === 'voice' ? 'itab-on' : ''}`} onClick={() => setInputMode('voice')}>🎙️ 음성</button>
                            </div>
                        </div>
                        <div className="card-bd">
                            {!pendingReply ? (
                                <>
                                    {inputMode === 'text' && (
                                        <div className="txt-box">
                                            <p className="txt-hint">청각장애인에게 전달할 내용을 입력하세요</p>
                                            <div className="txt-row">
                                                <textarea ref={taRef} className="txt-area"
                                                          placeholder="내용을 입력하세요..."
                                                          value={textInput}
                                                          onChange={e => setTextInput(e.target.value)}
                                                          onKeyDown={htk}
                                                          rows={3} />
                                                <button className={`btn-prev ${textInput.trim() ? 'btn-prev-on' : ''}`}
                                                        onClick={subTxt}
                                                        disabled={!textInput.trim()}>
                                                    미리<br />보기<br />↑
                                                </button>
                                            </div>
                                            <p className="txt-sub">Shift+Enter 줄바꿈 / Enter 미리보기</p>
                                        </div>
                                    )}
                                    {inputMode === 'voice' && (
                                        <div className="voice-box">
                                            <button className={`mic-btn ${listening ? 'mic-on' : ''}`}
                                                    onClick={listening ? stopV : startV}>
                                                <span>🎙️</span>
                                                {listening && <div className="mic-ring" />}
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
                        </div>
                    </div>

                    <div className="card card-ai">
                        <div className="card-hd">
                            <span>🤖 AI 수어 시연</span>
                            {aiLoading && <span className="badge-live">● 변환 중...</span>}
                            <span className="hd-sub">장애인에게 화면을 보여주세요</span>
                        </div>
                        <div className="card-bd p0">
                            <AIPanel guide={aiGuide} loading={aiLoading} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}