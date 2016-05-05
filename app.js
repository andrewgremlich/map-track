var mapTrackRef = new Firebase("https://map-track.firebaseio.com");
var myLatLng;
var map;

mapTrackRef.child("location").on("value", function (snapshot) {
    myLatLng = snapshot.val().location;
    placeMarker();
});

console.log(myLatLng);

function updater() {
    setInterval(updatePosition, 20);
}

function updatePosition() {
    if (username === "Andrew Gremlich") {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition);
        } else {
            console.log("Geolocation is not supported by this browser.");
        }
    }
}

updater();

function showPosition(position) {
    myLatLng = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    }

    mapTrackRef.update({
        location: myLatLng,
    })
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
        content: '<img width="75px" src='+userimage+'>' + '<h2>Find me!</h2>',
        size: new google.maps.Size(150, 50)
    });

    google.maps.event.addListener(marker, 'click', function () {
        infowindow.open(map, marker);
    });
    
    marker.setMap(null);
    marker.setMap(map);
}

window.onload = function () {
    initialize();
};