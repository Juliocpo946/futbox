class FiltrosPublicaciones {
    constructor(config) {
        this.searchForm = document.getElementById(config.searchFormId || 'search-form-nav');
        this.searchInput = document.getElementById(config.searchInputId || 'search-input-nav');
        this.mundialSelect = document.getElementById(config.mundialSelectId || 'mundial-filter-nav');
        this.tituloSeccion = document.getElementById(config.tituloSeccionId);
        this.onFilterChange = config.onFilterChange;
        
        this.currentSearchQuery = '';
        this.currentMundialId = '';
        this.currentCategoriaId = '';
        this.currentCategoriaNombre = '';
        
        this.init();
    }

    init() {
        this.cargarMundialesSelect();
        this.setupEventListeners();
        this.cargarFiltrosDesdeURL();
    }

    async cargarMundialesSelect() {
        if (!this.mundialSelect) return;
        try {
            const mundiales = await window.api.fetchAPI('/publicaciones/mundiales/');
            mundiales.sort((a, b) => b.año - a.año);
            mundiales.forEach(mundial => {
                const option = document.createElement('option');
                option.value = mundial.id;
                option.textContent = mundial.nombre ? `${mundial.nombre} (${mundial.año})` : `Mundial ${mundial.año}`;
                this.mundialSelect.appendChild(option);
            });
            if (this.currentMundialId) this.mundialSelect.value = this.currentMundialId;
        } catch (error) {
            console.error("Error al cargar mundiales para filtro:", error);
        }
    }

    setupEventListeners() {
        if (this.searchForm && this.searchInput) {
            this.searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.currentSearchQuery = this.searchInput.value.trim();
                this.aplicarFiltros();
            });
        }

        if (this.mundialSelect) {
            this.mundialSelect.addEventListener('change', (e) => {
                this.currentMundialId = e.target.value;
                this.aplicarFiltros();
            });
        }

        document.addEventListener('filterByCategory', (event) => {
            this.currentCategoriaId = event.detail.categoryId;
            this.currentCategoriaNombre = event.detail.categoryName;
            this.currentSearchQuery = '';
            this.currentMundialId = '';
            if (this.searchInput) this.searchInput.value = '';
            if (this.mundialSelect) this.mundialSelect.value = '';
            this.aplicarFiltros();
        });
    }

    cargarFiltrosDesdeURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.currentCategoriaId = urlParams.get('categoria') || '';
        this.currentMundialId = urlParams.get('mundial') || '';
        this.currentSearchQuery = urlParams.get('search') || '';
        
        if (this.currentSearchQuery && this.searchInput) {
            this.searchInput.value = this.currentSearchQuery;
        }

        if (this.currentCategoriaId) {
            this.cargarNombreCategoria();
        }
    }

    async cargarNombreCategoria() {
        try {
            const categorias = await window.api.fetchAPI('/publicaciones/categorias/');
            const cat = categorias.find(c => c.id == this.currentCategoriaId);
            if (cat) this.currentCategoriaNombre = cat.nombre;
        } catch (e) {
            console.error("Error obteniendo nombre de categoría inicial");
        }
    }

    aplicarFiltros() {
        this.actualizarTitulo();
        if (this.onFilterChange) {
            this.onFilterChange(this.getEndpointConFiltros());
        }
    }

    getEndpointConFiltros() {
        let endpoint = '/publicaciones/?';
        const params = [];
        if (this.currentSearchQuery) params.push(`search=${encodeURIComponent(this.currentSearchQuery)}`);
        if (this.currentMundialId) params.push(`mundial=${this.currentMundialId}`);
        if (this.currentCategoriaId) params.push(`categoria=${this.currentCategoriaId}`);
        return endpoint + params.join('&');
    }

    actualizarTitulo() {
        if (!this.tituloSeccion) return;
        let titulo = 'Comunidad';
        const filtros = [];
        
        if (this.currentCategoriaNombre) {
            filtros.push(`Categoría: "${this.currentCategoriaNombre}"`);
        }
        if (this.currentMundialId && this.mundialSelect) {
            const selectedOption = this.mundialSelect.options[this.mundialSelect.selectedIndex];
            if (selectedOption && selectedOption.value) {
                filtros.push(`Mundial: "${selectedOption.text}"`);
            }
        }
        if (this.currentSearchQuery) {
            filtros.push(`Búsqueda: "${this.currentSearchQuery}"`);
        }

        if (filtros.length > 0) {
            titulo = `Resultados para: ${filtros.join(', ')}`;
        }

        this.tituloSeccion.innerHTML = titulo;
    }

    getFiltrosActuales() {
        return {
            search: this.currentSearchQuery,
            mundial: this.currentMundialId,
            categoria: this.currentCategoriaId
        };
    }
}

window.FiltrosPublicaciones = FiltrosPublicaciones;