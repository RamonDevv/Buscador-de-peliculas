import './style.css'
import { configurarBuscador } from './Search.js'


document.querySelector('#app').innerHTML = `
  <div>
    <h1>Movie Search</h1>
    <input id="Buscador" type="text" placeholder="Movie Title"/>
    <div id="movies-list" class="movies-list"></div>
    
    <!-- Modal -->
    <div id="movieModal" class="modal">
      <div class="modal-content">
        <span class="close">&times;</span>
        <div class="modal-body">
          <img id="modalPoster" src="" alt="Poster"/>
          <div class="modal-info">
            <h2 id="modalTitle"></h2>
            <p><strong>Año:</strong> <span id="modalYear"></span></p>
            <p><strong>Clasificación:</strong> <span id="modalRated"></span></p>
            <p><strong>Duración:</strong> <span id="modalRuntime"></span></p>
            <p><strong>Género:</strong> <span id="modalGenre"></span></p>
            <p><strong>Director:</strong> <span id="modalDirector"></span></p>
            <p><strong>Trama:</strong> <span id="modalPlot"></span></p>
            <p><strong>IMDb Rating:</strong> <span id="modalRating"></span></p>
          </div>
        </div>
      </div>
    </div>
  </div>
`

configurarBuscador();