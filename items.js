// items.js - Contains all item data for BlueprintBuddy
const items = {
    // Construction Materials
    "ceramictiles": { 
        weight: 10, 
        category: "construction",
        displayName: "Ceramic Tiles",
        description: "High-quality ceramic tiles for flooring"
    },
    "concrete": { 
        weight: 160, 
        category: "construction",
        displayName: "Concrete Mix",
        description: "Ready-to-use concrete mix"
    },
    "refined-planks": { 
        weight: 15, 
        category: "construction",
        displayName: "Refined Planks",
        description: "Smoothed wooden planks for construction"
    },
    "copperwire": { 
        weight: 20, 
        category: "electrical",
        displayName: "Copper Wire",
        description: "Electrical wiring for buildings"
    },
    "computer": { 
        weight: 35, 
        category: "electronics",
        displayName: "Computer",
        description: "Desktop computer for automation systems"
    },
    "rebar": { 
        weight: 45, 
        category: "construction",
        displayName: "Reinforcement Bar",
        description: "Steel rods for reinforcing concrete"
    },
    "glass": { 
        weight: 25, 
        category: "construction",
        displayName: "Glass Panels",
        description: "Tempered glass for windows"
    },
    "steel-beams": { 
        weight: 80, 
        category: "construction",
        displayName: "Steel Beams",
        description: "Heavy load-bearing steel beams"
    },
    "steel-pipes": { 
        weight: 40, 
        category: "construction",
        displayName: "Steel Pipes",
        description: "Industrial steel pipes for plumbing"
    },
    "wooden-doors": { 
        weight: 30, 
        category: "construction",
        displayName: "Wooden Doors",
        description: "Pre-made wooden doors"
    },
    "roof-tiles": { 
        weight: 15, 
        category: "construction",
        displayName: "Roof Tiles",
        description: "Weather-resistant roof tiles"
    },
    "insulation": { 
        weight: 8, 
        category: "construction",
        displayName: "Insulation Material",
        description: "Thermal insulation for walls"
    }
};

// Export the items object for use in main script
if (typeof module !== 'undefined') {
    module.exports = items;
}