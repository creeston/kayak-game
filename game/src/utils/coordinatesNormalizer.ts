export class CoordinatesNormalizer {
    static calculateNormalizationParameters(coordinates: any[]) {
        let maxX = -Infinity;
        let maxZ = -Infinity;
        let minX = Infinity;
        let minZ = Infinity;

        coordinates.forEach((coord) => {
            const [x, y, z] = coord;
            maxX = Math.max(maxX, x);
            maxZ = Math.max(maxZ, z);
            minX = Math.min(minX, x);
            minZ = Math.min(minZ, z);
        });

        const riverCenterX = (maxX + minX) / 2;
        const riverCenterZ = (maxZ + minZ) / 2;

        const width = maxX - minX;
        const height = maxZ - minZ;

        return {
            riverCenterX,
            riverCenterZ,
            width,
            height,
            maxX,
            maxZ,
            minX,
            minZ,
        };
    }

    static normalizeCoordinates(
        coordinates: any[],
        minX: number,
        minZ: number,
        scale: number
    ) {
        return coordinates.map((coord) => {
            const [x, y, z] = coord;
            const normalizedX = (x - minX) / scale;
            const normalizedZ = (z - minZ) / scale;
            return [normalizedX, y, normalizedZ];
        });
    }

    static recalculateCoordinatesRelativeToOrigin(coordinates: any[], scale) {
        const [xOrigin, yOrigin, zOrigin] = coordinates[0];

        return coordinates.map((coord) => {
            const [x, y, z] = coord;
            return { x: (x - xOrigin) / scale, y: 0, z: (z - zOrigin) / scale };
        });
    }
}
