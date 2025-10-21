let slideIndex = 1;

function plusSlides(n) {
    showSlides(slideIndex += n);
}

function currentSlide(n) {
    showSlides(slideIndex = n);
}

function showSlides(n) {
    let slides = document.getElementsByClassName("carrusel-item");
    let dots = document.getElementsByClassName("dot");

    if (slides.length === 0) return;

    if (n > slides.length) {
        slideIndex = 1;
    }
    if (n < 1) {
        slideIndex = slides.length;
    }

    for (let i = 0; i < slides.length; i++) {
        slides[i].classList.remove("active");
    }

    if (dots.length > 0) {
        for (let i = 0; i < dots.length; i++) {
            dots[i].classList.remove("active-dot");
        }
    }

    if (slides[slideIndex - 1]) {
        slides[slideIndex - 1].classList.add("active");
    }

    if (dots.length > 0 && dots[slideIndex - 1]) {
        dots[slideIndex - 1].classList.add("active-dot");
    }
}