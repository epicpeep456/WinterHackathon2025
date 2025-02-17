from flask import Flask, render_template, request, jsonify
import openai
import os
import requests
import ResourceFinder
import json

app = Flask(__name__)

google_maps_api_key = os.getenv("GOOGLE_MAPS_API_KEY")
openai.api_key = os.getenv("OPENAI_API_KEY")

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
    response = openai.Completion.create(
        engine="text-davinci-003",
        prompt=f"Summarize this resource description in one sentence: {description}",
        max_tokens=50,
    )
    summary = response.choices[0].text.strip()
    return jsonify({"summary": summary})

# API to add a new resource (crowdsourcing)
@app.route("/api/add-resource", methods=["POST"])
def add_resource():
    data = request.json
    new_resource = {
        "id": len(resources) + 1,
        "name": data.get("name"),
        "lat": data.get("lat"),
        "lng": data.get("lng"),
        "description": data.get("description"),
    }
    resources.append(new_resource)
    return jsonify({"message": "Resource added successfully!", "resource": new_resource})

# Get resources from Google Maps
@app.route("/api/resources-gmaps", methods=["GET"])
def get_resources_gmaps():
    zip_code = request.args.get("zip_code")

    if not zip_code:
        return jsonify({"error": "Zip code is required"}), 400

    resources = ResourceFinder.get_resources(zip_code)
    return jsonify(resources)

@app.route("/predictions", methods=["POST"])
def get_predictions():
    return render_template("Predictions.html")

if __name__ == "__main__":
    app.run(debug=True)