// Import ang mga authentication functions mula sa auth.js
import { 
    handleLogin, 
    handleRegister, 
    handleLogout, 
    listenToAuthChanges, 
    currentUserProfile 
} from './auth.js';

document.addEventListener('DOMContentLoaded', () => {

    // 1. Subaybayan kung naka-login o naka-logout ang user
    listenToAuthChanges(
        (user) => {
            console.log("Naka-login si:", user);
            // Dito mo ilalagay ang code para ipakita ang Dashboard o itago ang Login screen
            const loginSection = document.getElementById('loginSection');
            const dashboardSection = document.getElementById('dashboardSection');
            
            if (loginSection) loginSection.style.display = 'none';
            if (dashboardSection) dashboardSection.style.display = 'block';

            // Halimbawa: I-display ang pangalan ng user kung may element ka na ganito ang ID
            const welcomeUser = document.getElementById('welcomeUser');
            if (welcomeUser) {
                welcomeUser.textContent = `Welcome, ${user.fullname || user.email} (${user.role})`;
            }
        },
        () => {
            console.log("Walang naka-login (Logged out)");
            // Ipakita ang Login screen, itago ang Dashboard
            const loginSection = document.getElementById('loginSection');
            const dashboardSection = document.getElementById('dashboardSection');
            
            if (loginSection) loginSection.style.display = 'block';
            if (dashboardSection) dashboardSection.style.display = 'none';
        }
    );

    // 2. Login Button / Form Handler
    // Palitan ang 'loginBtn' o 'loginForm' ayon sa ID ng button o form mo sa index.html
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Kukunin ang input mula sa username/email field at password field
            const emailInput = document.getElementById('usernameInput').value.trim();
            const passwordInput = document.getElementById('passwordInput').value.trim();

            if (!emailInput || !passwordInput) {
                alert("Mangyaring punan ang lahat ng espasyo.");
                return;
            }

            const result = await handleLogin(emailInput, passwordInput);
            if (result.success) {
                alert("Matagumpay na nakapag-login!");
                window.location.reload();
            } else {
                alert("Nabigo ang pag-login: " + result.message);
            }
        });
    }

    // 3. Register Button / Form Handler (Para sa Create Account)
    const registerBtn = document.getElementById('registerBtn'); // O ang submit button ng register form mo
    if (registerBtn) {
        registerBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            // Kunin ang mga values mula sa registration form inputs mo
            const fullname = document.getElementById('regFullname')?.value || "User";
            const username = document.getElementById('regUsername')?.value || "user123";
            const email = document.getElementById('regEmail')?.value;
            const password = document.getElementById('regPassword')?.value;

            if (!email || !password) {
                alert("Ilagay ang email at password.");
                return;
            }

            const result = await handleRegister(fullname, username, email, password);
            if (result.success) {
                alert(result.message);
                window.location.reload();
            } else {
                alert("Nabigo ang pag-rehistro: " + result.message);
            }
        });
    }

    // 4. Logout Button Handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await handleLogout();
            alert("Nakapag-logout na.");
            window.location.reload();
        });
    }

});
