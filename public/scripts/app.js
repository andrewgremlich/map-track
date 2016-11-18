(function () {
    "use strict";
    var myLatLng,
        map,
        selectors = {
            "main": document.querySelector("main"),
            "aside": document.querySelector("aside"),
            "instructions": document.querySelector("#instructions"),
            "sessionID": document.querySelector("#sessionID"),
            "waitScreen": document.querySelector("#waitScreen"),
            "firstPage": document.querySelector("#first-page")
        };

    function showPosition(position) {
        myLatLng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        }

        database.ref('location').update(myLatLng);
    }

    function placeMarker() {
        var marker = new google.maps.Marker({
            zoom: 15,
            position: myLatLng
        });

        var infowindow = new google.maps.InfoWindow({
            content: '<h2>Find me before I move!  I am hiding at this spot.</h2>',
            size: new google.maps.Size(150, 50)
        });

        google.maps.event.addListener(marker, 'click', function () {
            infowindow.open(map, marker);
        });

        marker.setMap(null);
        marker.setMap(map);
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

    initialize();

    function updater() {
        setInterval(updatePosition, 5000);
    }

    function transitionToWait(userList, sessionToken) {
        selectors.firstPage.style.display = "none";
        selectors.waitScreen.style.display = "block";

        for (var i = 0; i < userList.length; i++) {
            var userText = document.createTextNode(userList[i]),
                userPara = document.createElement("p");

            userPara.appendChild(userText);

            document.querySelector("#runners").appendChild(userPara);
        }

        selectors.sessionID.innerText = sessionToken;
    }

    function randomPick(userArray) {

        var random = Math.random(),
            amountUser = userArray.length,
            pick = userArray[Math.floor(random * amountUser)];

        return pick;
    }

    document.querySelector("#pickRunner").onclick = e => {

        var runner,
            refr = `session/${selectors.sessionID.innerText}`;

        database.ref(refr + '/participants').once("value", snap => {
            var userArray = snap.val();
            if (userArray) {
                runner = randomPick(userArray);
                database.ref(refr + '/runner').set(runner)
            }
        })
    }

    document.querySelector("#start").onclick = e => {

        selectors.waitScreen.style.display = "none";
        document.querySelector("#game").style.display = "block";

        //        updater();
    }

    document.querySelector("#startSession").onclick = e => {

        let username = document.querySelector("#name").value,
            sessionToken = document.querySelector("#joinSession").value,
            refString = `session/${sessionToken}/participants`,
            uploaderArray = [];

        uploaderArray.push(username);

        if (sessionToken) {

            database.ref(refString).once("value", snap => {
                var partArray = snap.val();
                if (partArray) {
                    for (var i = 0; i < partArray.length; i++) {
                        uploaderArray.push(partArray[i]);
                    }
                }
                database.ref(refString).set(uploaderArray);
                transitionToWait(uploaderArray, sessionToken);
            })

        } else {
            document.querySelector("#error").innerText = "You must fill the inputs";
        }
    }

    selectors.instructions.onclick = e => {
        e.target.style.display = "none";
        selectors.main.style.display = "none";
        selectors.aside.style.display = "block";
    }

    document.querySelector("#close").onclick = e => {
        selectors.aside.style.display = "none";
        selectors.main.style.display = "block";
        selectors.instructions.style.display = "block";
    }

    var sessionToken = (Math.random() * 100000).toFixed();
    document.querySelector("#sessionToken").innerHTML = sessionToken;

}());
