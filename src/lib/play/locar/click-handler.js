import * as THREE from 'three';

class ClickHandler {

    constructor(renderer) {
        this.raycaster = new THREE.Raycaster();
        this.normalisedMousePosition = new THREE.Vector2(null, null);
        renderer.domElement.addEventListener("click", e => {
            this.normalisedMousePosition.set (
                ((e.clientX / renderer.domElement.clientWidth) * 2) - 1,
                -((e.clientY / renderer.domElement.clientHeight) * 2) + 1
            );    
        });
    }


    raycast(camera, scene) {
        if(this.normalisedMousePosition.x !== null && this.normalisedMousePosition.y !== null) {
            this.raycaster.setFromCamera(this.normalisedMousePosition, camera);
            const objects = this.raycaster.intersectObjects(scene.children, false);
            this.normalisedMousePosition.set(null, null);
            return objects;
        }    
        return [];
    }
}

export { ClickHandler };    
