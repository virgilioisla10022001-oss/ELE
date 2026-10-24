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
            const authSection = document.getElementById('authSection');
            const appSection = document.getElementById('appSection');
            if (authSection) authSection.classList.add('hidden');
            if (appSection) appSection.classList.remove('hidden');
            
            const welcomeUser = document.getElementById('welcomeUser');
            if (welcomeUser) {
                welcomeUser.textContent = `Welcome, ${user.fullname || user.email} (${(user.role || 'associate').toUpperCase()})`;
            }
        },
        () => {
            console.log("Walang naka-login (Logged out)");
            const authSection = document.getElementById('authSection');
            const appSection = document.getElementById('appSection');
            if (authSection) authSection.classList.remove('hidden');
            if (appSection) appSection.classList.add('hidden');
        }
    );

    // I-tapat sa aktwal na ID sa HTML: btnDoLogin, loginUser, loginPass
    const loginBtn = document.getElementById('btnDoLogin');

    if (loginBtn) {
        loginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const userInput = document.getElementById('loginUser')?.value.trim();
            const passwordInput = document.getElementById('loginPass')?.value.trim();

            if (!userInput || !passwordInput) {
                alert("Mangyaring ilagay ang username at password.");
                return;
            }

            console.log("Sinusubukang mag-login para sa:", userInput);
            
            // Note: Kung email ang nasa Firebase database, siguraduhing email ang inilalagay sa input, 
            // o kaya ay i-map ang username papuntang email kung iyon ang setup ninyo.
            const result = await handleLogin(userInput, passwordInput);
            
            if (result.success) {
                alert("Matagumpay na nakapag-login!");
            } else {
                alert("Nabigo ang pag-login: " + result.message);
            }
        });
    } else {
        console.error("Hindi mahanap ang Login button sa HTML.");
    }

});
