let slideIndex = 1;
showSlides(slideIndex);

function plusSlides(n) {
    showSlides(slideIndex += n);
}

function currentSlide(n) {
    showSlides(slideIndex = n);
}

function showSlides(n) {
    let i;
    let slides = document.getElementsByClassName("carrusel-item");
    let dots = document.getElementsByClassName("dot");

    if (n > slides.length) {
        slideIndex = 1
    }
    if (n < 1) {
        slideIndex = slides.length
    }

    // Oculta todos los slides quitando la clase 'active'
    for (i = 0; i < slides.length; i++) {
        slides[i].classList.remove("active");
    }

    // Quita el estado 'active-dot' de todos los puntos
    for (i = 0; i < dots.length; i++) {
        dots[i].classList.remove("active-dot");
    }

    // Muestra el slide actual añadiendo la clase 'active' y el punto correspondiente
    slides[slideIndex - 1].classList.add("active");
    dots[slideIndex - 1].classList.add("active-dot");
}