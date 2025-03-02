// Class that encapsulates the tiled piece of environment (river surrounding) of the game

import { AbstractMesh, Mesh } from "@babylonjs/core";
import {
    RiverEnvironment,
    RiverEnvironmentElement,
} from "../models/riverEnvironment";
import { Land } from "./land";
import { DestroyableMesh } from "../contracts/destroyableMesh";
import { Village } from "./village";
import { Forest } from "./forest";

// Made of up ground mesh, and may contain other meshes like trees, houses, etc.
export class Environment implements DestroyableMesh {
    private meshes: DestroyableMesh[] = [];
    constructor(
        private scene: any,
        private treeMeshTemplate: AbstractMesh,
        private houseMeshTemplate: AbstractMesh,
        private width: number,
        private environmentData: RiverEnvironment,
        private riverPath: { x: number; z: number }[]
    ) {}

    render(x: number, z: number) {
        const land = new Land(this.scene, this.width, this.width)
            .withGrassMaterial()
            .atPosition(x, z)
            .applyHeightMap(this.riverPath, 10, 2);

        this.meshes = [land];

        this.environmentData.forEach((surrounding: RiverEnvironmentElement) => {
            if (
                surrounding["type"] == "allotments" ||
                surrounding["type"] == "village"
            ) {
                const location = surrounding.location;
                if (!this.isLocationInEnvironment(location, x, z)) {
                    return;
                }

                this.meshes.push(
                    new Village(surrounding, this.houseMeshTemplate)
                );
            }

            if (surrounding["type"] == "forest") {
                const shape = surrounding.shape;
                if (
                    shape.some((point) =>
                        this.isLocationInEnvironment(point, x, z)
                    )
                ) {
                    this,
                        this.meshes.push(
                            new Forest(surrounding, this.treeMeshTemplate)
                        );
                }
            }
        });

        return this;
    }

    private isLocationInEnvironment(location: number[], x: number, z: number) {
        // Environment is a square with width "width" located at (x, z)

        const halfWidth = this.width / 2;
        const xMin = x - halfWidth;
        const xMax = x + halfWidth;
        const zMin = z - halfWidth;
        const zMax = z + halfWidth;

        return (
            location[0] >= xMin &&
            location[0] <= xMax &&
            location[1] >= zMin &&
            location[1] <= zMax
        );
    }

    dispose() {
        this.meshes.forEach((mesh) => {
            mesh.dispose();
        });
    }
}
