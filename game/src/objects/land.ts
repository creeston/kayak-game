import {
    Color3,
    MeshBuilder,
    StandardMaterial,
    VertexBuffer,
} from "@babylonjs/core";
import { DestroyableMesh } from "../contracts/destroyableMesh";

export class Land implements DestroyableMesh {
    constructor(scene, landWidth, landHeight) {
        this.ground = MeshBuilder.CreateGround(
            "land",
            { width: landWidth, height: landHeight, subdivisions: 50 },
            scene
        );
        this.scene = scene;
    }

    atPosition(xOffset: number, zOffset: number) {
        this.ground.position.x = xOffset;
        this.ground.position.z = zOffset;

        this.xOffset = xOffset;
        this.zOffset = zOffset;

        return this;
    }

    withGrassMaterial() {
        const groundMaterial = new StandardMaterial("groundMat", this.scene);
        this.ground.material = groundMaterial;
        this.ground.material.specularColor = new Color3(0.1, 0.1, 0.1);
        this.ground.material.diffuseColor = new Color3(0.3, 0.6, 0.3); // Grass-like green

        return this;
    }

    applyHeightMap(
        riverPath: { x: number; z: number }[],
        riverWidth: number,
        riverDepth: number
    ) {
        const positions =
            this.ground.getVerticesData(VertexBuffer.PositionKind) || [];
        const indices = this.ground.getIndices() || [];

        for (let i = 0; i < riverPath.length - 1; i++) {
            const firstPoint = riverPath[i];
            const secondPoint = riverPath[i + 1];

            // Interpolate x and z between two points
            let x1 = firstPoint.x;
            let z1 = firstPoint.z;
            let x2 = secondPoint.x;
            let z2 = secondPoint.z;
            let dx = x2 - x1;
            let dz = z2 - z1;
            let distance = Math.sqrt(dx * dx + dz * dz);
            let steps = Math.floor(distance);
            let stepX = dx / steps;
            let stepZ = dz / steps;
            for (let step = 0; step < steps; step++) {
                let x = x1 + stepX * step;
                let z = z1 + stepZ * step;

                for (let j = 0; j < positions.length; j += 3) {
                    let vx = positions[j] + this.xOffset;
                    let vz = positions[j + 2] + this.zOffset;
                    let distance = Math.abs(x - vx) + Math.abs(z - vz); // Manhattan distance
                    if (distance < riverWidth) {
                        // Lower the terrain
                        let depthFactor = 1 - distance / riverWidth; // Closer to center = deeper
                        positions[j + 1] -= riverDepth * depthFactor; // Lower Y coordinate
                    }
                }
            }
        }

        this.ground.updateVerticesData(VertexBuffer.PositionKind, positions);
        this.ground.convertToFlatShadedMesh();

        return this;
    }

    dispose() {
        this.ground.dispose();
    }

    private ground: any;
    private scene: any;

    private xOffset: number = 0;
    private zOffset: number = 0;
}
