// app.js - Main Application Controller (IMPORT)

import { 
    initDefaultData, 
    switchAuthView, 
    handleLogin, 
    handleRegister, 
    handleResetPassword 
} from './auth.js';

let currentUser = null;
let isAdminUnlocked = false;

// DOM Ready Event Listener
document.addEventListener('DOMContentLoaded', () => {
    initDefaultData();
    setupEventListeners();

    setInterval(() => {
        const now = new Date();
        const timeStr = now.toISOString().slice(0, 19).replace('T', ' ');
        const dtEl = document.getElementById('dateTime');
        if (dtEl) dtEl.textContent = timeStr;
    }, 1000);
});

function setupEventListeners() {
    // Auth Buttons
    document.getElementById('btnDoLogin').addEventListener('click', () => {
        const user = handleLogin();
        if (user) {
            currentUser = user;
            isAdminUnlocked = false;
            document.getElementById('authSection').classList.add('hidden');
            document.getElementById('appSection').classList.remove('hidden');
            document.getElementById('welcomeUser').textContent = `Welcome, ${user.fullname} (${user.role.toUpperCase()})`;
            applyRolePermissions();
            refreshAppData();
        }
    });

    document.getElementById('btnShowRegister').addEventListener('click', () => switchAuthView('registerView'));
    document.getElementById('btnShowForgot').addEventListener('click', () => switchAuthView('forgotView'));
    document.getElementById('btnBackToLogin1').addEventListener('click', () => switchAuthView('loginView'));
    document.getElementById('btnBackToLogin2').addEventListener('click', () => switchAuthView('loginView'));
    document.getElementById('btnDoRegister').addEventListener('click', handleRegister);
    document.getElementById('btnDoResetPass').addEventListener('click', handleResetPassword);
    document.getElementById('btnLogout').addEventListener('click', doLogout);

    // Navigation Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = e.target.getAttribute('data-tab');
            switchTab(targetTab, e.target);
        });
    });

    // Form Controls
    document.getElementById('actionTypeSelect').addEventListener('change', toggleActionTypeForm);
    document.getElementById('existingProductSelect').addEventListener('change', populateExistingProduct);
    document.getElementById('submitProductBtn').addEventListener('click', addProduct);
    document.getElementById('searchItem').addEventListener('keyup', filterProducts);
    document.getElementById('filterCategorySelect').addEventListener('change', filterProducts);
    document.getElementById('saveRetailLogBtn').addEventListener('click', recordSaleOrLoss);
    document.getElementById('btnGenerateReport').addEventListener('click', generateReport);
    document.getElementById('btnExportPDF').addEventListener('click', exportReportToPDF);
    document.getElementById('btnPrintReport').addEventListener('click', printReportDocument);
    
    // Admin Controls
    document.getElementById('btnUnlockAdmin').addEventListener('click', unlockAdminAccess);
    document.getElementById('btnLockAdmin').addEventListener('click', lockAdminAccess);
    document.getElementById('btnChangeAdminPass').addEventListener('click', changeAdminPassword);
    document.getElementById('btnSaveEditedUser').addEventListener('click', saveEditedUser);
    document.getElementById('btnCloseEditModal').addEventListener('click', () => document.getElementById('editUserModal').classList.add('hidden'));
}

function applyRolePermissions() {
    const adminTabBtn = document.getElementById('adminTabBtn');
    const adminMainHeader = document.getElementById('adminTabMainHeader');
    const saveRetailLogBtn = document.getElementById('saveRetailLogBtn');

    if (currentUser && currentUser.role === 'associate') {
        document.getElementById('formTitle').textContent = 'Request Item Restock / Add';
        document.getElementById('submitProductBtn').textContent = 'Submit Request to Admin';
        if (saveRetailLogBtn) saveRetailLogBtn.textContent = 'Submit Retail / Loss Log Request to Admin';
        if (adminTabBtn) adminTabBtn.textContent = 'Request';
        if (adminMainHeader) adminMainHeader.textContent = 'Request';
    } else {
        document.getElementById('formTitle').textContent = 'Add New Product / Restock';
        document.getElementById('submitProductBtn').textContent = 'Submit Product Directly';
        if (saveRetailLogBtn) saveRetailLogBtn.textContent = 'Save Retail / Loss Log';
        if (adminTabBtn) adminTabBtn.textContent = 'Admin';
        if (adminMainHeader) adminMainHeader.textContent = 'Admin Panel';
    }
    toggleActionTypeForm();
}

function doLogout() {
    currentUser = null;
    isAdminUnlocked = false;
    document.getElementById('appSection').classList.add('hidden');
    document.getElementById('authSection').classList.remove('hidden');
    switchAuthView('loginView');
}

function switchTab(tabName, clickedBtn) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    if (clickedBtn) clickedBtn.classList.add('active');
    if (tabName === 'admin') checkAdminViewStatus();
}

function isItemExpired(expiryDate) {
    if (!expiryDate) return false;
    const today = new Date().toISOString().slice(0, 10);
    return expiryDate < today;
}

function isItemNearlyExpired(expiryDate) {
    if (!expiryDate) return false;
    const today = new Date();
    const exp = new Date(expiryDate);
    const diffTime = exp - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 10;
}

function getStockBadgeHTML(p) {
    if (isItemExpired(p.expiry)) {
        return `<span class="badge-expired">Expired</span>`;
    }
    if (p.qty === 0) {
        return `<span class="badge-out">Out of Stock</span>`;
    }
    let max = p.maxQty ? p.maxQty : 20;
    let percentage = (p.qty / max) * 100;
    if (percentage <= 15 || p.qty <= 5) {
        return `<span class="badge-low">Low Stock (${p.qty})</span>`;
    } else {
        return `<span class="badge-instock">In Stock</span>`;
    }
}

function toggleActionTypeForm() {
    const type = document.getElementById('actionTypeSelect').value;
    const selectGroup = document.getElementById('selectExistingGroup');
    const nameInput = document.getElementById('pName');
    const brandInput = document.getElementById('pBrand');
    const catSelect = document.getElementById('pCat');

    if (type === 'new') {
        selectGroup.classList.add('hidden');
        nameInput.value = '';
        brandInput.value = '';
        nameInput.disabled = false;
        brandInput.disabled = false;
        catSelect.disabled = false;
    } else {
        selectGroup.classList.remove('hidden');
        nameInput.disabled = true;
        brandInput.disabled = true;
        catSelect.disabled = true;
        loadExistingProductsDropdown();
    }
}

function loadExistingProductsDropdown() {
    let products = JSON.parse(localStorage.getItem('products')) || [];
    let select = document.getElementById('existingProductSelect');
    select.innerHTML = '';
    products.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${p.name} (${p.brand}) - Qty: ${p.qty}</option>`;
    });
    if (products.length > 0) populateExistingProduct();
}

function populateExistingProduct() {
    const id = document.getElementById('existingProductSelect').value;
    let products = JSON.parse(localStorage.getItem('products')) || [];
    let p = products.find(prod => prod.id == id);
    if (p) {
        document.getElementById('pName').value = p.name;
        document.getElementById('pBrand').value = p.brand;
        document.getElementById('pCat').value = p.cat;
        document.getElementById('pPrice').value = p.price;
    }
}

function addProduct() {
    const actionType = document.getElementById('actionTypeSelect').value;
    const name = document.getElementById('pName').value;
    const brand = document.getElementById('pBrand').value;
    const qty = parseInt(document.getElementById('pQty').value) || 0;
    const cat = document.getElementById('pCat').value;
    const price = parseFloat(document.getElementById('pPrice').value) || 0;
    const expiry = document.getElementById('pExpiry').value;
    const dateAdded = new Date().toISOString().slice(0, 10);

    if (!name) { alert('Enter product name.'); return; }

    if (currentUser && currentUser.role === 'associate') {
        let requests = JSON.parse(localStorage.getItem('restockRequests')) || [];
        requests.push({ associateName: currentUser.fullname, name, brand, qty, cat, price, expiry, dateAdded });
        localStorage.setItem('restockRequests', JSON.stringify(requests));
        alert('Restock request submitted to Admin.');
    } else {
        let products = JSON.parse(localStorage.getItem('products'));
        if (actionType === 'new') {
            products.push({ id: Date.now(), name, brand, qty, maxQty: qty * 2, cat, price, expiry, dateAdded });
        } else {
            let existingId = document.getElementById('existingProductSelect').value;
            let found = products.find(p => p.id == existingId);
            if (found) {
                if (actionType === 'add') found.qty += qty;
                else if (actionType === 'restock') found.qty = qty;
                if (expiry) found.expiry = expiry;
            }
        }
        localStorage.setItem('products', JSON.stringify(products));
        alert('Product inventory updated successfully!');
    }
    refreshAppData();
}

function filterProducts() {
    const query = document.getElementById('searchItem').value.toLowerCase();
    const catFilter = document.getElementById('filterCategorySelect').value;
    let products = JSON.parse(localStorage.getItem('products')) || [];
    let tbody = document.querySelector('#invTable tbody');
    tbody.innerHTML = '';

    const filtered = products.filter(p => {
        const matchQuery = p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query);
        const matchCat = !catFilter || p.cat === catFilter;
        return matchQuery && matchCat;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No matching products.</td></tr>`;
        return;
    }

    filtered.forEach(p => {
        const badge = getStockBadgeHTML(p);
        let actionTd = (currentUser && currentUser.role !== 'associate') ? `<td><button class="btn-action btn-delete" data-del-id="${p.id}">Remove</button></td>` : '';
        tbody.innerHTML += `<tr><td>${p.name}</td><td>${p.brand}</td><td>${p.cat}</td><td>${p.qty}</td><td>${p.expiry || '-'}</td><td>${badge}</td>${actionTd}</tr>`;
    });

    tbody.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-del-id'));
            deleteProduct(id);
        });
    });
}

function deleteProduct(id) {
    if (currentUser && currentUser.role === 'associate') { alert('Unauthorized.'); return; }
    let products = JSON.parse(localStorage.getItem('products')) || [];
    let idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
        let removed = products.splice(idx, 1)[0];
        localStorage.setItem('products', JSON.stringify(products));

        let lossHistory = JSON.parse(localStorage.getItem('inventoryLossHistory')) || [];
        lossHistory.push({ name: removed.name, brand: removed.brand, type: 'Removed/Deleted', qty: removed.qty, notes: 'Manual Removal by Admin', date: new Date().toLocaleString() });
        localStorage.setItem('inventoryLossHistory', JSON.stringify(lossHistory));
        refreshAppData();
    }
}

function recordSaleOrLoss() {
    const prodId = document.getElementById('logProductSelect').value;
    const logType = document.getElementById('logTypeSelect').value;
    const qty = parseInt(document.getElementById('logQty').value) || 1;
    const notes = document.getElementById('logNotes').value;

    let products = JSON.parse(localStorage.getItem('products'));
    let prod = products.find(p => p.id == prodId);

    if (!prod || prod.qty < qty) {
        alert('Insufficient stock.');
        return;
    }

    if (currentUser && currentUser.role === 'associate') {
        let retailRequests = JSON.parse(localStorage.getItem('retailRequests')) || [];
        retailRequests.push({
            associateName: currentUser.fullname,
            prodId: prod.id,
            prodName: prod.name,
            prodBrand: prod.brand,
            logType,
            qty,
            notes: notes || logType,
            date: new Date().toLocaleString()
        });
        localStorage.setItem('retailRequests', JSON.stringify(retailRequests));
        alert('Retail/Loss log request submitted to Admin/Owner for approval.');
    } else {
        prod.qty -= qty;
        localStorage.setItem('products', JSON.stringify(products));

        let lossHistory = JSON.parse(localStorage.getItem('inventoryLossHistory')) || [];
        lossHistory.push({ name: prod.name, brand: prod.brand, type: logType, qty, notes, date: new Date().toLocaleString() });
        localStorage.setItem('inventoryLossHistory', JSON.stringify(lossHistory));

        let logs = JSON.parse(localStorage.getItem('logs')) || [];
        logs.push({ name: prod.name, brand: prod.brand, type: logType, qty, notes: notes || logType, date: new Date().toLocaleString() });
        localStorage.setItem('logs', JSON.stringify(logs));

        alert('Retail/Loss logged successfully!');
    }

    refreshAppData();
}

function refreshAppData() {
    let products = JSON.parse(localStorage.getItem('products')) || [];
    let logs = JSON.parse(localStorage.getItem('logs')) || [];

    const lowItems = products.filter(p => p.qty > 0 && !isItemExpired(p.expiry) && ((p.qty / (p.maxQty || 20)) * 100 <= 15 || p.qty <= 5));
    const outItems = products.filter(p => p.qty === 0 && !isItemExpired(p.expiry));
    const expiringSoon = products.filter(p => isItemNearlyExpired(p.expiry));

    document.getElementById('statTotal').textContent = products.length;
    document.getElementById('statLow').textContent = lowItems.length;
    document.getElementById('statOut').textContent = outItems.length;

    let dashTbody = document.querySelector('#dashTable tbody');
    dashTbody.innerHTML = '';
    products.slice(-5).reverse().forEach(p => {
        dashTbody.innerHTML += `<tr><td>${p.name}</td><td>${p.brand}</td><td>${p.qty}</td><td>${getStockBadgeHTML(p)}</td><td>${p.dateAdded}</td></tr>`;
    });

    let dashLowTbody = document.querySelector('#dashLowTable tbody');
    dashLowTbody.innerHTML = '';
    if (lowItems.length === 0) dashLowTbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No low stock items.</td></tr>`;
    else lowItems.forEach(p => dashLowTbody.innerHTML += `<tr><td>${p.name}</td><td>${p.brand}</td><td>${p.qty}</td></tr>`);

    let dashOutTbody = document.querySelector('#dashOutTable tbody');
    dashOutTbody.innerHTML = '';
    if (outItems.length === 0) dashOutTbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No out of stock items.</td></tr>`;
    else outItems.forEach(p => dashOutTbody.innerHTML += `<tr><td>${p.name}</td><td>${p.brand}</td><td>${p.qty}</td></tr>`);

    let expTbody = document.querySelector('#dashExpiryTable tbody');
    expTbody.innerHTML = '';
    if (expiringSoon.length === 0) expTbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No nearly expiring items.</td></tr>`;
    else expiringSoon.forEach(p => expTbody.innerHTML += `<tr><td>${p.name}</td><td>${p.brand}</td><td>${p.expiry}</td><td><span class="badge-low">Expiring Soon</span></td></tr>`);

    filterProducts();
    renderReportsHistory();

    let logSelect = document.getElementById('logProductSelect');
    logSelect.innerHTML = '';
    products.forEach(p => {
        if (p.qty > 0) logSelect.innerHTML += `<option value="${p.id}">${p.name} (${p.brand}) - Stock: ${p.qty}</option>`;
    });

    let logsTbody = document.querySelector('#logsTable tbody');
    logsTbody.innerHTML = '';
    logs.slice(-10).reverse().forEach(l => {
        logsTbody.innerHTML += `<tr><td>${l.name}</td><td>${l.brand}</td><td>${l.type}</td><td>${l.qty}</td><td>${l.notes}</td><td>${l.date}</td></tr>`;
    });
}

function generateReport() {
    const periodType = document.getElementById('reportTypeSelect').value;
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const lossHistory = JSON.parse(localStorage.getItem('inventoryLossHistory')) || [];
    const now = new Date();

    document.getElementById('pdfReportTitle').textContent = `${periodType.toUpperCase()} INVENTORY & LOSS REPORT`;
    document.getElementById('pdfReportMeta').textContent = `Generated: ${now.toLocaleString()} | By: ${currentUser ? currentUser.fullname : 'Admin'}`;

    const lowItems = products.filter(p => p.qty > 0 && ((p.qty / (p.maxQty || 20)) * 100 <= 15 || p.qty <= 5));
    const outItems = products.filter(p => p.qty === 0 || isItemExpired(p.expiry));

    document.getElementById('pdfTotalProd').textContent = products.length;
    document.getElementById('pdfLowStock').textContent = lowItems.length;
    document.getElementById('pdfOutStock').textContent = outItems.length;

    let lossTbody = document.querySelector('#pdfLossSummaryTable tbody');
    lossTbody.innerHTML = '';
    if (lossHistory.length === 0) {
        lossTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No loss items recorded.</td></tr>`;
    } else {
        lossHistory.forEach(l => {
            lossTbody.innerHTML += `<tr><td>${l.name}</td><td>${l.brand}</td><td>${l.type} (${l.notes || '-'})</td><td>${l.qty}</td><td>${l.date}</td></tr>`;
        });
    }

    let pdfTbody = document.querySelector('#pdfInventoryDetailsTable tbody');
    pdfTbody.innerHTML = '';
    products.forEach(p => {
        pdfTbody.innerHTML += `<tr><td>${p.name}</td><td>${p.brand}</td><td>${p.cat}</td><td>${p.qty}</td><td>₱${p.price.toFixed(2)}</td></tr>`;
    });

    document.getElementById('reportPreviewContainer').classList.remove('hidden');
    renderInventoryBarGraph(products);

    let history = JSON.parse(localStorage.getItem('reportsHistory')) || [];
    history.push({ date: now.toISOString().slice(0, 10), period: periodType, by: currentUser ? currentUser.fullname : 'Admin' });
    localStorage.setItem('reportsHistory', JSON.stringify(history));
    renderReportsHistory();
}

function renderInventoryBarGraph(products) {
    let container = document.getElementById('inventoryBarGraph');
    container.innerHTML = '';
    if (products.length === 0) {
        container.innerHTML = `<p style="font-size:13px; color:#ccc;">No products available for graph.</p>`;
        return;
    }
    products.forEach(p => {
        let max = p.maxQty || 50;
        let percent = Math.min(100, Math.round((p.qty / max) * 100));
        let color = p.qty === 0 ? '#dc3545' : percent <= 15 ? '#ffc107' : '#28a745';
        container.innerHTML += `
            <div>
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:2px;">
                    <span>${p.name} (${p.brand})</span>
                    <span>Qty: ${p.qty}</span>
                </div>
                <div style="width:100%; background:rgba(255,255,255,0.1); border-radius:4px; height:14px; overflow:hidden;">
                    <div style="width:${percent}%; background:${color}; height:100%;"></div>
                </div>
            </div>
        `;
    });
}

function renderReportsHistory() {
    let history = JSON.parse(localStorage.getItem('reportsHistory')) || [];
    let tbody = document.querySelector('#reportsHistoryTable tbody');
    tbody.innerHTML = '';
    if (history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No reports generated yet.</td></tr>`;
        return;
    }
    history.slice(-10).reverse().forEach(r => {
        tbody.innerHTML += `<tr><td>${r.date}</td><td>${r.period} Report</td><td>${r.by}</td><td><button class="btn-action btn-edit btn-download-pdf">Download PDF</button></td></tr>`;
    });

    tbody.querySelectorAll('.btn-download-pdf').forEach(btn => {
        btn.addEventListener('click', exportReportToPDF);
    });
}

function exportReportToPDF() {
    const { jsPDF } = window.jspdf;
    const element = document.getElementById('reportPdfPreview');
    html2canvas(element, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(imgData, 'PNG', 10, 10, 190, (canvas.height * 190) / canvas.width);
        pdf.save(`DelaCruzStore_Report.pdf`);
    });
}

function printReportDocument() {
    const win = window.open('', '', 'height=700,width=900');
    win.document.write('<html><head><title>Print Report</title></head><body>' + document.getElementById('reportPdfPreview').outerHTML + '</body></html>');
    win.document.close();
    setTimeout(() => win.print(), 500);
}

function unlockAdminAccess() {
    if (!currentUser) return;
    if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
        alert('Access Denied.');
        return;
    }
    const inputKey = document.getElementById('adminPassInput').value;
    const userPasscode = currentUser.adminPasscode || '123456789';
    if (inputKey === userPasscode) {
        isAdminUnlocked = true;
        document.getElementById('adminPassInput').value = '';
        checkAdminViewStatus();
    } else {
        alert('Incorrect Admin Passcode!');
    }
}

function lockAdminAccess() {
    isAdminUnlocked = false;
    checkAdminViewStatus();
}

function checkAdminViewStatus() {
    if (!currentUser) return;
    if (currentUser.role === 'associate') {
        document.getElementById('adminLockView').classList.add('hidden');
        document.getElementById('adminContentView').classList.add('hidden');
        document.getElementById('associateRequestsView').classList.remove('hidden');
        renderAssociateRequestHistory();
        return;
    }
    document.getElementById('associateRequestsView').classList.add('hidden');
    if (isAdminUnlocked) {
        document.getElementById('adminLockView').classList.add('hidden');
        document.getElementById('adminContentView').classList.remove('hidden');
        loadAdminInfo();
        renderPendingApprovals();
        renderRestockRequests();
        renderRetailRequests();
        renderApprovedLogsTable();
        renderAllUsersTable();
    } else {
        document.getElementById('adminLockView').classList.remove('hidden');
        document.getElementById('adminContentView').classList.add('hidden');
    }
}

function renderAssociateRequestHistory() {
    if (!currentUser) return;
    const name = currentUser.fullname;

    let allReq = JSON.parse(localStorage.getItem('restockRequests')) || [];
    let myPending = allReq.filter(r => r.associateName === name);
    let pendTbody = document.querySelector('#assocPendingTable tbody');
    pendTbody.innerHTML = '';
    if (myPending.length === 0) pendTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No pending restock requests.</td></tr>`;
    else myPending.forEach(r => pendTbody.innerHTML += `<tr><td>${r.name}</td><td>${r.brand}</td><td>${r.qty}</td><td>₱${r.price.toFixed(2)}</td><td>${r.dateAdded}</td></tr>`);

    let allRetailReq = JSON.parse(localStorage.getItem('retailRequests')) || [];
    let myRetailPending = allRetailReq.filter(r => r.associateName === name);
    let pendRetailTbody = document.querySelector('#assocPendingRetailTable tbody');
    pendRetailTbody.innerHTML = '';
    if (myRetailPending.length === 0) pendRetailTbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No pending retail/loss log requests.</td></tr>`;
    else myRetailPending.forEach(r => pendRetailTbody.innerHTML += `<tr><td>${r.prodName}</td><td>${r.prodBrand}</td><td>${r.logType}</td><td>${r.qty}</td><td>${r.notes || '-'}</td><td>${r.date}</td></tr>`);

    let allApp = JSON.parse(localStorage.getItem('approvedRestockHistory')) || [];
    let myApp = allApp.filter(r => r.associateName === name);
    let appTbody = document.querySelector('#assocApprovedTable tbody');
    appTbody.innerHTML = '';
    if (myApp.length === 0) appTbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No approved requests.</td></tr>`;
    else myApp.forEach(r => appTbody.innerHTML += `<tr><td>${r.name}</td><td>${r.brand}</td><td>${r.qty}</td><td>${r.approvedBy}</td><td>${r.notes || '-'}</td><td>${r.date}</td></tr>`);

    let allRej = JSON.parse(localStorage.getItem('rejectedRestockHistory')) || [];
    let myRej = allRej.filter(r => r.associateName === name);
    let rejTbody = document.querySelector('#assocRejectedTable tbody');
    rejTbody.innerHTML = '';
    if (myRej.length === 0) rejTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No rejected requests.</td></tr>`;
    else myRej.forEach(r => rejTbody.innerHTML += `<tr><td>${r.name}</td><td>${r.brand}</td><td>${r.qty}</td><td>${r.reason}</td><td>${r.date}</td></tr>`);
}

function loadAdminInfo() {
    if (currentUser) {
        document.getElementById('adminName').value = currentUser.fullname;
        document.getElementById('adminUser').value = currentUser.username;
        document.getElementById('adminRoleDisplay').value = currentUser.role.toUpperCase();
    }
}

function renderPendingApprovals() {
    let users = JSON.parse(localStorage.getItem('users'));
    let pending = users.filter(u => u.status === 'pending');
    let tbody = document.querySelector('#approvalTable tbody');
    tbody.innerHTML = '';
    if (pending.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No pending approvals.</td></tr>`;
        return;
    }
    pending.forEach(u => {
        tbody.innerHTML += `<tr><td>${u.fullname}</td><td>${u.username}</td><td>${u.email}</td><td><button class="btn-action btn-approve" data-user="${u.username}">Approve</button> <button class="btn-action btn-reject" data-user="${u.username}">Reject</button></td></tr>`;
    });

    tbody.querySelectorAll('.btn-approve').forEach(b => b.addEventListener('click', (e) => approveUser(e.target.getAttribute('data-user'))));
    tbody.querySelectorAll('.btn-reject').forEach(b => b.addEventListener('click', (e) => rejectUser(e.target.getAttribute('data-user'))));
}

function approveUser(username) {
    let users = JSON.parse(localStorage.getItem('users'));
    let u = users.find(user => user.username === username);
    if (u) {
        u.status = 'approved';
        localStorage.setItem('users', JSON.stringify(users));
        renderPendingApprovals();
        renderAllUsersTable();
    }
}

function rejectUser(username) {
    let users = JSON.parse(localStorage.getItem('users'));
    let u = users.find(user => user.username === username);
    if (u) {
        u.status = 'rejected';
        localStorage.setItem('users', JSON.stringify(users));
        renderPendingApprovals();
        renderAllUsersTable();
    }
}

function renderRestockRequests() {
    let requests = JSON.parse(localStorage.getItem('restockRequests')) || [];
    let tbody = document.querySelector('#restockRequestTable tbody');
    tbody.innerHTML = '';
    if (requests.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No pending restock requests.</td></tr>`;
        return;
    }
    requests.forEach((req, index) => {
        tbody.innerHTML += `<tr><td>${req.associateName}</td><td>${req.name}</td><td>${req.brand}</td><td>${req.qty}</td><td>₱${req.price.toFixed(2)}</td><td><button class="btn-action btn-approve" data-idx="${index}">Approve</button> <button class="btn-action btn-reject" data-idx="${index}">Reject</button></td></tr>`;
    });

    tbody.querySelectorAll('.btn-approve').forEach(b => b.addEventListener('click', (e) => promptApproveRestock(parseInt(e.target.getAttribute('data-idx')))));
    tbody.querySelectorAll('.btn-reject').forEach(b => b.addEventListener('click', (e) => promptRejectRestock(parseInt(e.target.getAttribute('data-idx')))));
}

function promptApproveRestock(index) {
    let notes = prompt("Enter optional notes for approval:", "");
    approveRestock(index, notes || '');
}

function promptRejectRestock(index) {
    let reason = prompt("Enter reason for rejection (Required):", "");
    if (!reason) { alert("Reason is required to reject a request."); return; }
    rejectRestock(index, reason);
}

function approveRestock(index, notes) {
    let requests = JSON.parse(localStorage.getItem('restockRequests')) || [];
    let req = requests[index];
    let products = JSON.parse(localStorage.getItem('products'));
    
    let existing = products.find(p => p.name.toLowerCase() === req.name.toLowerCase());
    if (existing) {
        existing.qty += req.qty;
    } else {
        products.push({ id: Date.now(), name: req.name, brand: req.brand, qty: req.qty, maxQty: req.qty * 2, cat: req.cat, price: req.price, expiry: req.expiry, dateAdded: req.dateAdded });
    }
    localStorage.setItem('products', JSON.stringify(products));

    let approvedHistory = JSON.parse(localStorage.getItem('approvedRestockHistory')) || [];
    approvedHistory.push({ associateName: req.associateName, name: req.name, brand: req.brand, qty: req.qty, approvedBy: currentUser.fullname, notes, date: new Date().toLocaleString() });
    localStorage.setItem('approvedRestockHistory', JSON.stringify(approvedHistory));

    addApprovedLog('Restock Request', `Restock - ${req.name} (${req.qty})`, req.associateName);

    requests.splice(index, 1);
    localStorage.setItem('restockRequests', JSON.stringify(requests));
    renderRestockRequests();
    renderApprovedLogsTable();
    refreshAppData();
}

function rejectRestock(index, reason) {
    let requests = JSON.parse(localStorage.getItem('restockRequests')) || [];
    let req = requests[index];

    let rejectedHistory = JSON.parse(localStorage.getItem('rejectedRestockHistory')) || [];
    rejectedHistory.push({ associateName: req.associateName, name: req.name, brand: req.brand, qty: req.qty, reason, date: new Date().toLocaleString() });
    localStorage.setItem('rejectedRestockHistory', JSON.stringify(rejectedHistory));

    requests.splice(index, 1);
    localStorage.setItem('restockRequests', JSON.stringify(requests));
    renderRestockRequests();
}

function renderRetailRequests() {
    let requests = JSON.parse(localStorage.getItem('retailRequests')) || [];
    let tbody = document.querySelector('#retailRequestTable tbody');
    tbody.innerHTML = '';
    if (requests.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No pending retail / loss log requests.</td></tr>`;
        return;
    }
    requests.forEach((req, index) => {
        tbody.innerHTML += `<tr><td>${req.associateName}</td><td>${req.prodName}</td><td>${req.prodBrand}</td><td>${req.logType}</td><td>${req.qty}</td><td>${req.notes || '-'}</td><td><button class="btn-action btn-approve" data-idx="${index}">Approve</button> <button class="btn-action btn-reject" data-idx="${index}">Reject</button></td></tr>`;
    });

    tbody.querySelectorAll('.btn-approve').forEach(b => b.addEventListener('click', (e) => approveRetailLogRequest(parseInt(e.target.getAttribute('data-idx')))));
    tbody.querySelectorAll('.btn-reject').forEach(b => b.addEventListener('click', (e) => rejectRetailLogRequest(parseInt(e.target.getAttribute('data-idx')))));
}

function approveRetailLogRequest(index) {
    let requests = JSON.parse(localStorage.getItem('retailRequests')) || [];
    let req = requests[index];

    let products = JSON.parse(localStorage.getItem('products'));
    let prod = products.find(p => p.id == req.prodId);

    if (!prod || prod.qty < req.qty) {
        alert('Cannot approve: Insufficient stock in inventory.');
        return;
    }

    prod.qty -= req.qty;
    localStorage.setItem('products', JSON.stringify(products));

    let lossHistory = JSON.parse(localStorage.getItem('inventoryLossHistory')) || [];
    lossHistory.push({ name: req.prodName, brand: req.prodBrand, type: req.logType, qty: req.qty, notes: req.notes, date: new Date().toLocaleString() });
    localStorage.setItem('inventoryLossHistory', JSON.stringify(lossHistory));

    let logs = JSON.parse(localStorage.getItem('logs')) || [];
    logs.push({ name: req.prodName, brand: req.prodBrand, type: req.logType, qty: req.qty, notes: req.notes || req.logType, date: new Date().toLocaleString() });
    localStorage.setItem('logs', JSON.stringify(logs));

    addApprovedLog('Retail/Loss Log', `${req.logType} - ${req.prodName} (${req.qty})`, req.associateName);

    let approvedHistory = JSON.parse(localStorage.getItem('approvedRestockHistory')) || [];
    approvedHistory.push({ associateName: req.associateName, name: req.prodName, brand: req.prodBrand, qty: req.qty, approvedBy: currentUser.fullname, notes: req.notes, date: new Date().toLocaleString() });
    localStorage.setItem('approvedRestockHistory', JSON.stringify(approvedHistory));

    requests.splice(index, 1);
    localStorage.setItem('retailRequests', JSON.stringify(requests));

    renderRetailRequests();
    renderApprovedLogsTable();
    refreshAppData();
    alert('Retail/Loss log request approved!');
}

function rejectRetailLogRequest(index) {
    let reason = prompt("Enter reason for rejection (Required):", "");
    if (!reason) { alert("Reason is required to reject."); return; }

    let requests = JSON.parse(localStorage.getItem('retailRequests')) || [];
    let req = requests[index];

    let rejectedHistory = JSON.parse(localStorage.getItem('rejectedRestockHistory')) || [];
    rejectedHistory.push({ associateName: req.associateName, name: req.prodName, brand: req.prodBrand, qty: req.qty, reason, date: new Date().toLocaleString() });
    localStorage.setItem('rejectedRestockHistory', JSON.stringify(rejectedHistory));

    requests.splice(index, 1);
    localStorage.setItem('retailRequests', JSON.stringify(requests));

    renderRetailRequests();
    alert('Log request rejected.');
}

function addApprovedLog(type, details, requestedBy) {
    let logs = JSON.parse(localStorage.getItem('approvedLogs')) || [];
    logs.push({ type, details, requestedBy, approvedBy: currentUser ? currentUser.fullname : 'Admin', date: new Date().toLocaleString() });
    localStorage.setItem('approvedLogs', JSON.stringify(logs));
}

function renderApprovedLogsTable() {
    let logs = JSON.parse(localStorage.getItem('approvedLogs')) || [];
    let tbody = document.querySelector('#approvedLogTable tbody');
    tbody.innerHTML = '';
    if (logs.length === 0) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No logs yet.</td></tr>`;
    else logs.slice(-10).reverse().forEach(l => tbody.innerHTML += `<tr><td>${l.type}</td><td>${l.details}</td><td>${l.requestedBy}</td><td>${l.approvedBy}</td><td>${l.date}</td></tr>`);
}

function renderAllUsersTable() {
    let users = JSON.parse(localStorage.getItem('users'));
    let tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';
    users.forEach(u => {
        let actionBtn = (currentUser.role === 'admin' && u.role === 'owner') ? `<span style="color:#aaa;">Restricted</span>` : `<button class="btn-action btn-edit" data-user="${u.username}">Edit</button> <button class="btn-action btn-delete" data-user="${u.username}">Delete</button>`;
        tbody.innerHTML += `<tr><td>${u.fullname}</td><td>${u.username}</td><td><strong>${u.role.toUpperCase()}</strong></td><td>${u.status}</td><td>${actionBtn}</td></tr>`;
    });

    tbody.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', (e) => openEditModal(e.target.getAttribute('data-user'))));
    tbody.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', (e) => deleteUserAccount(e.target.getAttribute('data-user'))));
}

function openEditModal(username) {
    let users = JSON.parse(localStorage.getItem('users'));
    let target = users.find(u => u.username === username);
    if (!target) return;
    document.getElementById('editOldUsernameKey').value = target.username;
    document.getElementById('editFullname').value = target.fullname;
    document.getElementById('editUsername').value = target.username;
    document.getElementById('editEmail').value = target.email;
    document.getElementById('editPassword').value = target.password;
    document.getElementById('editAdminPasscode').value = target.adminPasscode || '';
    document.getElementById('editRole').value = target.role;
    document.getElementById('editStatus').value = target.status;
    document.getElementById('editUserModal').classList.remove('hidden');
}

function saveEditedUser() {
    let oldKey = document.getElementById('editOldUsernameKey').value;
    let users = JSON.parse(localStorage.getItem('users'));
    let target = users.find(u => u.username === oldKey);
    if (target) {
        target.fullname = document.getElementById('editFullname').value;
        target.username = document.getElementById('editUsername').value;
        target.email = document.getElementById('editEmail').value;
        target.password = document.getElementById('editPassword').value;
        target.adminPasscode = document.getElementById('editAdminPasscode').value;
        target.role = document.getElementById('editRole').value;
        target.status = document.getElementById('editStatus').value;
        localStorage.setItem('users', JSON.stringify(users));
        document.getElementById('editUserModal').classList.add('hidden');
        renderAllUsersTable();
    }
}

function deleteUserAccount(username) {
    let users = JSON.parse(localStorage.getItem('users'));
    let target = users.find(u => u.username === username);
    if (target && target.role === 'owner') { alert('Cannot delete Owner.'); return; }
    if (confirm('Delete user?')) {
        users = users.filter(u => u.username !== username);
        localStorage.setItem('users', JSON.stringify(users));
        renderAllUsersTable();
    }
}

function changeAdminPassword() {
    const oldPass = document.getElementById('oldAdminPass').value;
    const newPass = document.getElementById('newAdminPass').value;
    const confirmPass = document.getElementById('confirmAdminPass').value;
    const userPasscode = currentUser.adminPasscode || '123456789';
    if (oldPass !== userPasscode || newPass !== confirmPass) {
        alert('Passcode check failed.');
        return;
    }
    let users = JSON.parse(localStorage.getItem('users'));
    let u = users.find(usr => usr.username === currentUser.username);
    if (u) {
        u.adminPasscode = newPass;
        currentUser.adminPasscode = newPass;
        localStorage.setItem('users', JSON.stringify(users));
        alert('Admin Passcode updated!');
    }
}
