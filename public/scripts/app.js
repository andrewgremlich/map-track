(function () {
    "use strict";

    /*********************
     * APP GLOBAL VARS
     *********************/

    var myLatLng,
        map,
        selectors = {
            "main": document.querySelector("main"),
            "aside": document.querySelector("aside"),
            "instructions": document.querySelector("#instructions"),
            "sessionID": document.querySelector("#sessionID"),
            "waitScreen": document.querySelector("#waitScreen"),
            "firstPage": document.querySelector("#first-page"),
            "game": document.querySelector("#game"),
            "stop": document.querySelector("#stop")
        },
        refreshIntervalId,
        sessionToken = (Math.random() * 100000).toFixed(),
        refr = `session/${selectors.sessionID.innerText}`;


    /***********************
     * MAP SECTION
     ***********************/

    function placeMarker() {
        let marker = new google.maps.Marker({
            zoom: 15,
            position: myLatLng
        });

        let infowindow = new google.maps.InfoWindow({
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
        let mapProp = {
            center: new google.maps.LatLng(myLatLng.lat, myLatLng.lng),
            zoom: 15,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById("googleMap"), mapProp);
        placeMarker();
    }

    function showPosition(position) {
        myLatLng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        }

        database.ref(`${refr}/location`).set(myLatLng);

        database.ref(`${refr}/location`).on("value", function (snap) {
            myLatLng = snap.val();

            console.log("refreshing marker");

            placeMarker();
        });
    }

    function updatePosition() {

        try {

            let username = localStorage["mapTrackUserName"];

            database.ref(`${refr}/runner`).once("value", snap => {
                var runner = snap.val();

                if (username === runner) {
                    if (navigator.geolocation) {
                        console.log("Is runner");
                        navigator.geolocation.getCurrentPosition(showPosition);
                    } else {
                        console.log("Geolocation is not supported by this browser.");
                    }
                } else {
                    console.log("Is tracker");
                }
            })

        } catch (e) {
            console.log(e);
        }
    }

    function updater() {
        refreshIntervalId = setInterval(updatePosition, 5000);
    }


    /************************************************
     * Utility functions for page transitions
     ************************************************/

    function transitionToWait(userList, sessionToken) {
        selectors.firstPage.style.display = "none";
        selectors.waitScreen.style.display = "block";

        for (let i = 0; i < userList.length; i++) {
            let userText = document.createTextNode(userList[i]),
                userPara = document.createElement("p");

            userPara.appendChild(userText);

            document.querySelector("#runners").appendChild(userPara);
        }

        selectors.sessionID.innerText = sessionToken;
    }

    function randomPick(userArray) {

        let random = Math.random(),
            amountUser = userArray.length,
            pick = userArray[Math.floor(random * amountUser)];

        return pick;
    }

    function closeSession() {
        localStorage.removeItem('mapTrackUserName');
        clearInterval(refreshIntervalId);
        database.ref(refr).remove();
    }


    /***************
     * EVENTS
     ***************/

    document.querySelector("#pickRunner").onclick = e => {

        let runner;

        refr = `session/${selectors.sessionID.innerText}`;

        database.ref(`${refr}/participants`).on("value", snap => {
            var userArray = snap.val();

            if (userArray) {
                runner = randomPick(userArray);

                database.ref(refr + '/runner').set(runner)
            }
        });
    }

    document.querySelector("#start").onclick = e => {

        selectors.waitScreen.style.display = "none";
        selectors.game.style.display = "block";
        selectors.stop.style.display = "block";

        updater();
    }

    document.querySelector("#startSession").onclick = e => {

        let username = document.querySelector("#name").value,
            sessionToken = document.querySelector("#joinSession").value,
            refString = `session/${sessionToken}/participants`,
            uploaderArray = [];

        localStorage["mapTrackUserName"] = username;

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

    selectors.stop.onclick = e => {
        selectors.game.style.display = "none";
        selectors.main.style.display = "block";
        closeSession();
    };

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

    /************************************************
     * START APPLICATION
     ************************************************/

    function defaultStart(position) {
        myLatLng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        }
        initialize();
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(defaultStart);
    } else {
        console.log("Geolocation is not supported by this browser.");
    }

    document.querySelector("#sessionToken").innerHTML = sessionToken;

}());
