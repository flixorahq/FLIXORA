
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = (selector) => document.querySelector(selector);

const loginPanel = $("#login-panel");
const editor = $("#editor-panel");

// Admin login
$("#login").onclick = async () => {
  const email = $("#email").value.trim();
  const password = $("#password").value;

  if (!email || !password) {
    $("#login-msg").textContent = "ইমেইল ও পাসওয়ার্ড দিন।";
    return;
  }

  $("#login").disabled = true;
  $("#login-msg").textContent = "লগইন হচ্ছে...";

  try {
    await signInWithEmailAndPassword(auth, email, password);
    $("#login-msg").textContent = "লগইন সফল হয়েছে।";
  } catch (error) {
    console.error("Login error:", error);
    $("#login-msg").textContent =
      "Login failed: " + (error.code || error.message);
  } finally {
    $("#login").disabled = false;
  }
};

// Admin logout
$("#logout").onclick = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    alert("লগআউট করা যায়নি।");
  }
};

// Check login status
onAuthStateChanged(
  auth,
  (user) => {
    loginPanel.classList.toggle("hidden", !!user);
    editor.classList.toggle("hidden", !user);

    if (user) {
      loadList();
    }
  },
  (error) => {
    console.error("Authentication error:", error);
    $("#login-msg").textContent =
      "Authentication error: " + error.code;
  }
);

// Get form values
function values() {
  return {
    title: $("#title").value.trim(),
    description: $("#description").value.trim(),
    image: $("#image").value.trim(),
    category: $("#category").value.trim(),
    video: $("#video").value.trim(),
    download: $("#download").value.trim(),
    ad1: $("#ad1").value.trim(),
    ad2: $("#ad2").value.trim()
  };
}

// Add or update movie
$("#movie-form").onsubmit = async (event) => {
  event.preventDefault();

  if (!auth.currentUser) {
    $("#save-msg").textContent = "আগে Admin লগইন করুন।";
    return;
  }

  const data = values();
  const id = $("#movie-id").value;

  try {
    if (id) {
      await updateDoc(doc(db, "movies", id), data);
      $("#save-msg").textContent = "Movie updated successfully.";
    } else {
      await addDoc(collection(db, "movies"), {
        ...data,
        createdAt: serverTimestamp()
      });
      $("#save-msg").textContent = "Movie added successfully.";
    }

    $("#movie-form").reset();
    $("#movie-id").value = "";
    await loadList();

  } catch (error) {
    console.error("Save error:", error);
    $("#save-msg").textContent =
      "Save failed: " + error.code;
  }
};

// Clear form
$("#clear").onclick = () => {
  $("#movie-form").reset();
  $("#movie-id").value = "";
  $("#save-msg").textContent = "";
};

// Load movie list
async function loadList() {
  const list = $("#admin-list");
  list.textContent = "Loading movies...";

  try {
    const snapshot = await getDocs(collection(db, "movies"));
    list.replaceChildren();

    if (snapshot.empty) {
      list.textContent = "No movies yet.";
      return;
    }

    snapshot.forEach((movieDoc) => {
      const movie = movieDoc.data();

      const row = document.createElement("div");
      row.className = "admin-row";

      const title = document.createElement("b");
      title.textContent = movie.title || "Untitled";

      const actions = document.createElement("span");

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "secondary";
      editButton.textContent = "Edit";

      editButton.onclick = () => {
        $("#movie-id").value = movieDoc.id;

        for (const key of [
          "title",
          "description",
          "image",
          "category",
          "video",
          "download",
          "ad1",
          "ad2"
        ]) {
          $("#" + key).value = movie[key] || "";
        }

        $("#save-msg").textContent = "Editing movie.";
        window.scrollTo({ top: 0, behavior: "smooth" });
      };

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "danger";
      deleteButton.textContent = "Delete";

      deleteButton.onclick = async () => {
        if (!confirm("Are you sure you want to delete this movie?")) {
          return;
        }

        try {
          await deleteDoc(doc(db, "movies", movieDoc.id));
          await loadList();
        } catch (error) {
          console.error("Delete error:", error);
          alert("Delete failed: " + error.code);
        }
      };

      actions.append(editButton, deleteButton);
      row.append(title, actions);
      list.append(row);
    });

  } catch (error) {
    console.error("Load error:", error);
    list.textContent =
      "Could not load movies: " + error.code;
  }
}
