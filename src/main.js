import './style.css'
import { configurarBuscador } from './Search.js'

document.querySelector('#app').innerHTML = `
  <div class="app-container">
    <!-- Header Section -->
    <header class="app-header">
      <div class="header-content">
        <div class="header-top">
          <div class="logo-section">
            <h1 class="app-title">🎬 Movie Search</h1>
            <p class="app-subtitle">Discover your next favorite film</p>
          </div>
          <button class="theme-toggle" id="themeToggle" aria-label="Toggle dark/light mode">
            🌙
          </button>
        </div>

        <!-- Tabs: Search / Watchlist / Analytics -->
        <div class="tabs-container">
          <button class="tab-btn active" data-tab="search">🔍 Search</button>
          <button class="tab-btn" data-tab="watchlist">❤️ Watchlist</button>
          <button class="tab-btn" data-tab="analytics">📊 Analytics</button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="app-main">
      <!-- Search Section -->
      <section class="search-section">
        <div class="search-container">
          <div class="search-input-wrapper">
            <span class="search-icon">🔍</span>
            <input 
              id="Buscador" 
              type="text" 
              placeholder="Search movies by title..." 
              class="search-input"
              aria-label="Search for movies"
            />
            <button class="search-clear" id="clearSearch" aria-label="Clear search" style="display:none;">✕</button>
          </div>
          
          <!-- Filter Toggle Button -->
          <button class="filter-toggle" id="filterToggle" aria-label="Toggle filters">
            ⚙️ Filters
          </button>
        </div>

        <!-- Advanced Filter Panel (Hidden by default) -->
        <div class="filter-panel" id="filterPanel" style="display: none;">
          <div class="filter-group">
            <label for="yearFilter">Year:</label>
            <input type="number" id="yearFilter" placeholder="e.g., 2023" min="1900" max="2099" />
          </div>
          <div class="filter-group">
            <label for="typeFilter">Type:</label>
            <select id="typeFilter">
              <option value="">All Types</option>
              <option value="movie">Movie</option>
              <option value="series">Series</option>
              <option value="episode">Episode</option>
            </select>
          </div>
          <div class="filter-group">
            <label for="genreFilter">Genre (contains):</label>
            <input type="text" id="genreFilter" placeholder="e.g., Action, Drama" />
          </div>
          <div class="filter-group">
            <label for="ratingFilter">IMDb Rating Min:</label>
            <input type="number" id="ratingFilter" placeholder="e.g., 7.0" min="0" max="10" step="0.1" />
          </div>
          <button class="btn-apply-filters" id="applyFilters">Apply Filters</button>
          <button class="btn-clear-filters" id="clearFilters">Clear</button>
        </div>

        <!-- Search History -->
        <div class="search-history" id="searchHistory" style="display: none;">
          <div class="history-header">
            <span>🕐 Recent Searches</span>
            <button class="history-clear-btn" id="clearHistory" aria-label="Clear search history">Clear</button>
          </div>
          <div class="history-tags" id="historyTags"></div>
        </div>
      </section>

      <!-- Movies Section (Tab-based) -->
      <section class="movies-section tab-content active" id="searchTab" data-tab="search">
        <div id="movies-list" class="movies-list" role="region" aria-label="Movie search results">
          <!-- Movies rendered here -->
        </div>
        <div id="no-results" class="no-results" style="display:none;">
          <p>No movies found. Try searching for another title!</p>
        </div>
      </section>

      <!-- Watchlist Section (Tab) -->
      <section class="watchlist-section tab-content" id="watchlistTab" data-tab="watchlist">
        <div class="watchlist-container">
          <div id="watchlistContent" class="watchlist-grid"></div>
          <div id="watchlistEmpty" class="empty-state" style="display:none;">
            <p>❤️ Your watchlist is empty</p>
            <p>Add movies from search results to get started!</p>
          </div>
        </div>
      </section>

      <!-- Analytics Section (Tab) -->
      <section class="analytics-section tab-content" id="analyticsTab" data-tab="analytics">
        <div class="analytics-grid">
          <!-- Top Searches -->
          <div class="analytics-card">
            <h3>🔥 Top Searches</h3>
            <div id="topSearches" class="analytics-list"></div>
          </div>

          <!-- Most Watched Stats -->
          <div class="analytics-card">
            <h3>📺 Watchlist Stats</h3>
            <div id="watchlistStats" class="analytics-stats"></div>
          </div>

          <!-- Top Rated Movies -->
          <div class="analytics-card">
            <h3>⭐ Your Top Rated</h3>
            <div id="topRated" class="analytics-list"></div>
          </div>

          <!-- Genre Distribution -->
          <div class="analytics-card">
            <h3>🎬 Genre Distribution</h3>
            <div id="genreStats" class="analytics-list"></div>
          </div>
        </div>
      </section>
    </main>

    <!-- Modal -->
    <div id="movieModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <button class="modal-close" aria-label="Close movie details">&times;</button>
        <div class="modal-body">
          <img id="modalPoster" src="" alt="Movie poster" class="modal-poster"/>
          <div class="modal-info">
            <h2 id="modalTitle" class="modal-title"></h2>
            <div class="modal-details">
              <div class="detail-item">
                <strong>Year:</strong>
                <span id="modalYear"></span>
              </div>
              <div class="detail-item">
                <strong>Rating:</strong>
                <span id="modalRated"></span>
              </div>
              <div class="detail-item">
                <strong>Runtime:</strong>
                <span id="modalRuntime"></span>
              </div>
              <div class="detail-item">
                <strong>Genre:</strong>
                <span id="modalGenre"></span>
              </div>
              <div class="detail-item">
                <strong>Director:</strong>
                <span id="modalDirector"></span>
              </div>
              <div class="detail-item">
                <strong>IMDb Rating:</strong>
                <span id="modalRating" class="imdb-rating"></span>
              </div>
            </div>
            <div class="modal-plot">
              <h3>Synopsis</h3>
              <p id="modalPlot"></p>
            </div>

            <!-- Rating System -->
            <div class="modal-rating-section">
              <h3>Your Rating</h3>
              <div class="star-rating" id="starRating">
                <button class="star" data-rating="1">⭐</button>
                <button class="star" data-rating="2">⭐</button>
                <button class="star" data-rating="3">⭐</button>
                <button class="star" data-rating="4">⭐</button>
                <button class="star" data-rating="5">⭐</button>
              </div>
              <p class="rating-label" id="ratingLabel">Click to rate</p>
            </div>

            <!-- Action Buttons -->
            <div class="modal-actions">
              <button id="addToWatchlist" class="btn-watchlist">❤️ Add to Watchlist</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`

configurarBuscador()