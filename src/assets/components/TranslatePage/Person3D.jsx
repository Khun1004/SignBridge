// ══════════════════════════════════════════════════════════════
//  Person3D.jsx — FBX AnimationMixer 방식 (최종)
//
//  public/animations/ 에 아래 파일 필요:
//    Idle.fbx     (With Skin)    ← 캐릭터 메시 + 대기 애니메이션
//    Hello.fbx    (Without Skin) ← 안녕하세요
//    Point.fbx    (Without Skin) ← 만나서 반갑습니다
//    Thanks.fbx   (Without Skin) ← 고맙습니다
//    ThumbUp.fbx  (Without Skin) ← 좋아합니다
//    Sorry.fbx    (Without Skin) ← 미안합니다
//    Love.fbx     (Without Skin) ← 사랑합니다
// ══════════════════════════════════════════════════════════════
import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'

const POSE_TO_FBX = {
    idle:    'Idle.fbx',
    hello:   'Hello.fbx',
    point:   'Point.fbx',
    thanks:  'Thanks.fbx',
    thumbUp: 'ThumbUp.fbx',
    fist:    'Sorry.fbx',
    love:    'Love.fbx',
}
const FBX_BASE = '/animations/'

export default function Person3D({ pose = 'idle', playing = true }) {
    const containerRef  = useRef(null)
    const rendererRef   = useRef(null)
    const sceneRef      = useRef(null)
    const cameraRef     = useRef(null)
    const mixerRef      = useRef(null)
    const currentActRef = useRef(null)
    const clockRef      = useRef(new THREE.Clock())
    const frameRef      = useRef(null)
    const poseRef       = useRef(pose)
    const playingRef    = useRef(playing)
    const animCacheRef  = useRef({})        // fbxFile → AnimationClip
    const loadingRef    = useRef(new Set()) // 로딩 중인 파일명 Set

    // ── playing 변경 시 즉시 반영 ────────────────────────────
    useEffect(() => {
        playingRef.current = playing
        const act = currentActRef.current
        if (!act) return
        if (playing) {
            act.paused = false
            act.play()
        } else {
            act.paused = true
        }
    }, [playing])

    // ── 크로스페이드 전환 ─────────────────────────────────────
    const crossFadeTo = useCallback((clip) => {
        const mixer = mixerRef.current
        if (!mixer || !clip) return

        const next = mixer.clipAction(clip)
        next.loop             = THREE.LoopRepeat
        next.clampWhenFinished = false

        const prev = currentActRef.current

        if (prev && prev !== next) {
            next.reset()
            next.play()
            prev.crossFadeTo(next, 0.35, true)
        } else if (!prev) {
            next.reset()
            next.play()
        }

        currentActRef.current = next
        next.paused = !playingRef.current
    }, [])

    // ── 애니메이션 로드 및 재생 ──────────────────────────────
    const playAnim = useCallback((poseName) => {
        const mixer = mixerRef.current
        if (!mixer) return  // 모델 로드 전 — pose useEffect에서 재호출됨

        const fbxFile = POSE_TO_FBX[poseName] ?? POSE_TO_FBX.idle

        // 캐시에 있으면 바로 전환
        if (animCacheRef.current[fbxFile]) {
            crossFadeTo(animCacheRef.current[fbxFile])
            return
        }

        // 이미 로딩 중이면 대기
        if (loadingRef.current.has(fbxFile)) return
        loadingRef.current.add(fbxFile)

        new FBXLoader().load(
            FBX_BASE + fbxFile,
            (fbx) => {
                loadingRef.current.delete(fbxFile)
                if (!fbx.animations?.length) {
                    console.warn(`[Person3D] ${fbxFile} 애니메이션 없음 → Idle 폴백`)
                    const idle = animCacheRef.current['Idle.fbx']
                    if (idle) crossFadeTo(idle)
                    return
                }
                const clip = fbx.animations[0]
                animCacheRef.current[fbxFile] = clip

                // 로드 완료 시점에도 이 pose를 보여줘야 하면 전환
                const want = POSE_TO_FBX[poseRef.current] ?? POSE_TO_FBX.idle
                if (want === fbxFile) crossFadeTo(clip)
            },
            undefined,
            (err) => {
                loadingRef.current.delete(fbxFile)
                console.warn(`[Person3D] ${fbxFile} 로드 실패 → Idle 폴백`, err)
                const idle = animCacheRef.current['Idle.fbx']
                if (idle) crossFadeTo(idle)
            }
        )
    }, [crossFadeTo])

    // ── pose prop 변경 감지 → 애니메이션 전환 ────────────────
    useEffect(() => {
        poseRef.current = pose
        playAnim(pose)
    }, [pose, playAnim])

    // ── Three.js 초기화 (마운트 1회) ─────────────────────────
    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        let disposed = false

        // Scene
        const scene = new THREE.Scene()
        sceneRef.current = scene

        // Camera
        const camera = new THREE.PerspectiveCamera(
            35,
            container.clientWidth / Math.max(container.clientHeight, 1),
            0.1, 1000
        )
        cameraRef.current = camera

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        renderer.setSize(container.clientWidth, container.clientHeight)
        renderer.outputColorSpace = THREE.SRGBColorSpace
        rendererRef.current = renderer
        container.appendChild(renderer.domElement)

        // 조명
        scene.add(new THREE.AmbientLight(0xffffff, 2.2))
        const kl = new THREE.DirectionalLight(0xffffff, 1.8)
        kl.position.set(2, 5, 5);  scene.add(kl)
        const fl = new THREE.DirectionalLight(0xffffff, 1.0)
        fl.position.set(-3, 3, 4); scene.add(fl)
        const rl = new THREE.DirectionalLight(0xffffff, 0.8)
        rl.position.set(0, 5, -5); scene.add(rl)

        // Idle.fbx 로드 — 캐릭터 메시 + Idle 애니메이션
        new FBXLoader().load(
            FBX_BASE + 'Idle.fbx',
            (fbx) => {
                if (disposed) return

                normalizeAndCenterModel(fbx)
                scene.add(fbx)
                fitCameraToObject(camera, fbx, container)

                // AnimationMixer 생성
                const mixer = new THREE.AnimationMixer(fbx)
                mixerRef.current = mixer

                // Idle 클립 캐시 저장
                if (fbx.animations?.length) {
                    animCacheRef.current['Idle.fbx'] = fbx.animations[0]
                }

                // 현재 pose 재생 (이미 pose가 설정된 경우 대응)
                playAnim(poseRef.current)
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
            const w = el.clientWidth || 1
            const h = el.clientHeight || 1
            cam.aspect = w / h
            cam.updateProjectionMatrix()
            rdr.setSize(w, h)
        }
        window.addEventListener('resize', onResize)

        // 렌더 루프
        const animate = () => {
            frameRef.current = requestAnimationFrame(animate)
            const delta = clockRef.current.getDelta()
            mixerRef.current?.update(delta)
            renderer.render(scene, camera)
        }
        animate()

        return () => {
            disposed = true
            window.removeEventListener('resize', onResize)
            if (frameRef.current) cancelAnimationFrame(frameRef.current)
            mixerRef.current?.stopAllAction()
            renderer.dispose()
            if (container.contains(renderer.domElement))
                container.removeChild(renderer.domElement)
        }
    }, [playAnim]) // playAnim은 useCallback으로 안정적

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
    camera.aspect = (container.clientWidth || 1) / (container.clientHeight || 1)
    camera.updateProjectionMatrix()
}