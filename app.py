from flask import Flask, render_template, request, jsonify
from openai import OpenAI  # Import the OpenAI client
import os
import ResourceFinder
import requests

app = Flask(__name__)

google_maps_api_key = os.getenv("GOOGLE_MAPS_API_KEY")
openai_api_key = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI client
client = OpenAI(api_key=openai_api_key)

# Mock database for resources
resources = [
    {
        "id": 1,
        "name": "Community Food Bank",
        "lat": 37.7749,
        "lng": -122.4194,
        "description": "Provides free meals and groceries to low-income families.",
    },
    {
        "id": 2,
        "name": "Homeless Shelter",
        "lat": 37.7849,
        "lng": -122.4294,
        "description": "Offers temporary housing and support services.",
    },
]

# Homepage
@app.route("/")
def home():
    return render_template("index.html", google_maps_api_key=google_maps_api_key)

# API to get resources
@app.route("/api/resources", methods=["GET"])
def get_resources():
    return jsonify(resources)

# API to summarize resource description using OpenAI
@app.route("/api/summarize", methods=["POST"])
def summarize():
    data = request.json
    description = data.get("description", "")

    # Use OpenAI to generate a summary
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": f"Summarize this resource description in one sentence: {description}"},
        ],
        max_tokens=50,
    )
    summary = response.choices[0].message.content.strip()
    return jsonify({"summary": summary})

# API to add a new resource (crowdsourcing)
@app.route("/api/add-resource", methods=["POST"])
def add_resource():
    data = request.json
    try:
        lat = float(data.get("lat"))  # Convert to float
        lng = float(data.get("lng"))  # Convert to float
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid latitude or longitude"}), 400

    new_resource = {
        "id": len(resources) + 1,
        "name": data.get("name"),
        "lat": lat,
        "lng": lng,
        "description": data.get("description"),
    }
    resources.append(new_resource)
    return jsonify({"message": "Resource added successfully!", "resource": new_resource})

# API to recommend similar places using OpenAI
@app.route("/api/recommend", methods=["POST"])
def recommend():
    data = request.json
    name = data.get("name")
    description = data.get("description")
    lat = data.get("lat")
    lng = data.get("lng")

    # Use OpenAI to generate recommendations
    prompt = f"Based on the place '{name}' located at '{description}', recommend multiple similar places nearby."
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=100,
    )
    recommendations = response.choices[0].message.content.strip().split("\n")

    return jsonify({"recommendations": recommendations})

# Get resources from Google Maps
@app.route("/api/resources-gmaps", methods=["GET"])
def get_resources_gmaps():
    zip_code = request.args.get("zip_code")

    if not zip_code:
        return jsonify({"error": "Zip code is required"}), 400

    resources = ResourceFinder.get_resources(zip_code)
    return jsonify(resources)

@app.route("/api/recommend-current-location", methods=["POST"])
def recommend_current_location():
    data = request.json
    lat = data.get("lat")
    lng = data.get("lng")

    # Use Google Places API to find the type of place the user is currently at
    place_type = "cafe"  # Example: Replace with logic to determine the place type

    # Use OpenAI to recommend places based on the place type
    prompt = f"Recommend 3 places to visit after being at a {place_type}."
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=100,
    )
    recommendations = response.choices[0].message.content.strip().split("\n")

    return jsonify({"recommendations": recommendations})

# Mock Uber API endpoint
@app.route("/api/call-uber", methods=["POST"])
def call_uber():
    data = request.json
    lat = data.get("lat")
    lng = data.get("lng")

    if not lat or not lng:
        return jsonify({"error": "Latitude and longitude are required"}), 400

    # Simulate a successful Uber request
    return jsonify({"message": "Uber is on the way!", "status": "success"})