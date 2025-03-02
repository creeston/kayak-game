import {
    Color3,
    MeshBuilder,
    StandardMaterial,
    Vector3,
    VertexBuffer,
} from "@babylonjs/core";
import * as CANNON from "cannon";
import { DestroyableMesh } from "../contracts/destroyableMesh";

export class Land implements DestroyableMesh {
    constructor(
        private scene,
        private landWidth,
        private landHeight,
        private physicsWorld
    ) {
        this.ground = MeshBuilder.CreateGround(
            "land",
            { width: landWidth, height: landHeight, subdivisions: 50 },
            scene
        );
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
        let colliderCreated = false;
        const positions =
            this.ground.getVerticesData(VertexBuffer.PositionKind) || [];

        for (let i = 0; i < riverPath.length - 1; i++) {
            const firstPoint = riverPath[i];
            const secondPoint = riverPath[i + 1];

            const direction = new Vector3(
                secondPoint.x - firstPoint.x,
                0,
                secondPoint.z - firstPoint.z
            );

            const normalizedDirection = direction.normalizeToNew();
            const perpendicular = new Vector3(
                -normalizedDirection.z,
                0,
                normalizedDirection.x
            );

            const leftBank = new Vector3(firstPoint.x, 0, firstPoint.z).add(
                perpendicular.scale((riverWidth + 4) / 2)
            );
            const rightBank = new Vector3(firstPoint.x, 0, firstPoint.z).add(
                perpendicular.scale(-(riverWidth + 4) / 2)
            );

            if (!colliderCreated) {
                this.createStaticCollider(leftBank, direction);
                this.createStaticCollider(rightBank, direction);

                colliderCreated = false;
            }

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

    private createStaticCollider(position: Vector3, direction: Vector3) {
        const startVec = position;
        const endVec = direction.add(position);

        // const directionVec = endVec.subtract(startVec);
        const length = direction.length();
        const midpoint = Vector3.Center(startVec, endVec);

        const angle = Math.atan2(direction.x, direction.z);

        const wall = MeshBuilder.CreateBox(
            "wall",
            { width: 1, height: 5, depth: length },
            this.scene
        );
        wall.position = midpoint;
        wall.rotation.y = angle;
        wall.setEnabled(false);

        // Create collision box using Cannon.js
        const halfExtents = new CANNON.Vec3(0.5, 5, length / 2);
        const colliderShape = new CANNON.Box(halfExtents);
        const colliderBody = new CANNON.Body({ mass: 0 }); // Static collider
        colliderBody.addShape(colliderShape);
        colliderBody.position.set(midpoint.x, 5, midpoint.z); // Y is half of height

        // Apply rotation to the collider
        const quaternion = new CANNON.Quaternion();
        quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle);
        colliderBody.quaternion.copy(quaternion);

        // Add collider to the physics world
        this.physicsWorld.addBody(colliderBody);
    }

    dispose() {
        this.ground.dispose();
    }

    private ground: any;

    private xOffset: number = 0;
    private zOffset: number = 0;
}
