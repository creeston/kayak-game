import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import { Engine, Scene, Vector3, HemisphericLight } from "@babylonjs/core";
import { RiverGeodataParser } from "./utils/riverGeodataParser";
import riverData from "./river.json";
import { CoordinatesNormalizer } from "./utils/coordinatesNormalizer";
import { River } from "./objects/river";
import { Land } from "./objects/land";
import { Boat } from "./objects/boat";
import { Sky } from "./objects/sky";
import { Camera } from "./objects/camera";
import { RiverTiling } from "./utils/riverTiling";

class App {
    constructor() {
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        const dataParser = new RiverGeodataParser();
        let path = dataParser.getRiverGeodataFromGeojson(riverData);

        let { width, height } =
            CoordinatesNormalizer.calculateNormalizationParameters(path);

        let riverPath =
            CoordinatesNormalizer.recalculateCoordinatesRelativeToOrigin(
                path,
                10
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

        var engine = new Engine(canvas, true);
        var scene = new Scene(engine);

        var light: HemisphericLight = new HemisphericLight(
            "light1",
            new Vector3(0, 1, 0),
            scene
        );

        light.intensity = 0.7;

        const sky = new Sky(
            scene,
            Math.floor(width) + 500,
            500,
            Math.floor(height) + 500
        ).atPosition(
            new Vector3(Math.floor(width) / 2, 0, -Math.floor(height) / 2)
        );
        new River(scene, renderRiverPath, 20);

        let renderedLands: Land[] = [
            new Land(scene, tileSize, tileSize)
                .withGrassMaterial()
                .applyHeightMap(renderRiverPath, 10, 2),
        ];

        const { x: startX, z: startZ } = renderRiverPath[0];

        const boat = new Boat(scene, 2, 4).atRiverPosition(startX, startZ);
        const camera = new Camera(scene, canvas, boat.position);

        // on key up increase boat speed
        window.addEventListener("keyup", (event) => {
            if (event.key === "ArrowUp") {
                boat.accelerate();
            }
        });

        let currentRiverPointIndex = 0;
        let renderedTiles = new Set<string>();
        engine.runRenderLoop(() => {
            if (currentRiverPointIndex >= renderRiverPath.length - 2) {
                scene.render();
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
                if (tilesContainingPoint) {
                    tilesContainingPoint.forEach((tile) => {
                        const tileKey = `${tile.x}_${tile.z}`;
                        if (!renderedTiles.has(tileKey)) {
                            const riverPoints = tileToRiverPoints.get(tileKey);
                            const { x, z, cz, cx } = tile;
                            renderedLands.push(
                                new Land(scene, tileSize, tileSize)
                                    .withGrassMaterial()
                                    .atPosition(cx, cz)
                                    .applyHeightMap(riverPoints, 10, 2)
                            );
                            renderedTiles.add(tileKey);
                        }
                    });
                }
            }

            if (renderedLands.length > 80) {
                renderedLands.slice(0, 20).forEach((land) => {
                    land.dispose();
                });

                renderedLands = renderedLands.slice(20);
            }

            scene.render();
        });
    }
}
new App();
