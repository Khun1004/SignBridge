import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const BONES = {
  rArm:     'mixamorig_RightArm',
  rForearm: 'mixamorig_RightForeArm',
  rHand:    'mixamorig_RightHand',
  lArm:     'mixamorig_LeftArm',
  lForearm: 'mixamorig_LeftForeArm',
  lHand:    'mixamorig_LeftHand',
};

function lerp(a, b, t) { return a + (b - a) * t; }

function applyIdlePose(boneMap, instant) {
  const t = instant ? 1.0 : 0.08;
  const set = (name, rx, ry, rz) => {
    const b = boneMap[name];
    if (!b) return;
    b.rotation.x = lerp(b.rotation.x, rx, t);
    b.rotation.y = lerp(b.rotation.y, ry, t);
    b.rotation.z = lerp(b.rotation.z, rz, t);
  };
  set(BONES.rArm,     0, 0, -1.3);
  set(BONES.lArm,     0, 0,  1.3);
  set(BONES.rForearm, 0.15, 0, 0);
  set(BONES.lForearm, 0.15, 0, 0);
  set(BONES.rHand,    0, 0, 0);
  set(BONES.lHand,    0, 0, 0);
}

export default function Person3D({ pose = 'idle', jointData = null }) {
  const mountRef = useRef(null);
  const stateRef = useRef({ pose, jointData });

  useEffect(() => {
    stateRef.current = { pose, jointData };
  }, [pose, jointData]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    let animId;
    const boneMap = {};

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, el.clientWidth / el.clientHeight, 0.1, 100);
    camera.position.set(0, 1.4, 3.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(1, 2, 3);
    scene.add(dirLight);

    const loader = new GLTFLoader();
    loader.load(
        '/avatar.glb',
        (gltf) => {
          const model = gltf.scene;
          model.position.set(0, -1.0, 0);
          scene.add(model);

          // AnimationMixer 생성하지 않음 → 내장 애니메이션 재생 안 됨

          model.traverse(node => {
            if (node.isBone) boneMap[node.name] = node;
          });

          console.log('본 목록:', Object.keys(boneMap));
          applyIdlePose(boneMap, true);
        },
        undefined,
        (err) => console.error('GLB 로드 오류:', err)
    );

    const tick = () => {
      animId = requestAnimationFrame(tick);
      const { pose: cp, jointData: jd } = stateRef.current;

      if (cp === 'idle' || !jd) {
        applyIdlePose(boneMap, false);
      } else if (jd) {
        const t = 0.12;
        if (jd.rArm && boneMap[BONES.rArm]) {
          const b = boneMap[BONES.rArm];
          b.rotation.x = lerp(b.rotation.x, jd.rArm.x ?? 0, t);
          b.rotation.y = lerp(b.rotation.y, jd.rArm.y ?? 0, t);
          b.rotation.z = lerp(b.rotation.z, jd.rArm.z ?? -1.3, t);
        }
        if (jd.lArm && boneMap[BONES.lArm]) {
          const b = boneMap[BONES.lArm];
          b.rotation.x = lerp(b.rotation.x, jd.lArm.x ?? 0, t);
          b.rotation.y = lerp(b.rotation.y, jd.lArm.y ?? 0, t);
          b.rotation.z = lerp(b.rotation.z, jd.lArm.z ?? 1.3, t);
        }
      }

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}