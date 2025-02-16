let map;
let markers = [];

// Initialize Google Map
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 37.7749, lng: -122.4194 },
        zoom: 12,
    });

    // Fetch resources from backend
    fetch("/api/resources")
        .then((response) => response.json())
        .then((data) => {
            data.forEach((resource) => {
                const marker = new google.maps.Marker({
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
            });
        });
}

// Function to fetch locations from Flask backend
async function fetchLocations(zipCode) {
    const response = await fetch(`/api/resources-gmaps?zip_code=${zipCode}`);
    const data = await response.json();

    const icons = {
        "Food Banks": {
            url: "/static/images/food-bank.png",
            scaledSize: new google.maps.Size(32, 32),
        },
        "Water Fountains": {
            url: "/static/images/water-bottle.png",
            scaledSize: new google.maps.Size(32, 32),
        },
        "Parks": {
            url: "/static/images/tree-silhouette.png",
            scaledSize: new google.maps.Size(32, 32),
        },
    };
    
    // Plot markers on the map
    data.forEach(place => {
        const marker = new google.maps.Marker({
            position: { lat: place.latitude, lng: place.longitude },
            map: map,
            title: place.name,
            icon: icons[place.query]
        });
        const infoWindow = new google.maps.InfoWindow({
            content: `<div><strong>${place.name}</strong><br>${place.address}</div>`
        });

        marker.addListener("click", () => {
            infoWindow.open(map, marker);
        });

        markers.push(marker);
    });


    // Center map on first location
    if (data.length > 0) {
        map.setCenter({ lat: data[0].latitude, lng: data[0].longitude });
    }
}


// Handle form submission
document.getElementById("zip_code").addEventListener("change", function() {
    const zipCode = this.value;
    fetchLocations(zipCode);
});


// Add a new resource
document.getElementById("resource-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const description = document.getElementById("description").value;

    // Get user's current location (mock for now)
    const lat = 37.7749;
    const lng = -122.4194;

    fetch("/api/add-resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, lat, lng }),
    })
        .then((response) => response.json())
        .then((data) => {
            alert("Resource added successfully!");
            window.location.reload();
        });
});