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