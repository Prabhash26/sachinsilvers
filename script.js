/* =====================  SETTINGS (edit these)  ===================== */
const ADMIN_PASSWORD = "admin123";               // change this!
const WHATSAPP = "919876543210";                 // country code + number, no + or spaces
const CONTACT = {
  address: "Shop No. 12, Main Market, Your City",
  phone:   "+91 98765 43210",
  email:   "info@sachinsilvers.com",
  hours:   "Mon – Sat, 10:00 AM – 8:00 PM"
};
/* ================================================================= */

const $ = id => document.getElementById(id);

// Images named like "ii1" are found automatically: it tries .png .jpg .jpeg .webp ... in this
// folder and in an "images" folder. If none is found, a "not found" box shows the file name needed.
const EXTS = [".png", ".jpg", ".jpeg", ".webp", ".PNG", ".JPG", ".JPEG", ".avif", ".jfif"];
const FOLDERS = ["", "images/"];
const foundImg = {};
function missingImg(name) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='#2a2a2e'/>` +
    `<text x='50%' y='46%' fill='#fff' font-size='24' text-anchor='middle' font-family='sans-serif'>Image not found</text>` +
    `<text x='50%' y='56%' fill='#ffb3c1' font-size='22' text-anchor='middle' font-family='sans-serif'>${name}.png</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
function setImg(el, src) {
  if (/^data:|\.(png|jpe?g|webp|gif|avif)$/i.test(src)) { el.onerror = el.onload = null; el.src = src; return; }
  if (foundImg[src]) { el.onerror = el.onload = null; el.src = foundImg[src]; return; }
  const tries = [];
  FOLDERS.forEach(f => EXTS.forEach(x => tries.push(f + src + x)));
  let i = 0;
  el.onerror = () => {
    i++;
    if (i < tries.length) el.src = tries[i];
    else { el.onerror = el.onload = null; el.src = missingImg(src); }
  };
  el.onload = () => { foundImg[src] = tries[i]; };
  el.src = tries[0];
}
document.querySelectorAll("img[data-base]").forEach(el => setImg(el, el.dataset.base));
const KEY = "silverProductsV2";
// Products: this browser's own copy (admin edits) if it exists, otherwise the published products.json
let localCopy = null;
try { localCopy = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
let products = Array.isArray(localCopy) ? localCopy : [];
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fixIds = () => {
  products = products.filter(p => !/^d[1-9]$/.test(p.id || ""));   // remove old sample products
  products.forEach(p => { if (!p.id) p.id = newId(); });
};
fixIds();
let isAdmin = sessionStorage.getItem("isAdmin") === "1";
let queue = [];   // images waiting to be added

/* ---------- Contact ---------- */
$("cAddress").textContent = CONTACT.address;
$("cPhone").textContent = CONTACT.phone;
$("cPhone").href = "tel:" + CONTACT.phone.replace(/\s/g, "");
$("cEmail").textContent = CONTACT.email;
$("cEmail").href = "mailto:" + CONTACT.email;
$("cHours").textContent = CONTACT.hours;
$("year").textContent = new Date().getFullYear();
$("fAddress").textContent = CONTACT.address;
$("fPhone").textContent = CONTACT.phone;
$("fEmail").textContent = CONTACT.email;
document.querySelectorAll(".wa-link").forEach(a => {
  a.href = `https://wa.me/${WHATSAPP}`; a.target = "_blank"; a.rel = "noopener";
});

/* ---------- Render products ---------- */
const priceText = p => p.price ? "Wholesale: " + p.price : "Price on request";

function makeCard(p, withDel) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    ${withDel ? `<button class="del" data-id="${p.id}" title="Delete">✕</button>` : ""}
    <div class="imgwrap"><img alt="" loading="lazy"></div>
    <div class="info"><h3></h3><div class="price"></div><div class="badge"></div>
    <a class="enquire" target="_blank" rel="noopener">Enquire on WhatsApp</a></div>`;
  setImg(card.querySelector("img"), p.img);
  card.querySelector("img").alt = p.name;
  card.querySelector("h3").textContent = p.name;
  card.querySelector(".price").textContent = priceText(p);
  const b = card.querySelector(".badge");
  if (p.moq) b.textContent = "Min. order: " + p.moq; else b.remove();
  card.querySelector(".enquire").href =
    `https://wa.me/${WHATSAPP}?text=` + encodeURIComponent("Hello, I want a bulk quote for: " + p.name);
  card.addEventListener("click", e => {
    if (e.target.closest(".del, .enquire")) return;
    location.hash = "#product/" + p.id;
  });
  // Hover: show the product's next photos without opening it
  const list = (p.imgs && p.imgs.length) ? p.imgs : [p.img];
  if (list.length > 1) {
    const alt = document.createElement("img");
    alt.className = "alt"; alt.alt = "";
    card.querySelector(".imgwrap").appendChild(alt);
    let timer = null, k = 0;
    const show = i => { setImg(alt, list[i]); alt.classList.add("on"); };
    card.addEventListener("mouseenter", () => {
      k = 1; show(k);
      if (list.length > 2) timer = setInterval(() => {
        k = (k + 1) % list.length;
        if (k === 0) alt.classList.remove("on"); else show(k);   // back to first photo, then repeat
      }, 1100);
    });
    card.addEventListener("mouseleave", () => { clearInterval(timer); alt.classList.remove("on"); });
  }
  if (p.imgs && p.imgs.length > 1) {
    const sp = document.createElement("span"); sp.className = "photos"; sp.textContent = "📷 " + p.imgs.length; card.appendChild(sp);
  }
  return card;
}

function render() {
  const grid = $("productGrid"), prev = $("previewGrid");
  grid.innerHTML = ""; prev.innerHTML = "";
  $("emptyMsg").classList.toggle("hidden", products.length > 0);
  products.forEach(p => grid.appendChild(makeCard(p, isAdmin)));
  products.slice(0, 4).forEach(p => prev.appendChild(makeCard(p, false)));

  grid.querySelectorAll(".del").forEach(btn =>
    btn.addEventListener("click", () => {
      if (confirm("Delete this product?")) { products = products.filter(x => x.id !== btn.dataset.id); save(); render(); }
    })
  );

  $("adminPanel").classList.toggle("hidden", !isAdmin);
  if (products.length) { setImg($("aboutImg"), products[0].img); $("aboutImg").classList.remove("hidden"); $("aboutMono").classList.add("hidden"); }
  else { $("aboutImg").classList.add("hidden"); $("aboutMono").classList.remove("hidden"); }
  $("loginBtn").classList.toggle("hidden", isAdmin);
  $("logoutBtn").classList.toggle("hidden", !isAdmin);
  if (curProduct && document.body.classList.contains("pv")) { buildThumbs(); $("ppAdmin").classList.toggle("hidden", !isAdmin); }
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(products)); return true; }
  catch (e) { alert("Storage is full. Please delete some products."); return false; }
}

/* ---------- Image processing ---------- */
const MAX_SIZE = 1000;   // longest side in pixels (bigger = sharper full screen, more storage)

function loadBase(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const s = Math.min(1, MAX_SIZE / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, c.width, c.height);  // transparent PNG -> black
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Edge-aware fill from the borders: only paints pixels that look like the
// background AND are almost the same colour as the pixel they were reached from,
// so it stops at the jewellery edge instead of leaking into it.
function blackenBackground(ctx, w, h, tol) {
  const data = ctx.getImageData(0, 0, w, h), px = data.data;
  const EDGE = 14;
  const cs = [0, (w-1)*4, (h-1)*w*4, ((h-1)*w + w-1)*4];
  const bg = [0,1,2].map(k => cs.reduce((s, i) => s + px[i+k], 0) / 4);
  const dist = (i, r, g, b) => Math.hypot(px[i]-r, px[i+1]-g, px[i+2]-b);

  const seen = new Uint8Array(w * h), stack = [];
  const seed = (x, y) => stack.push(y*w + x, -1);
  for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h-1); }
  for (let y = 0; y < h; y++) { seed(0, y); seed(w-1, y); }

  while (stack.length) {
    const par = stack.pop(), idx = stack.pop();
    if (seen[idx]) continue;
    const i = idx * 4;
    if (dist(i, bg[0], bg[1], bg[2]) > tol) continue;
    if (par >= 0 && dist(i, px[par*4], px[par*4+1], px[par*4+2]) > EDGE) continue;
    seen[idx] = 1;
    const x = idx % w, y = (idx - x) / w;
    const r = px[i], g = px[i+1], b = px[i+2];
    px[i] = px[i+1] = px[i+2] = 0;
    // neighbours compare against this pixel's ORIGINAL colour
    const nb = [];
    if (x+1 < w) nb.push(idx+1); if (x > 0) nb.push(idx-1);
    if (y+1 < h) nb.push(idx+w); if (y > 0) nb.push(idx-w);
    for (const n of nb) {
      if (seen[n]) continue;
      const j = n*4;
      if (dist(j, bg[0], bg[1], bg[2]) <= tol && Math.hypot(px[j]-r, px[j+1]-g, px[j+2]-b) <= EDGE)
        stack.push(n, idx);
    }
  }
  ctx.putImageData(data, 0, 0);
}

function renderBase(base, q) {
  const c = document.createElement("canvas");
  c.width = base.width; c.height = base.height;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(base, 0, 0);
  if (q.mode === "black") blackenBackground(ctx, c.width, c.height, q.tol);
  return c.toDataURL("image/jpeg", 0.82);
}
function buildImage(q) { q.imgs = q.bases.map(b => renderBase(b, q)); q.img = q.imgs[0]; }

/* ---------- Upload queue ---------- */
async function loadFiles() {
  const files = [...$("pImages").files];
  const one = $("uploadMode").value === "one";          // many photos -> ONE product
  queue = [];
  $("queue").innerHTML = "<p class='empty'>Processing images...</p>";
  const bases = [];
  for (const f of files) { try { bases.push(await loadBase(f)); } catch (e) { /* skip */ } }
  const groups = one ? (bases.length ? [bases] : []) : bases.map(b => [b]);
  groups.forEach(g => {
    const q = { bases: g, mode: "original", tol: 35, name: "", price: "", moq: "", desc: "" };
    buildImage(q); queue.push(q);
  });
  drawQueue();
}

function drawQueue() {
  const box = $("queue");
  box.innerHTML = "";
  queue.forEach((q, i) => {
    const row = document.createElement("div");
    row.className = "qitem";
    row.innerHTML = `<img><div class="fields">
      <input data-k="name"  placeholder="Product name (required)">
      <input data-k="price" placeholder="Wholesale price (e.g. ₹85 / gram)">
      <input data-k="moq"   placeholder="Minimum order (e.g. 50 pieces)">
      <textarea data-k="desc" placeholder="Details (weight, size, finish, design info...)"></textarea></div>
      <button class="rm" title="Remove">✕</button>
      <div class="minis"></div>
      <div class="ctrl">
        <select class="mode">
          <option value="original">Original photo</option>
          <option value="black">Black background</option>
        </select>
        <span class="tolwrap hidden">Strength
          <input type="range" class="tol" min="10" max="120" step="1">
        </span>
      </div>`;
    const img = row.querySelector("img"), minis = row.querySelector(".minis");
    const refresh = () => {
      img.src = q.img; minis.innerHTML = "";
      if (q.imgs.length > 1) {
        q.imgs.forEach(s => { const m = document.createElement("img"); m.src = s; minis.appendChild(m); });
        const t = document.createElement("span"); t.textContent = q.imgs.length + " photos in this product"; minis.appendChild(t);
      }
    };
    refresh();
    row.querySelectorAll(".fields input, .fields textarea").forEach(inp => {
      inp.value = q[inp.dataset.k];
      inp.addEventListener("input", () => q[inp.dataset.k] = inp.value);
    });
    const mode = row.querySelector(".mode"), tol = row.querySelector(".tol"), wrap = row.querySelector(".tolwrap");
    mode.value = q.mode; tol.value = q.tol;
    wrap.classList.toggle("hidden", q.mode !== "black");
    mode.addEventListener("change", () => {
      q.mode = mode.value; wrap.classList.toggle("hidden", q.mode !== "black");
      buildImage(q); refresh();
    });
    let t;
    tol.addEventListener("input", () => {
      q.tol = +tol.value; clearTimeout(t);
      t = setTimeout(() => { buildImage(q); refresh(); }, 120);
    });
    row.querySelector(".rm").addEventListener("click", () => { queue.splice(i, 1); drawQueue(); });
    box.appendChild(row);
  });
  $("addBtn").classList.toggle("hidden", queue.length === 0);
}

$("pImages").addEventListener("change", loadFiles);
$("uploadMode").addEventListener("change", () => { if ($("pImages").files.length) loadFiles(); });

$("addBtn").addEventListener("click", () => {
  if (queue.some(q => !q.name.trim())) return alert("Please enter a name for every product.");
  const added = queue.map(q => ({
    name: q.name.trim(), price: q.price.trim(), moq: q.moq.trim(), desc: q.desc.trim(),
    img: q.imgs[0], imgs: q.imgs.length > 1 ? q.imgs : undefined,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  }));
  products = [...added, ...products];
  if (!save()) { products = products.slice(added.length); return; }
  queue = []; $("pImages").value = ""; drawQueue(); render();
});

/* ---------- Product photos: thumbnails, add/remove, full screen ---------- */
let curProduct = null, curIdx = 0, lbIdx = 0;
const imgsOf = p => (p.imgs && p.imgs.length) ? p.imgs : [p.img];

function buildThumbs() {
  const box = $("ppThumbs"), list = imgsOf(curProduct);
  box.innerHTML = "";
  box.classList.toggle("hidden", list.length < 2);
  list.forEach((src, i) => {
    const t = document.createElement("div"); t.className = "thumb";
    const im = document.createElement("img"); setImg(im, src); im.alt = curProduct.name + " photo " + (i + 1);
    t.appendChild(im);
    t.addEventListener("click", () => showPhoto(i));
    if (isAdmin && list.length > 1) {
      const x = document.createElement("button"); x.className = "thumb-x"; x.textContent = "✕"; x.title = "Remove this photo";
      x.addEventListener("click", e => { e.stopPropagation(); removePhoto(i); });
      t.appendChild(x);
    }
    box.appendChild(t);
  });
}
function showPhoto(i) {
  const list = imgsOf(curProduct);
  curIdx = (i + list.length) % list.length;
  setImg($("ppImg"), list[curIdx]);
  [...$("ppThumbs").children].forEach((t, k) => t.classList.toggle("on", k === curIdx));
}
function removePhoto(i) {
  if (!confirm("Remove this photo?")) return;
  const list = imgsOf(curProduct).filter((_, k) => k !== i);
  curProduct.imgs = list; curProduct.img = list[0];
  save(); render(); buildThumbs(); showPhoto(0);
}
$("ppAddPhotos").addEventListener("change", async e => {
  if (!curProduct) return;
  const old = imgsOf(curProduct), added = [];
  for (const f of [...e.target.files]) {
    try { added.push((await loadBase(f)).toDataURL("image/jpeg", 0.82)); } catch (err) { /* skip */ }
  }
  e.target.value = "";
  if (!added.length) return;
  curProduct.imgs = [...old, ...added]; curProduct.img = old[0];
  if (!save()) { curProduct.imgs = old; return; }
  render(); buildThumbs(); showPhoto(old.length);
});

function lbShow(i) {
  const n = imgsOf(curProduct).length;
  lbIdx = (i + n) % n;
  $("lbImg").src = $("ppThumbs").children[lbIdx].querySelector("img").src;
  $("lbCap").textContent = curProduct.name + (n > 1 ? `  (${lbIdx + 1}/${n})` : "");
}
function openViewer() {
  const n = imgsOf(curProduct).length;
  $("lbPrev").classList.toggle("hidden", n < 2); $("lbNext").classList.toggle("hidden", n < 2);
  lbShow(curIdx);
  const lb = $("lightbox"); lb.classList.remove("hidden");
  if (lb.requestFullscreen) lb.requestFullscreen().catch(() => {});
}
function closeViewer() {
  $("lightbox").classList.add("hidden");
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}
$("lbClose").addEventListener("click", closeViewer);
$("lbPrev").addEventListener("click", () => lbShow(lbIdx - 1));
$("lbNext").addEventListener("click", () => lbShow(lbIdx + 1));
$("lightbox").addEventListener("click", e => { if (!e.target.closest("button")) closeViewer(); });
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeViewer();
  if (!$("lightbox").classList.contains("hidden")) {
    if (e.key === "ArrowLeft") lbShow(lbIdx - 1);
    if (e.key === "ArrowRight") lbShow(lbIdx + 1);
  }
});
document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement) $("lightbox").classList.add("hidden"); });

/* ---------- Admin login (modal, no prompt box) ---------- */
function openLogin() { $("modal").classList.remove("hidden"); $("passErr").textContent = ""; $("passInput").value = ""; $("passInput").focus(); }
function closeLogin() { $("modal").classList.add("hidden"); }
function tryLogin() {
  if ($("passInput").value === ADMIN_PASSWORD) {
    isAdmin = true; sessionStorage.setItem("isAdmin", "1");
    closeLogin(); render(); location.hash = "#gallery";
    setTimeout(() => $("adminPanel").scrollIntoView({ behavior: "smooth" }), 150);
  } else $("passErr").textContent = "Wrong password. Try again.";
}
$("loginBtn").addEventListener("click", openLogin);
$("passOk").addEventListener("click", tryLogin);
$("passCancel").addEventListener("click", closeLogin);
$("passInput").addEventListener("keydown", e => { if (e.key === "Enter") tryLogin(); });
$("logoutBtn").addEventListener("click", () => { isAdmin = false; sessionStorage.removeItem("isAdmin"); render(); });
if (location.hash === "#admin" && !isAdmin) openLogin();

/* ---------- Page routing (#product/ID = product page) ---------- */
function route() {
  const h = location.hash;
  const m = h.match(/^#product\/(.+)$/);
  const page = $("productPage");
  document.body.classList.remove("pv", "gv");
  page.classList.add("hidden");
  const cur = (m || h === "#gallery") ? "#gallery" : (h || "#home");
  document.querySelectorAll(".nav nav a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === cur));

  if (h === "#gallery") {                       // separate Gallery page
    document.body.classList.add("gv");
    document.title = "Gallery – SachinSilvers";
    window.scrollTo(0, 0);
    return;
  }
  if (!m) {                                     // home page
    document.title = "SachinSilvers – Silver Jewellery Wholesale";
    const target = h.length > 1 ? $(h.slice(1)) : null;
    if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
    return;
  }
  const p = products.find(x => x.id === m[1]); // product page
  if (!p) { location.hash = "#gallery"; return; }
  document.body.classList.add("pv"); page.classList.remove("hidden");
  document.title = p.name + " – SachinSilvers";
  curProduct = p; $("ppImg").alt = p.name;
  $("ppImg").onclick = () => openViewer();
  buildThumbs(); showPhoto(0);
  $("ppAdmin").classList.toggle("hidden", !isAdmin);
  $("ppName").textContent = p.name;
  $("ppPrice").textContent = priceText(p);
  $("ppMoq").textContent = p.moq ? "Min. order: " + p.moq : "";
  $("ppMoq").classList.toggle("hidden", !p.moq);
  $("ppDesc").textContent = p.desc || "Contact us for full details of this design.";
  $("ppWa").href = `https://wa.me/${WHATSAPP}?text=` + encodeURIComponent("Hello, I want a bulk quote for: " + p.name);
  $("ppCall").href = "tel:" + CONTACT.phone.replace(/\s/g, "");
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);

/* ---------- Publish: export / load products.json ---------- */
$("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(products)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "products.json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});
$("resetBtn").addEventListener("click", () => {
  if (confirm("Remove the changes saved in this browser and load the published products.json?")) {
    localStorage.removeItem(KEY); location.reload();
  }
});

/* ---------- Start ---------- */
async function init() {
  if (!Array.isArray(localCopy)) {              // visitors / phone: load the published list
    try {
      const r = await fetch("products.json?t=" + Date.now(), { cache: "no-store" });
      if (r.ok) { const d = await r.json(); if (Array.isArray(d)) products = d; }
    } catch (e) { /* no products.json yet */ }
    fixIds();
  }
  render(); route();
}
init();
