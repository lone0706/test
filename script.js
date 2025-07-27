// Configuration - Replace with your Google Sheets details
const CONFIG = {
    // Your Google Sheet ID (from the URL)
    SPREADSHEET_ID: '1o6Csb0Ny_n4G4wVYWtGIvP59RYBnCVa1Dip85_0pQ1o',
    // Your API Key (get from Google Cloud Console)
    API_KEY: 'AIzaSyB1CUHpkRJj-Lo2sU1gNFAqbvMdJDFRT4Q',
    // Range of your data (adjust if needed)
    RANGE: 'Sheet1!A:F' // Adjust based on your sheet name and columns
};

// Column mapping - Adjust based on your Google Sheet structure
const COLUMN_MAPPING = {
    SKU: 0,          // Column A
    NAME: 1,         // Column B
    URL: 2,          // Column C
    CURRENT_STOCK: 3, // Column D
    IMAGE: 4,        // Column E
    INCOMING_STOCK: 5 // Column F
};

class InventoryManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.setupEventListeners();
        this.displayProducts();
        this.updateStats();
    }

    async loadProducts() {
        const loadingElement = document.getElementById('loading');
        const errorElement = document.getElementById('error');

        try {
            loadingElement.style.display = 'block';
            
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${CONFIG.RANGE}?key=${CONFIG.API_KEY}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.values || data.values.length < 2) {
                throw new Error('No data found in spreadsheet');
            }

            // Remove header row and process data
            const rows = data.values.slice(1); // Skip header row
            
            this.products = rows.map(row => ({
                sku: row[COLUMN_MAPPING.SKU] || '',
                name: row[COLUMN_MAPPING.NAME] || '',
                url: row[COLUMN_MAPPING.URL] || '',
                currentStock: parseInt(row[COLUMN_MAPPING.CURRENT_STOCK]) || 0,
                image: row[COLUMN_MAPPING.IMAGE] || '',
                incomingStock: parseInt(row[COLUMN_MAPPING.INCOMING_STOCK]) || 0
            }));

            this.filteredProducts = [...this.products];
            loadingElement.style.display = 'none';

        } catch (error) {
            console.error('Error loading products:', error);
            loadingElement.style.display = 'none';
            errorElement.style.display = 'block';
            errorElement.textContent = `Error loading inventory: ${error.message}`;
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');

        searchInput.addEventListener('input', (e) => {
            this.searchProducts(e.target.value);
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchProducts(e.target.value);
            }
        });

        searchBtn.addEventListener('click', () => {
            this.searchProducts(searchInput.value);
        });
    }

    searchProducts(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) {
            this.filteredProducts = [...this.products];
        } else {
            this.filteredProducts = this.products.filter(product => 
                product.sku.toLowerCase().includes(searchTerm) ||
                product.name.toLowerCase().includes(searchTerm)
            );
        }

        this.displayProducts();
        this.updateStats();
    }

    displayProducts() {
        const container = document.getElementById('productsContainer');
        
        if (this.filteredProducts.length === 0) {
            container.innerHTML = '<div class="no-results">No products found matching your search.</div>';
            return;
        }

        container.innerHTML = this.filteredProducts.map(product => `
            <div class="product-card">
                <img src="${product.image || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                     alt="${product.name}" 
                     class="product-image"
                     onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
                <div class="product-info">
                    <div class="product-sku">SKU: ${product.sku}</div>
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-details">
                        <div class="detail-row">
                            <span class="detail-label">Current Stock:</span>
                            <span class="detail-value ${this.getStockClass(product.currentStock)}">
                                ${product.currentStock}
                            </span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Incoming Stock:</span>
                            <span class="detail-value">${product.incomingStock}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Total Available:</span>
                            <span class="detail-value">${product.currentStock + product.incomingStock}</span>
                        </div>
                    </div>
                    ${product.url ? `<a href="${product.url}" target="_blank" class="product-link">View Product</a>` : ''}
                </div>
            </div>
        `).join('');
    }

    getStockClass(stock) {
        if (stock === 0) return 'stock-low';
        if (stock <= 5) return 'stock-medium';
        return 'stock-high';
    }

    updateStats() {
        const totalProducts = this.filteredProducts.length;
        const lowStockItems = this.filteredProducts.filter(p => p.currentStock <= 5).length;

        document.getElementById('totalProducts').textContent = `Total Products: ${totalProducts}`;
        document.getElementById('lowStock').textContent = `Low Stock Items: ${lowStockItems}`;
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new InventoryManager();
});

// Add some helpful console messages for setup
console.log('Inventory Management System Loaded');
console.log('To configure:');
console.log('1. Replace SPREADSHEET_ID in script.js with your Google Sheet ID');
console.log('2. Replace API_KEY in script.js with your Google API Key');
console.log('3. Adjust COLUMN_MAPPING if your sheet structure is different');