// Función debounce para evitar múltiples llamadas al API
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function configurarBuscador() {
  const input = document.getElementById("Buscador");
  const moviesList = document.getElementById("movies-list");
  const modal = document.getElementById("movieModal");
  const closeBtn = document.querySelector(".close");
  const apiKey = import.meta.env.VITE_OMDB_KEY;

  // Función para buscar películas
  const buscarPeliculas = debounce(async (query) => {
    if (!query.trim()) {
      moviesList.innerHTML = "";
      return;
    }

    try {
      console.log("Buscando películas...", query);
      const res = await fetch(`https://www.omdbapi.com/?s=${query}&apikey=${apiKey}`);
      const data = await res.json();

      if (data.Response === "True") {
        console.log("Películas encontradas:", data.Search);
        mostrarListaPeliculas(data.Search);
      } else {
        moviesList.innerHTML = `<p>No se encontraron películas. ${data.Error}</p>`;
      }
    } catch (error) {
      console.error("Error en la búsqueda:", error);
      moviesList.innerHTML = `<p>Error al buscar películas</p>`;
    }
  }, 500); // Espera 500ms después de que el usuario deje de escribir

  // Mostrar lista de películas
  function mostrarListaPeliculas(peliculas) {
    moviesList.innerHTML = peliculas.map((pelicula) => `
      <div class="movie-card" data-imdb-id="${pelicula.imdbID}">
        <img src="${pelicula.Poster !== "N/A" ? pelicula.Poster : "https://via.placeholder.com/100x150?text=No+Image"}" alt="${pelicula.Title}" class="movie-poster-thumb"/>
        <div class="movie-info">
          <h3>${pelicula.Title}</h3>
          <p>${pelicula.Year}</p>
          <p class="movie-type">${pelicula.Type}</p>
        </div>
      </div>
    `).join("");

    // Agregar event listeners a cada película
    document.querySelectorAll(".movie-card").forEach((card) => {
      card.addEventListener("click", () => {
        const imdbId = card.dataset.imdbId;
        cargarDetallesPelicula(imdbId);
      });
    });
  }

  // Cargar detalles completos de la película
  async function cargarDetallesPelicula(imdbId) {
    try {
      const res = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${apiKey}`);
      const data = await res.json();

      if (data.Response === "True") {
        mostrarModal(data);
      }
    } catch (error) {
      console.error("Error al cargar detalles:", error);
    }
  }

  // Mostrar modal con detalles
  function mostrarModal(pelicula) {
    document.getElementById("modalTitle").textContent = pelicula.Title;
    document.getElementById("modalYear").textContent = pelicula.Year;
    document.getElementById("modalRated").textContent = pelicula.Rated || "N/A";
    document.getElementById("modalRuntime").textContent = pelicula.Runtime || "N/A";
    document.getElementById("modalGenre").textContent = pelicula.Genre || "N/A";
    document.getElementById("modalDirector").textContent = pelicula.Director || "N/A";
    document.getElementById("modalPlot").textContent = pelicula.Plot || "N/A";
    document.getElementById("modalRating").textContent = pelicula.imdbRating || "N/A";
    document.getElementById("modalPoster").src = pelicula.Poster !== "N/A" ? pelicula.Poster : "https://via.placeholder.com/200x300?text=No+Image";

    modal.style.display = "block";
  }

  // Cerrar modal
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  // Debounce en el input
  input.addEventListener("input", (e) => {
    buscarPeliculas(e.target.value.trim());
  });
}
