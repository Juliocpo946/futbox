class MediaLightbox {
    constructor(lightboxId) {
        this.lightbox = document.getElementById(lightboxId);
        this.inner = this.lightbox?.querySelector('.media-lightbox-carousel-inner');
        this.closeBtn = this.lightbox?.querySelector('.lightbox-close');
        this.prevBtn = this.lightbox?.querySelector('.media-lightbox-control.prev');
        this.nextBtn = this.lightbox?.querySelector('.media-lightbox-control.next');
        this.items = [];
        this.currentIndex = 0;
        this.init();
    }

    init() {
        if (!this.lightbox) return;
        this.closeBtn?.addEventListener('click', () => this.close());
        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) this.close();
        });
        this.prevBtn?.addEventListener('click', () => this.showSlide(this.currentIndex - 1));
        this.nextBtn?.addEventListener('click', () => this.showSlide(this.currentIndex + 1));
    }

    open(items, startIndex = 0) {
        if (!items || items.length === 0 || !this.lightbox || !this.inner) return;
        this.items = items;
        this.currentIndex = startIndex;
        this.render();
        this.lightbox.classList.add('visible');
    }

    close() {
        if (!this.lightbox) return;
        this.lightbox.classList.remove('visible');
        if (this.inner) this.inner.innerHTML = '';
        this.lightbox.querySelectorAll('video').forEach(v => v.pause());
    }

    render() {
        if (!this.inner || this.items.length === 0) return;
        this.inner.innerHTML = this.items.map((item, index) => {
            let content;
            if (item.media_type === 'image') {
                content = `<img src="${item.path}" alt="Media ${index + 1}">`;
            } else if (item.media_type === 'video') {
                content = `<video controls preload="metadata"><source src="${item.path}" type="video/mp4">Video no soportado.</video>`;
            } else {
                content = `<span>Archivo no soportado</span>`;
            }
            return `<div class="media-lightbox-carousel-item ${index === this.currentIndex ? 'active' : ''}">${content}</div>`;
        }).join('');
        this.updateControls();
    }

    showSlide(index) {
        if (!this.inner || index < 0 || index >= this.items.length) return;
        const items = this.inner.querySelectorAll('.media-lightbox-carousel-item');
        if (items[this.currentIndex]) {
            items[this.currentIndex].classList.remove('active');
            const video = items[this.currentIndex].querySelector('video');
            if (video) video.pause();
        }
        this.currentIndex = index;
        if (items[this.currentIndex]) {
            items[this.currentIndex].classList.add('active');
        }
        this.updateControls();
    }

    updateControls() {
        if (!this.prevBtn || !this.nextBtn) return;
        const total = this.items.length;
        if (total <= 1) {
            this.prevBtn.style.display = 'none';
            this.nextBtn.style.display = 'none';
        } else {
            this.prevBtn.style.display = 'block';
            this.nextBtn.style.display = 'block';
            this.prevBtn.disabled = this.currentIndex === 0;
            this.nextBtn.disabled = this.currentIndex === total - 1;
        }
    }
}

window.MediaLightbox = MediaLightbox;