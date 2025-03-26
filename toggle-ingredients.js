// Toggle Ingredients Display - Optional Setting
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      if (!window.blueprintBuddy) {
        console.error("BlueprintBuddy not initialized yet");
        return;
      }
      
      console.log("Initializing Ingredients Toggle...");
      
      // Create a styled toggle switch
      function createToggleSwitch() {
        // Create container for the toggle
        const toggleContainer = document.createElement('div');
        toggleContainer.id = 'ingredients-toggle-container';
        toggleContainer.style.display = 'flex';
        toggleContainer.style.alignItems = 'center';
        toggleContainer.style.justifyContent = 'space-between';
        toggleContainer.style.padding = '8px 12px';
        toggleContainer.style.margin = '10px 0';
        toggleContainer.style.backgroundColor = 'rgba(41, 128, 185, 0.5)';
        toggleContainer.style.borderRadius = '4px';
        toggleContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        toggleContainer.style.cursor = 'pointer';
        
        // Create toggle label
        const label = document.createElement('span');
        label.textContent = 'Show Recipe Ingredients:';
        label.style.color = 'white';
        label.style.fontWeight = 'bold';
        
        // Create toggle switch
        const switchLabel = document.createElement('label');
        switchLabel.className = 'switch';
        switchLabel.style.position = 'relative';
        switchLabel.style.display = 'inline-block';
        switchLabel.style.width = '40px';
        switchLabel.style.height = '24px';
        
        // Create the checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'show-ingredients-toggle';
        checkbox.style.opacity = '0';
        checkbox.style.width = '0';
        checkbox.style.height = '0';
        
        // Load saved state (default to hidden)
        const savedState = localStorage.getItem('blueprintBuddyShowIngredients');
        checkbox.checked = savedState === 'true';
        
        // Create the slider
        const slider = document.createElement('span');
        slider.className = 'slider round';
        slider.style.position = 'absolute';
        slider.style.cursor = 'pointer';
        slider.style.top = '0';
        slider.style.left = '0';
        slider.style.right = '0';
        slider.style.bottom = '0';
        slider.style.backgroundColor = checkbox.checked ? '#2ecc71' : '#ccc';
        slider.style.transition = '.4s';
        slider.style.borderRadius = '34px';
        
        // Add the slider circle
        slider.innerHTML = '<span style="position: absolute; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; transform: ' + (checkbox.checked ? 'translateX(16px)' : 'none') + ';"></span>';
        
        // Initial state application
        updateIngredientsDisplay(checkbox.checked);
        
        // Add event listener to toggle
        checkbox.addEventListener('change', function() {
          updateIngredientsDisplay(this.checked);
          localStorage.setItem('blueprintBuddyShowIngredients', this.checked);
          
          // Update slider appearance
          slider.style.backgroundColor = this.checked ? '#2ecc71' : '#ccc';
          const circle = slider.querySelector('span');
          if (circle) {
            circle.style.transform = this.checked ? 'translateX(16px)' : 'none';
          }
        });
        
        // Add event listener to the whole container (for better UX)
        toggleContainer.addEventListener('click', function(e) {
          // Don't trigger if clicking directly on the checkbox
          if (e.target !== checkbox) {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
          }
        });
        
        // Assemble toggle
        switchLabel.appendChild(checkbox);
        switchLabel.appendChild(slider);
        toggleContainer.appendChild(label);
        toggleContainer.appendChild(switchLabel);
        
        return toggleContainer;
      }
      
      // Control ingredients display visibility
      function updateIngredientsDisplay(show) {
        const ingredientsDisplay = document.getElementById('ingredientsDisplay');
        if (ingredientsDisplay) {
          ingredientsDisplay.style.display = show ? 'block' : 'none';
        }
      }
      
      // Insert toggle at the right location
      function insertToggle() {
        // Find ideal location (right before the ingredients display)
        const ingredientsDisplay = document.getElementById('ingredientsDisplay');
        const quantitySelector = document.querySelector('.quantity-selector');
        
        if (ingredientsDisplay && ingredientsDisplay.parentNode && quantitySelector) {
          const toggle = createToggleSwitch();
          
          // Insert after quantity selector but before ingredients display
          if (quantitySelector.nextSibling === ingredientsDisplay) {
            quantitySelector.parentNode.insertBefore(toggle, ingredientsDisplay);
          } else {
            // Find a spot between quantity selector and ingredients display
            let currentNode = quantitySelector.nextSibling;
            while (currentNode && currentNode !== ingredientsDisplay) {
              if (currentNode.nextSibling === ingredientsDisplay) {
                currentNode.parentNode.insertBefore(toggle, ingredientsDisplay);
                break;
              }
              currentNode = currentNode.nextSibling;
            }
            
            // Fallback insertion
            if (!currentNode) {
              ingredientsDisplay.parentNode.insertBefore(toggle, ingredientsDisplay);
            }
          }
        }
      }
      
      // Ensure toggle is inserted when needed
      function ensureToggleExists() {
        if (!document.getElementById('ingredients-toggle-container')) {
          insertToggle();
        }
      }
      
      // Override the display recipe details function to make sure our toggle works
      const originalDisplayRecipeDetails = window.blueprintBuddy.displayRecipeDetails;
      window.blueprintBuddy.displayRecipeDetails = function() {
        // Call original function
        originalDisplayRecipeDetails.apply(this, arguments);
        
        // Make sure the toggle exists
        ensureToggleExists();
        
        // Update the ingredients display based on toggle state
        const toggle = document.getElementById('show-ingredients-toggle');
        if (toggle) {
          updateIngredientsDisplay(toggle.checked);
        }
      };
      
      // Initialize with a delay to ensure DOM is ready
      setTimeout(ensureToggleExists, 500);
      
      console.log("Ingredients Toggle initialized");
    }, 2000);
  });