import { Mesh, MeshBuilder, Scene, Vector, Vector3 } from "@babylonjs/core";
import { SkyMaterial } from "@babylonjs/materials";

export class Sky {
    constructor(scene: Scene, width: number, height: number, depth: number) {
        this.skybox = MeshBuilder.CreateBox(
            "skyBox",
            { width: width, height: height, depth: depth },
            scene
        );
        const skyMaterial = new SkyMaterial("skyMaterial", scene);
        skyMaterial.backFaceCulling = false;
        skyMaterial.luminance = 1;
        skyMaterial.inclination = -0.1;
        this.skybox.material = skyMaterial;
    }

    atPosition(position: Vector3) {
        this.skybox.position = position;
        return this;
    }

    get position() {
        return this.skybox.position;
    }

    get size() {
        return this.skybox.scaling.x;
    }

    skybox: Mesh;
}
