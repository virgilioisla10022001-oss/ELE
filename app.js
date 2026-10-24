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
            const loginSection = document.getElementById('loginSection');
            const dashboardSection = document.getElementById('dashboardSection');
            if (loginSection) loginSection.style.display = 'none';
            if (dashboardSection) dashboardSection.style.display = 'block';
        },
        () => {
            console.log("Walang naka-login (Logged out)");
            const loginSection = document.getElementById('loginSection');
            const dashboardSection = document.getElementById('dashboardSection');
            if (loginSection) loginSection.style.display = 'block';
            if (dashboardSection) dashboardSection.style.display = 'none';
        }
    );

    // Dynamic Login Handler (Kahit ano pang ID ng button o input mo)
    const loginBtn = document.querySelector('button[type="submit"]') || 
                     document.getElementById('loginBtn') || 
                     document.querySelector('.login-btn');

    if (loginBtn) {
        loginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Kunin ang value mula sa anumang email/username input
            const emailInput = document.getElementById('usernameInput')?.value || 
                               document.querySelector('input[type="email"]')?.value || 
                               document.querySelector('input').value;
                               
            const passwordInput = document.getElementById('passwordInput')?.value || 
                                  document.querySelector('input[type="password"]')?.value;

            if (!emailInput || !passwordInput) {
                alert("Mangyaring ilagay ang email at password.");
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
