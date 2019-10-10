var coord_opt = "US"; // "US", "JP", "world"

let US_coord = [40, -100];
let US_zoom = 3;

let JP_coord = [36, 138];
let JP_zoom = 4;

let world_coord = [0, 0];
let world_zoom = 2;

switch (coord_opt) {
    case "world":
        coord = world_coord;
        zoom = world_zoom;
        break;

    case "US":
        coord = US_coord;
        zoom = US_zoom;
        break;

    case "JP":
        coord = JP_coord;
        zoom = JP_zoom;
        break;

    default:
        coord = world_coord;
        zoom = world_zoom;
        break;
};


let map = L.map("map", {
    center: coord,
    zoom: zoom
});

// If data.beta.nyc is down comment out this link
let link = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
let plateLink = "GeoJSON/PB2002_boundaries.json";

// Create the tile layer that will be the background of our map
// Adding tile layer
let satelliteMap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.satellite",
    accessToken: API_KEY
});

let Outdoor = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.outdoors",
    accessToken: API_KEY
});

let light = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.light",
    accessToken: API_KEY
});

// Only one base layer can be shown at a time
let baseMaps = {
    Satellite: satelliteMap,
    Outdoor: Outdoor,
    Grayscale: light
};

// Create an overlayMaps object to hold the bikeStations layer


// Grabbing our GeoJSON data..
d3.json(link, function (data) {
    // Creating a GeoJSON layer with the retrieved data
    // L.geoJson(data).addTo(map);

    // This function returns the style data for each of the earthquakes we plot on
    // the map. We pass the magnitude of the earthquake into two separate functions
    // to calculate the color and radius.

    // Grab plate data
    let plateBoundary = new L.LayerGroup();

    d3.json(plateLink, function (plateData) {
        //L.geoJson(plateData).addTo(map);

        function styleInfoPlate(feature) {
            return {
                opacity: 1,
                fillOpacity: 1,
                fillColor: 'grey',
                color: "grey",
                weight: 2.5
            };
        }

        L.geoJson(plateData, {
            style: styleInfoPlate
        }).addTo(plateBoundary);
    });

    let earthquake = new L.LayerGroup();



    let overlayMaps = {
        "Plate boundary": plateBoundary,
        "Earthquake": earthquake
    };

    // Create a layer control, pass in the baseMaps and overlayMaps. Add the layer control to the map
    L.control.layers(baseMaps, overlayMaps, {
        collapsed: false
    }).addTo(map);

    function styleInfo(feature) {
        return {
            opacity: 1,
            fillOpacity: 1,
            fillColor: getColor(feature.properties.mag),
            color: "#000000",
            radius: getRadius(feature.properties.mag),
            stroke: true,
            weight: 0.5
        };
    }

    // This function determines the color of the marker based on the magnitude of the earthquake.
    function getColor(magnitude) {
        switch (true) {
            case magnitude > 5:
                return "#ea2c2c";
            case magnitude > 4:
                return "#ea822c";
            case magnitude > 3:
                return "#ee9c00";
            case magnitude > 2:
                return "#eecc00";
            case magnitude > 1:
                return "#d4ee00";
            default:
                return "#98ee00";
        }
    }

    // This function determines the radius of the earthquake marker based on its magnitude.
    // Earthquakes with a magnitude of 0 were being plotted with the wrong radius.
    function getRadius(magnitude) {
        if (magnitude === 0) {
            return 1;
        }

        return magnitude * 4;
    }


    L.geoJson(data, {

        // We turn each feature into a circleMarker on the map.
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng);
        },
        // We set the style for each circleMarker using our styleInfo function.
        style: styleInfo,
        // We create a popup for each marker to display the magnitude and location of the earthquake after the marker has been created and styled
        onEachFeature: function (feature, layer) {
            layer.bindPopup("Magnitude: " + feature.properties.mag + "<br>Location: " + feature.properties.place);
        }

    }).addTo(earthquake);

    // Here we create a legend control object.
    var legend = L.control({
        position: "bottomright"
    });
    // Then add all the details for the legend
    legend.onAdd = function () {
        var div = L.DomUtil.create("div", "info legend");

        var grades = [0, 1, 2, 3, 4, 5];
        var colors = [
            "#98ee00",
            "#d4ee00",
            "#eecc00",
            "#ee9c00",
            "#ea822c",
            "#ea2c2c"
        ];

        // Looping through our intervals to generate a label with a colored square for each interval.
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                "<i style='background: " + colors[i] + "'></i> " +
                grades[i] + (grades[i + 1] ? "&ndash;" + grades[i + 1] + "<br>" : "+");
        }
        return div;
    };
    // Add legend to the map.
    legend.addTo(map);
});
