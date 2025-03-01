river_data = 'data/river.json'

import json
import folium

with open(river_data, encoding="utf-8") as f:
    river_data = json.load(f)

river_path = river_data['path']

# Create a map centered around the first point of the river path
map_center = [river_path[0][1], river_path[0][0]]
m = folium.Map(location=map_center, zoom_start=12)

# Add the river path to the map
folium.PolyLine(
    locations=[[coord[1], coord[0]] for coord in river_path],
    color='blue',
    weight=2.5,
    opacity=1
).add_to(m)


from simplification.cutil import simplify_coords

# Simplify river path to reduce overlap in queries
simplified_path = simplify_coords(river_path, 0.001)  # 0.01 degree tolerance (~1km precision)

# Display simplified path
folium.PolyLine(
    locations=[[coord[1], coord[0]] for coord in simplified_path],
    color='red',
    weight=2.5,
    opacity=1
).add_to(m)


# Save the map to an HTML file
m.save('river_path_map.html')


