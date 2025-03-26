// Storage API Helper - Enhances trailer and storage integration
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      if (!window.blueprintBuddy) {
        console.error("BlueprintBuddy not initialized yet");
        return;
      }
      
      console.log("Initializing Storage API Helper...");
      
      // This script assumes the BlueprintBuddy and TTApiClient are already initialized
      
      /**
       * Enhanced Storage Manager
       * Handles fetching and managing storage data from various sources
       */
      class StorageManager {
        constructor(apiClient) {
          this.apiClient = apiClient;
          this.trailerConfig = null;
          this.userDetails = {
            vrpId: this.apiClient.userId,
            trailer: null,
            trailerCapacity: 300 // Default capacity in kg
          };
          
          // Storage containers
          this.trailerStorage = {};
          this.trainyardStorage = {};
          this.playerInventory = {};
          
          // Cache timeout (5 minutes)
          this.cacheTimeout = 5 * 60 * 1000;
          this.lastTrailerConfigFetch = 0;
        }
        
        /**
         * Initialize the storage manager by fetching basic user data
         */
        async initialize() {
          // Get user info to determine if they have a trailer
          try {
            // Get trailer configuration data
            await this.fetchTrailerConfigs();
            
            // Get user data to determine trailer
            await this.fetchUserTrailerInfo();
            
            // Get current trailer capacity
            await this.getTrailerCapacity();
            
            console.log("Storage Manager initialized with user details:", this.userDetails);
            return true;
          } catch (error) {
            console.error("Failed to initialize Storage Manager:", error);
            return false;
          }
        }
        
        /**
         * Fetch trailer configurations from cached API
         */
        async fetchTrailerConfigs() {
          // Check if we already have trailer config and it's recent
          const now = Date.now();
          if (this.trailerConfig && (now - this.lastTrailerConfigFetch < this.cacheTimeout)) {
            return this.trailerConfig;
          }
          
          try {
            // Use the client's cached API URL for trailer configs
            const response = await fetch(`https://ttycoon.eu/api/v1/serverdata/trailerconfig`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              throw new Error(`Failed to get trailer configs: ${response.status}`);
            }
            
            const data = await response.json();
            this.trailerConfig = data;
            this.lastTrailerConfigFetch = now;
            
            console.log(`Loaded ${data.length} trailer configurations`);
            return data;
          } catch (error) {
            console.error('Failed to get trailer configs:', error);
            return [];
          }
        }
        
        /**
         * Fetch user trailer information from API
         */
        async fetchUserTrailerInfo() {
          try {
            // Try to get data from user data endpoint
            const userData = await this.apiClient.getUserData();
            
            if (userData) {
              // Try to get trailer info from various possible structures
              if (userData.vehicles && userData.vehicles.trailer) {
                this.userDetails.trailer = userData.vehicles.trailer;
                console.log("Found trailer from userData.vehicles:", this.userDetails.trailer);
              } else if (userData.trailer) {
                this.userDetails.trailer = userData.trailer;
                console.log("Found trailer directly in userData:", this.userDetails.trailer);
              }
            }
            
            // If trailer not found in user data, try trunks
            if (!this.userDetails.trailer) {
              const trunks = await this.apiClient.getUserTrunks();
              
              if (trunks && trunks.length > 0) {
                for (const trunk of trunks) {
                  if (trunk.type === "trailer" && trunk.vehicle) {
                    this.userDetails.trailer = trunk.vehicle;
                    console.log("Found trailer from trunks:", this.userDetails.trailer);
                    break;
                  }
                }
              }
            }
            
            // Update UI to show trailer info if found
            this.updateStorageUI();
            
            return this.userDetails.trailer;
          } catch (error) {
            console.error('Failed to get user trailer info:', error);
            return null;
          }
        }
        
        /**
         * Get trailer capacity based on trailer type
         */
        async getTrailerCapacity() {
          // If no trailer, return default
          if (!this.userDetails.trailer) {
            return this.userDetails.trailerCapacity;
          }
          
          // Make sure we have trailer configuration data
          if (!this.trailerConfig) {
            await this.fetchTrailerConfigs();
          }
          
          // Find trailer info in config
          if (this.trailerConfig && Array.isArray(this.trailerConfig)) {
            const trailerInfo = this.trailerConfig.find(t => t.id === this.userDetails.trailer);
            
            if (trailerInfo && trailerInfo.capacity) {
              this.userDetails.trailerCapacity = trailerInfo.capacity;
              console.log(`Found trailer capacity: ${trailerInfo.capacity}kg for ${this.userDetails.trailer}`);
              
              // Update BlueprintBuddy settings
              if (window.blueprintBuddy.state.settings) {
                window.blueprintBuddy.state.settings.trailerCapacity = trailerInfo.capacity;
                
                // Also update the UI element if it exists
                const trailerCapacityInput = document.getElementById('trailer-capacity');
                if (trailerCapacityInput) {
                  trailerCapacityInput.value = trailerInfo.capacity;
                }
                
                // Save settings
                if (typeof window.blueprintBuddy.saveSettings === 'function') {
                  window.blueprintBuddy.saveSettings();
                }
              }
              
              return trailerInfo.capacity;
            }
          }
          
          return this.userDetails.trailerCapacity;
        }
        
        /**
         * Get the trailer storage contents
         */
        async getTrailerContents() {
          if (!this.userDetails.trailer) {
            return {};
          }
          
          try {
            // Format the trailer chest name according to the pattern
            const trailerChestName = `u${this.userDetails.vrpId}veh_trailer_${this.userDetails.trailer}`;
            console.log(`Looking up trailer contents for: ${trailerChestName}`);
            
            // Use the API client to get chest contents
            const storage = await this.apiClient.getChestContents(trailerChestName);
            
            if (storage && Object.keys(storage).length > 0) {
              this.trailerStorage = storage;
              console.log("Loaded trailer contents:", this.trailerStorage);
              return storage;
            } else {
              console.log("Trailer storage is empty or not accessible");
              return {};
            }
          } catch (error) {
            console.error('Failed to get trailer contents:', error);
            return {};
          }
        }
        
        /**
         * Get TrainYard storage contents
         */
        async getTrainyardContents() {
          try {
            // Common TrainYard storage name format
            const trainyardStorageName = `self_storage:${this.userDetails.vrpId}:ty:chest`;
            console.log(`Looking up trainyard contents for: ${trainyardStorageName}`);
            
            // Use the API client to get chest contents
            const storage = await this.apiClient.getChestContents(trainyardStorageName);
            
            if (storage && Object.keys(storage).length > 0) {
              this.trainyardStorage = storage;
              console.log("Loaded trainyard contents:", this.trainyardStorage);
              return storage;
            } else {
              console.log("TrainYard storage is empty or not accessible");
              return {};
            }
          } catch (error) {
            console.error('Failed to get TrainYard contents:', error);
            return {};
          }
        }
        
        /**
         * Get player inventory
         */
        async getPlayerInventory() {
          try {
            const inventory = await this.apiClient.getUserInventory();
            
            if (inventory && Object.keys(inventory).length > 0) {
              this.playerInventory = inventory;
              console.log("Loaded player inventory:", this.playerInventory);
              return inventory;
            } else {
              console.log("Player inventory is empty or not accessible");
              return {};
            }
          } catch (error) {
            console.error('Failed to get player inventory:', error);
            return {};
          }
        }
        
        /**
         * Get all storage combined (player, trainyard, trailer)
         */
        async getAllStorage() {
          try {
            // Get all storage sources
            await Promise.all([
              this.getPlayerInventory(),
              this.getTrailerContents(),
              this.getTrainyardContents()
            ]);
            
            // Combine all inventories
            const combinedInventory = {};
            
            // Helper function to add items to combined inventory
            const addItems = (source) => {
              for (const [itemId, itemData] of Object.entries(source)) {
                // Extract base item ID (sometimes there's a modifier after a |)
                const baseItemId = itemId.split('|')[0];
                const amount = typeof itemData === 'number' ? itemData : (itemData.amount || 0);
                
                // Add to inventory or update quantity
                if (combinedInventory[baseItemId]) {
                  combinedInventory[baseItemId] += amount;
                } else {
                  combinedInventory[baseItemId] = amount;
                }
              }
            };
            
            // Add all sources
            addItems(this.playerInventory);
            addItems(this.trailerStorage);
            addItems(this.trainyardStorage);
            
            // Update BlueprintBuddy inventory
            if (window.blueprintBuddy.state) {
              window.blueprintBuddy.state.inventory = combinedInventory;
            }
            
            console.log("Combined inventory created with items:", Object.keys(combinedInventory).length);
            
            return combinedInventory;
          } catch (error) {
            console.error('Failed to get combined storage:', error);
            return {};
          }
        }
        
        /**
         * Update UI with storage information
         */
        updateStorageUI() {
          // Update trailer type display
          const trailerTypeElement = document.getElementById('trailer-type');
          if (trailerTypeElement) {
            trailerTypeElement.textContent = this.userDetails.trailer || 'None';
          }
          
          // Update trailer capacity display
          const trailerCapacityElement = document.getElementById('trailer-capacity-display');
          if (trailerCapacityElement) {
            trailerCapacityElement.textContent = `${this.userDetails.trailerCapacity} kg`;
          }
          
          // Show storage summary if available
          const storageSummary = document.getElementById('storage-summary');
          if (storageSummary) {
            storageSummary.style.display = 'block';
          }
          
          // Update available storages display
          const availableStoragesElement = document.getElementById('available-storages');
          if (availableStoragesElement) {
            const availableStorages = ['Player'];
            
            if (Object.keys(this.trainyardStorage).length > 0) {
              availableStorages.push('Trainyard');
            }
            
            if (this.userDetails.trailer && Object.keys(this.trailerStorage).length > 0) {
              availableStorages.push('Trailer');
            }
            
            availableStoragesElement.textContent = availableStorages.join(', ');
          }
        }
      }
      
      // Initialize the enhancements once BlueprintBuddy is ready
      const enhanceStorageAPI = function() {
        // Check if API client is available
        if (!window.blueprintBuddy.apiClient) {
          console.log("API client not initialized yet, waiting...");
          setTimeout(enhanceStorageAPI, 1000);
          return;
        }
        
        console.log("Enhancing storage API integration...");
        
        // Create storage manager
        const storageManager = new StorageManager(window.blueprintBuddy.apiClient);
        
        // Store reference to storage manager for later use
        window.blueprintBuddy.storageManager = storageManager;
        
        // Initialize storage manager
        storageManager.initialize().then(success => {
          if (success) {
            console.log("Storage manager initialized successfully");
            
            // Get all storage data
            storageManager.getAllStorage().then(combinedInventory => {
              // Refresh the inventory display
              if (typeof window.blueprintBuddy.displayInventory === 'function') {
                window.blueprintBuddy.displayInventory();
              }
              
              // Refresh recipe display if a recipe is selected
              if (window.blueprintBuddy.state.selectedRecipe && 
                  typeof window.blueprintBuddy.displayRecipeDetails === 'function') {
                window.blueprintBuddy.displayRecipeDetails();
              }
            });
            
            // Override the refresh inventory function
            const originalRefreshInventory = window.blueprintBuddy.getInventoryData;
            window.blueprintBuddy.getInventoryData = async function() {
              console.log("Enhanced inventory refresh triggered");
              
              // Use the storage manager to get all inventory
              await storageManager.getAllStorage();
              
              // Update display
              if (typeof window.blueprintBuddy.displayInventory === 'function') {
                window.blueprintBuddy.displayInventory();
              }
              
              // Refresh recipe display if needed
              if (window.blueprintBuddy.state.selectedRecipe && 
                  typeof window.blueprintBuddy.displayRecipeDetails === 'function') {
                window.blueprintBuddy.displayRecipeDetails();
              }
            };
          }
        });
      };
      
      // Start the enhancement process
      enhanceStorageAPI();
      
    }, 2500); // Delay to ensure other scripts are loaded
  });