// Import the Firebase SDK modules
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

// Firebase Configuration from your console
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Keep track of active user profile
export let currentUserProfile = null;

// Listen to Auth State
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

// Login Function
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

// Register Function
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

// Logout Function
export async function handleLogout() {
    await signOut(auth);
}
