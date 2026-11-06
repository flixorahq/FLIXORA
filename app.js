import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const grid = document.querySelector("#movie-grid");
const search = document.querySelector("#search");
const count = document.querySelector("#count");
const categoryList = document.querySelector("#category-list");
const featured = document.querySelector("#featured");
let movies = [];
let activeCategory = "all";

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function renderCategories() {
  const categories = [...new Set(movies.map(movie => (movie.category || "").trim()).filter(Boolean))];
  categoryList.innerHTML = [
    `<button class="category-chip ${activeCategory === "all" ? "active" : ""}" type="button" data-category="all">All</button>`,
    ...categories.map(category => `<button class="category-chip ${activeCategory === category ? "active" : ""}" type="button" data-category="${esc(category)}">${esc(category)}</button>`)
  ].join("");

  categoryList.querySelectorAll(".category-chip").forEach(button => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      renderCategories();
      renderMovies();
    });
  });
}

function renderFeatured() {
  const track = document.querySelector("#featured-track");
  if (!track) return;

  const featuredMovies = movies.filter(movie => movie.image).slice(0, 12);
  track.innerHTML = featuredMovies.length
    ? featuredMovies.map(movie => `
      <a class="featured-poster" href="details.html?id=${encodeURIComponent(movie.id)}" aria-label="View ${esc(movie.title || "movie")}">
        <img src="${esc(movie.image)}" alt="${esc(movie.title || "Movie poster")}" loading="lazy" onerror="this.closest('.featured-poster').remove()">
        <span class="featured-poster-title">${esc(movie.title || "Untitled")}</span>
      </a>`).join("")
    : '<p class="featured-empty">Add movie posters from the Admin Panel and they will appear here.</p>';
}

function renderMovies() {
  const term = search.value.trim().toLowerCase();
  const filtered = movies.filter(movie => {
    const matchesText = (movie.title || "").toLowerCase().includes(term) ||
      (movie.category || "").toLowerCase().includes(term);
    const matchesCategory = activeCategory === "all" || (movie.category || "").trim() === activeCategory;
    return matchesText && matchesCategory;
  });

  count.textContent = `${filtered.length} ${filtered.length === 1 ? "title" : "titles"}`;
  grid.innerHTML = filtered.length
    ? filtered.map(movie => `
      <a class="movie-card" href="details.html?id=${encodeURIComponent(movie.id)}">
        <div class="poster-wrap">
          <img src="${esc(movie.image || "")}" alt="${esc(movie.title || "Movie poster")}" loading="lazy" onerror="this.style.display='none'">
          <span class="poster-badge">${esc(movie.category || "MOVIE")}</span>
        </div>
        <div class="card-info">
          <span class="tag">${esc(movie.category || "Movie")}</span>
          <h3>${esc(movie.title || "Untitled")}</h3>
          <span class="card-open">View details <span aria-hidden="true">→</span></span>
        </div>
      </a>`).join("")
    : '<p class="empty-state">No movies found. Try another search or category.</p>';
}

search.addEventListener("input", renderMovies);

try {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const snapshot = await getDocs(query(collection(db, "movies"), orderBy("createdAt", "desc")));
  movies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderCategories();
  renderFeatured();
  renderMovies();
} catch (error) {
  grid.innerHTML = '<p class="empty-state">Movies could not be loaded. Please check the connection and try again.</p>';
  count.textContent = "";
  console.error("FLIXORA movie loading error:", error);
}

const featuredTrack = document.querySelector("#featured-track");
document.querySelector("#featured-prev")?.addEventListener("click", () => {
  featuredTrack?.scrollBy({ left: -featuredTrack.clientWidth * 0.8, behavior: "smooth" });
});
document.querySelector("#featured-next")?.addEventListener("click", () => {
  featuredTrack?.scrollBy({ left: featuredTrack.clientWidth * 0.8, behavior: "smooth" });
});
