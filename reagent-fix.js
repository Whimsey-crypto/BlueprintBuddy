// Fix for reagent processing in BlueprintBuddy
// Specifically targets the issue with "0 ingredients required" showing for recipes with reagents

document.addEventListener('DOMContentLoaded', function() {
    // Wait for BlueprintBuddy to initialize
    setTimeout(function() {
      if (!window.blueprintBuddy) {
        console.error("BlueprintBuddy not initialized yet");
        return;
      }
      
      console.log("Applying reagent processing fix...");
      
      // 1. Fix the recipe file input handler to properly process reagents
      const recipeFileInput = document.getElementById('recipe-file');
      if (recipeFileInput) {
        // Remove existing event listeners by cloning
        const newInput = recipeFileInput.cloneNode(true);
        recipeFileInput.parentNode.replaceChild(newInput, recipeFileInput);
        
        // Add new event listener
        newInput.addEventListener('change', async function(event) {
          const file = event.target.files[0];
          if (!file) return;
          
          try {
            // Read file content
            const text = await file.text();
            const jsonData = JSON.parse(text);
            
            // Transform JSON into expected format
            const recipes = {};
            
            // Debug counters
            let totalRecipes = 0;
            let filteredRecipes = 0;
            let recipesWithReagents = 0;
            
            jsonData.forEach(function(item) {
              totalRecipes++;
              
              // Skip invalid entries
              if (!item || !item.name) return;
              
              // Skip recipes with "x[number]" in the name (bulk recipes)
              if (item.name.match(/\s+x\d+$/)) {
                filteredRecipes++;
                return;
              }
              
              // Process reagents (ingredients)
              const ingredients = [];
              
              // Debug - log reagents
              console.log(`Processing recipe: ${item.name}`);
              console.log(`Reagents:`, item.reagents);
              
              if (item.reagents && Array.isArray(item.reagents)) {
                recipesWithReagents++;
                
                item.reagents.forEach(reagent => {
                  // Debug
                  console.log(`Processing reagent:`, reagent);
                  
                  let itemName, amount;
                  
                  // Handle case where reagent.item is a string directly
                  if (typeof reagent.item === 'string') {
                    itemName = reagent.item;
                    amount = reagent.amount || 0;
                    console.log(`String item: ${itemName}, amount: ${amount}`);
                  } 
                  // Handle case where reagent.item is an object with a name property
                  else if (reagent.item && reagent.item.name) {
                    itemName = reagent.item.name;
                    amount = reagent.amount || 0;
                    console.log(`Object item: ${itemName}, amount: ${amount}`);
                  }
                  // Skip if we can't determine the item name
                  else {
                    console.log(`Invalid reagent format:`, reagent);
                    return;
                  }
                  
                  ingredients.push([itemName, amount]);
                });
              }
              
              // Debug
              console.log(`Processed ingredients:`, ingredients);
              
              // Create a properly formatted recipe object
              recipes[item.name] = {
                category: item.transformer_id?.includes('trucking') ? 'trucking' : 
                          item.transformer_id?.includes('liberty') ? 'liberty' : 'miscellaneous',
                location: item.transformer_id ? item.transformer_id.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Unknown',
                pays: item.out_money || 0,
                cost: item.in_money || 0,
                ingredients: ingredients,
                output: item.products && item.products.length > 0 ? 
                  (typeof item.products[0].item === 'string' ? item.products[0].item : 
                   item.products[0].item?.name || '') : '',
                outputAmount: item.products && item.products.length > 0 ? item.products[0].amount || 0 : 0,
                craftTime: 30,
                instructions: item.description || 'No instructions available'
              };
            });
            
            console.log(`Total recipes: ${totalRecipes}`);
            console.log(`Filtered bulk recipes: ${filteredRecipes}`);
            console.log(`Recipes with reagents: ${recipesWithReagents}`);
            console.log(`Final processed recipes: ${Object.keys(recipes).length}`);
            
            // Update BlueprintBuddy with the processed recipes
            window.blueprintBuddy.state.recipesData = recipes;
            window.RECIPES_DATA = recipes;
            
            // Sample check of processed recipes
            const sampleRecipe = "Refine Aluminum x1";
            if (recipes[sampleRecipe]) {
              console.log(`Sample recipe "${sampleRecipe}":`, recipes[sampleRecipe]);
              console.log(`Ingredients:`, recipes[sampleRecipe].ingredients);
            }
            
            // Update UI
            window.blueprintBuddy.extractRecipeCategories();
            window.blueprintBuddy.populateCategorySelect();
            window.blueprintBuddy.populateRecipeSelect();
            
            // Show success message
            window.blueprintBuddy.updateStatusMessage(
              `Successfully loaded ${Object.keys(recipes).length} recipes (fixed reagent processing)`, 
              'success'
            );
          } catch (error) {
            console.error("Error processing recipe file:", error);
            window.blueprintBuddy.updateStatusMessage(
              `Error loading recipes: ${error.message}`, 
              'error'
            );
          }
          
          // Reset file input
          event.target.value = '';
        });
        
        console.log("Recipe file input handler replaced");
      }
      
      // 2. Fix the recipe display function to better handle ingredients
      const originalDisplayRecipeDetails = window.blueprintBuddy.displayRecipeDetails;
      window.blueprintBuddy.displayRecipeDetails = function() {
        // Skip if no recipe selected
        if (!this.state.selectedRecipe) {
          this.clearRecipeDisplay();
          return;
        }
        
        const recipe = this.state.recipesData[this.state.selectedRecipe];
        if (!recipe) {
          console.error("Selected recipe not found:", this.state.selectedRecipe);
          this.clearRecipeDisplay();
          return;
        }
        
        // Debug log
        console.log("Displaying recipe:", this.state.selectedRecipe, recipe);
        console.log("Ingredients:", recipe.ingredients);
        
        // Update recipe metadata
        this.elements.recipeLocation.textContent = `Location: ${recipe.location || 'Unknown'}`;
        
        // Calculate profit (revenue - cost)
        const revenue = recipe.pays || 0;
        const cost = recipe.cost || 0;
        const profit = revenue - cost;
        const profitStyle = profit >= 0 ? 'color: #2ecc71;' : 'color: #e74c3c;';
        
        // Display cost, revenue, and profit
        this.elements.recipeCost.innerHTML = `
          Cost: $${cost.toLocaleString()}<br>
          Revenue: $${revenue.toLocaleString()}<br>
          <span style="${profitStyle}">Profit: $${profit.toLocaleString()}</span>
        `;
        
        this.elements.recipeInstructions.textContent = recipe.instructions || 'No instructions available.';
        
        // Clear ingredients display
        this.elements.ingredientsDisplay.innerHTML = '';
        
        // Check if ingredients is valid
        if (!recipe.ingredients || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
          const noIngredientsDiv = document.createElement('div');
          noIngredientsDiv.className = 'ingredient';
          noIngredientsDiv.innerHTML = `
            <span class="ingredient-name">No ingredients required</span>
          `;
          this.elements.ingredientsDisplay.appendChild(noIngredientsDiv);
        } else {
          // Show each ingredient
          recipe.ingredients.forEach(ingredient => {
            let itemId, amount;
            
            // Handle both formats: [itemId, amount] or {item, amount}
            if (Array.isArray(ingredient)) {
              [itemId, amount] = ingredient;
            } else if (typeof ingredient === 'object') {
              if (typeof ingredient.item === 'string') {
                itemId = ingredient.item;
              } else if (ingredient.item && ingredient.item.name) {
                itemId = ingredient.item.name;
              } else {
                itemId = "unknown";
              }
              amount = ingredient.amount || 0;
            } else {
              return; // Skip invalid ingredients
            }
            
            const userHas = this.state.inventory[itemId] || 0;
            
            // Find item data
            let itemName = itemId;
            let itemWeight = 0;
            
            if (this.state.itemsData) {
              const itemData = this.state.itemsData.find(item => item.id === itemId);
              if (itemData) {
                itemName = itemData.name || itemId;
                itemWeight = itemData.weight || 0;
              }
            }
            
            // Create ingredient element
            const ingredientDiv = document.createElement('div');
            ingredientDiv.classList.add('ingredient');
            
            // Determine if user has enough of this ingredient
            if (userHas >= amount) {
              ingredientDiv.classList.add('have');
            } else if (userHas > 0) {
              ingredientDiv.classList.add('partial');
            } else {
              ingredientDiv.classList.add('missing');
            }
            
            // Show ingredient info
            ingredientDiv.innerHTML = `
              <span class="ingredient-name">${itemName}</span>
              <span class="ingredient-amount">${amount}</span>
              <span class="inventory-have">${userHas}</span>
            `;
            
            this.elements.ingredientsDisplay.appendChild(ingredientDiv);
          });
        }
        
        // Hide calculation results if shown
        this.elements.runsCalculation.style.display = 'none';
      };
      
      console.log("Recipe display function patched");
      console.log("Reagent processing fix applied successfully!");
    }, 1000); // Wait 1 second for BlueprintBuddy to initialize
  });