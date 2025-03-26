// app.js - Main application logic for BlueprintBuddy

// Main App Class
class BlueprintBuddy {
    constructor() {
        // App State
        this.state = {
            inventory: {},
            weight: 0,
            maxWeight: 9000,
            settings: {
                refreshInterval: 10,
                notifyMissingItems: true,
                showItemDetails: true,
                autoCloseDelay: 0,
                favoriteRecipes: []
            },
            selectedRecipe: "House",
            searchTerm: "",
            lastUpdate: null,
            gameConnected: false
        };
        
        // Element references - will be populated in init()
        this.elements = {};
        
        // Auto-refresh timer
        this.refreshTimer = null;
    }
    
    // Initialize the application
    async init() {
        console.log('Initializing BlueprintBuddy...');
        
        // Load all external data
        await this.loadExternalData();
        
        // Set up DOM element references
        this.setupElementReferences();
        
        // Load saved settings
        this.loadSettings();
        
        // Set up UI event handlers
        this.setupEventHandlers();
        
        // Make the menu movable and resizable
        this.setupMenuInteraction();
        
        // Set up game client communication
        this.setupGameConnection();
        
        // Initial UI population
        this.populateRecipeSelect();
        this.displayRecipeDetails();
        this.setupAutoRefresh();
        
        // Position initially in center
        const menuContainer = this.elements.menuContainer;
        menuContainer.style.left = `${(window.innerWidth - menuContainer.offsetWidth) / 2}px`;
        menuContainer.style.top = `${(window.innerHeight - menuContainer.offsetHeight) / 2}px`;
        
        // Request initial game data
        this.getInventoryData();
        
        this.updateStatusMessage('BlueprintBuddy ready and waiting for game data');
    }
    
    // Load recipes and items data from external files
    async loadExternalData() {
        try {
            // In a real module system, we'd use imports
            // For now, we're assuming these are loaded via script tags
            this.recipes = window.recipes || {};
            this.items = window.items || {};
            
            // If no data loaded, show error
            if (Object.keys(this.recipes).length === 0) {
                console.error('No recipes loaded. Check that recipes.js is included before app.js');
            }
            if (Object.keys(this.items).length === 0) {
                console.error('No items loaded. Check that items.js is included before app.js');
            }
        } catch (error) {
            console.error('Failed to load external data:', error);
        }
    }
    
    // Set up references to DOM elements
    setupElementReferences() {
        this.elements = {
            menuContainer: document.getElementById('menuContainer'),
            resizeHandle: document.getElementById('resizeHandle'),
            menuHeader: document.querySelector('.menu-header'),
            closeBtn: document.getElementById('closeBtn'),
            tabs: document.querySelectorAll('.tab'),
            tabContents: document.querySelectorAll('.tab-content'),
            
            // Recipe tab elements
            recipeSelect: document.getElementById('recipeSelect'),
            ingredientsDisplay: document.getElementById('ingredientsDisplay'),
            recipeWeight: document.getElementById('recipe-weight'),
            maxWeightDisplay: document.getElementById('max-weight'),
            weightProgress: document.getElementById('weight-progress'),
            recipeLocation: document.getElementById('recipe-location'),
            recipeCost: document.getElementById('recipe-cost'),
            recipeInstructions: document.getElementById('recipe-instructions'),
            
            // Inventory tab elements
            playerInventoryDisplay: document.getElementById('player-inventory'),
            inventorySearch: document.getElementById('inventorySearch'),
            currentWeightDisplay: document.getElementById('current-weight'),
            inventoryCapacityDisplay: document.getElementById('inventory-capacity'),
            inventoryProgressDisplay: document.getElementById('inventory-progress'),
            refreshInventoryBtn: document.getElementById('refresh-inventory'),
            
            // Settings tab elements
            maxInventoryWeightSetting: document.getElementById('max-inventory-weight'),
            refreshIntervalSetting: document.getElementById('refresh-interval'),
            notifyMissingItemsSetting: document.getElementById('notify-missing-items'),
            showItemDetailsSetting: document.getElementById('show-item-details'),
            autoCloseDelaySetting: document.getElementById('auto-close-delay'),
            saveSettingsBtn: document.getElementById('save-settings'),
            statusMessage: document.getElementById('status-message'),
            
            // Favorites elements
            favoriteButton: document.getElementById('favorite-recipe')
        };
    }
    
    // Load settings from localStorage
    loadSettings() {
        const savedSettings = localStorage.getItem('blueprintBuddy_settings');
        if (savedSettings) {
            try {
                const parsedSettings = JSON.parse(savedSettings);
                this.state.settings = { ...this.state.settings, ...parsedSettings };
            } catch (error) {
                console.error('Failed to parse saved settings:', error);
            }
        }
        
        const savedMaxWeight = localStorage.getItem('blueprintBuddy_maxWeight');
        if (savedMaxWeight) {
            this.state.maxWeight = parseInt(savedMaxWeight);
        }
        
        // Update UI with loaded settings
        this.updateSettingsUI();
    }
    
    // Update the settings UI with current state values
    updateSettingsUI() {
        const { settings, maxWeight } = this.state;
        const elements = this.elements;
        
        elements.maxInventoryWeightSetting.value = maxWeight;
        elements.refreshIntervalSetting.value = settings.refreshInterval;
        
        if (elements.notifyMissingItemsSetting) {
            elements.notifyMissingItemsSetting.checked = settings.notifyMissingItems;
        }
        
        if (elements.showItemDetailsSetting) {
            elements.showItemDetailsSetting.checked = settings.showItemDetails;
        }
        
        if (elements.autoCloseDelaySetting) {
            elements.autoCloseDelaySetting.value = settings.autoCloseDelay;
        }
        
        // Update display elements
        elements.maxWeightDisplay.textContent = maxWeight;
        elements.inventoryCapacityDisplay.textContent = maxWeight;
    }
    
    // Save settings to localStorage
    saveSettings() {
        const elements = this.elements;
        
        this.state.maxWeight = parseInt(elements.maxInventoryWeightSetting.value) || 9000;
        
        const settingsToSave = {
            refreshInterval: parseInt(elements.refreshIntervalSetting.value) || 0,
            autoCloseDelay: parseInt(elements.autoCloseDelaySetting?.value || 0),
            notifyMissingItems: elements.notifyMissingItemsSetting?.checked || false,
            showItemDetails: elements.showItemDetailsSetting?.checked || true,
            favoriteRecipes: this.state.settings.favoriteRecipes || []
        };
        
        localStorage.setItem('blueprintBuddy_settings', JSON.stringify(settingsToSave));
        localStorage.setItem('blueprintBuddy_maxWeight', this.state.maxWeight.toString());
        
        this.state.settings = settingsToSave;
        
        // Update display elements
        elements.maxWeightDisplay.textContent = this.state.maxWeight;
        elements.inventoryCapacityDisplay.textContent = this.state.maxWeight;
        
        // Reconfigure auto-refresh if needed
        this.setupAutoRefresh();
        
        this.updateStatusMessage('Settings saved successfully', 'success');
    }
    
    // Populate recipe select dropdown with available recipes
    populateRecipeSelect() {
        const recipeSelect = this.elements.recipeSelect;
        recipeSelect.innerHTML = '';
        
        // Add favorite recipes first if any
        const favoriteRecipes = this.state.settings.favoriteRecipes || [];
        if (favoriteRecipes.length > 0) {
            const favGroup = document.createElement('optgroup');
            favGroup.label = "Favorites";
            
            favoriteRecipes.forEach(recipeName => {
                if (this.recipes[recipeName]) {
                    const option = document.createElement('option');
                    option.value = recipeName;
                    option.text = recipeName;
                    favGroup.appendChild(option);
                }
            });
            
            recipeSelect.appendChild(favGroup);
            
            // Add a separator
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.text = "───────────────";
            recipeSelect.appendChild(separator);
        }
        
        // Add all recipes
        Object.keys(this.recipes).sort().forEach(recipeName => {
            const option = document.createElement('option');
            option.value = recipeName;
            option.text = recipeName;
            recipeSelect.appendChild(option);
        });
        
        // Select the current recipe
        recipeSelect.value = this.state.selectedRecipe;
    }
    
    // Set up event handlers for UI elements
    setupEventHandlers() {
        const elements = this.elements;
        
        // Tab switching
        elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                elements.tabs.forEach(t => t.classList.remove('active'));
                elements.tabContents.forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                const tabId = tab.getAttribute('data-tab');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
        
        // Recipe selection
        elements.recipeSelect.addEventListener('change', () => {
            this.state.selectedRecipe = elements.recipeSelect.value;
            this.displayRecipeDetails();
        });
        
        // Close button
        elements.closeBtn.addEventListener('click', () => {
            this.updateStatusMessage('Closing application...');
            this.sendCommand({ type: 'close' });
        });
        
        // Refresh inventory button
        elements.refreshInventoryBtn.addEventListener('click', () => this.getInventoryData());
        
        // Inventory search
        elements.inventorySearch.addEventListener('input', () => {
            this.state.searchTerm = elements.inventorySearch.value;
            this.displayInventory();
        });
        
        // Save settings button
        elements.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        
        // Favorite recipe button if available
        if (elements.favoriteButton) {
            elements.favoriteButton.addEventListener('click', () => this.toggleFavoriteRecipe());
        }
        
        // ESC key handler for pinning
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.sendCommand({ type: 'pin' });
            }
        });
    }
    
    // Toggle current recipe as favorite
    toggleFavoriteRecipe() {
        const recipeName = this.state.selectedRecipe;
        const favorites = this.state.settings.favoriteRecipes || [];
        
        if (favorites.includes(recipeName)) {
            // Remove from favorites
            this.state.settings.favoriteRecipes = favorites.filter(name => name !== recipeName);
            this.elements.favoriteButton.classList.remove('active');
            this.elements.favoriteButton.innerHTML = '★ Add to Favorites';
        } else {
            // Add to favorites
            favorites.push(recipeName);
            this.state.settings.favoriteRecipes = favorites;
            this.elements.favoriteButton.classList.add('active');
            this.elements.favoriteButton.innerHTML = '☆ Remove from Favorites';
        }
        
        // Save updated favorites
        localStorage.setItem('blueprintBuddy_settings', JSON.stringify(this.state.settings));
        
        // Refresh recipe select
        this.populateRecipeSelect();
    }
    
    // Make the menu movable and resizable
    setupMenuInteraction() {
        const menuContainer = this.elements.menuContainer;
        const menuHeader = this.elements.menuHeader;
        const resizeHandle = this.elements.resizeHandle;
        
        // Variables for drag and resize operations
        let isDragging = false;
        let isResizing = false;
        let startX, startY, startLeft, startTop, startWidth, startHeight;
        
        // Mouse down on header to start dragging
        menuHeader.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = menuContainer.offsetLeft;
            startTop = menuContainer.offsetTop;
            e.preventDefault();
        });
        
        // Mouse down on resize handle to start resizing
        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startWidth = menuContainer.offsetWidth;
            startHeight = menuContainer.offsetHeight;
            startX = e.clientX;
            startY = e.clientY;
            e.stopPropagation();
        });
        
        // Mouse move to handle both dragging and resizing
        document.addEventListener('mousemove', (e) => {
            // Handle dragging
            if (isDragging) {
                let newLeft = startLeft + (e.clientX - startX);
                let newTop = startTop + (e.clientY - startY);
                
                // Keep window within viewport
                newLeft = Math.max(0, Math.min(window.innerWidth - menuContainer.offsetWidth, newLeft));
                newTop = Math.max(0, Math.min(window.innerHeight - menuContainer.offsetHeight, newTop));
                
                menuContainer.style.left = `${newLeft}px`;
                menuContainer.style.top = `${newTop}px`;
            }
            
            // Handle resizing
            if (isResizing) {
                let newWidth = startWidth + (e.clientX - startX);
                let newHeight = startHeight + (e.clientY - startY);
                
                // Constrain size within min/max dimensions
                newWidth = Math.max(200, Math.min(600, newWidth));
                newHeight = Math.max(150, Math.min(750, newHeight));
                
                menuContainer.style.width = `${newWidth}px`;
                menuContainer.style.height = `${newHeight}px`;
            }
        });
        
        // Mouse up to end both operations
        document.addEventListener('mouseup', () => {
            isDragging = false;
            isResizing = false;
        });
    }
    
    // Set up game client communication
    setupGameConnection() {
        // Listen for messages from the game client
        window.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.processGameData(data);
            } catch (error) {
                console.error('Failed to process game data:', error);
            }
        });
    }
    
    // Send commands to the game client
    sendCommand(command) {
        try {
            console.log('Sending command to game:', command);
            window.parent.postMessage(JSON.stringify(command), '*');
        } catch (error) {
            console.error('Failed to send command:', error);
            this.updateStatusMessage('Error sending command to game', 'error');
        }
    }
    
    // Process data received from the game client
    processGameData(data) {
        console.log('Received game data:', data);
        this.state.gameConnected = true;
        this.state.lastUpdate = new Date();
        
        // Handle inventory data
        if (data.inventory) {
            try {
                this.state.inventory = JSON.parse(data.inventory);
                this.displayInventory();
                this.displayRecipeDetails(); // Update recipe display with new inventory
                
                // Show last update time
                const timeStr = this.state.lastUpdate.toLocaleTimeString();
                this.updateStatusMessage(`Inventory updated at ${timeStr}`, 'success');
            } catch (e) {
                console.error('Failed to parse inventory data:', e);
                this.updateStatusMessage('Error parsing inventory data', 'error');
            }
        }
        
        // Handle weight data
        if (data.weight !== undefined) {
            this.state.weight = parseInt(data.weight);
            this.elements.currentWeightDisplay.textContent = this.state.weight;
        }
        
        // Handle max weight data from server if available
        if (data.max_weight !== undefined) {
            this.state.maxWeight = parseInt(data.max_weight);
            this.elements.maxWeightDisplay.textContent = this.state.maxWeight;
            this.elements.inventoryCapacityDisplay.textContent = this.state.maxWeight;
            this.elements.maxInventoryWeightSetting.value = this.state.maxWeight;
        }
        
        // Update UI elements
        this.updateInventoryWeight();
    }
    
    // Update status message with optional status type (success, error, warning)
    updateStatusMessage(message, status = 'info') {
        const statusElem = this.elements.statusMessage;
        if (!statusElem) return;
        
        statusElem.textContent = message;
        
        // Reset all status classes
        statusElem.style.backgroundColor = '';
        
        // Apply color based on status
        switch (status) {
            case 'success':
                statusElem.style.backgroundColor = 'rgba(46, 204, 113, 0.5)'; // Green
                break;
            case 'error':
                statusElem.style.backgroundColor = 'rgba(231, 76, 60, 0.5)'; // Red
                break;
            case 'warning':
                statusElem.style.backgroundColor = 'rgba(243, 156, 18, 0.5)'; // Orange
                break;
            default:
                statusElem.style.backgroundColor = 'rgba(22, 160, 133, 0.5)'; // Teal
        }
    }
    
    // Request inventory data from the game
    getInventoryData() {
        try {
            this.updateStatusMessage('Requesting inventory data...', 'warning');
            
            // Request specific data keys needed
            this.sendCommand({ 
                type: 'getNamedData', 
                keys: ['inventory', 'weight', 'max_weight'] 
            });
            
            // Set up auto-close if configured
            if (this.state.settings.autoCloseDelay > 0) {
                setTimeout(() => {
                    this.sendCommand({ type: 'pin' });
                }, this.state.settings.autoCloseDelay * 1000);
            }
        } catch (error) {
            console.error('Failed to get inventory data:', error);
            this.updateStatusMessage('Error requesting data: ' + error.message, 'error');
        }
    }
    
    // Set up auto-refresh timer
    setupAutoRefresh() {
        // Clear existing timer
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
        
        // Set new timer if interval > 0
        const interval = this.state.settings.refreshInterval;
        if (interval > 0) {
            this.refreshTimer = setInterval(() => this.getInventoryData(), interval * 1000);
            console.log(`Auto-refresh set up for every ${interval} seconds`);
        }
    }
    
    // Display recipe details
    displayRecipeDetails() {
        const recipe = this.recipes[this.state.selectedRecipe];
        if (!recipe) return;
        
        // Clear ingredients display
        this.elements.ingredientsDisplay.innerHTML = '';
        
        // Update recipe metadata
        this.elements.recipeLocation.textContent = `Location: ${recipe.location}`;
        this.elements.recipeCost.textContent = `Pays: ${recipe.pays.toLocaleString()}`;
        this.elements.recipeInstructions.textContent = recipe.instructions;
        
        // Update favorite button if available
        if (this.elements.favoriteButton) {
            const isFavorite = (this.state.settings.favoriteRecipes || []).includes(recipe.name);
            this.elements.favoriteButton.classList.toggle('active', isFavorite);
            this.elements.favoriteButton.innerHTML = isFavorite ? '☆ Remove from Favorites' : '★ Add to Favorites';
        }
        
        let totalWeight = 0;
        let canCraft = true;
        
        // Display each ingredient
        recipe.ingredients.forEach(([itemId, amount]) => {
            const itemData = this.items[itemId] || { 
                weight: 0, 
                displayName: itemId,
                description: "Unknown item" 
            };
            
            const userHas = this.state.inventory[itemId] || 0;
            
            // Calculate ingredient weight
            const ingredientWeight = (itemData.weight * amount) / 100; // Divided by 100 to make numbers more manageable
            totalWeight += ingredientWeight;
            
            // Create ingredient element
            const ingredientDiv = document.createElement('div');
            ingredientDiv.classList.add('ingredient');
            
            // Determine if user has enough of this ingredient
            if (userHas >= amount) {
                ingredientDiv.classList.add('have');
            } else if (userHas > 0) {
                ingredientDiv.classList.add('partial');
                canCraft = false;
            } else {
                ingredientDiv.classList.add('missing');
                canCraft = false;
            }
            
            // Show proper item name and details if enabled
            const displayName = this.state.settings.showItemDetails ? 
                itemData.displayName : itemId;
            
            ingredientDiv.innerHTML = `
                <span class="ingredient-name">${displayName}</span>
                <span class="ingredient-amount">${amount}</span>
                <span class="inventory-have">${userHas}</span>
            `;
            
            // Show item description as tooltip if available and enabled
            if (this.state.settings.showItemDetails && itemData.description) {
                ingredientDiv.title = itemData.description;
            }
            
            this.elements.ingredientsDisplay.appendChild(ingredientDiv);
        });
        
        // Display recipe weight
        this.elements.recipeWeight.textContent = totalWeight.toFixed(1);
        
        // Update progress bar
        const weightPercentage = Math.min(100, (totalWeight / this.state.maxWeight) * 100);
        this.elements.weightProgress.style.width = `${weightPercentage}%`;
        
        // Change color based on weight
        if (weightPercentage > 90) {
            this.elements.weightProgress.style.backgroundColor = 'rgba(231, 76, 60, 0.8)'; // Red
        } else if (weightPercentage > 75) {
            this.elements.weightProgress.style.backgroundColor = 'rgba(243, 156, 18, 0.8)'; // Orange
        } else {
            this.elements.weightProgress.style.backgroundColor = 'rgba(22, 160, 133, 0.8)'; // Teal
        }
        
        // Notify about missing items if enabled
        if (!canCraft && this.state.settings.notifyMissingItems) {
            this.updateStatusMessage('Missing items needed for this recipe', 'warning');
        }
    }
    
    // Display inventory items with search filtering
    displayInventory() {
        const searchTerm = this.state.searchTerm.toLowerCase();
        const playerInventoryDisplay = this.elements.playerInventoryDisplay;
        
        // Clear display
        playerInventoryDisplay.innerHTML = '';
        
        // Get sorted inventory items that match search
        const items = Object.entries(this.state.inventory)
            .filter(([itemId, quantity]) => 
                !searchTerm || itemId.toLowerCase().includes(searchTerm))
            .sort((a, b) => a[0].localeCompare(b[0]));
        
        // Show message if no items
        if (items.length === 0) {
            const noItemsDiv = document.createElement('div');
            noItemsDiv.className = 'no-results';
            noItemsDiv.textContent = searchTerm 
                ? 'No items match your search' 
                : 'No items in inventory';
            playerInventoryDisplay.appendChild(noItemsDiv);
            return;
        }
        
        // Display each item
        items.forEach(([itemId, quantity]) => {
            const itemData = this.items[itemId] || { weight: 0, displayName: itemId };
            const itemWeight = (itemData.weight * quantity) / 100;
            
            // Create item display with proper name if available
            const displayName = this.state.settings.showItemDetails && itemData.displayName ? 
                itemData.displayName : itemId;
            
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            itemDiv.innerHTML = `
                <span>${displayName}</span>
                <span>${quantity} (${itemWeight.toFixed(1)} kg)</span>
            `;
            
            // Add tooltip if enabled
            if (this.state.settings.showItemDetails && itemData.description) {
                itemDiv.title = itemData.description;
            }
            
            playerInventoryDisplay.appendChild(itemDiv);
        });
    }
    
    // Update inventory weight calculation and display
    updateInventoryWeight() {
        let totalWeight = 0;
        
        // Calculate total inventory weight
        for (const [itemId, quantity] of Object.entries(this.state.inventory)) {
            const itemData = this.items[itemId] || { weight: 0 };
            totalWeight += (itemData.weight * quantity) / 100;
        }
        
        // Update state and display
        this.state.weight = Math.round(totalWeight);
        this.elements.currentWeightDisplay.textContent = this.state.weight;
        
        // Update progress bar
        const weightPercentage = Math.min(100, (this.state.weight / this.state.maxWeight) * 100);
        this.elements.inventoryProgressDisplay.style.width = `${weightPercentage}%`;
        
        // Change color based on how full inventory is
        if (weightPercentage > 90) {
            this.elements.inventoryProgressDisplay.style.backgroundColor = 'rgba(231, 76, 60, 0.8)'; // Red
        } else if (weightPercentage > 75) {
            this.elements.inventoryProgressDisplay.style.backgroundColor = 'rgba(243, 156, 18, 0.8)'; // Orange
        } else {
            this.elements.inventoryProgressDisplay.style.backgroundColor = 'rgba(22, 160, 133, 0.8)'; // Teal
        }
    }
}

// Initialize on page load
window.onload = () => {
    // Create and initialize the application
    window.blueprintBuddy = new BlueprintBuddy();
    window.blueprintBuddy.init();
};