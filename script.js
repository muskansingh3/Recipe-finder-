// API Configuration
const API_URL = "https://www.themealdb.com/api/json/v1/1/";

// State
let currentRecipes = [];
let favorites = JSON.parse(localStorage.getItem('recipeFavorites')) || {};

// DOM Elements
let searchInput, searchBtn, recipeResults, favoritesSection, favoritesGrid, favoritesLink, loadingElement;

// Initialize
function init() {
    // Initialize DOM elements
    searchInput = document.getElementById('search-input');
    searchBtn = document.getElementById('search-btn');
    recipeResults = document.getElementById('recipe-results');
    favoritesSection = document.getElementById('favorites');
    favoritesGrid = document.querySelector('.favorites-grid');
    favoritesLink = document.getElementById('favorites-link');
    loadingElement = document.getElementById('loading');
    
    // Setup event listeners
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', searchRecipes);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchRecipes();
        });
    }
    
    // Setup navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (link.id === 'favorites-link') {
                showFavorites(e);
            } else {
                showSection(link.dataset.section, e);
            }
        });
    });
    
    if (document.getElementById('home')) {
        loadDefaultRecipes();
        showHome();
    }
    
    if (favoritesGrid) {
        renderFavorites();
    }
}

// Show specific section
function showSection(sectionName, e) {
    // List of section IDs
    const sections = ['home', 'favorites', 'pricing', 'history', 'email'];
    
    // Hide all sections
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    
    // Show requested section
    const section = document.getElementById(sectionName);
    if (section) {
        section.classList.remove('hidden');
    }
    
    // Update active navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to clicked link
    if (e && e.currentTarget) {
        e.currentTarget.classList.add('active');
    }
}

// Show favorites view
function showFavorites(e) {
    e.preventDefault();
    // Hide other sections
    const sections = ['home', 'pricing', 'history', 'email'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    
    // Show favorites
    if (favoritesSection) favoritesSection.classList.remove('hidden');
    
    // Update active navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to clicked link
    if (e && e.currentTarget) {
        e.currentTarget.classList.add('active');
    }
}

// Show home view
function showHome() {
    // Hide other sections
    const sections = ['favorites', 'pricing', 'history', 'email'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    
    // Show home
    const homeSection = document.getElementById('home');
    if (homeSection) homeSection.classList.remove('hidden');
    
    // Update active navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const homeLink = document.querySelector('.nav-link[data-section="home"]');
    if (homeLink) homeLink.classList.add('active');
}

// Load default recipes
async function loadDefaultRecipes() {
    try {
        const response = await fetch(`${API_URL}filter.php?c=Dessert`);
        const data = await response.json();
        currentRecipes = data.meals || [];
        renderRecipes(currentRecipes);
        
        // Add trending recipes
        const trendingResponse = await fetch(`${API_URL}filter.php?c=Chicken`);
        const trendingData = await trendingResponse.json();
        if (trendingData.meals) {
            const trendingContainer = document.getElementById('trending-recipes');
            if (trendingContainer) {
                trendingContainer.innerHTML = trendingData.meals.slice(0, 4).map(recipe => `
                    <div class="trending-recipe">
                        <div class="trending-image" style="background-image: url('${recipe.strMealThumb}')"></div>
                        <div class="trending-title">${recipe.strMeal}</div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading default recipes:', error);
    }
}

// Search recipes
async function searchRecipes() {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) return;
    
    // Show loading spinner
    if (loadingElement) {
        loadingElement.classList.remove('d-none');
        recipeResults.innerHTML = '';
    }
    
    try {
        const response = await fetch(`${API_URL}search.php?s=${searchTerm}`);
        const data = await response.json();
        currentRecipes = data.meals || [];
        renderRecipes(currentRecipes);
        showHome();
        
        // Add results count
        const resultsCount = document.getElementById('results-count');
        if (resultsCount) {
            resultsCount.textContent = `Found ${currentRecipes.length} recipes for "${searchTerm}"`;
        }
    } catch (error) {
        console.error('Error fetching recipes:', error);
        if (recipeResults) {
            recipeResults.innerHTML = `<p class="error">Error loading recipes. Please try again.</p>`;
        }
    } finally {
        // Hide loading spinner
        if (loadingElement) {
            loadingElement.classList.add('d-none');
        }
    }
}

// Render recipes
function renderRecipes(recipes) {
    if (!recipeResults) return;
    
    if (recipes.length === 0) {
        recipeResults.innerHTML = `<p class="no-results">No recipes found. Try a different search term.</p>`;
        return;
    }
    
    recipeResults.innerHTML = recipes.map(recipe => `
        <div class="recipe-card" data-id="${recipe.idMeal}">
            <div class="recipe-image" style="background-image: url('${recipe.strMealThumb}')"></div>
            <div class="recipe-content">
                <h3 class="recipe-title">${recipe.strMeal}</h3>
                <div class="recipe-info">
                    <span>${recipe.strArea} Cuisine</span>
                    <span>${recipe.strCategory}</span>
                </div>
                <div class="recipe-actions">
                    <button class="favorite-btn ${favorites[recipe.idMeal] ? 'active' : ''}" 
                            onclick="toggleFavorite('${recipe.idMeal}')">❤</button>
                    <button class="view-recipe" onclick="viewRecipe('${recipe.idMeal}')">View Recipe</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Toggle favorite
function toggleFavorite(recipeId) {
    if (favorites[recipeId]) {
        delete favorites[recipeId];
    } else {
        // Get recipe details to save
        const recipe = currentRecipes.find(r => r.idMeal === recipeId);
        if (recipe) {
            favorites[recipeId] = {
                id: recipe.idMeal,
                name: recipe.strMeal,
                image: recipe.strMealThumb,
                category: recipe.strCategory,
                area: recipe.strArea
            };
        }
    }
    
    localStorage.setItem('recipeFavorites', JSON.stringify(favorites));
    renderRecipes(currentRecipes);
    renderFavorites();
}

// Render favorites
function renderFavorites() {
    if (!favoritesGrid) return;
    
    const favRecipes = Object.values(favorites);
    if (favRecipes.length === 0) {
        favoritesGrid.innerHTML = `<p class="no-favorites">You haven't added any favorites yet.</p>`;
        return;
    }
    
    favoritesGrid.innerHTML = favRecipes.map(recipe => `
        <div class="recipe-card" data-id="${recipe.id}">
            <div class="recipe-image" style="background-image: url('${recipe.image}')"></div>
            <div class="recipe-content">
                <h3 class="recipe-title">${recipe.name}</h3>
                <div class="recipe-info">
                    <span>${recipe.area} Cuisine</span>
                    <span>${recipe.category}</span>
                </div>
                <div class="recipe-actions">
                    <button class="favorite-btn active" 
                            onclick="toggleFavorite('${recipe.id}')">❤</button>
                    <button class="view-recipe" onclick="viewRecipe('${recipe.id}')">View Recipe</button>
                </div>
            </div>
        </div>
    `).join('');
}

// View recipe details
async function viewRecipe(recipeId) {
    try {
        const response = await fetch(`${API_URL}lookup.php?i=${recipeId}`);
        const data = await response.json();
        const recipe = data.meals?.[0];
        
        if (!recipe) {
            throw new Error('Recipe not found');
        }
        
    // Format ingredients
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const ingredient = recipe[`strIngredient${i}`];
        const measure = recipe[`strMeasure${i}`];
        if (ingredient && ingredient.trim() !== '') {
            ingredients.push(`${measure} ${ingredient}`);
        }
    }
    
    // Create modal with YouTube integration
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Get high-quality image
    let recipeImage = recipe.strMealThumb || '';
    if (recipeImage.includes('/preview')) {
        recipeImage = recipeImage.replace('/preview', '');
    }
    
    // Create YouTube embed URL
    let youtubeEmbed = '';
    if (recipe.strYoutube) {
        youtubeEmbed = recipe.strYoutube.replace('watch?v=', 'embed/');
    } else {
        // Fallback to YouTube search
        youtubeEmbed = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(recipe.strMeal + ' recipe')}`;
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2>${recipe.strMeal}</h2>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-6">
                        <div class="ratio ratio-16x9 mb-4">
                            <iframe src="${youtubeEmbed}" 
                                    title="${recipe.strMeal} recipe video" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowfullscreen>
                            </iframe>
                        </div>
                        <img src="${recipeImage}" alt="${recipe.strMeal}" class="img-fluid rounded">
                    </div>
                    <div class="col-md-6">
                        <h3><i class="fa-solid fa-carrot me-2"></i> Ingredients:</h3>
                        <ul class="ingredients-list">${ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
                        
                        <h3 class="mt-4"><i class="fa-solid fa-book-open me-2"></i> Instructions:</h3>
                        <div class="instructions">${formatInstructions(recipe.strInstructions)}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
} catch (error) {
    console.error('Error fetching recipe details:', error);
    alert('Error loading recipe details. Please try again.');
}
}

// Format recipe instructions with paragraphs
function formatInstructions(instructions) {
    return instructions
        .split('\r\n')
        .filter(step => step.trim() !== '')
        .map(step => `<p>${step}</p>`)
        .join('');
}

// Initialize app
document.addEventListener('DOMContentLoaded', init);
