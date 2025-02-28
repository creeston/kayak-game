import { Color3, Mesh, StandardMaterial, VertexData } from "@babylonjs/core";

export class River {
    constructor(
        scene: any,
        riverPath: { x: number; z: number }[],
        riverWidth: number
    ) {
        this.scene = scene;
        this.riverPath = riverPath;
        this.riverWidth = riverWidth;
        this.createRiver();
    }

    createRiver() {
        const riverVertices = [];
        const riverIndices = [];
        let riverIndex = 0;

        for (let i = 0; i < this.riverPath.length - 1; i++) {
            const { x: x1, z: z1 } = this.riverPath[i];
            const { x: x2, z: z2 } = this.riverPath[i + 1];

            const y = -2;

            const dx = x2 - x1;
            const dz = z2 - z1;
            const length = Math.sqrt(dx * dx + dz * dz);
            const steps = Math.ceil(length);

            for (let j = 0; j < steps; j++) {
                const t = j / steps;
                const x = x1 + t * dx;
                const z = z1 + t * dz;

                // Define a square for the river
                riverVertices.push(
                    x - this.riverWidth / 2,
                    y,
                    z - this.riverWidth / 2
                ); // Bottom-left
                riverVertices.push(
                    x + this.riverWidth / 2,
                    y,
                    z - this.riverWidth / 2
                ); // Bottom-right
                riverVertices.push(
                    x + this.riverWidth / 2,
                    y,
                    z + this.riverWidth / 2
                ); // Top-right
                riverVertices.push(
                    x - this.riverWidth / 2,
                    y,
                    z + this.riverWidth / 2
                ); // Top-left

                // Two triangles per square
                riverIndices.push(riverIndex, riverIndex + 1, riverIndex + 2);
                riverIndices.push(riverIndex, riverIndex + 2, riverIndex + 3);
                riverIndex += 4;
            }
        }

        const riverMesh = new Mesh("riverMesh", this.scene);
        const riverData = new VertexData();
        riverData.positions = riverVertices;
        riverData.indices = riverIndices;
        riverData.applyToMesh(riverMesh);

        const riverMaterial = new StandardMaterial("riverMat", this.scene);
        riverMaterial.diffuseColor = new Color3(0, 0, 1); // Blue
        riverMesh.material = riverMaterial;
    }

    private scene: any;
    private riverPath: { x: number; z: number }[];
    private riverWidth: number;
}
