import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import { Engine, Scene, Vector3, HemisphericLight } from "@babylonjs/core";
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

        new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);

        new Sky(
            this.scene,
            Math.floor(width) + 500,
            500,
            Math.floor(height) + 500
        ).atPosition(
            new Vector3(Math.floor(width) / 2, 0, -Math.floor(height) / 2)
        );
        new River(this.scene, renderRiverPath, 20);

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
        const treeMeshes = treeMeshesResult.meshes;
        const treeMesh = treeMeshes[0];
        treeMesh.setEnabled(false);
        const houseMeshes = houseMeshesResult.meshes;
        const houseMesh = houseMeshes[0];
        houseMesh.setEnabled(false);

        let renderedLands: Environment[] = [
            new Environment(
                this.scene,
                treeMesh,
                houseMesh,
                tileSize,
                riverSurrounding,
                renderRiverPath
            ).render(0, 0),
        ];

        const { x: startX, z: startZ } = renderRiverPath[0];

        const boat = new Boat(this.scene, 1, 4).atRiverPosition(startX, startZ);
        const camera = new Camera(this.scene, this.canvas, boat.position);

        let currentRiverPointIndex = 0;
        let renderedTiles = new Set<string>();
        this.engine.runRenderLoop(() => {
            if (currentRiverPointIndex >= renderRiverPath.length - 2) {
                this.scene.render();
                return;
            }

            if (boat.isOnTarget()) {
                const nextPoint = renderRiverPath[currentRiverPointIndex];
                if (nextPoint) {
                    const { x, z } = nextPoint;
                    boat.targetToPoint(x, z);
                    currentRiverPointIndex++;
                }
            }

            boat.flowToTarget(renderRiverPath[currentRiverPointIndex]);
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
                            riverPoints
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

            this.scene.render();
        });
    }
}

new App().start();
