(function () {

    function toggleSignIn() {
        if (!firebase.auth().currentUser) {
            var provider = new firebase.auth.GoogleAuthProvider();

            provider.addScope('https://www.googleapis.com/auth/plus.login');
            provider.addScope('profile');
            provider.addScope('email');
            firebase.auth().signInWithRedirect(provider);

        } else {
            localStorage.removeItem('map-track-oauth');
            firebase.auth().signOut();
        }
        document.getElementById('quickstart-sign-in').disabled = true;
    }

    function setRole(uid, func) {
        database.ref("users").once("value", function (snap) {
            snap.forEach(function (csnap) {
                if (csnap.key === uid) {
                    if (!csnap.val().role) {
                        func();
                    } else {
                        return;
                    }
                } else {
                    return;
                }
            })
        })
    }

    function initApp() {
        firebase.auth().getRedirectResult().then(function (result) {
            if (result.credential) {
                // This gives you a Google Access Token. You can use it to access the Google API.
                var token = result.credential.accessToken;
                location.reload();
                console.log(token);
            } else {
                //                console.log('token null');
            }
            var user = result.user;
        }).catch(function (error) {
            var errorCode = error.code,
                errorMessage = error.message,
                email = error.email,
                credential = error.credential;

            if (errorCode === 'auth/account-exists-with-different-credential') {
                alert('You have already signed up with a different auth provider for that email.');
            } else {
                console.error(error);
            }
        });
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {

                var authO = {
                    displayName: user.displayName,
                    email: user.email,
                    emailVerified: user.emailVerified,
                    photoURL: user.photoURL,
                    uid: user.uid
                }

                document.getElementById('quickstart-sign-in').textContent = 'Sign out';

                database.ref(`users/${authO.uid}`).update({
                    displayName: authO.displayName,
                    email: authO.email,
                    emailVerified: authO.emailVerified,
                    photoURL: authO.photoURL,
                    uid: authO.uid,
                });

                setRole(authO.uid, function () {
                    database.ref(`users/${authO.uid}`).update({
                        role: 0,
                    });
                });

                localStorage["map-track-oauth"] = JSON.stringify(authO);

            } else {
                document.getElementById('quickstart-sign-in').textContent = 'Sign in with Google';

                document.querySelector("#errorLogin").style.display = "block";
            }
            document.getElementById('quickstart-sign-in').disabled = false;
        });
        document.getElementById('quickstart-sign-in').addEventListener('click', toggleSignIn, false);
    }
    initApp();

}())
