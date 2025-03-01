import { Vector3 } from "@babylonjs/core";
import { CoordinatesNormalizer } from "../utils/coordinatesNormalizer";
import { GeodataConverter } from "../utils/geodataConverter";

export class Forest {
    constructor(forestData, origin, treeMesh) {
        const geodataConverter = new GeodataConverter();
        const forestArea = forestData["shape"].map((coords) =>
            geodataConverter.convertCoordinates(coords[0], coords[1])
        );
        const forestConvertedArea =
            CoordinatesNormalizer.recalculateCoordinatesRelativeToOrigin(
                forestArea,
                10,
                origin
            );

        this.createForest(forestConvertedArea, treeMesh);
    }

    createForest(forestConvertedArea, treeMesh) {
        for (const point of forestConvertedArea) {
            const tree = treeMesh.clone("tree", null);
            tree.position = new Vector3(point.x, point.y, point.z);
            this.trees.push(tree);
        }
    }

    destroy() {
        this.trees.forEach((tree) => {
            tree.dispose();
        });
    }

    private trees: any[] = [];
}
