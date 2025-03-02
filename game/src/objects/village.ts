import { Vector3 } from "@babylonjs/core";
import { RiverEnvironmentElement } from "../models/riverEnvironment";
import { DestroyableMesh } from "../contracts/destroyableMesh";

export class Village implements DestroyableMesh {
    constructor(villageData: RiverEnvironmentElement, houseMesh) {
        this.createVillage(villageData.location, houseMesh);
    }

    createVillage(point, houseMesh) {
        const house = houseMesh.clone("house", null);
        house.position = new Vector3(point[0], 0, point[1]);
        house.setEnabled(true);
        this.house = house;
    }

    dispose() {
        this.house.dispose();
    }

    private house: any;
}
