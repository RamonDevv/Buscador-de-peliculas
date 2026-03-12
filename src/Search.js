const API_URL = 'https://www.omdbapi.com/';
const API_KEY = import.meta.env.VITE_OMDB_KEY;
const DEBOUNCE_DELAY = 500;
const MAX_SEARCH_HISTORY = 10;

let currentFilters = { year: '', type: '', genre: '', rating: '' };
let currentSearchQuery = '';

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getSearchHistory() {
  try {
    const history = localStorage.getItem('movieSearchHistory');
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.warn('Error reading search history:', error);
    return [];
  }
}

function addToHistory(query) {
  if (!query.trim()) return;
  const history = getSearchHistory();
  const filtered = history.filter(item => item.toLowerCase() !== query.toLowerCase());
  filtered.unshift(query);
  const limited = filtered.slice(0, MAX_SEARCH_HISTORY);
  try {
    localStorage.setItem('movieSearchHistory', JSON.stringify(limited));
  } catch (error) {
    console.warn('Error saving search history:', error);
  }
}

function displaySearchHistory() {
  const history = getSearchHistory();
  const historyContainer = document.getElementById('searchHistory');
  const historyTags = document.getElementById('historyTags');
  
  if (!historyContainer || !historyTags) return;
  
  if (history.length === 0) {
    historyContainer.style.display = 'none';
    return;
  }
  
  historyContainer.style.display = 'block';
  historyTags.innerHTML = history.map(term => `
    <button class="history-tag" data-query="${escapeHtml(term)}">
      ${escapeHtml(term)} <span class="history-tag-remove">×</span>
    </button>
  `).join('');
  
  historyTags.querySelectorAll('.history-tag').forEach(tag => {
    tag.addEventListener('click', (e) => {
      if (e.target.closest('.history-tag-remove')) {
        e.stopPropagation();
        removeFromHistory(tag.dataset.query);
      } else {
        document.getElementById('Buscador').value = tag.dataset.query;
        buscarPeliculas(tag.dataset.query);
      }
    });
  });
}

function removeFromHistory(term) {
  const history = getSearchHistory();
  const filtered = history.filter(item => item !== term);
  localStorage.setItem('movieSearchHistory', JSON.stringify(filtered));
  displaySearchHistory();
}

function getWatchlist() {
  try {
    const watchlist = localStorage.getItem('movieWatchlist');
    return watchlist ? JSON.parse(watchlist) : [];
  } catch (error) {
    console.warn('Error reading watchlist:', error);
    return [];
  }
}

function addToWatchlist(movie) {
  const watchlist = getWatchlist();
  if (watchlist.some(item => item.imdbID === movie.imdbID)) {
    alert('Already in your watchlist!');
    return;
  }
  
  watchlist.push({
    imdbID: movie.imdbID,
    Title: movie.Title || '',
    Poster: movie.Poster || '',
    Year: movie.Year || 'N/A',
    Runtime: movie.Runtime || 'N/A',
    Genre: movie.Genre || 'N/A',
    Plot: movie.Plot || 'No description',
  });
  
  try {
    localStorage.setItem('movieWatchlist', JSON.stringify(watchlist));
    displayWatchlist();
    updateAnalytics();
    updateModalWatchlistButton(movie.imdbID);
  } catch (error) {
    console.warn('Error saving to watchlist:', error);
    alert('Could not add to watchlist');
  }
}

function removeFromWatchlist(imdbID) {
  let watchlist = getWatchlist();
  watchlist = watchlist.filter(item => item.imdbID !== imdbID);
  localStorage.setItem('movieWatchlist', JSON.stringify(watchlist));
  displayWatchlist();
  updateAnalytics();
  updateModalWatchlistButton(imdbID);
}

function isInWatchlist(imdbID) {
  return getWatchlist().some(item => item.imdbID === imdbID);
}

function displayWatchlist() {
  const watchlist = getWatchlist();
  const content = document.getElementById('watchlistContent');
  const empty = document.getElementById('watchlistEmpty');
  
  if (!content) return;
  
  if (watchlist.length === 0) {
    content.style.display = 'none';
    if (empty) empty.style.display = 'block';
    return;
  }
  
  content.style.display = 'grid';
  if (empty) empty.style.display = 'none';
  
  content.innerHTML = watchlist.map(movie => `
    <div class="watchlist-card">
      <img src="${escapeHtml(movie.Poster)}" alt="${escapeHtml(movie.Title)}" class="watchlist-card-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22%3E%3Crect fill=%221C1C1E%22/%3E%3C/svg%3E'">
      <div class="watchlist-card-info">
        <h3>${escapeHtml(movie.Title)}</h3>
        <p style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(movie.Genre)}</p>
        <div class="watchlist-card-rating" id="rating-${movie.imdbID}">${renderUserRating(movie.imdbID)}</div>
      </div>
      <button class="watchlist-card-remove" data-imdb-id="${movie.imdbID}">✕</button>
    </div>
  `).join('');
  
  content.querySelectorAll('.watchlist-card-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Remove from watchlist?')) {
        removeFromWatchlist(btn.dataset.imdbId);
      }
    });
  });
  
  content.querySelectorAll('.watchlist-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.watchlist-card-remove')) {
        const movie = watchlist.find(m => m.imdbID === card.querySelector('.watchlist-card-remove').dataset.imdbId);
        if (movie) cargarDetallesPelicula(movie.imdbID);
      }
    });
  });
}

function getUserRatings() {
  try {
    const ratings = localStorage.getItem('movieUserRatings');
    return ratings ? JSON.parse(ratings) : {};
  } catch (error) {
    return {};
  }
}

function getUserRating(imdbID) {
  const ratings = getUserRatings();
  return ratings[imdbID] || 0;
}

function saveRating(imdbID, rating) {
  const ratings = getUserRatings();
  ratings[imdbID] = parseInt(rating);
  localStorage.setItem('movieUserRatings', JSON.stringify(ratings));
  updateAnalytics();
  displayWatchlist();
}

function renderUserRating(imdbID) {
  const rating = getUserRating(imdbID);
  if (rating === 0) return '<small style="color: var(--text-secondary);">Not rated</small>';
  return Array.from({ length: 5 }, (_, i) => 
    `<span style="color: ${i < rating ? '#FFB800' : '#3A3A3C'};">★</span>`
  ).join('');
}

function setupStarRating(imdbID) {
  const starRating = document.getElementById('starRating');
  if (!starRating) return;
  
  const currentRating = getUserRating(imdbID);
  const stars = starRating.querySelectorAll('.star');
  const label = document.getElementById('ratingLabel');
  
  stars.forEach((star, index) => {
    star.classList.toggle('active', index < currentRating);
    star.addEventListener('click', () => {
      const newRating = index + 1;
      saveRating(imdbID, newRating);
      stars.forEach((s, i) => s.classList.toggle('active', i < newRating));
      if (label) label.textContent = `You rated this ${newRating} star${newRating !== 1 ? 's' : ''}`;
    });
  });
  
  if (label && currentRating > 0) {
    label.textContent = `You rated this ${currentRating} star${currentRating !== 1 ? 's' : ''}`;
  }
}

function getAnalytics() {
  try {
    const analytics = localStorage.getItem('movieAnalytics');
    return analytics ? JSON.parse(analytics) : { searches: {}, genres: {} };
  } catch (error) {
    return { searches: {}, genres: {} };
  }
}

function trackSearch(query) {
  const analytics = getAnalytics();
  analytics.searches[query] = (analytics.searches[query] || 0) + 1;
  localStorage.setItem('movieAnalytics', JSON.stringify(analytics));
}

function trackGenre(genres) {
  if (!genres) return;
  const analytics = getAnalytics();
  const genreList = genres.split(', ');
  genreList.forEach(genre => {
    analytics.genres[genre] = (analytics.genres[genre] || 0) + 1;
  });
  localStorage.setItem('movieAnalytics', JSON.stringify(analytics));
}

function updateAnalytics() {
  const analytics = getAnalytics();
  const watchlist = getWatchlist();
  const ratings = getUserRatings();
  
  const topSearches = Object.entries(analytics.searches)
    .sort((a, b) => b[1] - a[1]).slice(0, 5);
  
  const topSearchesDiv = document.getElementById('topSearches');
  if (topSearchesDiv) {
    topSearchesDiv.innerHTML = topSearches.length > 0
      ? topSearches.map(([query, count]) => `
          <div class="analytics-item">
            <span>${escapeHtml(query)}</span>
            <span class="analytics-item-value">${count}</span>
          </div>
        `).join('')
      : '<p style="color: var(--text-secondary);">No searches yet</p>';
  }
  
  const avgRating = watchlist.length > 0
    ? (Object.values(ratings).reduce((a, b) => a + b, 0) / watchlist.length).toFixed(1)
    : 0;
  
  const watchlistStatsDiv = document.getElementById('watchlistStats');
  if (watchlistStatsDiv) {
    watchlistStatsDiv.innerHTML = `
      <div class="stat-row">
        <span>Total Movies</span>
        <span class="stat-value">${watchlist.length}</span>
      </div>
      <div class="stat-row">
        <span>Average Rating</span>
        <span class="stat-value">${avgRating} ⭐</span>
      </div>
    `;
  }
  
  const topRated = watchlist
    .filter(m => ratings[m.imdbID])
    .sort((a, b) => (ratings[b.imdbID] || 0) - (ratings[a.imdbID] || 0))
    .slice(0, 5);
  
  const topRatedDiv = document.getElementById('topRated');
  if (topRatedDiv) {
    topRatedDiv.innerHTML = topRated.length > 0
      ? topRated.map(movie => `
          <div class="analytics-item">
            <span>${escapeHtml(movie.Title)}</span>
            <span class="analytics-item-value">${ratings[movie.imdbID]}★</span>
          </div>
        `).join('')
      : '<p style="color: var(--text-secondary);">No ratings yet</p>';
  }
  
  const genreStats = Object.entries(analytics.genres)
    .sort((a, b) => b[1] - a[1]).slice(0, 5);
  
  const genreDiv = document.getElementById('genreStats');
  if (genreDiv) {
    genreDiv.innerHTML = genreStats.length > 0
      ? genreStats.map(([genre, count]) => `
          <div class="analytics-item">
            <span>${escapeHtml(genre)}</span>
            <span class="analytics-item-value">${count}</span>
          </div>
        `).join('')
      : '<p style="color: var(--text-secondary);">View movies to see stats</p>';
  }
}

function getThemePreference() {
  const saved = localStorage.getItem('appTheme');
  if (saved) return saved;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'light') {
    html.classList.add('light-mode');
  } else {
    html.classList.remove('light-mode');
  }
  
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
  
  localStorage.setItem('appTheme', theme);
}

function toggleTheme() {
  const current = localStorage.getItem('appTheme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

function setupThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

function setupTabNavigation() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.dataset.tab === tabName) {
          content.classList.add('active');
        }
      });
      
      if (tabName === 'watchlist') displayWatchlist();
      else if (tabName === 'analytics') updateAnalytics();
    });
  });
}

async function buscarPeliculas(query) {
  if (!query.trim()) {
    document.getElementById('movies-list').innerHTML = '';
    return;
  }
  
  currentSearchQuery = query;
  addToHistory(query);
  trackSearch(query);
  displaySearchHistory();
  
  const lista = document.getElementById('movies-list');
  lista.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">🔍 Searching...</p>';
  
  try {
    const response = await fetch(`${API_URL}?apikey=${API_KEY}&s=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (data.Response === 'True' && data.Search) {
      let movies = data.Search;
      movies = aplicarFiltros(movies);
      mostrarListaPeliculas(movies);
    } else {
      lista.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">No movies found</p>`;
    }
  } catch (error) {
    console.error('Search error:', error);
    lista.innerHTML = '<p style="text-align: center; color: #ef4444;">Error searching. Check your connection.</p>';
  }
}

function aplicarFiltros(movies) {
  return movies.filter(movie => {
    if (currentFilters.year && !movie.Year.includes(currentFilters.year)) return false;
    if (currentFilters.type && movie.Type !== currentFilters.type) return false;
    return true;
  });
}

function mostrarListaPeliculas(peliculas) {
  const lista = document.getElementById('movies-list');
  
  if (peliculas.length === 0) {
    lista.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No results match your filters</p>';
    return;
  }
  
  lista.innerHTML = peliculas.map(pelicula => `
    <div class="movie-card" data-imdb-id="${pelicula.imdbID}">
      <img src="${escapeHtml(pelicula.Poster)}" alt="${escapeHtml(pelicula.Title)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22225%22%3E%3Crect fill=%221C1C1E%22/%3E%3C/svg%3E'">
      <div class="movie-info">
        <h3>${escapeHtml(pelicula.Title)}</h3>
        <p>${escapeHtml(pelicula.Year)}</p>
      </div>
    </div>
  `).join('');
  
  lista.querySelectorAll('.movie-card').forEach(card => {
    card.addEventListener('click', () => {
      cargarDetallesPelicula(card.dataset.imdbId);
    });
  });
}

async function cargarDetallesPelicula(imdbID) {
  try {
    const response = await fetch(`${API_URL}?apikey=${API_KEY}&i=${imdbID}`);
    const pelicula = await response.json();
    
    if (pelicula.Response === 'True') {
      trackGenre(pelicula.Genre);
      mostrarModal(pelicula);
    }
  } catch (error) {
    console.error('Error loading details:', error);
    alert('Error loading movie details');
  }
}

function mostrarModal(pelicula) {
  const modal = document.getElementById('movieModal');
  document.getElementById('modalTitle').textContent = pelicula.Title;
  document.getElementById('modalYear').textContent = pelicula.Year;
  document.getElementById('modalRated').textContent = pelicula.Rated || 'N/A';
  document.getElementById('modalRuntime').textContent = pelicula.Runtime || 'N/A';
  document.getElementById('modalGenre').textContent = pelicula.Genre || 'N/A';
  document.getElementById('modalDirector').textContent = pelicula.Director || 'N/A';
  document.getElementById('modalPlot').textContent = pelicula.Plot || 'N/A';
  document.getElementById('modalRating').textContent = pelicula.imdbRating || 'N/A';
  document.getElementById('modalPoster').src = pelicula.Poster !== 'N/A' ? pelicula.Poster : '';
  
  setupStarRating(pelicula.imdbID);
  updateModalWatchlistButton(pelicula.imdbID, pelicula);
  
  modal.classList.add('active');
  modal.style.display = 'flex';
}

function updateModalWatchlistButton(imdbID, movieData = null) {
  const btn = document.getElementById('addToWatchlist');
  if (!btn) return;
  
  if (isInWatchlist(imdbID)) {
    btn.textContent = '❤️ In Watchlist';
    btn.onclick = () => removeFromWatchlist(imdbID);
  } else {
    btn.textContent = '🤍 Add to Watchlist';
    btn.onclick = () => {
      if (movieData) addToWatchlist(movieData);
      else {
        const movie = {
          imdbID: imdbID,
          Title: document.getElementById('modalTitle').textContent,
          Poster: document.getElementById('modalPoster').src,
          Year: document.getElementById('modalYear').textContent,
          Runtime: document.getElementById('modalRuntime').textContent,
          Genre: document.getElementById('modalGenre').textContent,
          Plot: document.getElementById('modalPlot').textContent,
        };
        addToWatchlist(movie);
      }
    };
  }
}

function setupFilters() {
  const yearInput = document.getElementById('yearFilter');
  const typeSelect = document.getElementById('typeFilter');
  const filterToggle = document.getElementById('filterToggle');
  const filterPanel = document.getElementById('filterPanel');
  const clearFiltersBtn = document.getElementById('clearFilters');
  const clearHistoryBtn = document.getElementById('clearHistory');
  
  if (filterToggle) {
    filterToggle.addEventListener('click', () => {
      filterPanel.style.display = filterPanel.style.display === 'none' ? 'grid' : 'none';
    });
  }
  
  if (yearInput) {
    yearInput.addEventListener('change', () => {
      currentFilters.year = yearInput.value;
      if (currentSearchQuery) buscarPeliculas(currentSearchQuery);
    });
  }
  
  if (typeSelect) {
    typeSelect.addEventListener('change', () => {
      currentFilters.type = typeSelect.value;
      if (currentSearchQuery) buscarPeliculas(currentSearchQuery);
    });
  }
  
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      if (yearInput) yearInput.value = '';
      if (typeSelect) typeSelect.value = '';
      currentFilters = { year: '', type: '', genre: '', rating: '' };
      if (currentSearchQuery) buscarPeliculas(currentSearchQuery);
    });
  }
  
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      localStorage.removeItem('movieSearchHistory');
      displaySearchHistory();
    });
  }
}

function setupModalHandlers() {
  const modal = document.getElementById('movieModal');
  const closeBtn = document.querySelector('.modal-close');
  const modalOverlay = document.querySelector('.modal-overlay');
  const searchInput = document.getElementById('Buscador');
  
  const closeModal = () => {
    modal.classList.remove('active');
    modal.style.display = 'none';
    if (searchInput) searchInput.focus();
  };
  
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

// Main initialization
export function configurarBuscador() {
  const theme = getThemePreference();
  applyTheme(theme);
  setupThemeToggle();
  setupTabNavigation();
  setupFilters();
  setupModalHandlers();
  const searchInput = document.getElementById('Buscador');
  const clearBtn = document.getElementById('clearSearch');
  const debouncedSearch = debounce((query) => buscarPeliculas(query), DEBOUNCE_DELAY);
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const value = e.target.value;
      if (value.trim()) {
        clearBtn.style.display = 'block';
        debouncedSearch(value);
      } else {
        clearBtn.style.display = 'none';
        document.getElementById('movies-list').innerHTML = '';
      }
    });
  }
  
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      clearBtn.style.display = 'none';
      document.getElementById('movies-list').innerHTML = '';
    });
  }
  
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  displaySearchHistory();
  displayWatchlist();
  updateAnalytics();
}
