var mapTrackRef = new Firebase("https://map-track.firebaseio.com");
var username;
var userimage;

function login() {
    mapTrackRef.authWithOAuthRedirect("google", function (error, authData) {
        if (error) {
            console.log("Login Failed!", error);
        } else {
            console.log("Login Good!");
        }
    });
}

mapTrackRef.onAuth(authDataCallback);

function authDataCallback(authData) {
    if (authData) {
        username = authData.google.displayName;
        userimage = authData.google.profileImageURL;
        console.log(username);
        mapTrackRef.child("users").child(authData.uid).update({
            name: authData.google.displayName,
        });
        document.querySelector("#logout").style.display = "block";
        document.querySelector("#login").style.display = "none";
    } else {
        document.querySelector("#logout").style.display = "none";
        document.querySelector("#login").style.display = "block";
        console.log("User is logged out");
    }
}

if (username) {
    console.log("Yes!");
} else {
    console.log("no changing!");
}

function logout() {
    mapTrackRef.unauth();
}