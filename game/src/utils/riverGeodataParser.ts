export class RiverGeodataParser {
    getRiverGeodataFromGeojson(geojson: any) {
        let paths = [];
        geojson.features.forEach((feature) => {
            let properties = feature.properties;

            // only consider the river with id 7814035
            if (properties["@id"] != "relation/7814035") {
                return;
            }

            if (feature.geometry.type === "LineString") {
                const coordinates = feature.geometry.coordinates;
                const path = coordinates.map((coord) =>
                    this.convertCoordinates(coord[0], coord[1])
                );
                paths.push(path);
            } else if (feature.geometry.type === "MultiLineString") {
                const coordinates = feature.geometry.coordinates;
                coordinates.forEach((coords) => {
                    const path = coords.map((coord) =>
                        this.convertCoordinates(coord[0], coord[1])
                    );
                    paths.push(path);
                });
            }
        });

        const path = paths.reduce((acc, path) => acc.concat(path), []);
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
