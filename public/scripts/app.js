(function () {
    "use strict";

    database.ref("location").on("value", function (snapshot) {
        myLatLng = snapshot.val();
        placeMarker();
    });

    function safelyParseJSON(json) {
        var parsed;
        try {
            parsed = JSON.parse(json)
        } catch (e) {
            console.error("No user present!")
        }
        return parsed
    }

    var myLatLng,
        map,
        user = safelyParseJSON(localStorage['map-track-oauth']);

    function updatePosition() {
        if (user.displayName === "Andrew Gremlich") {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(showPosition);
            } else {
                console.log("Geolocation is not supported by this browser.");
            }
        }
    }

    function showPosition(position) {
        myLatLng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        }

        database.ref('location').update(myLatLng);
    }

    function initialize() {
        var mapProp = {
            center: new google.maps.LatLng(43.815, -111.7858797),
            zoom: 15,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById("googleMap"), mapProp);
        placeMarker();
    }

    function placeMarker() {
        var marker = new google.maps.Marker({
            zoom: 15,
            position: myLatLng
        });

        var infowindow = new google.maps.InfoWindow({
            content: '<img width="75px" src=' + user.photoURL + '>' + '<h2>Find me!</h2>',
            size: new google.maps.Size(150, 50)
        });

        google.maps.event.addListener(marker, 'click', function () {
            infowindow.open(map, marker);
        });

        marker.setMap(null);
        marker.setMap(map);
    }

    function updater() {
        setInterval(updatePosition, 5000);
    }

    updater();
    initialize();

}());
