"use client";

import { Bounds, Center, Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import { Suspense } from "react";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

import { Spinner } from "~/ui/spinner";

function Gltf({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function Obj({ url }: { url: string }) {
  const obj = useLoader(OBJLoader, url);
  return <primitive object={obj} />;
}

/** A 3D model (GLB/GLTF or OBJ) the viewer can rotate, zoom and pan. */
export default function ModelViewer({ url, autoRotate = true }: { url: string; autoRotate?: boolean }) {
  const isObj = /\.obj(\?|$)/i.test(url);
  return (
    <Suspense fallback={<div className="flex size-full items-center justify-center"><Spinner /></div>}>
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }} dpr={[1, 2]} className="touch-none">
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 2]} intensity={1.2} />
        <Bounds fit clip observe margin={1.2}>
          <Center>{isObj ? <Obj url={url} /> : <Gltf url={url} />}</Center>
        </Bounds>
        <Environment preset="city" />
        <OrbitControls makeDefault autoRotate={autoRotate} autoRotateSpeed={1.2} enablePan />
      </Canvas>
    </Suspense>
  );
}
