import { 
    handleLogin, 
    handleRegister, 
    handleLogout, 
    listenToAuthChanges, 
    currentUserProfile 
} from './auth.js';

document.addEventListener('DOMContentLoaded', () => {

    listenToAuthChanges(
        (user) => {
            console.log("Naka-login si:", user);
            const loginSection = document.getElementById('loginSection') || document.getElementById('authSection');
            const dashboardSection = document.getElementById('dashboardSection') || document.getElementById('appSection');
            if (loginSection) loginSection.classList.add('hidden');
            if (dashboardSection) dashboardSection.classList.remove('hidden');
            
            const welcomeUser = document.getElementById('welcomeUser');
            if (welcomeUser) {
                welcomeUser.textContent = `Welcome, ${user.fullname || user.email} (${(user.role || 'associate').toUpperCase()})`;
            }
        },
        () => {
            console.log("Walang naka-login (Logged out)");
            const loginSection = document.getElementById('loginSection') || document.getElementById('authSection');
            const dashboardSection = document.getElementById('dashboardSection') || document.getElementById('appSection');
            if (loginSection) loginSection.classList.remove('hidden');
            if (dashboardSection) dashboardSection.classList.add('hidden');
        }
    );

    // Dynamic Login Handler - Idinagdag ang 'btnDoLogin' para mahanap agad ang button sa HTML mo
    const loginBtn = document.getElementById('btnDoLogin') || 
                     document.querySelector('button[type="submit"]') || 
                     document.getElementById('loginBtn') || 
                     document.querySelector('.login-btn');

    if (loginBtn) {
        loginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Kunin ang value mula sa tamang HTML input IDs (loginUser / loginPass)
            const emailInput = document.getElementById('loginUser')?.value || 
                               document.getElementById('usernameInput')?.value || 
                               document.querySelector('input[type="email"]')?.value || 
                               document.querySelector('input').value;
                               
            const passwordInput = document.getElementById('loginPass')?.value || 
                                  document.getElementById('passwordInput')?.value || 
                                  document.querySelector('input[type="password"]')?.value;

            if (!emailInput || !passwordInput) {
                alert("Mangyaring ilagay ang username/email at password.");
                return;
            }

            console.log("Sinusubukang mag-login para sa:", emailInput);
            const result = await handleLogin(emailInput, passwordInput);
            
            if (result.success) {
                alert("Matagumpay na nakapag-login!");
                window.location.reload();
            } else {
                alert("Nabigo ang pag-login: " + result.message);
            }
        });
    } else {
        console.error("Hindi mahanap ang Login button sa HTML.");
    }

});
```[cite: 5, 6, 7]

---

### 2. `auth.js` (Firebase Authentication & Handler)
*Sinigurado nating malinis ang pag-import at pag-export ng mga function tulad ng `handleLogin` at `listenToAuthChanges`[cite: 6].*

```javascript
// auth.js - Handles Login, Registration, and User Management (EXPORT)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA6AxuCzAs1TePvX43-cBBfe_H6_35d53A",
  authDomain: "delacruztore.firebaseapp.com",
  databaseURL: "https://delacruztore-default-rtdb.firebaseio.com",
  projectId: "delacruztore",
  storageBucket: "delacruztore.firebasestorage.app",
  messagingSenderId: "105395830230",
  appId: "1:105395830230:web:ad0f5e4be903676c91f877",
  measurementId: "G-LCGJ04G9L1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export let currentUserProfile = null;

export function listenToAuthChanges(onUserLoggedIn, onUserLoggedOut) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
                currentUserProfile = { uid: user.uid, ...userDocSnap.data() };
                onUserLoggedIn(currentUserProfile);
            } else {
                currentUserProfile = {
                    uid: user.uid,
                    email: user.email,
                    role: 'associate',
                    status: 'pending'
                };
                onUserLoggedIn(currentUserProfile);
            }
        } else {
            currentUserProfile = null;
            onUserLoggedOut();
        }
    });
}

export async function handleLogin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) {
            throw new Error("User record not found in database.");
        }
        
        const userData = userDocSnap.data();
        if (userData.status !== 'approved') {
            await signOut(auth);
            throw new Error("Your account is pending admin approval.");
        }
        
        return { success: true, user: userData };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

export async function handleRegister(fullname, username, email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const userData = {
            fullname: fullname,
            username: username,
            email: email,
            role: 'associate',
            status: 'pending',
            adminPasscode: '123456789',
            createdAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, "users", user.uid), userData);
        return { success: true, message: "Registration successful! Waiting for approval." };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

export async function handleLogout() {
    await signOut(auth);
}
```[cite: 6]

---

### 3. Tiyakin ang HTML Script Tag Link
Siguraduhin na ang huling linya ng iyong HTML file ay nakaturo sa `app.js` (o kung `apps.js` ang filename mo sa GitHub, i-match ito roon):

```html
<!-- ES MODULE ENTRY POINT -->
<script type="module" src="app.js"></script>
```[cite: 7]

**Tandaan:** Pagkatapos i-update at i-push sa GitHub ang mga files na ito, i-hard refresh ang iyong browser gamit ang `Ctrl + F5` upang matiyak na hindi lumang bersyon ang nakatabi sa cache.
