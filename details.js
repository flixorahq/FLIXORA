import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const root = document.querySelector("#movie-detail");
const id = new URLSearchParams(location.search).get("id");
const esc = s => String(s || "").replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

// ---- Description থেকে "Key: value" তথ্য আলাদা করার সহায়ক ফাংশন ----
const KEYS = ["iMDB Rating", "IMDb Rating", "Rating", "Genre", "Stars", "Cast", "Director",
  "Language", "Quality", "Runtime", "Release Date", "Year", "Size", "Format",
  "Synopsis", "Storyline", "Plot"];

function parseInfo(text) {
  const t = String(text || "").replace(/\r/g, "");
  const re = new RegExp("\\b(" + KEYS.join("|") + ")\\s*:", "gi");
  const hits = [];
  let x;
  while ((x = re.exec(t))) hits.push({ key: x[1], start: x.index, end: re.lastIndex });
  if (!hits.length) return { rows: [], intro: t.trim() };
  const intro = t.slice(0, hits[0].start).trim();
  const rows = hits.map((h, i) => ({
    key: h.key,
    value: t.slice(h.end, i + 1 < hits.length ? hits[i + 1].start : undefined).trim()
  }));
  return { rows, intro };
}

function labelOf(k) {
  const l = k.toLowerCase();
  if (l === "imdb rating") return "IMDb";
  if (l === "cast") return "Stars";
  return k.replace(/\b\w/g, c => c.toUpperCase());
}

function valueHtml(k, v) {
  if (/imdb/i.test(k) && /^x\s*\/\s*10$/i.test(v)) return "—";
  if (v.includes("|")) {
    const tags = v.split("|").map(s => s.trim()).filter(Boolean);
    return `<div class="tag-list">${tags.map(s => `<span>${esc(s)}</span>`).join("")}</div>`;
  }
  return esc(v);
}

try {
  if (!id) throw new Error("Missing movie ID");
  const app = initializeApp(firebaseConfig), db = getFirestore(app), snap = await getDoc(doc(db, "movies", id));
  if (!snap.exists()) throw new Error("Movie not found");
  const m = snap.data();

  document.title = `${m.title || "Movie"} — FLIXORA`;

  const info = parseInfo(m.description);
  const cats = String(m.category || "Movie").split(/[,|]/).map(s => s.trim()).filter(Boolean);
  const lang = info.rows.find(r => /^language$/i.test(r.key));
  const story = info.rows.find(r => /^(synopsis|storyline|plot)$/i.test(r.key));
  const rows = info.rows.filter(r => r !== story && r.value);
  const synopsis = story ? story.value : info.intro;

  root.innerHTML = `
    <section class="movie-hero">
      <div class="movie-hero-inner">
        ${m.image ? `<img class="poster" src="${esc(m.image)}" alt="${esc(m.title)} poster">` : ''}
        <div class="movie-hero-text">
          <span class="tag">${esc(cats.join(" · "))}</span>
          <h1>${esc(m.title)}</h1>
          ${lang ? `<div class="pills"><span>${esc(lang.value)}</span></div>` : ''}
        </div>
      </div>
    </section>

    ${m.video ? `
      <div class="detail-actions">
        <button id="watch-movie" class="watch-movie-button" type="button">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4V8z"/></svg>
          <span>WATCH ONLINE</span>
        </button>
        <p id="watch-msg" class="notice" aria-live="polite" style="margin-top: 8px;"></p>
      </div>
    ` : ''}

    ${rows.length ? `
      <section class="info-card">
        <h2>Details</h2>
        <dl class="info-list">
          ${rows.map(r => `<dt>${esc(labelOf(r.key))}</dt><dd>${valueHtml(r.key, r.value)}</dd>`).join("")}
        </dl>
      </section>
    ` : ''}

    ${synopsis ? `
      <section class="info-card">
        <h2>Synopsis</h2>
        <p>${esc(synopsis)}</p>
      </section>
    ` : ''}

    <div class="download-box">
      <h2>Download</h2>
      <p class="muted">Sponsored links are optional and clearly identified. After each visit, return here to continue.</p>
      <button id="download">Continue to download</button>
      <p id="download-msg" class="notice" aria-live="polite"></p>
    </div>
  `;

  // পোস্টারের ঝাপসা ব্যানার ব্যাকগ্রাউন্ড
  if (m.image) {
    root.querySelector(".movie-hero").style.setProperty("--poster", `url("${String(m.image).replace(/"/g, "%22")}")`);
  }

  // Watch Online Ad + External Video Link Logic
  if (m.video) {
    let watchStep = 0;
    document.querySelector("#watch-movie").addEventListener("click", () => {
      const watchAds = [m.watchAd1, m.watchAd2].filter(Boolean);
      const watchMsg = document.querySelector("#watch-msg");

      if (watchStep < watchAds.length) {
        const adUrl = watchAds[watchStep++];
        watchMsg.textContent = `Opening sponsor link ${watchStep} of ${watchAds.length}. Return to this page to continue.`;
        window.open(adUrl, "_blank", "noopener,noreferrer");
      } else {
        watchMsg.textContent = "Opening video link...";
        window.open(m.video, "_blank", "noopener,noreferrer");
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
