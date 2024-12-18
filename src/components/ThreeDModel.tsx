import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { PresentationControls, Stage, OrbitControls } from "@react-three/drei";
import { Group } from "three";
import * as THREE from "three";
import { Button } from "~/components/shadcn/ui/button";
import clsx from "clsx";

const Model = ({ url }: { url: string }) => {
    const [model, setModel] = useState<Group | null>(null);

    useEffect(() => {
        const loader = new OBJLoader();

        loader.load(
            url,
            (object: Group) => {
                // Center the model
                const box = new THREE.Box3().setFromObject(object);
                const center = box.getCenter(new THREE.Vector3());
                object.position.sub(center);
                object.scale.set(2, 2, 2); // Adjust the scale as needed
                object.position.set(0, 0, 0); // Adjust the position as needed
                setModel(object);
                console.log("Object loaded", object);
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
            },
            (error) => {
                console.error("An error happened", error);
            }
        );
    }, [url]);

    if (!model) return null; // Optionally return a loading state

    console.log("Model", model);

    return <primitive object={model} />;
};

const ModelLoader = ({ url }: { url: string }) => {
    return (
        <Canvas
            camera={{ fov: 45, position: [0, 0, 5] }}
            className="avatar relative h-full w-full"
        >
            <color attach="background" args={["#E2DFD2"]} />
            <OrbitControls
                enableZoom={true} // Allow zooming
                maxDistance={10} // Maximum zoom-out distance
                minDistance={2} // Minimum zoom-in distance
            />
            <Stage intensity={1} environment="city">
                <Model url={url} />
            </Stage>
        </Canvas>
    );
};

const ShowModel = ({ url, blur }: { url: string; blur?: boolean }) => {
    const [loader, setLoader] = useState(false);

    return (
        <div className={clsx("h-full w-full avatar", { " blur-lg": blur })}>
            {loader ? (
                <ModelLoader url={url} />
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
