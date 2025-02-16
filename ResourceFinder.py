import requests
import os
import system_vars

google_maps_api_key = system_vars.google_maps_api_key

def get_resources(zip_code):
    queries = ["Food Banks", "Water Fountains", "Parks"]
    ENDPOINT = f"https://places.googleapis.com/v1/places:searchText"

    # Define search location (latitude, longitude) & radius in meters
    latitude, longitude = get_lat_long(zip_code)
    radius = 5000  # 5000 meters (5km)

    places = []
    for query in queries:
        params = {
            "textQuery": query,
            "languageCode": "en",
            "locationBias": {
                "circle": {
                    "center": {"latitude": latitude, "longitude": longitude},
                    "radius": radius
                }
            }
        }
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": google_maps_api_key,
            "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location"
        }
        response = requests.post(ENDPOINT, json=params, headers=headers)
        data = response.json()

        if "places" in data:
            for place in data["places"]:
                places.append({
                    "name": place["displayName"]["text"],
                    "latitude": place["location"]["latitude"],
                    "longitude": place["location"]["longitude"],
                    "address": place.get("formattedAddress", "No Address"),
                    "query": query
                })

    return places
    
def get_lat_long(zip_code):
    geocode_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={zip_code}&key={google_maps_api_key}"
    
    response = requests.get(geocode_url)
    data = response.json()

    if data["status"] == "OK":
        location = data["results"][0]["geometry"]["location"]
        return location["lat"], location["lng"]
    else:
        print("Error:", data["status"])
        return None, None
    