// Item Name Mapper and UI Streamliner for BlueprintBuddy

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      if (!window.blueprintBuddy) {
        console.error("BlueprintBuddy not initialized yet");
        return;
      }
      
      // Item name mapping
      const itemNameMap = {
        "tcargologs": "Logs",
        "tcargodust": "Sawdust",
        "refined_planks": "Planks",
        "refined_sand": "Sand",
        "refined_flint": "Flint",
        "scrap_plastic": "Scrap Plastic",
        "crafted_cardboard": "Cardboard",
        "scrap_emerald": "Raw Emeralds",
        "fridge_store_delivery": "Food Shipment",
        "crafted_jewelry": "Jewelry",
        "refined_gold": "Gold",
        "petrochem_oil": "Crude Oil",
        "mining_credit": "Mining Credit",
        "scrap_lead": "Lead",
        "scrap_mercury": "Mercury",
        "scrap_aluminum": "Aluminum",
        "scrap_copper": "Copper",
        "scrap_tin": "Tin",
        "military_titanium_ore": "Titanium Ore",
        "scrap_ore": "Raw Ore Mix",
        "military_titanium": "Titanium", 
        "petrochem_sulfur": "Sulfur",
        "petrochem_kerosene": "Kerosene",
        "military_explosives": "Explosives",
        // Add more mappings as needed
      };
      
      // Recipe lookup dictionary
      const recipesByProduct = {};
      
      // Build recipe product index
      function buildRecipeProductIndex() {
        const recipes = window.blueprintBuddy.state.recipesData;
        Object.keys(recipesByProduct).forEach(key => delete recipesByProduct[key]);
        
        for (const recipeName in recipes) {
          const recipe = recipes[recipeName];
          if (!recipe.products || !Array.isArray(recipe.products)) continue;
          
          recipe.products.forEach(product => {
            const productId = typeof product.item === 'string' ? product.item : 
                            (product.item && product.item.name ? product.item.name : null);
            
            if (productId) {
              if (!recipesByProduct[productId]) {
                recipesByProduct[productId] = [];
              }
              recipesByProduct[productId].push(recipeName);
            }
          });
        }
      }
      
      // Get human-readable name
      function getHumanReadableName(itemId) {
        return itemNameMap[itemId] || itemId;
      }
      
      // Find recipe for item
      function findRecipeForItem(itemId) {
        if (Object.keys(recipesByProduct).length === 0) {
          buildRecipeProductIndex();
        }
        const recipes = recipesByProduct[itemId] || [];
        return recipes.length > 0 ? recipes[0] : null;
      }
      
      // Navigate to recipe
      function navigateToRecipe(recipeName) {
        if (!recipeName) return;
        const recipeSelect = document.getElementById('recipeSelect');
        if (recipeSelect) {
          recipeSelect.value = recipeName;
          const event = new Event('change');
          recipeSelect.dispatchEvent(event);
          window.blueprintBuddy.state.selectedRecipe = recipeName;
          window.blueprintBuddy.displayRecipeDetails();
        }
      }
      
      // OPTION: Hide duplicate recipe display
      // Uncomment the next line to hide the initial ingredients display
      // document.getElementById('ingredientsDisplay').style.display = 'none';
      
      // Override displayRecipeDetails to use readable names
      const originalDisplayRecipeDetails = window.blueprintBuddy.displayRecipeDetails;
      window.blueprintBuddy.displayRecipeDetails = function() {
        if (!this.state.selectedRecipe) {
          this.clearRecipeDisplay();
          return;
        }
        
        const recipe = this.state.recipesData[this.state.selectedRecipe];
        if (!recipe) {
          this.clearRecipeDisplay();
          return;
        }
        
        // Basic recipe info
        this.elements.recipeLocation.textContent = `Location: ${recipe.location || 'Unknown'}`;
        
        const revenue = recipe.pays || 0;
        const cost = recipe.cost || 0;
        const profit = revenue - cost;
        const profitStyle = profit >= 0 ? 'color: #2ecc71;' : 'color: #e74c3c;';
        
        this.elements.recipeCost.innerHTML = `
          Cost: ${cost.toLocaleString()}<br>
          Revenue: ${revenue.toLocaleString()}<br>
          <span style="${profitStyle}">Profit: ${profit.toLocaleString()}</span>
        `;
        
        this.elements.recipeInstructions.textContent = recipe.instructions || 'No instructions available.';
        
        // Display ingredients with readable names
        this.elements.ingredientsDisplay.innerHTML = '';
        
        if (!recipe.ingredients || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
          const noIngredientsDiv = document.createElement('div');
          noIngredientsDiv.className = 'ingredient';
          noIngredientsDiv.innerHTML = `<span class="ingredient-name">No ingredients required</span>`;
          this.elements.ingredientsDisplay.appendChild(noIngredientsDiv);
        } else {
          recipe.ingredients.forEach(ingredient => {
            let itemId, amount;
            
            if (Array.isArray(ingredient)) {
              [itemId, amount] = ingredient;
            } else if (typeof ingredient === 'object') {
              itemId = typeof ingredient.item === 'string' ? ingredient.item : 
                     (ingredient.item && ingredient.item.name ? ingredient.item.name : "unknown");
              amount = ingredient.amount || 0;
            } else {
              return;
            }
            
            const userHas = this.state.inventory[itemId] || 0;
            const humanReadableName = getHumanReadableName(itemId);
            
            const ingredientDiv = document.createElement('div');
            ingredientDiv.className = 'ingredient';
            ingredientDiv.className += userHas >= amount ? ' have' : (userHas > 0 ? ' partial' : ' missing');
            
            ingredientDiv.innerHTML = `
              <span class="ingredient-name">${humanReadableName}</span>
              <span class="ingredient-amount">${amount}</span>
              <span class="inventory-have">${userHas}</span>
            `;
            
            ingredientDiv.dataset.itemId = itemId;
            this.elements.ingredientsDisplay.appendChild(ingredientDiv);
          });
        }
        
        this.elements.runsCalculation.style.display = 'none';
      };
      
      // Main modification: Override calculateRunsNeeded to add clickable items
      const originalCalculateRunsNeeded = window.blueprintBuddy.calculateRunsNeeded;
      window.blueprintBuddy.calculateRunsNeeded = function() {
        if (!this.state.selectedRecipe) {
          this.updateStatusMessage('Please select a recipe first', 'warning');
          return;
        }
        
        const recipe = this.state.recipesData[this.state.selectedRecipe];
        if (!recipe) return;
        
        const quantity = parseInt(this.elements.recipeQuantity.value) || 1;
        const requirementsDiv = this.elements.totalRequirements;
        requirementsDiv.innerHTML = '';
        
        let canCraftAll = true;
        let totalRunsNeeded = 0;
        let recipeWeight = 0;
        let missingItems = [];
        
        recipe.ingredients.forEach(ingredient => {
          let itemId, amount;
          
          if (Array.isArray(ingredient)) {
            [itemId, amount] = ingredient;
          } else if (typeof ingredient === 'object') {
            itemId = typeof ingredient.item === 'string' ? ingredient.item : 
                   (ingredient.item && ingredient.item.name ? ingredient.item.name : "unknown");
            amount = ingredient.amount || 0;
          } else {
            return;
          }
          
          // Calculate weight
          let itemWeight = 0;
          if (this.state.itemsData) {
            const itemData = this.state.itemsData.find(item => item.id === itemId);
            if (itemData) itemWeight = itemData.weight || 0;
          }
          recipeWeight += itemWeight * amount;
          
          // Calculate needed amounts
          const totalNeeded = amount * quantity;
          const userHas = this.state.settings.includeInventory ? (this.state.inventory[itemId] || 0) : 0;
          const missing = Math.max(0, totalNeeded - userHas);
          
          if (missing > 0) {
            canCraftAll = false;
            missingItems.push({ itemId, missing, displayName: getHumanReadableName(itemId) });
          }
          
          // Get human-readable name and check if item is craftable
          const humanReadableName = getHumanReadableName(itemId);
          const recipeForItem = findRecipeForItem(itemId);
          const isClickable = recipeForItem !== null;
          
          // Create requirement element with readable name
          const reqDiv = document.createElement('div');
          reqDiv.className = 'requirement-item';
          reqDiv.dataset.itemId = itemId;
          
          if (isClickable) {
            reqDiv.style.cursor = 'pointer';
            reqDiv.title = `Click to view recipe for ${humanReadableName}`;
            reqDiv.classList.add('clickable-item');
          }
          
          reqDiv.innerHTML = `
            <span>${humanReadableName}</span>
            <span>${totalNeeded} (Have: ${userHas}, Need: ${missing})</span>
          `;
          
          // Add click handler to navigate to recipe
          if (isClickable) {
            reqDiv.addEventListener('click', function() {
              navigateToRecipe(recipeForItem);
            });
          } else if (missing > 0) {
            reqDiv.addEventListener('click', () => {
              this.showItemRoute(itemId, missing);
            });
          }
          
          requirementsDiv.appendChild(reqDiv);
        });
        
        // Calculate trips needed
        const trailerCapacity = this.state.settings.trailerCapacity;
        const recipesPerTrip = recipeWeight > 0 ? Math.floor(trailerCapacity / recipeWeight) : 1;
        totalRunsNeeded = Math.ceil(quantity / recipesPerTrip);
        
        this.elements.totalRuns.textContent = canCraftAll ? 
          "0 (You have all materials)" : `${totalRunsNeeded}`;
        
        this.elements.showRouteBtn.style.display = canCraftAll ? 'none' : 'block';
        this.elements.showRouteBtn.onclick = () => {
          if (missingItems.length > 0) {
            this.showItemRoute(missingItems[0].itemId, missingItems[0].missing);
          }
        };
        
        this.elements.runsCalculation.style.display = 'block';
      };
      
      // Build product index
      buildRecipeProductIndex();
      
      // Add styles for clickable items
      const style = document.createElement('style');
      style.textContent = `
        .clickable-item {
          transition: background-color 0.2s;
        }
        .clickable-item:hover {
          background-color: rgba(41, 128, 185, 0.3) !important;
        }
        .clickable-item::after {
          content: " 🔍";
          font-size: 0.8em;
          opacity: 0.7;
        }
      `;
      document.head.appendChild(style);
    }, 1000);
  });