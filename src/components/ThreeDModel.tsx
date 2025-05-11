import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { PresentationControls, Stage, OrbitControls } from "@react-three/drei";
import { Group } from "three";
import * as THREE from "three";
import { Button } from "~/components/shadcn/ui/button";
import clsx from "clsx";

const Model = ({ url, setLoadingProgress }: { url: string; setLoadingProgress: (progress: number) => void }) => {
    const [model, setModel] = useState<Group | null>(null);

    useEffect(() => {
        const loader = new OBJLoader();

        loader.load(
            url,
            (object: Group) => {
                const box = new THREE.Box3().setFromObject(object);
                const center = box.getCenter(new THREE.Vector3());
                object.position.sub(center);
                object.scale.set(2, 2, 2);
                object.position.set(0, 0, 0);
                setModel(object);
                setLoadingProgress(100);
                //console.log("Object loaded", object);
            },
            (xhr) => {
                const progress = (xhr.loaded / xhr.total) * 100;
                setLoadingProgress(progress);
                //console.log(progress + "% loaded");
            },
            (error) => {
                console.error("An error happened", error);
                setLoadingProgress(0);
            }
        );
    }, [url, setLoadingProgress]);

    if (!model) return null;

    //console.log("Model", model);

    return <primitive object={model} />;
};

const ModelLoader = ({ url, setLoadingProgress }: { url: string; setLoadingProgress: (progress: number) => void }) => {
    return (
        <Canvas
            camera={{ fov: 45, position: [0, 0, 5] }}
            className="avatar relative h-full w-full"
        >
            <color attach="background" args={["#E2DFD2"]} />
            <OrbitControls
                enableZoom={true}
                maxDistance={10}
                minDistance={2}
            />
            <Stage intensity={1} environment="city">
                <Model url={url} setLoadingProgress={setLoadingProgress} />
            </Stage>
        </Canvas>
    );
};

const ShowModel = ({ url, blur }: { url: string; blur?: boolean }) => {
    const [loader, setLoader] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);

    return (
        <div className={clsx("h-full w-full avatar", { "blur-lg": blur })}>
            {loader ? (
                <>
                    <ModelLoader url={url} setLoadingProgress={setLoadingProgress} />
                    {loadingProgress < 100 && (
                        <div className="absolute inset-0   flex items-center justify-center bg-black bg-opacity-50 text-white">
                            <div className="text-center">
                                <div className="mb-2 text-2xl font-bold">Loading...</div>
                                <div className="text-xl">{Math.round(loadingProgress)}%</div>
                            </div>
                        </div>
                    )}
                </>
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
    );
};

export default ShowModel;
