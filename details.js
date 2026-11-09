import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const root = document.querySelector("#movie-detail");
const id = new URLSearchParams(location.search).get("id");
const esc = s => String(s || "").replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

try {
  if (!id) throw new Error("Missing movie ID");
  const app = initializeApp(firebaseConfig), db = getFirestore(app), snap = await getDoc(doc(db, "movies", id));
  if (!snap.exists()) throw new Error("Movie not found");
  const m = snap.data();

  root.innerHTML = `
    <div class="detail-card">
      ${m.image ? `<img class="poster" src="${esc(m.image)}" alt="">` : ''}
      <div>
        <span class="tag">${esc(m.category || "Movie")}</span>
        <h1>${esc(m.title)}</h1>
        <p>${esc(m.description)}</p>
        
        ${m.video ? `
          <div style="margin-top: 18px;">
            <button id="watch-movie" class="watch-movie-button" type="button">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4V8z"/></svg>
              <span>WATCH ONLINE</span>
            </button>
            <p id="watch-msg" class="notice" aria-live="polite" style="margin-top: 8px;"></p>
          </div>
          <!-- ইন-পেজ ভিডিও প্লেয়ার কন্টেইনার -->
          <div id="player-container" style="display: none; margin-top: 20px; width: 100%; border-radius: 12px; overflow: hidden; border: 1px solid var(--line); background: #000;">
          </div>
        ` : ''}

        <div class="download-box">
          <h2>Download</h2>
          <p class="muted">Sponsored links are optional and clearly identified. After each visit, return here to continue.</p>
          <button id="download">Continue to download</button>
          <p id="download-msg" class="notice" aria-live="polite"></p>
        </div>
      </div>
    </div>
  `;

  // Watch Online Ad + In-Page Video Player Logic
  if (m.video) {
    let watchStep = 0;
    document.querySelector("#watch-movie").addEventListener("click", () => {
      const watchAds = [m.watchAd1, m.watchAd2].filter(Boolean);
      const watchMsg = document.querySelector("#watch-msg");
      const playerContainer = document.querySelector("#player-container");

      if (watchStep < watchAds.length) {
        // ১ ও ২ নম্বর ক্লিক: অ্যাড লিংকে যাবে
        const adUrl = watchAds[watchStep++];
        watchMsg.textContent = `Opening sponsor link ${watchStep} of ${watchAds.length}. Return to this page to continue.`;
        window.open(adUrl, "_blank", "noopener,noreferrer");
      } else {
        // ৩ নম্বর ক্লিক: পেজের ভেতরেই ভিডিও প্লেয়ার লোড হবে
        watchMsg.textContent = "Loading video player below...";
        playerContainer.style.display = "block";
        
        // যদি এম্বেড URL হয় তবে iframe, অন্যথায় কাস্টম iframe লোডার
        playerContainer.innerHTML = `
          <iframe 
            src="${esc(m.video)}" 
            width="100%" 
            height="400" 
            style="border:0;" 
            allowfullscreen 
            allow="autoplay; encrypted-media">
          </iframe>
        `;
        
        // ভিডিও চলা শুরু হলে প্লেয়ারের কাছে স্ক্রোল করে নিয়ে যাবে
        playerContainer.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Download Ad Click Logic
  let downloadStep = 0;
  document.querySelector("#download").addEventListener("click", () => {
    const ads = [m.ad1, m.ad2].filter(Boolean);
    const msg = document.querySelector("#download-msg");
    if (downloadStep < ads.length) {
      const url = ads[downloadStep++];
      msg.textContent = `Opening sponsored link ${downloadStep} of ${ads.length}. Return to this page when finished.`;
      window.open(url, "_blank", "noopener,noreferrer");
    } else if (m.download) {
      msg.textContent = "Opening the download link.";
      window.open(m.download, "_blank", "noopener,noreferrer");
    } else {
      msg.textContent = "No download link has been added yet.";
    }
  });

} catch (e) {
  root.innerHTML = `<p class="muted">${esc(e.message)}. Check Firebase setup or return to the home page.</p>`;
}
