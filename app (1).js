import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
const grid=document.querySelector("#movie-grid"), search=document.querySelector("#search"), count=document.querySelector("#count");
let movies=[];
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function render(){
 const term=search.value.trim().toLowerCase();
 const filtered=movies.filter(m=>(m.title||"").toLowerCase().includes(term)||(m.category||"").toLowerCase().includes(term));
 count.textContent=`${filtered.length} titles`;
 grid.innerHTML=filtered.length?filtered.map(m=>`<a class="movie-card" href="details.html?id=${encodeURIComponent(m.id)}"><img src="${esc(m.image||"")}" alt="" loading="lazy" onerror="this.style.display='none'"><div class="card-info"><span class="tag">${esc(m.category||"Movie")}</span><h3>${esc(m.title||"Untitled")}</h3></div></a>`).join(""):'<p class="muted">No movies found.</p>';
}
search.addEventListener("input",render);
try{
 const app=initializeApp(firebaseConfig), db=getFirestore(app);
 const snap=await getDocs(query(collection(db,"movies"),orderBy("createdAt","desc")));
 movies=snap.docs.map(d=>({id:d.id,...d.data()})); render();
}catch(e){grid.innerHTML='<p class="muted">Connect Firebase and publish your first movie from the admin panel. See README.txt for setup.</p>';count.textContent="";console.error(e);}
