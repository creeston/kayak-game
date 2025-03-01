river_geojson_file = 'overpass/river.geojson'
output_file = 'data/river.json'

import json

with open(river_geojson_file, encoding="utf-8") as f:
    river_geojson = json.load(f)

river_path = []

for feature in river_geojson['features']:
    if feature['geometry']['type'] == 'LineString':
        river_path.append(feature['geometry']['coordinates'])
    elif feature['geometry']['type'] == 'MultiLineString':
        for line in feature['geometry']['coordinates']:
            river_path.append(line)


longest_line = max(river_path, key=lambda x: len(x))
river_path = longest_line

with open(output_file, 'w', encoding="utf-8") as f:
    json.dump({"path": river_path}, f, ensure_ascii=False, indent=4)