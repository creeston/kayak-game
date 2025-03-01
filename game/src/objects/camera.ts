import { ArcRotateCamera, Scene, Vector3 } from "@babylonjs/core";

export class Camera {
    constructor(scene: Scene, canvas: HTMLCanvasElement, position: Vector3) {
        const rad = Math.PI / 180;
        this.camera = new ArcRotateCamera(
            "Camera",
            rad * 240,
            rad * 60,
            50,
            position,
            scene
        );
        this.camera.attachControl(canvas, true);
        this.camera.setTarget(position);
        this.camera.keysUp = [];
        this.camera.keysDown = [];
        this.camera.keysLeft = [];
        this.camera.keysRight = [];

        this.camera.noRotationConstraint = false;
        this.camera.upperBetaLimit = rad * 63;
        this.camera.lowerBetaLimit = rad * 60;
    }

    setTarget(target: Vector3) {
        this.camera.setTarget(target);
    }

    getCameraRotation() {
        return this.camera.rotation;
    }

    setCameraXRotation(x: number) {
        this.camera.rotation.x = x;
    }

    private camera: ArcRotateCamera;
}
