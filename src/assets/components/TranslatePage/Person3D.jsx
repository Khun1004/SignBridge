import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'

export default function Person3D({
                                     pose = 'idle',
                                     playing = true,
                                 }) {
    const containerRef = useRef(null)

    const rendererRef = useRef(null)
    const sceneRef = useRef(null)
    const cameraRef = useRef(null)
    const modelRef = useRef(null)

    const bonesRef = useRef({
        spine: null,

        lArm: null,
        lFore: null,
        lHand: null,

        rArm: null,
        rFore: null,
        rHand: null,

        lThumb1: null, lThumb2: null, lThumb3: null,
        lIndex1: null, lIndex2: null, lIndex3: null,
        lMiddle1: null, lMiddle2: null, lMiddle3: null,
        lRing1: null, lRing2: null, lRing3: null,
        lPinky1: null, lPinky2: null, lPinky3: null,

        rThumb1: null, rThumb2: null, rThumb3: null,
        rIndex1: null, rIndex2: null, rIndex3: null,
        rMiddle1: null, rMiddle2: null, rMiddle3: null,
        rRing1: null, rRing2: null, rRing3: null,
        rPinky1: null, rPinky2: null, rPinky3: null,
    })

    const basePoseRef = useRef({})
    const frameRef = useRef(null)
    const lastTimeRef = useRef(performance.now())
    const clockRef = useRef(0)

    const poseRef = useRef(pose)
    const playingRef = useRef(playing)

    useEffect(() => { poseRef.current = pose }, [pose])
    useEffect(() => { playingRef.current = playing }, [playing])

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        let disposed = false

        const scene = new THREE.Scene()
        sceneRef.current = scene

        const camera = new THREE.PerspectiveCamera(
            35,
            container.clientWidth / Math.max(container.clientHeight, 1),
            0.1,
            1000
        )
        cameraRef.current = camera

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        renderer.setSize(container.clientWidth, container.clientHeight)
        renderer.outputColorSpace = THREE.SRGBColorSpace
        rendererRef.current = renderer
        container.appendChild(renderer.domElement)

        scene.add(new THREE.AmbientLight(0xffffff, 2.2))

        const keyLight = new THREE.DirectionalLight(0xffffff, 1.8)
        keyLight.position.set(2, 5, 5)
        scene.add(keyLight)

        const fillLight = new THREE.DirectionalLight(0xffffff, 1.0)
        fillLight.position.set(-3, 3, 4)
        scene.add(fillLight)

        const rimLight = new THREE.DirectionalLight(0xffffff, 0.8)
        rimLight.position.set(0, 5, -5)
        scene.add(rimLight)

        const loader = new FBXLoader()
        loader.load(
            '/animations/Idle.fbx',
            (fbx) => {
                if (disposed) return
                modelRef.current = fbx
                collectBones(fbx, bonesRef.current)
                captureBasePose(bonesRef.current, basePoseRef.current)
                normalizeAndCenterModel(fbx)
                scene.add(fbx)
                fitCameraToObject(camera, fbx, container)
            },
            undefined,
            (err) => {
                console.error('[Person3D] FBX load error:', err)
            }
        )

        const onResize = () => {
            const el = containerRef.current
            const renderer = rendererRef.current
            const camera = cameraRef.current
            if (!el || !renderer || !camera) return

            const width = el.clientWidth || 1
            const height = el.clientHeight || 1
            camera.aspect = width / height
            camera.updateProjectionMatrix()
            renderer.setSize(width, height)
        }

        window.addEventListener('resize', onResize)

        const animate = () => {
            frameRef.current = requestAnimationFrame(animate)

            const now = performance.now()
            const dt = (now - lastTimeRef.current) / 1000
            lastTimeRef.current = now

            if (playingRef.current) clockRef.current += dt

            const currentPose = poseRef.current

            if (currentPose === 'hello' || currentPose === '안녕하세요') {
                animateHello(clockRef.current, bonesRef.current, basePoseRef.current)
            } else if (currentPose === 'thumbUp' || currentPose === '좋아요') {
                animateThumbUp(clockRef.current, bonesRef.current, basePoseRef.current)
            } else {
                resetUpperBody(bonesRef.current, basePoseRef.current)
            }

            renderer.render(scene, camera)
        }

        animate()

        return () => {
            disposed = true
            window.removeEventListener('resize', onResize)
            if (frameRef.current) cancelAnimationFrame(frameRef.current)
            renderer.dispose()
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement)
            }
        }
    }, [])

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', minHeight: '420px', position: 'relative' }}
        />
    )
}

function collectBones(root, out) {
    root.traverse((obj) => {
        if (!obj.isBone) return

        const n = normalizeBoneName(obj.name)

        if (n.includes('spine')) out.spine ??= obj

        if (n.includes('leftarm') && !n.includes('fore')) out.lArm ??= obj
        if (n.includes('rightarm') && !n.includes('fore')) out.rArm ??= obj
        if (n.includes('leftforearm')) out.lFore ??= obj
        if (n.includes('rightforearm')) out.rFore ??= obj

        if (n.includes('lefthand') && !hasFingerWord(n)) out.lHand ??= obj
        if (n.includes('righthand') && !hasFingerWord(n)) out.rHand ??= obj

        if (n.includes('lefthandthumb1')) out.lThumb1 ??= obj
        if (n.includes('lefthandthumb2')) out.lThumb2 ??= obj
        if (n.includes('lefthandthumb3')) out.lThumb3 ??= obj

        if (n.includes('lefthandindex1')) out.lIndex1 ??= obj
        if (n.includes('lefthandindex2')) out.lIndex2 ??= obj
        if (n.includes('lefthandindex3')) out.lIndex3 ??= obj

        if (n.includes('lefthandmiddle1')) out.lMiddle1 ??= obj
        if (n.includes('lefthandmiddle2')) out.lMiddle2 ??= obj
        if (n.includes('lefthandmiddle3')) out.lMiddle3 ??= obj

        if (n.includes('lefthandring1')) out.lRing1 ??= obj
        if (n.includes('lefthandring2')) out.lRing2 ??= obj
        if (n.includes('lefthandring3')) out.lRing3 ??= obj

        if (n.includes('lefthandpinky1')) out.lPinky1 ??= obj
        if (n.includes('lefthandpinky2')) out.lPinky2 ??= obj
        if (n.includes('lefthandpinky3')) out.lPinky3 ??= obj

        if (n.includes('righthandthumb1')) out.rThumb1 ??= obj
        if (n.includes('righthandthumb2')) out.rThumb2 ??= obj
        if (n.includes('righthandthumb3')) out.rThumb3 ??= obj

        if (n.includes('righthandindex1')) out.rIndex1 ??= obj
        if (n.includes('righthandindex2')) out.rIndex2 ??= obj
        if (n.includes('righthandindex3')) out.rIndex3 ??= obj

        if (n.includes('righthandmiddle1')) out.rMiddle1 ??= obj
        if (n.includes('righthandmiddle2')) out.rMiddle2 ??= obj
        if (n.includes('righthandmiddle3')) out.rMiddle3 ??= obj

        if (n.includes('righthandring1')) out.rRing1 ??= obj
        if (n.includes('righthandring2')) out.rRing2 ??= obj
        if (n.includes('righthandring3')) out.rRing3 ??= obj

        if (n.includes('righthandpinky1')) out.rPinky1 ??= obj
        if (n.includes('righthandpinky2')) out.rPinky2 ??= obj
        if (n.includes('righthandpinky3')) out.rPinky3 ??= obj
    })

    console.log('[Person3D] bones:', Object.fromEntries(
        Object.entries(out).map(([k, v]) => [k, v?.name || null])
    ))
}

function hasFingerWord(n) {
    return ['thumb', 'index', 'middle', 'ring', 'pinky'].some(w => n.includes(w))
}

function normalizeBoneName(name) {
    return String(name).toLowerCase().replace(/[:|.\-\s]/g, '')
}

function captureBasePose(bones, store) {
    Object.entries(bones).forEach(([key, bone]) => {
        if (!bone) return
        store[key] = {
            x: bone.rotation.x,
            y: bone.rotation.y,
            z: bone.rotation.z,
        }
    })
}

function restoreBasePose(bones, basePose, alpha = 1) {
    Object.entries(bones).forEach(([key, bone]) => {
        if (!bone || !basePose[key]) return
        lerpBoneRotation(bone, basePose[key].x, basePose[key].y, basePose[key].z, alpha)
    })
}

function animateHello(t, b, basePose) {
    restoreBasePose(b, basePose, 0.1)

    const CYCLE = 3
    const p = (t % CYCLE) / CYCLE

    // 🔥 1단계: 왼팔 고정 + 오른손 쓸기
    if (p < 0.6) {
        const k = p / 0.6

        // 왼팔 (가슴 앞)
        lerpRot(b.lArm, 0.5, 0.1, 1.5, 0.2)
        lerpRot(b.lFore, 1.2, 0, 0.3, 0.2)
        applyHandPreset(b, 'left', 1.0, 0.2)

        // 오른손 쓸기 (핵심)
        lerpRot(b.rArm, 0.6 + k * 0.2, -0.1, -1.2, 0.2)
        lerpRot(b.rFore, 1.2, 0, -0.2, 0.2)

        // 손바닥 느낌
        if (b.rHand) {
            b.rHand.rotation.set(0.2, -0.3, -1.0)
        }

        applyHandPreset(b, 'right', 0.0, 0.2)
    }

    // 🔥 2단계: 두 주먹 아래
    else {
        const k = (p - 0.6) / 0.4

        lerpRot(b.lArm, 0.8 + k * 0.5, 0.1, 0.8, 0.2)
        lerpRot(b.rArm, 0.8 + k * 0.5, -0.1, -0.8, 0.2)

        applyHandPreset(b, 'left', 1.0, 0.2)
        applyHandPreset(b, 'right', 1.0, 0.2)
    }
}

function animateThumbUp(t, b, basePose) {
    restoreBasePose(b, basePose, 0.1)

    const pulse = Math.sin(t * 4.2) * 0.04
    const sway = Math.sin(t * 2.4) * 0.03

    // 왼팔은 자연스럽게 아래
    lerpRot(b.lArm, 0.18, 0.08, 0.55, 0.18)
    lerpRot(b.lFore, 0.28, 0.0, 0.12, 0.18)
    if (b.lHand) {
        lerpRot(b.lHand, 0.0, 0.0, 0.0, 0.18)
    }
    applyHandPreset(b, 'left', 0.08, 0.18)

    // 오른팔을 가슴 앞쪽으로 들어 올리기
    lerpRot(b.rArm, 0.55 + pulse, -0.12, -1.15 + sway, 0.2)
    lerpRot(b.rFore, 1.2 + pulse * 0.5, 0.0, -0.18, 0.2)

    // 오른손 방향: 엄지가 위로 보이게 손목 회전
    if (b.rHand) {
        lerpRot(b.rHand, -0.35, -0.15, -0.55, 0.22)
    }

    // 오른손 손가락: 엄지만 펴고 나머지는 접기
    applyThumbUpPreset(b, 'right', 0.22)
}

function applyThumbUpPreset(bones, side, alpha = 1) {
    const isRight = side === 'right'

    const thumb = isRight
        ? [bones.rThumb1, bones.rThumb2, bones.rThumb3]
        : [bones.lThumb1, bones.lThumb2, bones.lThumb3]

    const index = isRight
        ? [bones.rIndex1, bones.rIndex2, bones.rIndex3]
        : [bones.lIndex1, bones.lIndex2, bones.lIndex3]

    const middle = isRight
        ? [bones.rMiddle1, bones.rMiddle2, bones.rMiddle3]
        : [bones.lMiddle1, bones.lMiddle2, bones.lMiddle3]

    const ring = isRight
        ? [bones.rRing1, bones.rRing2, bones.rRing3]
        : [bones.lRing1, bones.lRing2, bones.lRing3]

    const pinky = isRight
        ? [bones.rPinky1, bones.rPinky2, bones.rPinky3]
        : [bones.lPinky1, bones.lPinky2, bones.lPinky3]

    // 엄지: 최대한 펴기
    if (thumb[0]) lerpBoneRotation(thumb[0], -0.15, 0.25, 0.08, alpha)
    if (thumb[1]) lerpBoneRotation(thumb[1], -0.05, 0.0, 0.0, alpha)
    if (thumb[2]) lerpBoneRotation(thumb[2], -0.02, 0.0, 0.0, alpha)

    // 나머지 손가락: 주먹처럼 접기
    applyFingerChain(index, 1.0, alpha)
    applyFingerChain(middle, 1.0, alpha)
    applyFingerChain(ring, 1.0, alpha)
    applyFingerChain(pinky, 1.0, alpha)
}

function resetUpperBody(b, basePose) {
    restoreBasePose(b, basePose, 0.16)
    applyHandPreset(b, 'left', 0.0, 0.14)
    applyHandPreset(b, 'right', 0.0, 0.14)
}

function applyFingerChain(chain, curl, alpha = 1, isThumb = false) {
    if (!chain?.length) return
    const a = THREE.MathUtils.lerp(0.05, 1.15, curl)
    const b = THREE.MathUtils.lerp(0.04, 1.0,  curl)
    const c = THREE.MathUtils.lerp(0.02, 0.85, curl)
    if (chain[0]) {
        lerpBoneRotation(
            chain[0],
            isThumb ? a * 0.7 : a,
            isThumb ? 0.18 * curl : 0,
            isThumb ? 0.15 * curl : 0,
            alpha
        )
    }
    if (chain[1]) lerpBoneRotation(chain[1], b, 0, 0, alpha)
    if (chain[2]) lerpBoneRotation(chain[2], c, 0, 0, alpha)
}

function applyHandPreset(bones, side, fist = 0, alpha = 1) {
    const thumb = THREE.MathUtils.clamp(fist * 0.85, 0, 1)
    const finger = THREE.MathUtils.clamp(fist, 0, 1)

    const chains =
        side === 'right'
            ? {
                thumb: [bones.rThumb1, bones.rThumb2, bones.rThumb3],
                index: [bones.rIndex1, bones.rIndex2, bones.rIndex3],
                middle: [bones.rMiddle1, bones.rMiddle2, bones.rMiddle3],
                ring: [bones.rRing1, bones.rRing2, bones.rRing3],
                pinky: [bones.rPinky1, bones.rPinky2, bones.rPinky3],
            }
            : {
                thumb: [bones.lThumb1, bones.lThumb2, bones.lThumb3],
                index: [bones.lIndex1, bones.lIndex2, bones.lIndex3],
                middle: [bones.lMiddle1, bones.lMiddle2, bones.lMiddle3],
                ring: [bones.lRing1, bones.lRing2, bones.lRing3],
                pinky: [bones.lPinky1, bones.lPinky2, bones.lPinky3],
            }

    applyFingerChain(chains.thumb, thumb, alpha, true)
    applyFingerChain(chains.index, finger, alpha)
    applyFingerChain(chains.middle, finger, alpha)
    applyFingerChain(chains.ring, finger, alpha)
    applyFingerChain(chains.pinky, finger, alpha)
}

function toVec3(p) {
    return new THREE.Vector3(p?.x ?? 0, -(p?.y ?? 0), p?.z ?? 0)
}

function avgVec3(a, b, c) {
    return new THREE.Vector3().add(a).add(b).add(c).multiplyScalar(1 / 3)
}

function angleABC(a, b, c) {
    const ab = a.clone().sub(b).normalize()
    const cb = c.clone().sub(b).normalize()
    const dot = THREE.MathUtils.clamp(ab.dot(cb), -1, 1)
    return Math.acos(dot)
}

function lerpRot(bone, x, y, z, alpha = 1) {
    if (!bone) return
    lerpBoneRotation(bone, x, y, z, alpha)
}

function lerpBoneRotation(bone, x, y, z, alpha = 1) {
    if (!bone) return
    bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, x, alpha)
    bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, y, alpha)
    bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, z, alpha)
}

function normalizeAndCenterModel(fbx) {
    const box = new THREE.Box3().setFromObject(fbx)
    const size = box.getSize(new THREE.Vector3())
    const scale = 2.7 / Math.max(size.y, 0.001)
    fbx.scale.setScalar(scale)

    const box2 = new THREE.Box3().setFromObject(fbx)
    const center = box2.getCenter(new THREE.Vector3())
    const min = box2.min.clone()
    fbx.position.set(-center.x, -min.y, -center.z)
}

function fitCameraToObject(camera, object, container) {
    const box = new THREE.Box3().setFromObject(object)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    const dist =
        ((size.y / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) * 1.5

    camera.position.set(center.x, center.y + size.y * 0.1, center.z + dist)
    camera.lookAt(center.x, center.y, center.z)

    const width = container.clientWidth || 1
    const height = container.clientHeight || 1
    camera.aspect = width / height
    camera.updateProjectionMatrix()
}