let allMovies = [];
let currentPage = 1;
const PAGE_SIZE = 12;
let currentUser = null;
let carouselIndex = 0;
let carouselMovies = [];
let carouselTimer = null;

function renderCard(movie) {
  const inCart = currentUser?.cart?.includes(movie.id);
  const inFav = currentUser?.favourites?.includes(movie.id);
  return `
    <article class="card">
      <img src="${movie.Poster}" alt="${movie.Title}" class="card-img" loading="lazy"/>
      <div class="card-body">
      <h3><a href="https://www.imdb.com/find?q=${encodeURIComponent(movie.Title)}" target="_blank">${movie.Title}</a></h3>
        <div class="card-meta">
          <time datetime="${movie.Year}">${movie.Year}</time>
          <span>.</span>
          <span>${movie.Runtime}</span>
        </div>
        <div class="card-actions">
          <button onclick="handleCart('${movie.id}')">${inCart ? "🗑️" : "🛒"}</button>
          <button onclick="handleFavourite('${movie.id}')">${inFav ? "💔" : "❤️"}</button>
        </div>
      </div>
    </article>
  `;
}

function renderPagination() {
  const totalPages = Math.ceil(allMovies.length / PAGE_SIZE);
  const html = `
    <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}>&#8592;</button>
    <span>Page ${currentPage} of ${totalPages}</span>
    <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""}>&#8594;</button>
  `;
  document
    .querySelectorAll(".pagination")
    .forEach((el) => (el.innerHTML = html));
}

function renderPage(page) {
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  document.querySelector(".cards").innerHTML = allMovies
    .slice(start, end)
    .map(renderCard)
    .join("");
  renderPagination();
}

function changePage(page) {
  currentPage = page;
  renderPage(currentPage);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function requireAuth(action) {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!loggedInUser) {
    window.location.href = `/pages/login.html?redirect=${action}`;
    return null;
  }
  return loggedInUser;
}
async function handleCart(movieId) {
  const user = requireAuth("cart");
  if (!user) return;
  const inCart = currentUser.cart?.includes(movieId);
  if (inCart && !confirm("Remove this movie from your cart?")) return;
  currentUser.cart = inCart
    ? currentUser.cart.filter((id) => id !== movieId)
    : [...(currentUser.cart ?? []), movieId];
  await fetch(`${API_BASE}/users/${currentUser.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cart: currentUser.cart }),
  });
  const btn = document.querySelector(`[onclick="handleCart('${movieId}')"]`);
  if (btn) btn.textContent = inCart ? "🛒" : "🗑️";
}

async function handleFavourite(movieId) {
  const user = requireAuth("favourites");
  if (!user) return;
  const inFav = currentUser.favourites?.includes(movieId);
  if (inFav && !confirm("Remove this movie from your favourites?")) return;
  currentUser.favourites = inFav
    ? currentUser.favourites.filter((id) => id !== movieId)
    : [...(currentUser.favourites ?? []), movieId];
  await fetch(`${API_BASE}/users/${currentUser.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ favourites: currentUser.favourites }),
  });
  const btn = document.querySelector(
    `[onclick="handleFavourite('${movieId}')"]`,
  );
  if (btn) btn.textContent = inFav ? "❤️" : "💔";
}

function initCarousel() {
  carouselMovies = [...allMovies].sort(() => Math.random() - 0.5).slice(0, 6);
  const track = document.querySelector(".carousel-track");
  track.innerHTML = carouselMovies
    .map((movie) => {
      const hqPoster = movie.Poster?.replace(/\._V1_.*$/, "._V1_SX1000.jpg");
      return `
      <div class="carousel-slide">
      <div class="carousel-backdrop" style="background-image: url('${hqPoster}')"></div>
        <img src="${hqPoster}" alt="${movie.Title}" />
        <div class="carousel-slide-info">
          <h2>${movie.Title}</h2>
          <span>${movie.Year} · ${movie.Runtime}</span>
        </div>
      </div>
    `;
    })
    .join("");
  document.querySelector(".carousel-prev").addEventListener("click", () => {
    carouselIndex =
      (carouselIndex - 1 + carouselMovies.length) % carouselMovies.length;
    updateCarousel();
    resetCarouselTimer();
  });
  document.querySelector(".carousel-next").addEventListener("click", () => {
    carouselIndex = (carouselIndex + 1) % carouselMovies.length;
    updateCarousel();
    resetCarouselTimer();
  });

  startCarouselTimer();
}
function updateCarousel() {
  document.querySelector(".carousel-track").style.transform =
    `translateX(-${carouselIndex * 100}%)`;
}

function startCarouselTimer() {
  carouselTimer = setInterval(() => {
    carouselIndex = (carouselIndex + 1) % carouselMovies.length;
    updateCarousel();
  }, 4000);
}

function resetCarouselTimer() {
  clearInterval(carouselTimer);
  startCarouselTimer();
}

document.addEventListener("DOMContentLoaded", () => {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  const guestLinks = document.querySelector(".guest-links");
  const userLinks = document.querySelector(".user-links");
  const greeting = document.querySelector(".user-greeting");
  const logoutBtn = document.querySelector(".btn-logout");

  async function getMovies() {
    document.querySelector(".cards").innerHTML =
      '<p class="loading">Loading movies...</p>';
    try {
      const movieRes = await fetch(`${API_BASE}/movies`);
      if (!movieRes.ok) throw new Error(`HTTP error: ${movieRes.status}`);
      allMovies = await movieRes.json();
      initCarousel();
      if (loggedInUser) {
        const userRes = await fetch(`${API_BASE}/users/${loggedInUser.id}`);
        currentUser = await userRes.json();
      }
      renderPage(currentPage);
    } catch (error) {
      console.error(error.message);
      document.querySelector(".cards").innerHTML =
        '<p class="error">Failed to load movies.</p>';
    }
  }

  getMovies();
  document.getElementById("search-input").addEventListener("input", (e) => {
    const query = e.target.value.trim().toLowerCase();
    const carousel = document.querySelector(".carousel");

    if (!query) {
      carousel.style.display = "flex";
      renderPage(currentPage);
      return;
    }

    carousel.style.display = "none";
    const filtered = allMovies.filter((movie) =>
      movie.Title.toLowerCase().includes(query),
    );
    const html = filtered.length
      ? filtered.map(renderCard).join("")
      : '<p class="error">No movies found.</p>';
    document.querySelector(".cards").innerHTML = html;
    document
      .querySelectorAll(".pagination")
      .forEach((el) => (el.innerHTML = ""));
  });

  if (loggedInUser) {
    guestLinks.style.display = "none";
    userLinks.style.display = "flex";
    greeting.textContent = `Hi, ${loggedInUser.name}`;
  } else {
    guestLinks.style.display = "flex";
    userLinks.style.display = "none";
  }

  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("loggedInUser");
    window.location.reload();
  });
});
