let currentUser = null;
let cartMovies = [];
let currentPage = 1;
const PAGE_SIZE = 12;

function renderCard(movie) {
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
          <button onclick="removeFromCart('${movie.id}')">Remove 🗑️</button>
        </div>
      </div>
    </article>
  `;
}

function renderPagination() {
  const totalPages = Math.ceil(cartMovies.length / PAGE_SIZE);
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
  const slice = cartMovies.slice(start, end);
  document.querySelector(".cards").innerHTML = slice.length
    ? slice.map(renderCard).join("")
    : "<p>Your cart is empty.</p>";
  renderPagination();
}

function changePage(page) {
  currentPage = page;
  renderPage(currentPage);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function removeFromCart(movieId) {
  if (!confirm("Remove this movie from your cart?")) return;
  currentUser.cart = currentUser.cart.filter((id) => id !== movieId);
  await fetch(`${API_BASE}/users/${currentUser.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cart: currentUser.cart }),
  });
  cartMovies = cartMovies.filter((m) => m.id !== movieId);
  document
    .querySelector(`[onclick="removeFromCart('${movieId}')"]`)
    ?.closest(".card")
    ?.remove();
  renderPagination();
}

document.addEventListener("DOMContentLoaded", async () => {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  const guestLinks = document.querySelector(".guest-links");
  const userLinks = document.querySelector(".user-links");
  const greeting = document.querySelector(".user-greeting");
  const logoutBtn = document.querySelector(".btn-logout");

  guestLinks.style.display = "none";
  userLinks.style.display = "flex";
  greeting.textContent = `Hi, ${loggedInUser.name}`;

  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("loggedInUser");
    window.location.replace("/");
  });

  try {
    document.querySelector(".cards").innerHTML =
      '<p class="loading">Loading...</p>';
    const userRes = await fetch(`${API_BASE}/users/${loggedInUser.id}`);
    currentUser = await userRes.json();

    const moviesRes = await fetch(`${API_BASE}/movies`);
    const allMovies = await moviesRes.json();

    cartMovies = allMovies.filter((m) => currentUser.cart?.includes(m.id));
    renderPage(currentPage);
    document.getElementById("search-input").addEventListener("input", (e) => {
      const query = e.target.value.trim().toLowerCase();
      if (!query) {
        renderPage(currentPage);
        return;
      }
      const filtered = cartMovies.filter((movie) =>
        movie.Title.toLowerCase().includes(query),
      );
      document.querySelector(".cards").innerHTML = filtered.length
        ? filtered.map(renderCard).join("")
        : '<p class="error">No movies found in cart.</p>';
      document
        .querySelectorAll(".pagination")
        .forEach((el) => (el.innerHTML = ""));
    });
  } catch (error) {
    console.error(error.message);
    document.querySelector(".cards").innerHTML =
      '<p class="error">Failed to load cart.</p>';
  }
});
