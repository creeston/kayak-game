export type Tile = { x: number; z: number; cx: number; cz: number };
type RiverPointToTiles = Map<string, Tile[]>;

export class RiverTiling {
    riverWidth = 10;
    valleyWidth = 150;

    generateTiles(
        tileSize: number,
        riverPath: { x: number; z: number }[]
    ): {
        tiles: Set<string>;
        tileCenters: Tile[];
        riverToTiles: RiverPointToTiles;
        tileToRiverPoints: Map<string, { x: number; z: number }[]>;
    } {
        const tiles = new Set<string>();
        const tileCenters: Tile[] = [];
        const riverToTiles: RiverPointToTiles = new Map();
        const tileToRiverPoints: Map<string, { x: number; z: number }[]> =
            new Map();

        for (const point of riverPath) {
            // Calculate affected area (river + valley)
            const minX = point.x - this.valleyWidth;
            const maxX = point.x + this.valleyWidth;
            const minZ = point.z - this.valleyWidth;
            const maxZ = point.z + this.valleyWidth;

            const affectedTiles: Tile[] = [];

            // Find all tiles within the bounding box
            for (
                let tx = Math.floor(minX / tileSize) * tileSize;
                tx <= maxX;
                tx += tileSize
            ) {
                for (
                    let tz = Math.floor(minZ / tileSize) * tileSize;
                    tz <= maxZ;
                    tz += tileSize
                ) {
                    const tileKey = `${tx}_${tz}`;
                    if (!tiles.has(tileKey)) {
                        tiles.add(tileKey);
                        tileCenters.push({
                            x: tx,
                            z: tz,
                            cx: tx + tileSize / 2,
                            cz: tz + tileSize / 2,
                        });
                    }
                    affectedTiles.push({
                        x: tx,
                        z: tz,
                        cx: tx + tileSize / 2,
                        cz: tz + tileSize / 2,
                    });

                    if (!tileToRiverPoints.has(tileKey)) {
                        tileToRiverPoints.set(tileKey, []);
                    }
                    tileToRiverPoints.get(tileKey)?.push(point);
                }
            }

            // Store affected tiles for this river point
            riverToTiles.set(`${point.x}_${point.z}`, affectedTiles);
        }

        return { tiles, tileCenters, riverToTiles, tileToRiverPoints };
    }
}
