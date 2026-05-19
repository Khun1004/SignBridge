// ══════════════════════════════════════════════════════════════
//  Person3D.jsx — 코드 기반 수어 애니메이션
//
//  public/animations/ 에 아래 파일만 필요:
//    Idle.fbx  (With Skin) ← 캐릭터 메시 + 기본 대기 포즈
//
//  나머지 포즈(hello, thanks 등)는 FBX 없이
//  Three.js로 본(bone)을 직접 회전시켜 구현합니다.
// ══════════════════════════════════════════════════════════════
import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'

const FBX_BASE = '/animations/'

// ── Mixamo 본 이름 매핑 ───────────────────────────────────────
const B = {
    hips:       'mixamorig:Hips',
    spine:      'mixamorig:Spine',
    spine1:     'mixamorig:Spine1',
    spine2:     'mixamorig:Spine2',
    neck:       'mixamorig:Neck',
    head:       'mixamorig:Head',
    // 왼팔
    lShoulder:  'mixamorig:LeftShoulder',
    lArm:       'mixamorig:LeftArm',
    lForeArm:   'mixamorig:LeftForeArm',
    lHand:      'mixamorig:LeftHand',
    // 왼 손가락
    lThumb1:    'mixamorig:LeftHandThumb1',
    lThumb2:    'mixamorig:LeftHandThumb2',
    lThumb3:    'mixamorig:LeftHandThumb3',
    lIndex1:    'mixamorig:LeftHandIndex1',
    lIndex2:    'mixamorig:LeftHandIndex2',
    lIndex3:    'mixamorig:LeftHandIndex3',
    lMiddle1:   'mixamorig:LeftHandMiddle1',
    lMiddle2:   'mixamorig:LeftHandMiddle2',
    lRing1:     'mixamorig:LeftHandRing1',
    lRing2:     'mixamorig:LeftHandRing2',
    lPinky1:    'mixamorig:LeftHandPinky1',
    lPinky2:    'mixamorig:LeftHandPinky2',
    // 오른팔
    rShoulder:  'mixamorig:RightShoulder',
    rArm:       'mixamorig:RightArm',
    rForeArm:   'mixamorig:RightForeArm',
    rHand:      'mixamorig:RightHand',
    // 오른 손가락
    rThumb1:    'mixamorig:RightHandThumb1',
    rThumb2:    'mixamorig:RightHandThumb2',
    rThumb3:    'mixamorig:RightHandThumb3',
    rIndex1:    'mixamorig:RightHandIndex1',
    rIndex2:    'mixamorig:RightHandIndex2',
    rIndex3:    'mixamorig:RightHandIndex3',
    rMiddle1:   'mixamorig:RightHandMiddle1',
    rMiddle2:   'mixamorig:RightHandMiddle2',
    rRing1:     'mixamorig:RightHandRing1',
    rRing2:     'mixamorig:RightHandRing2',
    rPinky1:    'mixamorig:RightHandPinky1',
    rPinky2:    'mixamorig:RightHandPinky2',
}

// ── 유틸: 본 맵 빌드 ─────────────────────────────────────────
function buildBoneMap(fbx) {
    const map = {}
    fbx.traverse(obj => {
        if (obj.isBone || obj.type === 'Bone') {
            map[obj.name] = obj
        }
    })
    return map
}

// ── 유틸: 쿼터니언 slerp 헬퍼 ────────────────────────────────
function setRot(bone, x, y, z, order = 'XYZ') {
    if (!bone) return
    const e = new THREE.Euler(x, y, z, order)
    bone.quaternion.setFromEuler(e)
}

// ── 포즈 정의 ─────────────────────────────────────────────────
// 각 포즈는 { duration, frames } 구조
// frames: [{ t: 0~1, bones: { boneName: [x,y,z] } }]

const POSES = {

    // ── 안녕하세요 ────────────────────────────────────────────
    // 1단계: 오른 손바닥으로 왼 팔을 위에서 아래로 쓸어내림
    // 2단계: 두 주먹을 쥐고 동시에 아래로 내림
    hello: {
        duration: 2.0,
        loop: true,
        frames: [
            {
                t: 0.0,
                // 준비 자세 — 왼팔 앞으로, 오른팔 왼팔 위에 위치
                bones: {
                    [B.lArm]:     [-0.3,  0.0, -0.8],  // 왼팔 앞으로
                    [B.lForeArm]: [ 0.0,  0.0,  0.5],
                    [B.lHand]:    [ 0.0,  0.0,  0.0],
                    [B.rArm]:     [-0.5,  0.0,  0.8],  // 오른팔 왼팔 위
                    [B.rForeArm]: [ 0.0,  0.0, -0.5],
                    [B.rHand]:    [ 0.3,  0.0,  0.0],
                    // 오른손 주먹 (손가락 접기)
                    [B.rIndex1]:  [ 0.8,  0.0,  0.0],
                    [B.rIndex2]:  [ 0.8,  0.0,  0.0],
                    [B.rIndex3]:  [ 0.8,  0.0,  0.0],
                    [B.rMiddle1]: [ 0.8,  0.0,  0.0],
                    [B.rMiddle2]: [ 0.8,  0.0,  0.0],
                    [B.rRing1]:   [ 0.8,  0.0,  0.0],
                    [B.rRing2]:   [ 0.8,  0.0,  0.0],
                    [B.rPinky1]:  [ 0.8,  0.0,  0.0],
                    [B.rPinky2]:  [ 0.8,  0.0,  0.0],
                    // 왼손 팔 뻗기 (손바닥 위로)
                    [B.lIndex1]:  [ 0.0,  0.0,  0.0],
                    [B.lMiddle1]: [ 0.0,  0.0,  0.0],
                    [B.lRing1]:   [ 0.0,  0.0,  0.0],
                    [B.lPinky1]:  [ 0.0,  0.0,  0.0],
                },
            },
            {
                t: 0.4,
                // 오른 주먹이 왼 팔 중간쯤 쓸어내림
                bones: {
                    [B.lArm]:     [-0.3,  0.0, -0.8],
                    [B.lForeArm]: [ 0.0,  0.0,  0.5],
                    [B.lHand]:    [ 0.0,  0.0,  0.0],
                    [B.rArm]:     [-0.3,  0.0,  0.6],  // 왼팔 중간
                    [B.rForeArm]: [ 0.2,  0.0, -0.4],
                    [B.rHand]:    [ 0.3,  0.0,  0.0],
                    [B.rIndex1]:  [ 0.8,  0.0,  0.0],
                    [B.rIndex2]:  [ 0.8,  0.0,  0.0],
                    [B.rMiddle1]: [ 0.8,  0.0,  0.0],
                    [B.rMiddle2]: [ 0.8,  0.0,  0.0],
                    [B.rRing1]:   [ 0.8,  0.0,  0.0],
                    [B.rPinky1]:  [ 0.8,  0.0,  0.0],
                },
            },
            {
                t: 0.65,
                // 쓸어내리기 완료 — 오른 주먹 아래까지 내려옴
                bones: {
                    [B.lArm]:     [-0.2,  0.0, -0.7],
                    [B.lForeArm]: [ 0.1,  0.0,  0.4],
                    [B.rArm]:     [-0.1,  0.0,  0.4],  // 왼팔 아래
                    [B.rForeArm]: [ 0.4,  0.0, -0.3],
                    [B.rHand]:    [ 0.3,  0.0,  0.0],
                    [B.rIndex1]:  [ 0.8,  0.0,  0.0],
                    [B.rIndex2]:  [ 0.8,  0.0,  0.0],
                    [B.rMiddle1]: [ 0.8,  0.0,  0.0],
                    [B.rPinky1]:  [ 0.8,  0.0,  0.0],
                    // 왼손도 주먹
                    [B.lIndex1]:  [ 0.8,  0.0,  0.0],
                    [B.lIndex2]:  [ 0.8,  0.0,  0.0],
                    [B.lMiddle1]: [ 0.8,  0.0,  0.0],
                    [B.lRing1]:   [ 0.8,  0.0,  0.0],
                    [B.lPinky1]:  [ 0.8,  0.0,  0.0],
                },
            },
            {
                t: 0.75,
                // 두 주먹 동시에 아래로 내리기 시작
                bones: {
                    [B.lArm]:     [ 0.1,  0.0, -0.5],
                    [B.lForeArm]: [ 0.5,  0.0,  0.2],
                    [B.rArm]:     [ 0.1,  0.0,  0.5],
                    [B.rForeArm]: [ 0.5,  0.0, -0.2],
                    // 양손 모두 주먹
                    [B.lIndex1]:  [ 0.8,  0.0,  0.0],
                    [B.lMiddle1]: [ 0.8,  0.0,  0.0],
                    [B.lRing1]:   [ 0.8,  0.0,  0.0],
                    [B.lPinky1]:  [ 0.8,  0.0,  0.0],
                    [B.rIndex1]:  [ 0.8,  0.0,  0.0],
                    [B.rMiddle1]: [ 0.8,  0.0,  0.0],
                    [B.rRing1]:   [ 0.8,  0.0,  0.0],
                    [B.rPinky1]:  [ 0.8,  0.0,  0.0],
                },
            },
            {
                t: 1.0,
                // 두 주먹 완전히 아래로 내림 → 원래 자세로 복귀
                bones: {
                    [B.lArm]:     [ 0.3,  0.0, -0.3],
                    [B.lForeArm]: [ 0.7,  0.0,  0.1],
                    [B.rArm]:     [ 0.3,  0.0,  0.3],
                    [B.rForeArm]: [ 0.7,  0.0, -0.1],
                    [B.lIndex1]:  [ 0.8,  0.0,  0.0],
                    [B.lMiddle1]: [ 0.8,  0.0,  0.0],
                    [B.lRing1]:   [ 0.8,  0.0,  0.0],
                    [B.lPinky1]:  [ 0.8,  0.0,  0.0],
                    [B.rIndex1]:  [ 0.8,  0.0,  0.0],
                    [B.rMiddle1]: [ 0.8,  0.0,  0.0],
                    [B.rRing1]:   [ 0.8,  0.0,  0.0],
                    [B.rPinky1]:  [ 0.8,  0.0,  0.0],
                },
            },
        ],
    },

    // ── 만나서 반갑습니다 ─────────────────────────────────────
    // 두 손 검지 세워 얼굴 앞에서 좌우로 흔들기
    point: {
        duration: 1.8,
        loop: true,
        frames: [
            {
                t: 0.0,
                bones: {
                    [B.lArm]:     [-0.4,  0.0, -0.6],
                    [B.lForeArm]: [-0.3,  0.0,  0.8],
                    [B.lHand]:    [ 0.0,  0.3,  0.0],
                    [B.rArm]:     [-0.4,  0.0,  0.6],
                    [B.rForeArm]: [-0.3,  0.0, -0.8],
                    [B.rHand]:    [ 0.0, -0.3,  0.0],
                    // 검지만 펴기 (나머지 접기)
                    [B.lIndex1]:  [ 0.0,  0.0,  0.0],
                    [B.lIndex2]:  [ 0.0,  0.0,  0.0],
                    [B.lMiddle1]: [ 0.9,  0.0,  0.0],
                    [B.lRing1]:   [ 0.9,  0.0,  0.0],
                    [B.lPinky1]:  [ 0.9,  0.0,  0.0],
                    [B.rIndex1]:  [ 0.0,  0.0,  0.0],
                    [B.rIndex2]:  [ 0.0,  0.0,  0.0],
                    [B.rMiddle1]: [ 0.9,  0.0,  0.0],
                    [B.rRing1]:   [ 0.9,  0.0,  0.0],
                    [B.rPinky1]:  [ 0.9,  0.0,  0.0],
                },
            },
            {
                t: 0.5,
                bones: {
                    [B.lArm]:     [-0.4,  0.0, -0.4],
                    [B.lForeArm]: [-0.3,  0.0,  0.6],
                    [B.rArm]:     [-0.4,  0.0,  0.4],
                    [B.rForeArm]: [-0.3,  0.0, -0.6],
                    [B.lIndex1]:  [ 0.0,  0.0,  0.0],
                    [B.lMiddle1]: [ 0.9,  0.0,  0.0],
                    [B.lRing1]:   [ 0.9,  0.0,  0.0],
                    [B.rIndex1]:  [ 0.0,  0.0,  0.0],
                    [B.rMiddle1]: [ 0.9,  0.0,  0.0],
                    [B.rRing1]:   [ 0.9,  0.0,  0.0],
                },
            },
            {
                t: 1.0,
                bones: {
                    [B.lArm]:     [-0.4,  0.0, -0.6],
                    [B.lForeArm]: [-0.3,  0.0,  0.8],
                    [B.rArm]:     [-0.4,  0.0,  0.6],
                    [B.rForeArm]: [-0.3,  0.0, -0.8],
                    [B.lIndex1]:  [ 0.0,  0.0,  0.0],
                    [B.lMiddle1]: [ 0.9,  0.0,  0.0],
                    [B.lRing1]:   [ 0.9,  0.0,  0.0],
                    [B.rIndex1]:  [ 0.0,  0.0,  0.0],
                    [B.rMiddle1]: [ 0.9,  0.0,  0.0],
                    [B.rRing1]:   [ 0.9,  0.0,  0.0],
                },
            },
        ],
    },

    // ── 고맙습니다 ────────────────────────────────────────────
    // 양손 펼쳐 가슴 앞에서 아래로 내리며 인사
    thanks: {
        duration: 1.8,
        loop: true,
        frames: [
            {
                t: 0.0,
                bones: {
                    [B.lArm]:     [-0.5,  0.0, -0.4],
                    [B.lForeArm]: [-0.2,  0.0,  0.5],
                    [B.lHand]:    [ 0.0,  0.0,  0.2],
                    [B.rArm]:     [-0.5,  0.0,  0.4],
                    [B.rForeArm]: [-0.2,  0.0, -0.5],
                    [B.rHand]:    [ 0.0,  0.0, -0.2],
                    // 손 펼치기
                    [B.lIndex1]:  [ 0.0,  0.0,  0.0],
                    [B.lMiddle1]: [ 0.0,  0.0,  0.0],
                    [B.lRing1]:   [ 0.0,  0.0,  0.0],
                    [B.lPinky1]:  [ 0.0,  0.0,  0.0],
                    [B.rIndex1]:  [ 0.0,  0.0,  0.0],
                    [B.rMiddle1]: [ 0.0,  0.0,  0.0],
                    [B.rRing1]:   [ 0.0,  0.0,  0.0],
                    [B.rPinky1]:  [ 0.0,  0.0,  0.0],
                },
            },
            {
                t: 0.5,
                bones: {
                    [B.lArm]:     [-0.2,  0.0, -0.4],
                    [B.lForeArm]: [ 0.2,  0.0,  0.4],
                    [B.rArm]:     [-0.2,  0.0,  0.4],
                    [B.rForeArm]: [ 0.2,  0.0, -0.4],
                    [B.lIndex1]:  [ 0.0,  0.0,  0.0],
                    [B.lMiddle1]: [ 0.0,  0.0,  0.0],
                    [B.rIndex1]:  [ 0.0,  0.0,  0.0],
                    [B.rMiddle1]: [ 0.0,  0.0,  0.0],
                },
            },
            {
                t: 1.0,
                bones: {
                    [B.lArm]:     [ 0.1,  0.0, -0.3],
                    [B.lForeArm]: [ 0.5,  0.0,  0.2],
                    [B.rArm]:     [ 0.1,  0.0,  0.3],
                    [B.rForeArm]: [ 0.5,  0.0, -0.2],
                    [B.lIndex1]:  [ 0.0,  0.0,  0.0],
                    [B.lMiddle1]: [ 0.0,  0.0,  0.0],
                    [B.rIndex1]:  [ 0.0,  0.0,  0.0],
                    [B.rMiddle1]: [ 0.0,  0.0,  0.0],
                },
            },
        ],
    },

    // ── 좋아합니다 (엄지 위) ──────────────────────────────────
    thumbUp: {
        duration: 1.5,
        loop: true,
        frames: [
            {
                t: 0.0,
                bones: {
                    [B.rArm]:     [-0.6,  0.0,  0.3],
                    [B.rForeArm]: [-0.4,  0.0, -0.6],
                    [B.rHand]:    [ 0.0,  0.0, -0.3],
                    // 엄지만 펴기
                    [B.rThumb1]:  [ 0.0, -0.5,  0.3],
                    [B.rThumb2]:  [ 0.0, -0.3,  0.0],
                    [B.rIndex1]:  [ 0.9,  0.0,  0.0],
                    [B.rIndex2]:  [ 0.8,  0.0,  0.0],
                    [B.rMiddle1]: [ 0.9,  0.0,  0.0],
                    [B.rRing1]:   [ 0.9,  0.0,  0.0],
                    [B.rPinky1]:  [ 0.9,  0.0,  0.0],
                    // 왼팔 자연스럽게
                    [B.lArm]:     [ 0.1,  0.0, -0.1],
                    [B.lForeArm]: [ 0.3,  0.0,  0.1],
                },
            },
            {
                t: 0.5,
                bones: {
                    [B.rArm]:     [-0.7,  0.0,  0.3],
                    [B.rForeArm]: [-0.5,  0.0, -0.6],
                    [B.rThumb1]:  [ 0.0, -0.5,  0.3],
                    [B.rIndex1]:  [ 0.9,  0.0,  0.0],
                    [B.rMiddle1]: [ 0.9,  0.0,  0.0],
                    [B.rRing1]:   [ 0.9,  0.0,  0.0],
                    [B.rPinky1]:  [ 0.9,  0.0,  0.0],
                },
            },
            {
                t: 1.0,
                bones: {
                    [B.rArm]:     [-0.6,  0.0,  0.3],
                    [B.rForeArm]: [-0.4,  0.0, -0.6],
                    [B.rThumb1]:  [ 0.0, -0.5,  0.3],
                    [B.rIndex1]:  [ 0.9,  0.0,  0.0],
                    [B.rMiddle1]: [ 0.9,  0.0,  0.0],
                    [B.rRing1]:   [ 0.9,  0.0,  0.0],
                    [B.rPinky1]:  [ 0.9,  0.0,  0.0],
                },
            },
        ],
    },

    // ── 미안합니다 (주먹 이마에서 아래로) ────────────────────
    fist: {
        duration: 1.8,
        loop: true,
        frames: [
            {
                t: 0.0,
                bones: {
                    [B.rArm]:     [-0.8,  0.0,  0.2],
                    [B.rForeArm]: [-0.6,  0.0, -0.3],
                    [B.rHand]:    [ 0.2,  0.0,  0.0],
                    // 주먹 쥐기
                    [B.rIndex1]:  [ 0.9,  0.0,  0.0],
                    [B.rIndex2]:  [ 0.8,  0.0,  0.0],
                    [B.rMiddle1]: [ 0.9,  0.0,  0.0],
                    [B.rMiddle2]: [ 0.8,  0.0,  0.0],
                    [B.rRing1]:   [ 0.9,  0.0,  0.0],
                    [B.rPinky1]:  [ 0.9,  0.0,  0.0],
                    [B.lArm]:     [ 0.1,  0.0, -0.1],
                    [B.lForeArm]: [ 0.3,  0.0,  0.1],
                },
            },
            {
                t: 0.4,
                bones: {
                    [B.rArm]:     [-0.5,  0.0,  0.3],
                    [B.rForeArm]: [-0.3,  0.0, -0.4],
                    [B.rIndex1]:  [ 0.9,  0.0,  0.0],
                    [B.rMiddle1]: [ 0.9,  0.0,  0.0],
                    [B.rRing1]:   [ 0.9,  0.0,  0.0],
                    [B.rPinky1]:  [ 0.9,  0.0,  0.0],
                },
            },
            {
                t: 0.7,
                bones: {
                    [B.rArm]:     [ 0.0,  0.0,  0.4],
                    [B.rForeArm]: [ 0.2,  0.0, -0.3],
                    // 손 펴기 (사과)
                    [B.rIndex1]:  [ 0.0,  0.0,  0.0],
                    [B.rMiddle1]: [ 0.0,  0.0,  0.0],
                    [B.rRing1]:   [ 0.0,  0.0,  0.0],
                    [B.rPinky1]:  [ 0.0,  0.0,  0.0],
                },
            },
            {
                t: 1.0,
                bones: {
                    [B.rArm]:     [ 0.1,  0.0,  0.2],
                    [B.rForeArm]: [ 0.4,  0.0, -0.2],
                    [B.rIndex1]:  [ 0.0,  0.0,  0.0],
                    [B.rMiddle1]: [ 0.0,  0.0,  0.0],
                },
            },
        ],
    },

    // ── 대기 (idle) ───────────────────────────────────────────
    idle: {
        duration: 3.0,
        loop: true,
        frames: [
            {
                t: 0.0,
                bones: {
                    [B.lArm]:     [ 0.05, 0.0, -0.05],
                    [B.lForeArm]: [ 0.1,  0.0,  0.0],
                    [B.rArm]:     [ 0.05, 0.0,  0.05],
                    [B.rForeArm]: [ 0.1,  0.0,  0.0],
                },
            },
            {
                t: 0.5,
                bones: {
                    [B.lArm]:     [ 0.08, 0.0, -0.06],
                    [B.rArm]:     [ 0.08, 0.0,  0.06],
                },
            },
            {
                t: 1.0,
                bones: {
                    [B.lArm]:     [ 0.05, 0.0, -0.05],
                    [B.rArm]:     [ 0.05, 0.0,  0.05],
                },
            },
        ],
    },
}

// ── 보간 헬퍼 ────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t }

function getFrameRots(poseFrames, time, duration) {
    const t = (time % duration) / duration  // 0~1 루프
    const frames = poseFrames

    // t 앞뒤 프레임 찾기
    let f0 = frames[frames.length - 1]
    let f1 = frames[0]
    for (let i = 0; i < frames.length - 1; i++) {
        if (t >= frames[i].t && t < frames[i + 1].t) {
            f0 = frames[i]; f1 = frames[i + 1]; break
        }
    }

    // 로컬 t 계산
    const span = f1.t === f0.t ? 1 : f1.t - f0.t
    const lt   = Math.max(0, Math.min(1, (t - f0.t) / span))

    // 본별 보간
    const result = {}
    const allBones = new Set([...Object.keys(f0.bones), ...Object.keys(f1.bones)])
    for (const bname of allBones) {
        const r0 = f0.bones[bname] || [0, 0, 0]
        const r1 = f1.bones[bname] || [0, 0, 0]
        result[bname] = [
            lerp(r0[0], r1[0], lt),
            lerp(r0[1], r1[1], lt),
            lerp(r0[2], r1[2], lt),
        ]
    }
    return result
}

// ══════════════════════════════════════════════════════════════
//  Person3D 컴포넌트
// ══════════════════════════════════════════════════════════════
export default function Person3D({ pose = 'idle', playing = true }) {
    const containerRef = useRef(null)
    const rendererRef  = useRef(null)
    const sceneRef     = useRef(null)
    const cameraRef    = useRef(null)
    const frameRef     = useRef(null)
    const clockRef     = useRef(new THREE.Clock())
    const boneMapRef   = useRef({})
    const poseRef      = useRef(pose)
    const playingRef   = useRef(playing)
    const animTimeRef  = useRef(0)
    const modelRef     = useRef(null)
    const mixerRef     = useRef(null)   // Idle FBX mixer

    useEffect(() => { poseRef.current   = pose    }, [pose])
    useEffect(() => { playingRef.current = playing }, [playing])

    // ── Three.js 초기화 ──────────────────────────────────────
    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        let disposed = false

        const scene    = new THREE.Scene()
        sceneRef.current = scene

        const camera   = new THREE.PerspectiveCamera(35, 1, 0.1, 1000)
        cameraRef.current = camera

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        renderer.setSize(container.clientWidth || 400, container.clientHeight || 500)
        renderer.outputColorSpace = THREE.SRGBColorSpace
        rendererRef.current = renderer
        container.appendChild(renderer.domElement)

        // 조명
        scene.add(new THREE.AmbientLight(0xffffff, 2.5))
        const kl = new THREE.DirectionalLight(0xffffff, 1.8)
        kl.position.set(2, 5, 5); scene.add(kl)
        const fl = new THREE.DirectionalLight(0xffffff, 1.0)
        fl.position.set(-3, 3, 4); scene.add(fl)

        // Idle.fbx 로드 (캐릭터 메시만 사용 — 애니메이션은 코드로 제어)
        new FBXLoader().load(
            FBX_BASE + 'Idle.fbx',
            (fbx) => {
                if (disposed) return
                normalizeAndCenterModel(fbx)
                scene.add(fbx)
                fitCameraToObject(camera, fbx, container)
                modelRef.current = fbx

                // 본 맵 빌드
                boneMapRef.current = buildBoneMap(fbx)
                const allBoneNames = Object.keys(boneMapRef.current)
                console.log('[Person3D] 전체 본 목록 (' + allBoneNames.length + '개):', allBoneNames)
                console.log('[Person3D] mixamorig 본:', allBoneNames.filter(n => n.toLowerCase().includes('mixamo')))
                console.log('[Person3D] arm 본:', allBoneNames.filter(n => n.toLowerCase().includes('arm')))

                // Idle FBX 애니메이션 비활성화 — 코드 애니메이션만 사용
                // (FBX T-포즈가 코드 애니메이션을 덮어쓰는 것 방지)
            },
            undefined,
            (err) => console.error('[Person3D] Idle.fbx 로드 실패:', err)
        )

        // 리사이즈
        const onResize = () => {
            const el  = containerRef.current
            const rdr = rendererRef.current
            const cam = cameraRef.current
            if (!el || !rdr || !cam) return
            const w = el.clientWidth || 400
            const h = el.clientHeight || 500
            cam.aspect = w / h
            cam.updateProjectionMatrix()
            rdr.setSize(w, h)
        }
        window.addEventListener('resize', onResize)

        // 렌더 루프
        const animate = () => {
            frameRef.current = requestAnimationFrame(animate)
            const delta = clockRef.current.getDelta()

            // Idle FBX mixer (베이스 포즈 유지)
            mixerRef.current?.update(delta)

            // 코드 기반 포즈 적용
            if (playingRef.current) animTimeRef.current += delta
            const curPose = POSES[poseRef.current] || POSES.idle
            const rots = getFrameRots(curPose.frames, animTimeRef.current, curPose.duration)

            const bm = boneMapRef.current
            for (const [bname, [x, y, z]] of Object.entries(rots)) {
                const bone = bm[bname]
                if (bone) {
                    // Slerp으로 부드럽게 적용
                    const target = new THREE.Quaternion().setFromEuler(
                        new THREE.Euler(x, y, z, 'XYZ')
                    )
                    bone.quaternion.slerp(target, 0.3)
                }
            }

            renderer.render(scene, camera)
        }
        animate()

        return () => {
            disposed = true
            window.removeEventListener('resize', onResize)
            if (frameRef.current) cancelAnimationFrame(frameRef.current)
            renderer.dispose()
            if (container.contains(renderer.domElement))
                container.removeChild(renderer.domElement)
        }
    }, [])

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', minHeight: '420px', position: 'relative' }}
        />
    )
}

// ── 유틸 ──────────────────────────────────────────────────────
function normalizeAndCenterModel(fbx) {
    const box  = new THREE.Box3().setFromObject(fbx)
    const size = box.getSize(new THREE.Vector3())
    fbx.scale.setScalar(2.7 / Math.max(size.y, 0.001))
    const box2   = new THREE.Box3().setFromObject(fbx)
    const center = box2.getCenter(new THREE.Vector3())
    fbx.position.set(-center.x, -box2.min.y, -center.z)
}

function fitCameraToObject(camera, object, container) {
    const box    = new THREE.Box3().setFromObject(object)
    const size   = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const dist   = ((size.y / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) * 1.5
    camera.position.set(center.x, center.y + size.y * 0.1, center.z + dist)
    camera.lookAt(center.x, center.y, center.z)
    camera.aspect = (container.clientWidth || 400) / (container.clientHeight || 500)
    camera.updateProjectionMatrix()
}