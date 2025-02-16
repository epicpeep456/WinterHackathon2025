from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import openai
import os

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Set OpenAI API key
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

# Homepage route
@app.route("/")
def home():
    # Pass the Google Maps API key to the frontend
    google_maps_api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    return render_template("index.html", google_maps_api_key=google_maps_api_key)

# API to get all resources
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

@app.route("/api/add-resource", methods=["POST"])
def add_resource():
    data = request.json
    new_resource = {
        "id": len(resources) + 1,
        "name": data.get("name"),
        "lat": float(data.get("lat")),  # Ensure lat and lng are floats
        "lng": float(data.get("lng")),
        "description": data.get("description"),
    }
    resources.append(new_resource)
    return jsonify({"message": "Resource added successfully!", "resource": new_resource})

# Run the Flask app
if __name__ == "__main__":
    app.run(debug=True)