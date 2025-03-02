import { Vector3 } from "@babylonjs/core";
import { RiverEnvironmentElement } from "../models/riverEnvironment";
import { DestroyableMesh } from "../contracts/destroyableMesh";

export class Forest implements DestroyableMesh {
    constructor(forestData: RiverEnvironmentElement, treeMesh) {
        this.createForest(forestData.shape, treeMesh);
    }

    createForest(forestConvertedArea: number[][], treeMesh) {
        for (const point of forestConvertedArea) {
            const tree = treeMesh.clone("tree", null);
            tree.position = new Vector3(point[0], 0, point[1]);
            this.trees.push(tree);
            tree.setEnabled(true);
        }
    }

    dispose() {
        this.trees.forEach((tree) => {
            tree.dispose();
        });
    }

    private trees: any[] = [];
}
