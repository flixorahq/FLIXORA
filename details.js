import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
const root=document.querySelector("#movie-detail"), id=new URLSearchParams(location.search).get("id");
const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
try{
 if(!id) throw new Error("Missing movie ID");
 const app=initializeApp(firebaseConfig), db=getFirestore(app), snap=await getDoc(doc(db,"movies",id));
 if(!snap.exists()) throw new Error("Movie not found");
 const m=snap.data();
 root.innerHTML=`<div class="detail-card">${m.image?`<img class="poster" src="${esc(m.image)}" alt="">`:''}<div><span class="tag">${esc(m.category||"Movie")}</span><h1>${esc(m.title)}</h1><p>${esc(m.description)}</p>${m.video?`<a class="button" target="_blank" rel="noopener noreferrer" href="${esc(m.video)}">Watch movie</a>`:''}<div class="download-box"><h2>Download</h2><p class="muted">Sponsored links are optional and clearly identified. After each visit, return here to continue.</p><button id="download">Continue to download</button><p id="download-msg" class="notice" aria-live="polite"></p></div></div></div>`;
 let step=0;
 document.querySelector("#download").addEventListener("click",()=>{
   const ads=[m.ad1,m.ad2].filter(Boolean), msg=document.querySelector("#download-msg");
   if(step<ads.length){const url=ads[step++]; msg.textContent=`Opening sponsored link ${step} of ${ads.length}. Return to this page when finished.`; window.open(url,"_blank","noopener,noreferrer");}
   else if(m.download){msg.textContent="Opening the download link."; window.open(m.download,"_blank","noopener,noreferrer");}
   else {msg.textContent="No download link has been added yet.";}
 });
}catch(e){root.innerHTML=`<p class="muted">${esc(e.message)}. Check Firebase setup or return to the home page.</p>`;}
