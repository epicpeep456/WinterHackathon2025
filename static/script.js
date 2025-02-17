let map;
let markers = [];
let selectedLocation = null;
let selectedPlace = null;

// Initialize Google Map
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 37.7749, lng: -122.4194 },
        zoom: 12,
    });

    // Add a click event listener to the map
    map.addListener("click", (event) => {
        // Clear previous selected location marker
        if (selectedLocation) {
            selectedLocation.setMap(null);
        }

        // Get the clicked coordinates
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        // Validate coordinates
        if (isNaN(lat) || isNaN(lng)) {
            alert("Invalid location selected. Please try again.");
            return;
        }

        // Add a marker for the selected location
        selectedLocation = new google.maps.Marker({
            position: { lat, lng },
            map: map,
            title: "Selected Location",
        });

        // Update the hidden form fields with the selected coordinates
        document.getElementById("lat").value = lat;
        document.getElementById("lng").value = lng;

        // Fetch place details at the selected location
        fetchPlaceDetails(lat, lng);
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

// Fetch place details at the selected location
function fetchPlaceDetails(lat, lng) {
    const service = new google.maps.places.PlacesService(map);
    service.nearbySearch(
        {
            location: { lat, lng },
            radius: 500, // 500 meters
            type: "point_of_interest", // You can change this to a specific type (e.g., "restaurant")
        },
        (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
                selectedPlace = results[0]; // Store the first result as the selected place
                document.getElementById("resource-name").textContent = selectedPlace.name;
                document.getElementById("resource-description").textContent = selectedPlace.vicinity;
            } else {
                alert("No places found at the selected location.");
            }
        }
    );
}

// Handle recommendation button click
document.getElementById("recommend-button").addEventListener("click", () => {
    if (!selectedPlace) {
        alert("Please select a location on the map first.");
        return;
    }

    // Get recommendations using OpenAI
    fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: selectedPlace.name,
            description: selectedPlace.vicinity,
            lat: selectedPlace.geometry.location.lat(),
            lng: selectedPlace.geometry.location.lng(),
        }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then((data) => {
            const recommendationsList = document.getElementById("recommendations-list");
            recommendationsList.innerHTML = ""; // Clear previous recommendations

            data.recommendations.forEach((recommendation) => {
                const li = document.createElement("li");

                // Add an icon or emoji to make it visually appealing
                const icon = document.createElement("span");
                icon.textContent = "📍"; // You can use an emoji or an icon from a library like FontAwesome
                icon.style.marginRight = "10px";

                const text = document.createElement("span");
                text.textContent = recommendation;

                li.appendChild(icon);
                li.appendChild(text);
                recommendationsList.appendChild(li);
            });
        })
        .catch((error) => {
            console.error("Error fetching recommendations:", error);
            alert("Failed to fetch recommendations. Please try again.");
        });
});

// Handle current location button click
document.getElementById("current-location-button").addEventListener("click", () => {
    if (navigator.geolocation) {
        // Get the user's current location
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Fetch place details at the current location
                fetchPlaceDetails(lat, lng);

                // Get recommendations based on the current location
                fetch("/api/recommend-current-location", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ lat, lng }),
                })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error("Network response was not ok");
                        }
                        return response.json();
                    })
                    .then((data) => {
                        const recommendationsList = document.getElementById("recommendations-list");
                        recommendationsList.innerHTML = ""; // Clear previous recommendations

                        data.recommendations.forEach((recommendation) => {
                            const li = document.createElement("li");

                            // Add an icon or emoji to make it visually appealing
                            const icon = document.createElement("span");
                            icon.textContent = "📍"; // You can use an emoji or an icon from a library like FontAwesome
                            icon.style.marginRight = "10px";

                            const text = document.createElement("span");
                            text.textContent = recommendation;

                            li.appendChild(icon);
                            li.appendChild(text);
                            recommendationsList.appendChild(li);
                        });
                    })
                    .catch((error) => {
                        console.error("Error fetching recommendations:", error);
                        alert("Failed to fetch recommendations. Please try again.");
                    });
            },
            (error) => {
                console.error("Error getting current location:", error);
                alert("Failed to get your current location. Please enable location access.");
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
    }
});

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
    const lat = parseFloat(document.getElementById("lat").value); // Convert to float
    const lng = parseFloat(document.getElementById("lng").value); // Convert to float

    if (isNaN(lat) || isNaN(lng)) {
        alert("Please select a valid location on the map.");
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
            window.location.reload();
        });
});

// Handle "Find Nearby Utilities" button click
document.getElementById("find-utilities-button").addEventListener("click", () => {
    if (navigator.geolocation) {
        // Get the user's current location
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Fetch nearby utilities and public resources
                fetchNearbyUtilities(lat, lng);
            },
            (error) => {
                console.error("Error getting current location:", error);
                alert("Failed to get your current location. Please enable location access.");
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
    }
});

// Fetch nearby utilities and public resources
function fetchNearbyUtilities(lat, lng) {
    const service = new google.maps.places.PlacesService(map);

    // Define the types of places to search for
    const placeTypes = [
        "library",
        "park",
        "restroom",
        "water_fountain",
        "post_office",
        "pharmacy",
        "hospital",
    ];

    const utilitiesList = document.getElementById("utilities-list");
    utilitiesList.innerHTML = ""; // Clear previous results

    placeTypes.forEach((type) => {
        service.nearbySearch(
            {
                location: { lat, lng },
                radius: 1000, // 1 km radius
                type: type,
            },
            (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
                    results.slice(0, 3).forEach((place) => {
                        const li = document.createElement("li");

                        // Add an icon or emoji to make it visually appealing
                        const icon = document.createElement("span");
                        icon.textContent = "📍"; // You can use an emoji or an icon from a library like FontAwesome
                        icon.style.marginRight = "10px";

                        const text = document.createElement("span");
                        text.textContent = `${place.name} (${place.vicinity})`;

                        li.appendChild(icon);
                        li.appendChild(text);
                        utilitiesList.appendChild(li);
                    });
                }
            }
        );
    });
}

// Text-to-Speech Functionality
document.getElementById("text-to-speech-button").addEventListener("click", () => {
    const content = document.body.innerText; // Get all text content on the page
    speak(content);
});

function speak(text) {
    if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1; // Speed of speech
        utterance.pitch = 1; // Pitch of speech
        window.speechSynthesis.speak(utterance);
    } else {
        alert("Text-to-speech is not supported in your browser.");
    }
}

// Speech-to-Text Functionality
document.getElementById("speech-to-text-button").addEventListener("click", () => {
    startVoiceCommand();
});

function startVoiceCommand() {
    if ("webkitSpeechRecognition" in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false; // Stop after one command
        recognition.interimResults = false; // Only final results
        recognition.lang = "en-US"; // Language

        recognition.start();

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            handleVoiceCommand(transcript);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            alert("Error occurred during speech recognition. Please try again.");
        };
    } else {
        alert("Speech-to-text is not supported in your browser.");
    }
}

function handleVoiceCommand(command) {
    if (command.includes("recommendations")) {
        document.getElementById("recommend-button").click();
    } else if (command.includes("utilities")) {
        document.getElementById("find-utilities-button").click();
    } else if (command.includes("location")) {
        document.getElementById("current-location-button").click();
    } else if (command.includes("read")) {
        document.getElementById("text-to-speech-button").click();
    } else {
        alert("Command not recognized. Please try again.");
    }
}

let currentSpeech = null; // Track the current speech synthesis

// Text-to-Speech Functionality
document.getElementById("text-to-speech-button").addEventListener("click", () => {
    const content = document.body.innerText; // Get all text content on the page
    speak(content);
});

// Read Voice Command Instructions
document.getElementById("read-instructions-button").addEventListener("click", () => {
    const instructions = document.getElementById("voice-command-help").innerText;
    speak(instructions);
});

function speak(text) {
    if ("speechSynthesis" in window) {
        if (currentSpeech) {
            window.speechSynthesis.cancel(); // Stop any ongoing speech
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1; // Speed of speech
        utterance.pitch = 1; // Pitch of speech

        utterance.onstart = () => {
            document.getElementById("cancel-tts-button").style.display = "inline-block";
        };

        utterance.onend = () => {
            document.getElementById("cancel-tts-button").style.display = "none";
            currentSpeech = null;
        };

        window.speechSynthesis.speak(utterance);
        currentSpeech = utterance;
    } else {
        alert("Text-to-speech is not supported in your browser.");
    }
}

// Cancel Text-to-Speech
document.getElementById("cancel-tts-button").addEventListener("click", () => {
    if ("speechSynthesis" in window && currentSpeech) {
        window.speechSynthesis.cancel();
        document.getElementById("cancel-tts-button").style.display = "none";
        currentSpeech = null;
    }
});

// Speech-to-Text Functionality
document.getElementById("speech-to-text-button").addEventListener("click", () => {
    startVoiceCommand();
});

function startVoiceCommand() {
    if ("webkitSpeechRecognition" in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false; // Stop after one command
        recognition.interimResults = false; // Only final results
        recognition.lang = "en-US"; // Language

        recognition.start();

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            handleVoiceCommand(transcript);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            alert("Error occurred during speech recognition. Please try again.");
        };
    } else {
        alert("Speech-to-text is not supported in your browser.");
    }
}

function handleVoiceCommand(command) {
    if (command.includes("recommendations")) {
        document.getElementById("recommend-button").click();
    } else if (command.includes("utilities")) {
        document.getElementById("find-utilities-button").click();
    } else if (command.includes("location")) {
        document.getElementById("current-location-button").click();
    } else if (command.includes("read")) {
        document.getElementById("text-to-speech-button").click();
    } else if (command.includes("stop reading")) {
        document.getElementById("cancel-tts-button").click();
    } else {
        alert("Command not recognized. Please try again.");
    }
}



document.getElementById("call-uber-button").addEventListener("click", () => {
    const lat = document.getElementById("lat").value;
    const lng = document.getElementById("lng").value;

    if (!lat || !lng) {
        alert("Please select a location on the map first.");
        return;
    }

    const uberStatus = document.getElementById("uber-status");
    if (!uberStatus) {
        console.error("Uber status element not found!");
        return;
    }

    // Mock Uber API call (replace with actual Uber API integration)
    callUber(lat, lng);
});

// Mock function to call Uber
function callUber(lat, lng) {
    const uberStatus = document.getElementById("uber-status");

    // Simulate an API request
    uberStatus.textContent = "Requesting Uber...";
    setTimeout(() => {
        uberStatus.textContent = "Uber is on the way! 🚗";
    }, 2000); // Simulate a 2-second delay
}

document.getElementById("bus-routes-button").addEventListener("click", () => {
    if (!selectedLocation) {
        alert("Please select a destination on the map first.");
        return;
    }

    if (navigator.geolocation) {
        // Get the user's current location
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const currentLat = position.coords.latitude;
                const currentLng = position.coords.longitude;

                const destinationLat = selectedLocation.getPosition().lat();
                const destinationLng = selectedLocation.getPosition().lng();

                // Fetch bus routes using Google Maps Directions API
                fetchBusRoutes(currentLat, currentLng, destinationLat, destinationLng);
            },
            (error) => {
                console.error("Error getting current location:", error);
                alert("Failed to get your current location. Please enable location access.");
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
    }
});

function fetchBusRoutes(startLat, startLng, endLat, endLng) {
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map); // Render the directions on the map

    const request = {
        origin: { lat: startLat, lng: startLng },
        destination: { lat: endLat, lng: endLng },
        travelMode: google.maps.TravelMode.TRANSIT, // Use public transit
        transitOptions: {
            modes: [google.maps.TransitMode.BUS], // Specify bus only
        },
    };

    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result); // Display the route on the map

            // Display step-by-step instructions
            const steps = result.routes[0].legs[0].steps;
            const instructionsList = document.getElementById("instructions-list");
            instructionsList.innerHTML = ""; // Clear previous instructions

            steps.forEach((step, index) => {
                const li = document.createElement("li");
                li.innerHTML = `<strong>Step ${index + 1}:</strong> ${step.instructions}`;
                instructionsList.appendChild(li);
            });
        } else {
            alert("Failed to fetch bus routes. Please try again.");
        }
    });
}