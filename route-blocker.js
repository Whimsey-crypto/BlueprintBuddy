// Route Blocker - Direct method replacement approach
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      if (!window.blueprintBuddy) {
        console.error("BlueprintBuddy not initialized yet");
        return;
      }
      
      console.log("Initializing Route Blocker...");
      
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
      };
      
      // Hide the original ingredients display
      function hideOriginalIngredientsDisplay() {
        const ingredientsDisplay = document.getElementById('ingredientsDisplay');
        if (ingredientsDisplay) {
          ingredientsDisplay.style.display = 'none';
        }
      }
      
      // Direct mapping of item IDs to recipe names
      const DIRECT_RECIPE_MAPPING = {
        "refined_sand": "Sand",
        "refined_flint": "Flint", 
        "tcargologs": "Logs",
        "tcargodust": "Sawdust",
        "mining_credit": "Mining Credit"
      };
      
      // Find the best matching recipe for an item
      function findBestRecipeForItem(itemId) {
        console.log(`Finding recipe for ${itemId}`);
        
        // Step 1: Check if we have a direct mapping
        if (DIRECT_RECIPE_MAPPING[itemId]) {
          const mappedName = DIRECT_RECIPE_MAPPING[itemId];
          for (const recipeName of Object.keys(window.blueprintBuddy.state.recipesData)) {
            if (recipeName.includes(mappedName)) {
              console.log(`Found direct mapping recipe: ${recipeName}`);
              return recipeName;
            }
          }
        }
        
        // Step 2: Look for recipes with the human-readable name
        const humanName = itemNameMap[itemId] || itemId;
        for (const recipeName of Object.keys(window.blueprintBuddy.state.recipesData)) {
          if (recipeName.includes(humanName)) {
            console.log(`Found by human name: ${recipeName}`);
            return recipeName;
          }
        }
        
        // Step 3: Check for recipes containing the item ID
        for (const recipeName of Object.keys(window.blueprintBuddy.state.recipesData)) {
          if (recipeName.toLowerCase().includes(itemId.toLowerCase())) {
            console.log(`Found by item ID: ${recipeName}`);
            return recipeName;
          }
        }
        
        console.log(`No recipe found for ${itemId}`);
        return null;
      }
      
      // Navigate to a recipe in the dropdown
      function navigateToRecipe(recipeName) {
        console.log(`Navigating to: ${recipeName}`);
        
        const recipeSelect = document.getElementById('recipeSelect');
        if (!recipeSelect) return;
        
        // First check if recipe exists exactly
        let found = false;
        for (let i = 0; i < recipeSelect.options.length; i++) {
          if (recipeSelect.options[i].value === recipeName) {
            found = true;
            break;
          }
        }
        
        // If not, try finding a similar recipe
        if (!found) {
          for (let i = 0; i < recipeSelect.options.length; i++) {
            const option = recipeSelect.options[i].value;
            if (option.includes(recipeName) || recipeName.includes(option)) {
              recipeName = option;
              console.log(`Using similar recipe: ${recipeName}`);
              found = true;
              break;
            }
          }
        }
        
        if (!found) {
          console.log(`Could not find recipe: ${recipeName}`);
          return;
        }
        
        // Select the recipe and trigger the change
        recipeSelect.value = recipeName;
        const event = new Event('change');
        recipeSelect.dispatchEvent(event);
        
        // Ensure BlueprintBuddy updates
        window.blueprintBuddy.state.selectedRecipe = recipeName;
        window.blueprintBuddy.displayRecipeDetails();
      }
      
      // THE KEY FIX: Completely override the showItemRoute method to find recipes instead
      window.blueprintBuddy.showItemRoute = function(itemId, amountNeeded) {
        console.log("INTERCEPTED showItemRoute for " + itemId);
        
        // Instead of showing a route, find a recipe
        const recipe = findBestRecipeForItem(itemId);
        if (recipe) {
          navigateToRecipe(recipe);
        } else {
          console.log(`No recipe found for ${itemId}`);
          // Don't do anything if no recipe is found
        }
      };
      
      // Hide ingredients display right away
      hideOriginalIngredientsDisplay();
      
      // Also override the original displayRecipeDetails to hide ingredients
      const originalDisplayRecipeDetails = window.blueprintBuddy.displayRecipeDetails;
      window.blueprintBuddy.displayRecipeDetails = function() {
        // Call original function
        originalDisplayRecipeDetails.apply(this, arguments);
        
        // Hide ingredients display
        hideOriginalIngredientsDisplay();
      };
      
      // Add visual styling to make requirements look clickable
      const style = document.createElement('style');
      style.textContent = `
        .requirement-item {
          transition: background-color 0.2s;
          cursor: pointer !important;
          position: relative;
          padding-left: 25px !important;
        }
        .requirement-item:hover {
          background-color: rgba(41, 128, 185, 0.3) !important;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .requirement-item::before {
          content: "🔍";
          position: absolute;
          left: 5px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.9em;
        }
      `;
      document.head.appendChild(style);
      
      console.log("Route Blocker initialized - Now finding recipes instead of showing waypoints");
    }, 1500);
  });