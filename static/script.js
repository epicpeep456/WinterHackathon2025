let map;
let markers = [];
let selectedLocation = null;

// Function to add a marker to the map
function addMarker(resource) {
    const { AdvancedMarkerElement } = google.maps.marker;

    const marker = new AdvancedMarkerElement({
        position: { lat: resource.lat, lng: resource.lng },
        map: map,
        title: resource.name,
    });

    // Add click event to show details
    marker.addListener("click", () => {
        document.getElementById("resource-name").textContent = resource.name;
        document.getElementById("resource-description").textContent = resource.description;

        // Get AI summary
        fetch("/api/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: resource.description }),
        })
            .then((response) => response.json())
            .then((data) => {
                document.getElementById("resource-summary").textContent = data.summary;
            });
    });

    markers.push(marker);
}

// Initialize Google Map
async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    map = new Map(document.getElementById("map"), {
        center: { lat: 37.7749, lng: -122.4194 },
        zoom: 12,
        mapId: "1f413cc5c4b114c", // Add your Map ID here
    });

    // Add a click event listener to the map
    map.addListener("click", (event) => {
        // Clear previous selected location marker
        if (selectedLocation) {
            selectedLocation.map = null;
        }

        // Add a marker for the selected location
        selectedLocation = new AdvancedMarkerElement({
            position: event.latLng,
            map: map,
            title: "Selected Location",
        });

        // Update the hidden form fields with the selected coordinates
        document.getElementById("lat").value = event.latLng.lat();
        document.getElementById("lng").value = event.latLng.lng();
    });

    // Fetch resources from backend
    fetch("/api/resources")
        .then((response) => response.json())
        .then((data) => {
            data.forEach((resource) => {
                addMarker(resource);
            });
        });
}

// Add a new resource
document.getElementById("resource-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const description = document.getElementById("description").value;
    const lat = document.getElementById("lat").value;
    const lng = document.getElementById("lng").value;

    if (!lat || !lng) {
        alert("Please select a location on the map.");
        return;
    }

    fetch("/api/add-resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, lat, lng }),
    })
        .then((response) => response.json())
        .then((data) => {
            alert("Resource added successfully!");

            // Add the new resource to the map
            addMarker(data.resource);

            // Clear the form
            document.getElementById("resource-form").reset();
            document.getElementById("lat").value = "";
            document.getElementById("lng").value = "";

            // Clear the selected location marker
            if (selectedLocation) {
                selectedLocation.map = null;
                selectedLocation = null;
            }
        });
});