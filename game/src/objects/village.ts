import { Vector3 } from "@babylonjs/core";
import { CoordinatesNormalizer } from "../utils/coordinatesNormalizer";
import { GeodataConverter } from "../utils/geodataConverter";

export class Village {
    constructor(villageData, origin, houseMesh) {
        const geodataConverter = new GeodataConverter();
        const villageLocation = geodataConverter.convertCoordinates(
            villageData["location"][0],
            villageData["location"][1]
        );
        const point =
            CoordinatesNormalizer.recalculateCoordinateRelativeToOrigin(
                villageLocation,
                10,
                origin
            );

        this.createVillage(point, houseMesh);
    }

    createVillage(point, houseMesh) {
        const house = houseMesh.clone("house", null);
        house.position = new Vector3(point.x, point.y, point.z);
        this.house = house;
    }

    destroy() {
        this.house.dispose();
    }

    private house: any;
}
