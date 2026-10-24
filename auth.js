// auth.js - Handles Login, Registration, and User Management (EXPORT)

export function initDefaultData() {
    if (!localStorage.getItem('users')) {
        const defaultAccounts = [
            { fullname: "Nomer Bueno", username: "Engr.NBueno", password: "ownerpassword", adminPasscode: "0987654321", email: "EngineernBueno@gmail.com", status: "approved", role: "owner" },
            { fullname: "virgilio isla", username: "ilyong123", password: "adminpassword", adminPasscode: "123456789", email: "ilyong.isla.7@gmail.com", status: "approved", role: "admin" },
            { fullname: "John Mico Inocencio", username: "JMInocencio", password: "associatepassword", adminPasscode: "123456789", email: "johnmico@gmail.com", status: "approved", role: "associate" }
        ];
        localStorage.setItem('users', JSON.stringify(defaultAccounts));
    }

    if (!localStorage.getItem('products')) {
        const defaultProducts = [
            { id: 101, name: "Bear Brand Powdered Milk 33g", brand: "Nestlé", qty: 15, maxQty: 100, cat: "Beverages & Dairy", price: 18.00, expiry: "2027-05-10", dateAdded: "2026-10-20" },
            { id: 102, name: "San Mig Super Coffee 3in1", brand: "San Miguel", qty: 4, maxQty: 50, cat: "Coffee", price: 8.50, expiry: "2026-10-26", dateAdded: "2026-10-21" },
            { id: 103, name: "Century Tuna Flakes in Oil 180g", brand: "Century Pacific", qty: 0, maxQty: 40, cat: "Canned & Processed Goods", price: 42.00, expiry: "2027-08-30", dateAdded: "2026-10-18" }
        ];
        localStorage.setItem('products', JSON.stringify(defaultProducts));
    }

    if (!localStorage.getItem('restockRequests')) localStorage.setItem('restockRequests', JSON.stringify([]));
    if (!localStorage.getItem('retailRequests')) localStorage.setItem('retailRequests', JSON.stringify([]));
    if (!localStorage.getItem('approvedRestockHistory')) localStorage.setItem('approvedRestockHistory', JSON.stringify([]));
    if (!localStorage.getItem('rejectedRestockHistory')) localStorage.setItem('rejectedRestockHistory', JSON.stringify([]));
    if (!localStorage.getItem('approvedLogs')) localStorage.setItem('approvedLogs', JSON.stringify([]));
    if (!localStorage.getItem('logs')) localStorage.setItem('logs', JSON.stringify([]));
    if (!localStorage.getItem('reportsHistory')) localStorage.setItem('reportsHistory', JSON.stringify([]));
    if (!localStorage.getItem('inventoryLossHistory')) localStorage.setItem('inventoryLossHistory', JSON.stringify([]));
}

export function showAlert(elementId, msg, isSuccess) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.className = `alert-msg ${isSuccess ? 'success' : 'error'}`;
    el.textContent = msg;
    setTimeout(() => el.textContent = '', 4000);
}

export function switchAuthView(viewId) {
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('registerView').classList.add('hidden');
    document.getElementById('forgotView').classList.add('hidden');
    document.getElementById(viewId).classList.remove('hidden');
}

export function handleLogin() {
    const username = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPass').value;
    let users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        showAlert('loginAlert', 'Invalid username or password!', false);
        return null;
    }
    if (user.status === 'pending') {
        showAlert('loginAlert', 'Account awaiting approval.', false);
        return null;
    }
    if (user.status === 'rejected') {
        showAlert('loginAlert', 'Account application rejected.', false);
        return null;
    }
    return user;
}

export function handleRegister() {
    const fullname = document.getElementById('regFullname').value;
    const username = document.getElementById('regUser').value;
    const password = document.getElementById('regPass').value;
    const email = document.getElementById('regEmail').value;
    if (!fullname || !username || !password || !email) {
        showAlert('regAlert', 'Please fill in all required fields.', false);
        return;
    }
    let users = JSON.parse(localStorage.getItem('users'));
    if (users.some(u => u.username === username)) {
        showAlert('regAlert', 'Username already taken.', false);
        return;
    }
    users.push({ fullname, username, password, adminPasscode: '123456789', email, status: 'pending', role: 'associate' });
    localStorage.setItem('users', JSON.stringify(users));
    showAlert('regAlert', 'Account registered! Submitted for approval.', true);
    setTimeout(() => switchAuthView('loginView'), 2000);
}

export function handleResetPassword() {
    const username = document.getElementById('forgotUser').value;
    const email = document.getElementById('forgotEmail').value;
    const newPass = document.getElementById('forgotNewPass').value;
    let users = JSON.parse(localStorage.getItem('users'));
    let user = users.find(u => u.username === username && u.email === email);
    if (user) {
        user.password = newPass;
        localStorage.setItem('users', JSON.stringify(users));
        showAlert('forgotAlert', 'Password reset successfully!', true);
        setTimeout(() => switchAuthView('loginView'), 1500);
    } else {
        showAlert('forgotAlert', 'Username and Email do not match.', false);
    }
}
