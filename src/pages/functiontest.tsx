import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { PresentationControls, Stage, OrbitControls } from "@react-three/drei";
import { Button } from "~/components/shadcn/ui/button";
import { Group } from "three";
import * as THREE from "three";
const Model: React.FC = () => {
  const [model, setModel] = useState<Group | null>(null);

  useEffect(() => {
    const loader = new OBJLoader();

    loader.load(
      "https://ipfs.io/ipfs/QmdBWAd58rkZzfPf28M1fegvTNtWrzABnV2M9qiEAfXCsx",
      (object: Group) => {
        // Center the model
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        object.position.sub(center);
        object.scale.set(0.1, 0.1, 0.1); // Adjust the scale as needed (0.5 = 50% of the original size)
        object.position.set(-2.5, -2, 0.0); // Adjust the scale as needed (0.5 = 50% of the original size)
        setModel(object);
        console.log("Object loaded", object);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error("An error happened", error);
      },
    );
  }, []);

  if (!model) return null; // Optionally return a loading state

  console.log("Model", model);

  return <primitive object={model} />;
};

const ModelLoader = () => {
  return (
    <Canvas camera={{ fov: 45 }} className="avatar relative h-full w-full ">
      <color attach="background" args={["#E2DFD2"]} />
      <PresentationControls speed={2} global polar={[-0.1, Math.PI / 4]}>
        <Stage intensity={1} environment="city">
          <Model />
        </Stage>
      </PresentationControls>
    </Canvas>
  );
};

const FunctionTest: React.FC = () => {
  const [loader, setLoader] = useState(false);

  return (
    <div className="h-full w-full">
      <div className="scrollbar-style relative h-full w-full overflow-y-auto rounded-xl">
        <div className="absolute h-full w-full bg-base-200/50" />
        <div className="flex h-full flex-col justify-between space-y-2 p-2">
          <div className="flex h-full flex-col gap-2">
            <div className="relative flex-1 space-y-2 rounded-xl border-4 border-base-100 p-1 text-sm tracking-wider">
              <div className="avatar h-full w-full">
                {loader ? (
                  <ModelLoader />
                ) : (
                  <div className="flex w-full flex-col items-center">
                    <Button
                      className="flex h-full w-full flex-col items-center justify-center"
                      onClick={() => setLoader(true)}
                    >
                      Load 3D Model
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="relative flex-1 space-y-2 rounded-xl border-4 border-base-100 p-4 text-sm tracking-wider">
              <div className="flex flex-col gap-2">
                <p>
                  <span className="font-semibold">Name:</span> 3D Model
                </p>
                <p>
                  <span className="badge badge-primary">Wadzzo</span>
                </p>

                <p className="line-clamp-2">
                  <b>Description: </b> 3D Model
                </p>

                <>
                  <p>
                    <span className="font-semibold">Available:</span> 10 copies
                  </p>

                  <p>
                    <span className="font-semibold">Price: 1 Wadzzo</span>
                  </p>
                </>

                <p>
                  <b>Media:</b> 3D
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FunctionTest;
