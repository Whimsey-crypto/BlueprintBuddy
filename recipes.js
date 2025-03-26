// recipes.js - Contains all recipe data for BlueprintBuddy
const recipes = {
    "House": {
        name: "House",
        location: "House Construction Site",
        ingredients: [
            ["ceramictiles", 4],
            ["concrete", 1],
            ["refined-planks", 2],
            ["copperwire", 1],
            ["computer", 1],
            ["rebar", 1]
        ],
        pays: 2350000,
        instructions: "Combine construction materials at the construction site to build a house."
    },
    "Garage": {
        name: "Garage",
        location: "Garage Construction Site", 
        ingredients: [
            ["concrete", 1],
            ["refined-planks", 1],
            ["rebar", 1]
        ],
        pays: 950000,
        instructions: "Build a garage at the construction site using these materials."
    },
    "Office Building": {
        name: "Office Building",
        location: "Commercial District", 
        ingredients: [
            ["ceramictiles", 8],
            ["concrete", 3],
            ["refined-planks", 4],
            ["copperwire", 2],
            ["computer", 4],
            ["rebar", 2],
            ["glass", 5]
        ],
        pays: 5250000,
        instructions: "Construct an office building in the commercial district."
    },
    "Small Bridge": {
        name: "Small Bridge",
        location: "Infrastructure Zone", 
        ingredients: [
            ["concrete", 2],
            ["rebar", 3],
            ["steel-beams", 2]
        ],
        pays: 1850000,
        instructions: "Build a small bridge at the infrastructure zone."
    },
    "Water Tower": {
        name: "Water Tower",
        location: "Rural Area", 
        ingredients: [
            ["concrete", 1],
            ["rebar", 2],
            ["steel-beams", 1],
            ["steel-pipes", 3]
        ],
        pays: 1350000,
        instructions: "Construct a water tower in the rural area to improve water supply."
    }
};

// Export the recipes object for use in main script
if (typeof module !== 'undefined') {
    module.exports = recipes;
}