import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const root = document.querySelector("#movie-detail");
const id = new URLSearchParams(location.search).get("id");

const esc = s => String(s || "").replace(/[&<>"']/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[c]));

// Read iframe code, video code, or direct video URL
function getMedia(value) {
  const input = String(value || "").trim();

  if (!input) return null;

  const parsed = new DOMParser().parseFromString(input, "text/html");

  const iframe = parsed.querySelector("iframe");

  let src = null;
  let type = "video";

  if (iframe) {
    src = iframe.getAttribute("src");
    type = "iframe";
  } else {
    const video = parsed.querySelector("video");
    const source = parsed.querySelector("video source");

    if (video || source) {
      src = source?.getAttribute("src") || video?.getAttribute("src");
      type = "video";
    } else if (!input.includes("<")) {
      src = input;
      type = "video";
    } else {
      return null;
    }
  }

  if (!src) return null;

  const decoder = document.createElement("textarea");
  decoder.innerHTML = src;
  src = decoder.value.trim();

  try {
    const url = new URL(src, location.href);

    if (!["https:", "http:"].includes(url.protocol)) {
      return null;
    }

    return { type, src: url.href };
  } catch {
    return null;
  }
}

// Display video player
function showVideo(value) {
  const player = document.querySelector("#video-player");
  const message = document.querySelector("#watch-msg");

  const media = getMedia(value);

  if (!media) {
    message.textContent = "Invalid Embed Code or video URL.";
    return;
  }

  player.replaceChildren();
  player.hidden = false;

  if (media.type === "iframe") {
    const iframe = document.createElement("iframe");

    iframe.src = media.src;
    iframe.title = "Movie video player";
    iframe.width = "100%";
    iframe.height = "100%";
    iframe.allowFullscreen = true;
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.style.border = "0";

    player.appendChild(iframe);

  } else {
    const video = document.createElement("video");

    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.controlsList = "nodownload";
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "contain";

    const source = document.createElement("source");
    source.src = media.src;

    video.appendChild(source);

    video.onerror = () => {
      message.textContent =
        "Video cannot play. Check video format, URL and server settings.";
    };

    video.oncanplay = () => {
      message.textContent = "Video is ready to play.";
    };

    player.appendChild(video);
  }

  message.textContent = "Video player loaded.";

  player.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

try {
  if (!id) throw new Error("Missing movie ID");

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const snap = await getDoc(doc(db, "movies", id));

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
          <div style="margin-top:18px;">
            <button id="watch-movie" class="watch-movie-button" type="button">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <path d="M10 8l6 4-6 4V8z"/>
              </svg>
              <span>WATCH ONLINE</span>
            </button>

            <p id="watch-msg" class="notice"
              aria-live="polite" style="margin-top:8px;"></p>
          </div>

          <div id="video-player" hidden
            style="margin-top:18px;width:100%;aspect-ratio:16/9;background:#000;border-radius:12px;overflow:hidden;">
          </div>
        ` : ''}

        <div class="download-box">
          <h2>Download</h2>

          <p class="muted">
            Sponsored links are optional and clearly identified.
            After each visit, return here to continue.
          </p>

          <button id="download">Continue to download</button>

          <p id="download-msg" class="notice"
            aria-live="polite"></p>
        </div>
      </div>
    </div>
  `;

  // Watch Online Ad + Video Player
  if (m.video) {
    let watchStep = 0;

    document.querySelector("#watch-movie").addEventListener("click", () => {
      const watchAds = [m.watchAd1, m.watchAd2].filter(Boolean);
      const watchMsg = document.querySelector("#watch-msg");

      if (watchStep < watchAds.length) {
        const adUrl = watchAds[watchStep++];

        watchMsg.textContent =
          `Opening sponsor link ${watchStep} of ${watchAds.length}. Return to this page to continue.`;

        window.open(adUrl, "_blank", "noopener,noreferrer");

      } else {
        showVideo(m.video);
      }
    });
  }

  // Download Ad Logic
  let downloadStep = 0;

  document.querySelector("#download").addEventListener("click", () => {
    const ads = [m.ad1, m.ad2].filter(Boolean);
    const msg = document.querySelector("#download-msg");

    if (downloadStep < ads.length) {
      const url = ads[downloadStep++];

      msg.textContent =
        `Opening sponsored link ${downloadStep} of ${ads.length}. Return to this page when finished.`;

      window.open(url, "_blank", "noopener,noreferrer");

    } else if (m.download) {
      msg.textContent = "Opening the download link.";
      window.open(m.download, "_blank", "noopener,noreferrer");

    } else {
      msg.textContent = "No download link has been added yet.";
    }
  });

} catch (e) {
  root.innerHTML = `
    <p class="muted">
      ${esc(e.message)}. Check Firebase setup or return to the home page.
    </p>
  `;
        }
