// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Global variables
let allProducts = [];
let profitAnalysis = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('editForm').addEventListener('submit', handleEditSubmit);
    document.getElementById('bulkUpdateForm').addEventListener('submit', handleBulkUpdateSubmit);
}

// Load all data
async function loadData() {
    try {
        await Promise.all([
            loadProducts(),
            loadProfitAnalysis()
        ]);
        renderDashboard();
        renderProductsTable();
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error al cargar los datos', 'error');
    }
}

// Load products
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Error fetching products');
        allProducts = await response.json();
    } catch (error) {
        console.error('Error loading products:', error);
        throw error;
    }
}

// Load profit analysis
async function loadProfitAnalysis() {
    try {
        const response = await fetch(`${API_BASE_URL}/products/profit-analysis`);
        if (!response.ok) throw new Error('Error fetching profit analysis');
        profitAnalysis = await response.json();
    } catch (error) {
        console.error('Error loading profit analysis:', error);
        throw error;
    }
}

// Render dashboard
function renderDashboard() {
    document.getElementById('totalInventory').textContent = 
        formatCurrency(profitAnalysis.totalInventoryValue || 0);
    document.getElementById('totalCost').textContent = 
        formatCurrency(profitAnalysis.totalCostValue || 0);
    document.getElementById('totalProfit').textContent = 
        formatCurrency(profitAnalysis.totalProfitValue || 0);
    document.getElementById('averageMargin').textContent = 
        formatPercentage(profitAnalysis.averageMargin || 0);
}

// Render products table
function renderProductsTable(products = allProducts) {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';

    products.forEach(product => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        
        const profitClass = product.profitPerUnit >= 0 ? 'profit-positive' : 'profit-negative';
        const marginClass = product.profitMarginPercentage >= 20 ? 'profit-positive' : 
                           product.profitMarginPercentage >= 10 ? 'profit-warning' : 'profit-negative';

        row.innerHTML = `
            <td class="px-4 py-3">
                <div class="font-medium">${product.name}</div>
                <div class="text-sm text-gray-500">${product.barcode || 'Sin código'}</div>
            </td>
            <td class="px-4 py-3">${formatCurrency(product.costPrice)}</td>
            <td class="px-4 py-3 ${marginClass}">${formatPercentage(product.profitMargin)}</td>
            <td class="px-4 py-3 font-medium">${formatCurrency(product.salePrice)}</td>
            <td class="px-4 py-3 ${profitClass} font-medium">${formatCurrency(product.profitPerUnit)}</td>
            <td class="px-4 py-3">${product.currentStock}</td>
            <td class="px-4 py-3">
                <button onclick="editProduct(${product.id})" 
                        class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="viewCostHistory(${product.id})" 
                        class="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600">
                    <i class="fas fa-history"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Handle search
function handleSearch(event) {
    const query = event.target.value.toLowerCase();
    const filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(query) ||
        (product.barcode && product.barcode.toLowerCase().includes(query))
    );
    renderProductsTable(filteredProducts);
}

// Edit product
function editProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('editProductId').value = product.id;
    document.getElementById('editCostPrice').value = product.costPrice;
    document.getElementById('editProfitMargin').value = product.profitMargin;
    document.getElementById('editManualPrice').value = product.manualSalePrice || '';
    document.getElementById('editIsManualPrice').checked = product.isUsingManualPrice;

    document.getElementById('editModal').classList.remove('hidden');
    document.getElementById('editModal').classList.add('flex');
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    document.getElementById('editModal').classList.remove('flex');
}

// Handle edit submit
async function handleEditSubmit(event) {
    event.preventDefault();

    const productId = document.getElementById('editProductId').value;
    const formData = {
        costPrice: parseFloat(document.getElementById('editCostPrice').value),
        profitMargin: parseFloat(document.getElementById('editProfitMargin').value),
        manualSalePrice: document.getElementById('editManualPrice').value ? 
                        parseFloat(document.getElementById('editManualPrice').value) : null,
        isUsingManualPrice: document.getElementById('editIsManualPrice').checked
    };

    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}/pricing`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Error updating product');

        showNotification('Producto actualizado exitosamente', 'success');
        closeEditModal();
        await loadData();
        renderDashboard();
        renderProductsTable();
    } catch (error) {
        console.error('Error updating product:', error);
        showNotification('Error al actualizar el producto', 'error');
    }
}

// Show most profitable products
function showMostProfitable() {
    const section = document.getElementById('mostProfitableSection');
    const list = document.getElementById('mostProfitableList');
    
    if (profitAnalysis.mostProfitableProducts && profitAnalysis.mostProfitableProducts.length > 0) {
        list.innerHTML = profitAnalysis.mostProfitableProducts.map(product => `
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                    <div class="font-medium">${product.name}</div>
                    <div class="text-sm text-gray-500">Ganancia por unidad: ${formatCurrency(product.profitPerUnit)}</div>
                </div>
                <div class="text-right">
                    <div class="font-bold profit-positive">${formatCurrency(product.totalProfitValue)}</div>
                    <div class="text-sm ${product.marginPercentage >= 20 ? 'profit-positive' : 'profit-warning'}">
                        ${formatPercentage(product.marginPercentage)}
                    </div>
                </div>
            </div>
        `).join('');
        
        section.classList.remove('hidden');
    } else {
        showNotification('No hay datos de productos más rentables', 'info');
    }
}

// Show low margin products
function showLowMarginProducts() {
    const section = document.getElementById('lowMarginSection');
    const list = document.getElementById('lowMarginList');
    
    if (profitAnalysis.productsWithLowMargin && profitAnalysis.productsWithLowMargin.length > 0) {
        list.innerHTML = profitAnalysis.productsWithLowMargin.map(product => `
            <div class="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div>
                    <div class="font-medium">${product.name}</div>
                    <div class="text-sm text-gray-500">Precio: ${formatCurrency(product.salePrice)} | Costo: ${formatCurrency(product.costPrice)}</div>
                </div>
                <div class="text-right">
                    <div class="font-bold profit-negative">${formatPercentage(product.margin)}</div>
                    <button onclick="editProduct(${product.id})" 
                            class="mt-1 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">
                        Corregir
                    </button>
                </div>
            </div>
        `).join('');
        
        section.classList.remove('hidden');
    } else {
        showNotification('No hay productos con márgenes bajos', 'success');
    }
}

// Bulk update margins
function bulkUpdateMargins() {
    document.getElementById('bulkUpdateModal').classList.remove('hidden');
    document.getElementById('bulkUpdateModal').classList.add('flex');
}

// Close bulk update modal
function closeBulkUpdateModal() {
    document.getElementById('bulkUpdateModal').classList.add('hidden');
    document.getElementById('bulkUpdateModal').classList.remove('flex');
}

// Handle bulk update submit
async function handleBulkUpdateSubmit(event) {
    event.preventDefault();

    const formData = {
        categoryId: document.getElementById('bulkCategoryId').value || null,
        newMargin: parseFloat(document.getElementById('bulkNewMargin').value)
    };

    if (formData.newMargin < 0 || formData.newMargin >= 100) {
        showNotification('El margen debe estar entre 0 y 99.99', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/products/bulk-update-margins`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Error updating margins');

        const result = await response.json();
        showNotification(`${result.updatedCount} productos actualizados exitosamente`, 'success');
        closeBulkUpdateModal();
        await loadData();
        renderDashboard();
        renderProductsTable();
    } catch (error) {
        console.error('Error bulk updating margins:', error);
        showNotification('Error al actualizar los márgenes', 'error');
    }
}

// View cost history
async function viewCostHistory(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}/cost-history`);
        if (!response.ok) throw new Error('Error fetching cost history');
        
        const history = await response.json();
        
        if (history.length === 0) {
            showNotification('No hay historial de costos para este producto', 'info');
            return;
        }

        // Create and show history modal
        showHistoryModal(history);
    } catch (error) {
        console.error('Error loading cost history:', error);
        showNotification('Error al cargar el historial de costos', 'error');
    }
}

// Show history modal
function showHistoryModal(history) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-96 overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-bold">Historial de Costos</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="space-y-2">
                ${history.map(entry => `
                    <div class="border-b pb-2">
                        <div class="flex justify-between items-center">
                            <div>
                                <span class="font-medium">${formatCurrency(entry.oldCostPrice)} → ${formatCurrency(entry.newCostPrice)}</span>
                                <span class="text-sm text-gray-500 ml-2">${formatCurrency(entry.oldSalePrice)} → ${formatCurrency(entry.newSalePrice)}</span>
                            </div>
                            <div class="text-sm text-gray-500">
                                ${new Date(entry.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                        ${entry.changeReason ? `<div class="text-sm text-gray-600">${entry.changeReason}</div>` : ''}
                        ${entry.changedBy ? `<div class="text-xs text-gray-500">Por: ${entry.changedBy}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Refresh data
async function refreshData() {
    showNotification('Actualizando datos...', 'info');
    await loadData();
    renderDashboard();
    renderProductsTable();
    showNotification('Datos actualizados exitosamente', 'success');
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatPercentage(value) {
    return `${value.toFixed(2)}%`;
}

function showNotification(message, type = 'info') {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };

    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}