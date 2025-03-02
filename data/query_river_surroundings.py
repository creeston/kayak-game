river_json_file = 'data/river.json'

import json

with open(river_json_file, encoding="utf-8") as f:
    river_data = json.load(f)

river_path = river_data['path']


import requests
import json
import geopandas as gpd
from shapely.geometry import LineString
from simplification.cutil import simplify_coords


radius = 1500

degree_tolerance = 0.01
simplified_path = simplify_coords(river_path, degree_tolerance) 


def build_query(lat, lon, radius=1000):
    return f"""
    [out:json][timeout:60];
    node({lon}, {lat}, {lon}, {lat})->.center;
    (
      way(around.center:{radius})["landuse"~"forest"];
      node(around.center:{radius})["place"~"town|village|hamlet|allotments"];
    );
    out geom;
    """

def query_overpass(query):
    url = "http://overpass-api.de/api/interpreter"
    response = requests.post(url, data=query)
    response.raise_for_status()
    return response.json()

all_results = []
added_elements = set()
for lat, lon in simplified_path[:100]:
    query = build_query(lat, lon)
    result = query_overpass(query)
    elements = result['elements']
    for element in elements:
        element_id = element['id']
        if element_id not in added_elements:
            added_elements.add(element['id'])
            all_results.append(element)


surrounding = []

for element in all_results:
    if element['type'] == 'node':
        # For places
        surrounding.append({
            "type": element["tags"]["place"],
            "location": [element['lon'], element['lat']],
            "tags": element['tags']
        })
    elif element['type'] == 'way':
        # For forests and fields
        if 'geometry' in element:
            coordinates = [[pt['lon'], pt['lat']] for pt in element['geometry']]
            landuse = element['tags']['landuse']
            surrounding.append({
                "type": landuse,
                "shape": coordinates,
                "tags": element['tags']
            })

with open("river_path_surroundings.json", "w", encoding="utf-8") as f:
    json.dump(surrounding, f, indent=4, ensure_ascii=False)
