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
		"stop": document.querySelector("#stop"),
		"runner": document.querySelector("#runners"),
		"tracker": document.querySelector("#trackers")
	},
	refreshIntervalId,
	sessionToken = (Math.random() * 100000).toFixed(),
	refr = `session/${selectors.sessionID.innerText}`;


/***********************
 * MAP SECTION
 ***********************/

/*Place the marker on the map*/
function placeMarker() {
	var marker = new google.maps.Marker({
		map: map,
		position: myLatLng
	});
}

/*Make the map*/
function initialize() {
	let mapProp = {
		center: myLatLng,
		zoom: 14
	};
	map = new google.maps.Map(document.getElementById("googleMap"), mapProp);
}

/*Update the runner's position in Firebase*/
function showPosition(position) {
	myLatLng = {
		lat: position.coords.latitude,
		lng: position.coords.longitude
	}

	database.ref(`${refr}/location`).set(myLatLng);
}

/*Logs the runner's position.  This essentially handles if
  the current user is the runner, and uses the showPosition
  function above.*/
function logRunner(runner, username, sp) {
	return function () {

		if (username === runner) {
			if (navigator.geolocation) {
				console.log("Is runner");
				navigator.geolocation.watchPosition(sp);
			} else {
				console.log("Geolocation is not supported by this browser.");
			}
		} else {
			console.log("Is tracker");
		}
	}
}


/*This function should handle all the updating*/
function updater() {

	database.ref(`${refr}/runner`).once("value", snap => {
		let runner = snap.val(),
			username = localStorage["mapTrackUserName"],
			runnerUpdater = logRunner(runner, username, showPosition);

		refreshIntervalId = setInterval(runnerUpdater, 5000);

		/*Here should have another marker appear for the users that are not the runner.*/

		database.ref(`${refr}/location`).on("value", snap => {
			myLatLng = snap.val();

			console.log(myLatLng);

			console.log("refreshing marker");

			placeMarker();
		});
	})

}


/************************************************
 * Utility functions for page transitions
 ************************************************/

/*Displays the wait screen for everyone to join the session*/
function transitionToWait(sessionToken, appUpdater) {
	selectors.firstPage.style.display = "none";
	selectors.waitScreen.style.display = "block";

	appUpdater(selectors.tracker);

	selectors.sessionID.innerText = sessionToken;
}

/*Late-comers that join the session will be shown through
  this function*/
function lateUpdater(refString) {

	return function (partDiv) {

		database.ref(refString).on("value", snap => {
			var partArray = snap.val();

			partDiv.innerHTML = "";

			for (var i = 0; i < partArray.length; i++) {
				var text = document.createTextNode(partArray[i]),
					para = document.createElement("p");

				para.appendChild(text);

				partDiv.appendChild(para);
			}
		})
	}

}

/*Randomly pick the runner for the game application*/
function randomPick(userArray) {

	let random = Math.random(),
		amountUser = userArray.length,
		pick = userArray[Math.floor(random * amountUser)];

	return pick;
}

/*Delete the instance in Firebase and the localStorage data*/
function closeSession() {
	console.log("deleting data")
	localStorage.removeItem('mapTrackUserName');
	clearInterval(refreshIntervalId);
	database.ref(refr).remove();
}

function showError(a, b) {
	let paraText = document.createTextNode(b);

	a.appendChild(paraText);

	selectors.runner.innerHTML = "";
	selectors.runner.appendChild(a);
}


/***************
 * EVENTS
 ***************/

/*If session not closed by user then delete the user from session*/
window.onbeforeunload = e => {
	var username = localStorage['mapTrackUserName'];

	database.ref(`${refr}/participants/`).once('value', e => {
		var users = e.val();
		for (var i = 0; i < users.length; i++) {
			var user = users[i]
			if (user === username) {
				users.splice(i, 1)
				database.ref(`${refr}/participants`).set(users)
			}
		}
	})

	localStorage.removeItem('mapTrackUserName');
};

document.querySelector("#pickRunner").onclick = e => {

	let runner;

	refr = `session/${selectors.sessionID.innerText}`;

	database.ref(`${refr}/participants`).once("value", snap => {
		var userArray = snap.val();

		if (userArray) {
			runner = randomPick(userArray);

			let text = document.createTextNode("Runner is " + runner),
				para = document.createElement("p");

			para.appendChild(text);

			selectors.runner.innerHTML = "";
			selectors.runner.appendChild(para);

			database.ref(refr + '/runner').set(runner)
		}
	});
}

document.querySelector("#start").onclick = e => {

	let target = e.target || e.srcElement,
		parent = target.parentElement,
		gchildren = parent.children[2].children,
		errorPara = document.createElement("p"),
		trackers = parent.children[1].children[0];


	if (gchildren.length > 1) {
		if (trackers && trackers.innerText.includes("Runner is")) {
			console.log("There is a runner")
			selectors.waitScreen.style.display = "none";
			selectors.game.style.display = "block";
			selectors.stop.style.display = "block";

			updater();
		} else {
			showError(errorPara, "Runner must be selected.");
		}
	} else {
		showError(errorPara, "Must have more than one player.");
	}
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

			var appUpdater = lateUpdater(refString);

			transitionToWait(sessionToken, appUpdater);
		})

	} else {
		document.querySelector("#inputerror").innerText = "You must fill the inputs";
	}
}

selectors.stop.onclick = e => {
	selectors.stop.style.display = "none";
	selectors.firstPage.style.display = "block";
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
	placeMarker();
}

function initMap() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(defaultStart);
	} else {
		console.log("Geolocation is not supported by this browser.");
	}
}

document.querySelector("#sessionToken").innerHTML = sessionToken;

if ('serviceWorker' in navigator) {
	navigator.serviceWorker
		.register('./service-worker.js')
		.then(function () {
			console.log('Service Worker Registered');
		});
}

window.addEventListener('online', function (e) {
	console.log("You are online");
}, false);

window.addEventListener('offline', function (e) {
	console.log("You are offline");
}, false);

// Check if the user is connected.
if (navigator.onLine) {
	console.log("You are online");
}
