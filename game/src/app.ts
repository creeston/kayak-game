import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import {
    Engine,
    Scene,
    Vector3,
    HemisphericLight,
    ActionManager,
    ExecuteCodeAction,
    Animation,
    Quaternion,
} from "@babylonjs/core";
import { GeodataConverter } from "./utils/geodataConverter";
import riverData from "./river.json";
import riverSurrounding from "./riverSurrounding.json";
import { CoordinatesNormalizer } from "./utils/coordinatesNormalizer";
import { River } from "./objects/river";
import { Boat } from "./objects/boat";
import { Sky } from "./objects/sky";
import { Camera } from "./objects/camera";
import { RiverTiling } from "./utils/riverTiling";
import { SceneLoader } from "@babylonjs/core";
import { Environment } from "./objects/environment";
import { RiverEnvironmentElement } from "./models/riverEnvironment";
import * as CANNON from "cannon";

class App {
    private canvas: HTMLCanvasElement;
    private geodataConverter: GeodataConverter;
    private engine: Engine;
    private scene: Scene;

    constructor() {
        this.canvas = document.getElementById(
            "gameCanvas"
        ) as HTMLCanvasElement;
        this.geodataConverter = new GeodataConverter();
        this.engine = new Engine(this.canvas, true);
        this.scene = new Scene(this.engine);
    }

    async start() {
        let path = this.geodataConverter.getRiverGeodataFromGeojson(riverData);

        let { width, height } =
            CoordinatesNormalizer.calculateNormalizationParameters(path);

        const origin = { x: path[0][0], z: path[0][2] };

        let riverPath =
            CoordinatesNormalizer.recalculateCoordinatesRelativeToOrigin(
                path,
                10,
                origin
            );

        width = width / 10;
        height = height / 10;

        const tileSize = 100;

        const riverTiling = new RiverTiling();
        const { riverToTiles, tileToRiverPoints } = riverTiling.generateTiles(
            tileSize,
            riverPath
        );

        const renderRiverPath = riverPath;

        riverSurrounding.forEach((surrounding: RiverEnvironmentElement) => {
            if (surrounding.location) {
                const location = this.geodataConverter.convertCoordinates(
                    surrounding.location[0],
                    surrounding.location[1]
                );
                const point =
                    CoordinatesNormalizer.recalculateCoordinateRelativeToOrigin(
                        location,
                        10,
                        origin
                    );

                surrounding.location = [point.x, point.z];
            }

            if (surrounding.shape) {
                const shape = surrounding.shape.map((coords) =>
                    this.geodataConverter.convertCoordinates(
                        coords[0],
                        coords[1]
                    )
                );
                const convertedShape =
                    CoordinatesNormalizer.recalculateCoordinatesRelativeToOrigin(
                        shape,
                        10,
                        origin
                    );

                surrounding.shape = convertedShape.map((point) => [
                    point.x,
                    point.z,
                ]);
            }
        });

        const treeMeshesResult = await SceneLoader.ImportMeshAsync(
            "",
            "low_poly_tree.glb",
            "",
            this.scene
        );
        const houseMeshesResult = await SceneLoader.ImportMeshAsync(
            "",
            "fantasy_house_low_poly.glb",
            "",
            this.scene
        );
        const boatMeshesResult = await SceneLoader.ImportMeshAsync(
            "",
            "boat-animated.glb",
            "",
            this.scene
        );
        const treeMeshes = treeMeshesResult.meshes;
        const treeMesh = treeMeshes[0];
        treeMesh.setEnabled(false);
        const houseMeshes = houseMeshesResult.meshes;
        const houseMesh = houseMeshes[0];
        houseMesh.setEnabled(false);
        const boatMeshes = boatMeshesResult.meshes;
        const boatMesh = boatMeshes[0];

        this.scene.animationGroups.forEach((anim) => anim.stop());

        const boatLeftPaddle = boatMeshes[5];
        const boatLeftPaddleNode = boatMeshes[5].parent;
        const boatRightPaddle = boatMeshes[6].parent;

        boatLeftPaddle.setEnabled(true);
        boatRightPaddle.setEnabled(true);

        const leftPaddleAnim = this.scene.animationGroups.find(
            (group) => group.name === "LeftPaddleSwim"
        );
        const rightPaddleAnim = this.scene.animationGroups.find(
            (group) => group.name === "RightPaddleSwim"
        );

        new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);

        new Sky(
            this.scene,
            Math.floor(width) + 500,
            500,
            Math.floor(height) + 500
        ).atPosition(
            new Vector3(Math.floor(width) / 2, 0, -Math.floor(height) / 2)
        );

        const riverPoints = tileToRiverPoints.get("0_0");
        const physicsWorld = new CANNON.World();
        // physicsWorld.gravity.set(0, -9.82, 0);

        const river = new River(
            this.scene,
            renderRiverPath,
            20,
            physicsWorld
        ).createRiver();

        let renderedLands: Environment[] = [
            new Environment(
                this.scene,
                treeMesh,
                houseMesh,
                tileSize,
                riverSurrounding,
                riverPoints,
                physicsWorld
            ).render(0, 0),
        ];

        const { x: startX, z: startZ } = renderRiverPath[0];

        const boat = new Boat(this.scene)
            .fromExistingMesh(boatMesh)
            .atRiverPosition(startX, startZ);

        // physicsWorld.gravity.set(0, -9.82, 0);

        const boatShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
        const boatBody = new CANNON.Body({ mass: 1 });
        boatBody.addShape(boatShape);
        boatBody.position.set(
            boat.position.x,
            boat.position.y,
            boat.position.z
        );
        const flowSpeed = 1; // Units per second

        physicsWorld.addBody(boatBody);

        const forceVectors: { x: number; z: number }[] = [];

        for (let i = 0; i < riverPath.length - 1; i++) {
            const current = riverPath[i];
            const next = riverPath[i + 1];

            // Calculate direction vector from current to next point
            const direction = { x: next.x - current.x, z: next.z - current.z };

            // Normalize the direction vector to create a unit vector
            const length = Math.sqrt(direction.x ** 2 + direction.z ** 2);
            const unitVector = {
                x: direction.x / length,
                z: direction.z / length,
            };

            // Scale the unit vector by the flow speed to get the force vector
            const forceVector = {
                x: unitVector.x * flowSpeed,
                z: unitVector.z * flowSpeed,
            };
            forceVectors.push(forceVector);
        }

        forceVectors.push(forceVectors[forceVectors.length - 1]);
        let currentRiverPointIndex = 0;
        const dragCoefficient = 0.5;

        // on key left and right turn the boat
        const sceneInstance = this.scene;
        this.scene.actionManager = new ActionManager(this.scene);
        this.scene.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, function (
                evt
            ) {
                if (evt.sourceEvent.key === "ArrowLeft") {
                    boat.turnLeft();
                } else if (evt.sourceEvent.key === "ArrowRight") {
                    boat.turnRight();
                } else if (evt.sourceEvent.key == "ArrowUp") {
                    // Apply force to the boat in the direction of the boat's forward vector
                    const foward = boat.forward;
                    const force = new CANNON.Vec3(foward.x, 0, foward.z).scale(
                        50
                    );
                    boatBody.applyForce(force, boatBody.position);

                    leftPaddleAnim.start(false, 3);
                    rightPaddleAnim.start(false, 3);
                } else if (evt.sourceEvent.key == "ArrowDown") {
                    // Apply force to the boat in the direction opposite to the boat's forward vector
                    const foward = boat.forward;
                    const force = new CANNON.Vec3(
                        -foward.x,
                        0,
                        -foward.z
                    ).scale(10);
                    boatBody.applyForce(force, boatBody.position);
                }
            })
        );

        this.scene.registerBeforeRender(() => {
            const boatPosition = boat.position;
            const currentRiverPoint = renderRiverPath[currentRiverPointIndex];
            const nextRiverPoint = renderRiverPath[currentRiverPointIndex + 1];
            const distanceToNext = Math.sqrt(
                (boatPosition.x - nextRiverPoint.x) ** 2 +
                    (boatPosition.z - nextRiverPoint.z) ** 2
            );

            const distanceToCurrent = Math.sqrt(
                (boatPosition.x - currentRiverPoint.x) ** 2 +
                    (boatPosition.z - currentRiverPoint.z) ** 2
            );

            if (distanceToNext < distanceToCurrent) {
                currentRiverPointIndex++;
            }

            const forceVector = forceVectors[currentRiverPointIndex];
            const riverFlow = new Vector3(forceVector.x, 0, forceVector.z);

            boatBody.applyForce(riverFlow, boatBody.position);

            const velocity = boatBody.velocity;
            const speed = velocity.length();
            if (speed > 0) {
                const dragForceMagnitude = dragCoefficient * speed;
                const dragForce = new CANNON.Vec3(
                    -velocity.x,
                    0,
                    -velocity.z
                ).scale(dragForceMagnitude / speed);
                boatBody.applyForce(dragForce, boatBody.position);
            }

            physicsWorld.step(1 / 60);
            boat.position.copyFromFloats(
                boatBody.position.x,
                boatBody.position.y,
                boatBody.position.z
            );

            camera.setTarget(boat.position);

            const nextPoints = [];
            for (const point of renderRiverPath.slice(currentRiverPointIndex)) {
                if (
                    point.x > boat.position.x &&
                    point.x < boat.position.x + 150
                ) {
                    nextPoints.push(point);
                }
            }

            for (const point of nextPoints) {
                const key = `${point.x}_${point.z}`;
                const tilesContainingPoint = riverToTiles.get(key);
                if (!tilesContainingPoint) {
                    continue;
                }
                tilesContainingPoint.forEach((tile) => {
                    const tileKey = `${tile.x}_${tile.z}`;
                    if (renderedTiles.has(tileKey)) {
                        // Tile already rendered
                        return;
                    }
                    const riverPoints = tileToRiverPoints.get(tileKey);
                    const { cz, cx } = tile;
                    renderedLands.push(
                        new Environment(
                            this.scene,
                            treeMesh,
                            houseMesh,
                            tileSize,
                            riverSurrounding,
                            riverPoints,
                            physicsWorld
                        ).render(cx, cz)
                    );
                    renderedTiles.add(tileKey);
                });
            }

            if (renderedLands.length > 80) {
                renderedLands.slice(0, 20).forEach((land) => {
                    land.dispose();
                });

                renderedLands = renderedLands.slice(20);
            }
        });

        const camera = new Camera(this.scene, this.canvas, boat.position);

        // let currentRiverPointIndex = 0;
        let renderedTiles = new Set<string>();
        this.engine.runRenderLoop(() => {
            // if (currentRiverPointIndex >= renderRiverPath.length - 2) {
            //     this.scene.render();
            //     return;
            // }

            // if (boat.isOnTarget()) {
            //     const nextPoint = renderRiverPath[currentRiverPointIndex];
            //     if (nextPoint) {
            //         const { x, z } = nextPoint;
            //         boat.targetToPoint(x, z);
            //         currentRiverPointIndex++;
            //     }
            // }

            // boat.flowToTarget(renderRiverPath[currentRiverPointIndex]);
            // camera.setTarget(boat.position);

            // const nextPoints = [];

            // for (const point of renderRiverPath.slice(currentRiverPointIndex)) {
            //     if (
            //         point.x > boat.position.x &&
            //         point.x < boat.position.x + 150
            //     ) {
            //         nextPoints.push(point);
            //     }
            // }

            // for (const point of nextPoints) {
            //     const key = `${point.x}_${point.z}`;
            //     const tilesContainingPoint = riverToTiles.get(key);
            //     if (!tilesContainingPoint) {
            //         continue;
            //     }
            //     tilesContainingPoint.forEach((tile) => {
            //         const tileKey = `${tile.x}_${tile.z}`;
            //         if (renderedTiles.has(tileKey)) {
            //             // Tile already rendered
            //             return;
            //         }
            //         const riverPoints = tileToRiverPoints.get(tileKey);
            //         const { cz, cx } = tile;
            //         renderedLands.push(
            //             new Environment(
            //                 this.scene,
            //                 treeMesh,
            //                 houseMesh,
            //                 tileSize,
            //                 riverSurrounding,
            //                 riverPoints
            //             ).render(cx, cz)
            //         );
            //         renderedTiles.add(tileKey);
            //     });
            // }

            // if (renderedLands.length > 80) {
            //     renderedLands.slice(0, 20).forEach((land) => {
            //         land.dispose();
            //     });

            //     renderedLands = renderedLands.slice(20);
            // }

            this.scene.render();
        });
    }
}

new App().start();
