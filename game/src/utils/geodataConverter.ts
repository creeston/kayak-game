export class GeodataConverter {
    getRiverGeodataFromGeojson(riverPath: any) {
        let path = [];
        riverPath.path.forEach((coordinate) => {
            path.push(this.convertCoordinates(coordinate[0], coordinate[1]));
        });

        return path;
    }

    convertCoordinates(lon, lat) {
        // Convert degrees to radians
        const lonRad = (lon * Math.PI) / 180;
        const latRad = (lat * Math.PI) / 180;

        // // Earth's radius in meters
        const radius = 6378137;

        // // Equirectangular projection
        const x = radius * lonRad;
        const z = radius * latRad;

        // y-coordinate (elevation) is set to 0 for simplicity
        const y = 0;

        return [x, y, z];
    }
}
