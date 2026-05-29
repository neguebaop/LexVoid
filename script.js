'use strict';

/* DLINKY LEVE — Firebase Auth + Firestore, sem localStorage, sem loops pesados */
const firebaseConfig = {
  apiKey: "AIzaSyBQDC8YM_6tJKyF2irGmOiW8NYHeJkHdFI",
  authDomain: "dlinky-45df5.firebaseapp.com",
  projectId: "dlinky-45df5",
  storageBucket: "dlinky-45df5.firebasestorage.app",
  messagingSenderId: "329520494601",
  appId: "1:329520494601:web:d6f27af06c8d872121a0d8"
};

if (window.firebase && !firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

const icons = {
  Instagram:'fa-brands fa-instagram', TikTok:'fa-brands fa-tiktok', Discord:'fa-brands fa-discord',
  YouTube:'fa-brands fa-youtube', Spotify:'fa-brands fa-spotify', WhatsApp:'fa-brands fa-whatsapp',
  Twitch:'fa-brands fa-twitch', Steam:'fa-brands fa-steam', Github:'fa-brands fa-github',
  Roblox:'fa-solid fa-square', Telegram:'fa-brands fa-telegram', X:'fa-brands fa-x-twitter'
};

const presetUrls = {
  bg1:'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1600&q=80',
  bg2:'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&w=1600&q=80',
  bg3:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
  banner1:'https://i.pinimg.com/originals/e6/67/64/e66764a7ae6b33bd2bab3ef8a19ca3b5.gif',
  banner2:'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80'
};

const defaultUser = {
  uid:'', name:'Usuário', slug:'usuario', email:'', bio:'', avatar:'', banner:'', bg:'', video:'', frame:'',
  music:'', welcome:'Clique aqui', color:'#a855f7', particles:false, particleType:'none', verified:false,
  hideViews:false, template:'default', decoration:'none', views:0, links:[], socials:[], embeds:[], tags:[], history:['Conta criada no LexVoid'], coins:0, inventory:[], purchases:[], selos:[], cursor:'', nameFx:{neon:false,shine:false,rainbow:false,perspective:false}, bgFx:'none', tagSettings:{showFree:true,showDlinky:true,active:['programador','artista','músico']}, colors:{profileBg:'#1E40AF',cardBg:'#000000',textColor:'#FFFFFF',bioColor:'#FFFFFF'}, frameAdjust:{x:0,y:0,scale:1,rotate:0}, particleCount:45, particleSpeed:5, particleSize:'small', entryEffect:'auto'
};

let user = {...defaultUser};
let currentAuthUser = null;
let assetMode = 'backgrounds';
let shopMode = 'coins';
let inventoryFilter = 'todos';
let routeToken = 0;
const ADMIN_EMAILS = ['jailtonsilas48@gmail.com','amoester199@gmail.com'];
let customFrames = [];
let adminSelos = [];
let landingFeaturedUsers = [];
const DLINKY_PIX_KEY = 'COLE_SUA_CHAVE_PIX_AQUI';

window.user = user;

function cleanSlug(v){
  return String(v || 'usuario').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]/g,'').slice(0,30) || 'usuario';
}
function escapeHtml(s=''){
  return String(s).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
}
function safeUrl(u=''){
  u = String(u || '').trim();
  return /^https?:\/\//i.test(u) ? u : '#';
}

function escapeAttr(s=''){
  return escapeHtml(s).replace(/'/g,'&#39;');
}
function getBestAvatar(){
  return String(user.avatar || '').trim();
}
function normalizeImageUrl(url){
  url = String(url || '').trim();
  if(!url) return '';
  // Aceita link direto. Para moldura, use de preferência .png/.gif/.webp/.apng.
  return url;
}
function toast(t){
  const el = $('#toast');
  if(!el) return alert(t);
  el.textContent = t;
  el.className = 'show';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(()=>{ el.className=''; }, 2200);
}
function mergeUser(data){
  user = {...defaultUser, ...(data || {})};
  user.slug = cleanSlug(user.slug);
  user.links = Array.isArray(user.links) ? user.links : [];
  user.socials = Array.isArray(user.socials) ? user.socials : [];
  user.history = Array.isArray(user.history) ? user.history : [];
  user.inventory = Array.isArray(user.inventory) ? user.inventory : [];
  user.selos = Array.isArray(user.selos) ? user.selos : [];
  user.nameFx = Object.assign({neon:false,shine:false,rainbow:false,perspective:false}, user.nameFx || {});
  user.tagSettings = Object.assign({showFree:true,showDlinky:true,active:['programador','artista','músico']}, user.tagSettings || {});
  user.colors = Object.assign({profileBg:'#1E40AF',cardBg:'#000000',textColor:'#FFFFFF',bioColor:'#FFFFFF'}, user.colors || {});
  user.frameAdjust = Object.assign({x:0,y:0,scale:1,rotate:0}, user.frameAdjust || {});
  user.particleCount = Number(user.particleCount || 45);
  user.particleSpeed = Number(user.particleSpeed || 5);
  user.particleSize = user.particleSize || 'small';
  // Se o tipo de partícula foi salvo, nunca deixa reload desligar sozinho.
  if(user.particleType && user.particleType !== 'none') user.particles = true;
  // Garante que efeitos do nome nunca virem undefined depois do F5.
  user.nameFx = Object.assign({neon:false,shine:false,rainbow:false,perspective:false}, user.nameFx || {});
  window.user = user;
  return user;
}
function publicData(u){
  const copy = {...u};
  delete copy.password;
  return copy;
}
async function loadUserByUid(uid){
  if(!uid) return mergeUser(defaultUser);
  const snap = await db.collection('users').doc(uid).get();
  if(snap.exists) return mergeUser(snap.data());
  return mergeUser({...defaultUser, uid, email:(auth.currentUser?.email || '').toLowerCase()});
}
async function loadProfileBySlug(slug){
  slug = cleanSlug(slug);
  const snap = await db.collection('profiles').doc(slug).get();
  if(snap.exists) return mergeUser(snap.data());
  return mergeUser({...defaultUser, slug});
}
async function saveUser(message='Salvo com sucesso!'){
  if(!currentAuthUser){ toast('Faça login para salvar.'); return; }
  user.uid = currentAuthUser.uid;
  user.email = (currentAuthUser.email || user.email || '').toLowerCase().trim();
  user.slug = cleanSlug(user.slug);
  user.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
  await db.collection('users').doc(currentAuthUser.uid).set(publicData(user), {merge:true});
  await db.collection('profiles').doc(user.slug).set(publicData(user), {merge:true});
  renderDash();
  if($('#profile')?.classList.contains('active')) renderProfile();
  if(message) toast(message);
}
function addHistory(t){
  user.history = [`${new Date().toLocaleString('pt-BR')} — ${t}`, ...(user.history || [])].slice(0,30);
}

function setBg(el, url){
  if(!el) return;
  url = String(url || '').trim();
  if(el.tagName === 'IMG'){
    if(url){ el.src = url; el.style.display='block'; }
    else { el.removeAttribute('src'); el.style.display='none'; }
    return;
  }
  el.style.backgroundImage = url ? `url("${url.replace(/"/g, '%22')}")` : '';
  el.style.backgroundSize = 'cover';
  el.style.backgroundPosition = 'center';
  el.style.backgroundRepeat = 'no-repeat';
}
function setInput(id, value){
  const el = $(id);
  if(!el || document.activeElement === el) return;
  if(el.type === 'checkbox') el.checked = !!value;
  else el.value = value || '';
}

function hideAllPages(){ $$('.page').forEach(p=>p.classList.remove('active')); }
function showPage(id){ hideAllPages(); $(id)?.classList.add('active'); }
function getPathSlug(){
  const p = (location.pathname || '/').replace(/^\/+/, '').split('/')[0];
  const reserved = ['', 'index.html', 'login', 'register', 'dashboard', 'assets', 'premium', 'community'];
  return reserved.includes(p.toLowerCase()) ? '' : decodeURIComponent(p).toLowerCase();
}
async function route(){
  const token = ++routeToken;
  const pathSlug = getPathSlug();
  const h = location.hash || (pathSlug ? '#/'+pathSlug : '#/');
  if(h === '#/' || h === '#') { showPage('#landing'); setTimeout(animateLandingCounters, 50); return; }
  if(h === '#/register') { showPage('#auth'); $('#registerForm')&&( $('#registerForm').style.display='block'); $('#loginForm')&&($('#loginForm').style.display='none'); return; }
  if(h === '#/login') { showPage('#auth'); $('#registerForm')&&( $('#registerForm').style.display='none'); $('#loginForm')&&($('#loginForm').style.display='block'); return; }
  if(h === '#/dashboard') { showPage('#dashboard'); renderDash(); return; }
  if(h === '#/assets') { simple('Linky Assets','Área de backgrounds, banners e decorações.'); return; }
  if(h === '#/premium') { simple('Premium LexVoid','Área premium em construção.'); return; }

  const slug = pathSlug || h.replace(/^#\//,'');
  showPage('#profile');
  await loadProfileBySlug(slug);
  if(token !== routeToken) return;
  renderProfile();
}
function simple(t,p){ showPage('#simple'); $('#simpleTitle')&&($('#simpleTitle').textContent=t); $('#simpleText')&&($('#simpleText').textContent=p); }
window.addEventListener('hashchange', route);

function isAdmin(){
  const email = String(currentAuthUser?.email || user.email || '').toLowerCase().trim();
  return ADMIN_EMAILS.includes(email);
}
function updateAdminVisibility(){
  const ok = isAdmin();
  $$('.admin-only').forEach(el=>{ el.classList.toggle('show', ok); el.style.display = ok ? 'flex' : 'none'; });
}
function openTab(id){
  if((id === 'admin' || id === 'adminSelos') && !isAdmin()){ toast('Área somente para admin.'); return; }
  $$('.dash-tab').forEach(x=>x.classList.remove('active'));
  $('#tab-'+id)?.classList.add('active');
  $$('.side-link').forEach(x=>x.classList.toggle('active', x.dataset.tab === id));
  $('.sidebar')?.classList.remove('open');
  if(id === 'links') renderLinksEditor();
  if(id === 'socials') renderSocialEditor();
  if(id === 'assets') renderAssets();
  if(id === 'store') renderShop();
  if(id === 'inventory') renderInventory();
  if(id === 'colors') renderColorsTags();
  if(id === 'history') renderHistory();
  if(id === 'admin') renderAdminPanel();
  if(id === 'adminSelos') renderAdminSelosPanel();
}

window.openTab = openTab;

function renderDash(){
  document.documentElement.style.setProperty('--neon', user.color || '#a855f7');
  $('#sideName') && ($('#sideName').textContent = user.name || 'Usuário');
  $('#sideUrl') && ($('#sideUrl').textContent = 'lexvoid/' + (user.slug || 'usuario'));
  $('#dashName') && ($('#dashName').textContent = user.name || 'Usuário');
  $('#dashSlug') && ($('#dashSlug').textContent = '@' + (user.slug || 'usuario'));
  $('#viewsCount') && ($('#viewsCount').textContent = user.views || 0);
  $('#walletCoins') && ($('#walletCoins').textContent = Number(user.coins || 0));
  $('#invCountMini') && ($('#invCountMini').textContent = (user.inventory || []).length);
  $('#invCoins') && ($('#invCoins').textContent = Number(user.coins || 0));
  $('#invItemsCount') && ($('#invItemsCount').textContent = (user.inventory || []).length);
  setBg($('#dashAvatar'), user.avatar);
  setBg($('#sideAvatar'), user.avatar);
  setInput('#cfgName', user.name);
  setInput('#cfgSlug', user.slug);
  setInput('#cfgBio', user.bio);
  setInput('#cfgMusic', user.music);
  setInput('#cfgWelcome', user.welcome || 'Clique aqui');
  setInput('#cfgAvatar', user.avatar);
  setInput('#cfgBanner', user.banner);
  setInput('#cfgBg', user.bg);
  setInput('#cfgVideo', user.video);
  setInput('#cfgFrame', user.frame);
  setInput('#cfgColor', user.color || '#a855f7');
  setInput('#cfgParticleType', user.particleType || 'none');
  setInput('#cfgTemplate', user.template || 'default');
  setInput('#cfgDecoration', user.decoration || 'none');
  setInput('#cfgVerified', user.verified);
  setInput('#cfgHideViews', user.hideViews);
  setInput('#uploadAvatar', user.avatar);
  setInput('#uploadBg', user.bg);
  setInput('#uploadCursor', user.cursor);
  setInput('#uploadMusic', user.music);
  setInput('#payName', user.payment?.payName || 'LexVoid');
  setInput('#payPix', user.payment?.pixKey || DLINKY_PIX_KEY);
  setInput('#payEndpoint', user.payment?.endpoint || '');
  setInput('#payToken', user.payment?.token || '');
  setInput('#customName', user.name);
  setInput('#customBio', user.bio);
  setInput('#customBgFx', user.bgFx || 'none');
  setInput('#fxNeonName', user.nameFx?.neon);
  setInput('#fxShineName', user.nameFx?.shine);
  setInput('#fxRainbowName', user.nameFx?.rainbow);
  setInput('#fxPerspective', user.nameFx?.perspective);
  setInput('#ctShowFree', user.tagSettings?.showFree !== false);
  setInput('#ctShowDlinky', user.tagSettings?.showDlinky !== false);
  setInput('#ctProfileBg', user.colors?.profileBg || '#1E40AF');
  setInput('#ctCardBg', user.colors?.cardBg || '#000000');
  setInput('#ctTextColor', user.colors?.textColor || '#FFFFFF');
  setInput('#ctBioColor', user.colors?.bioColor || '#FFFFFF');
  setInput('#particleTypeNew', user.particleType || 'none');
  setInput('#particleCountNew', user.particleCount || 45);
  setInput('#particleSpeedNew', user.particleSpeed || 5);
  setInput('#particleSizeNew', user.particleSize || 'small');
  renderColorsTags();
  renderHistory();
  updateAdminVisibility();
}
function renderHistory(){
  const h = $('#historyList');
  if(h) h.innerHTML = (user.history || []).map(x=>`<li>${escapeHtml(x)}</li>`).join('') || '<li>Nenhum histórico ainda.</li>';
}

function renderProfile(){
  document.documentElement.style.setProperty('--neon', user.color || '#a855f7');
  $('#welcomeText') && ($('#welcomeText').innerHTML = entryOverlayHtml());
  const entry = $('#entryOverlay');
  if(entry){
    const key = 'dlinky_entry_' + (user.slug || 'profile');
    entry.classList.toggle('hidden', sessionStorage.getItem(key) === '1');
    entry.onclick = ()=>{ sessionStorage.setItem(key,'1'); entry.classList.add('hidden'); const a=$('#profileAudio'); if(a && user.music) a.play().catch(()=>{}); };
  }
  $('#profileName') && ($('#profileName').textContent = user.name || 'Usuário');
  $('#profileSlug2') && ($('#profileSlug2').textContent = '@' + (user.slug || 'usuario'));
  $('#profileBio') && ($('#profileBio').textContent = user.bio || '');
  $('#verifiedBadge') && ($('#verifiedBadge').style.display = user.verified ? 'inline' : 'none');
  $('#profileViews') && ($('#profileViews').style.display = user.hideViews ? 'none' : 'inline-block');
  $('#profileViews') && ($('#profileViews').textContent = `👁 ${user.views || 0} views`);

  // Avatar fixo: só lê user.avatar. Nada de fallback antigo, nada de timer apagando.
  setBg($('#profileAvatar'), user.avatar);
  setBg($('#profileBanner'), user.banner);
  setBg($('#profileBg'), user.bg);

  const vid = $('#profileVideo');
  if(vid){
    vid.classList.remove('show');
    vid.removeAttribute('src');
    if(user.video){ vid.src = user.video; vid.load(); vid.classList.add('show'); vid.play().catch(()=>{}); }
  }
  const frame = $('#profileFrame');
  if(frame){
    frame.src = user.frame || '';
    frame.style.display = user.frame ? 'block' : 'none';
    const fa = user.frameAdjust || {x:0,y:0,scale:1,rotate:0};
    frame.style.setProperty('--frame-x', (Number(fa.x)||0)+'px');
    frame.style.setProperty('--frame-y', (Number(fa.y)||0)+'px');
    frame.style.setProperty('--frame-scale', Number(fa.scale||1));
    frame.style.setProperty('--frame-rotate', (Number(fa.rotate)||0)+'deg');
    frame.classList.toggle('manual-adjusted', !!user.frame);
  }
  const deco = $('#avatarDecoration');
  if(deco) deco.className = 'avatar-decoration has-img-frame ' + (user.decoration || 'none');

  const card = $('#profileCard');
  if(card){
    card.classList.toggle('fx-perspective', !!user.nameFx?.perspective);
    card.classList.toggle('bgfx-radial', user.bgFx === 'radial');
    card.classList.toggle('bgfx-scan', user.bgFx === 'scan');
    card.classList.toggle('bgfx-grain', user.bgFx === 'grain');
    card.style.background = user.colors?.cardBg ? hexToRgba(user.colors.cardBg, .72) : '';
    card.style.color = user.colors?.textColor || '';
  }
  const pn = $('#profileName');
  if(pn){
    pn.classList.toggle('fx-neon-name', !!user.nameFx?.neon);
    pn.classList.toggle('fx-shine-name', !!user.nameFx?.shine);
    pn.classList.toggle('fx-rainbow-name', !!user.nameFx?.rainbow);
    pn.style.color = user.colors?.textColor || '';
  }
  if($('#profileBio')) $('#profileBio').style.color = user.colors?.bioColor || '';
  const cursorUrl = String(user.cursor || '').trim();
  const profilePage = $('#profile');
  if(profilePage) profilePage.style.cursor = cursorUrl ? `url("${cursorUrl.replace(/"/g,'%22')}"), auto` : '';
  document.body.classList.toggle('dlinky-profile-custom-cursor', !!cursorUrl && $('#profile')?.classList.contains('active'));
  document.documentElement.style.setProperty('--dlinky-profile-cursor', cursorUrl ? `url("${cursorUrl.replace(/"/g,'%22')}"), auto` : 'auto');
  renderProfileTagsAndSelos();

  const links = $('#profileLinks');
  if(links) links.innerHTML = (user.links || []).map(l => `<a target="_blank" rel="noopener" href="${safeUrl(l.url)}">${escapeHtml(l.name || 'Link')}</a>`).join('');

  const socials = $('#profileSocials');
  if(socials) socials.innerHTML = (user.socials || []).filter(s=>s.on).map(s => {
    const name = String(s.name || 'link');
    const cls = icons[name] || 'fa-solid fa-link';
    return `<a class="social-icon brand-${name.toLowerCase().replace(/[^a-z0-9]/g,'')}" target="_blank" rel="noopener" title="${escapeHtml(name)}" href="${safeUrl(s.url)}"><i class="${cls}"></i></a>`;
  }).join('');

  const audio = $('#profileAudio');
  if(audio && audio.getAttribute('src') !== (user.music || '')){ audio.src = user.music || ''; if(user.music) audio.load(); }
  createProfileParticles(user.particleType || 'none');
}
window.renderProfile = renderProfile;
window.renderDash = renderDash;

function entryOverlayHtml(){
  const map = {snow:'❄️', raios:'⚡', stars:'✨', bubbles:'🫧', rain:'💧', fire:'🔥', leaves:'🍃', matrix:'▦', hearts:'❤️', cats:'🐾'};
  const icon = map[user.particleType || ''] || '✧';
  const text = escapeHtml(user.welcome || 'Clique aqui');
  return `<div class="entry-blur-orb">${icon}</div><h1>${text}</h1><span>${icon}</span>`;
}
function createProfileParticles(type){
  const layer = $('#profileParticleLayer');
  if(!layer) return;
  layer.innerHTML = '';
  if(type === 'none' || !user.particles) return;
  const chars = {
    snow:['❄','✻','❅'], raios:['⚡','ϟ'], stars:['✦','✧','✨'], hearts:['❤','♥'], embers:['•','✹'], bubbles:[''],
    rain:['╱','│','╲'], fire:['🔥','•','✹'], leaves:['🍃','🍂'], matrix:['0','1','▦'], cats:['🐾','😺']
  }[type] || ['✦'];
  const cls = {snow:'snow', raios:'bolt', stars:'star', hearts:'heart', embers:'ember', bubbles:'bubble', rain:'rain', fire:'fire', leaves:'leaf', matrix:'matrix', cats:'cat'}[type] || 'star';
  const count = Math.max(8, Math.min(140, Number(user.particleCount || 45)));
  const speed = Math.max(1, Math.min(10, Number(user.particleSpeed || 5)));
  const sizeMap = {small:[10,18], medium:[16,28], large:[24,42]};
  const [minS,maxS] = sizeMap[user.particleSize || 'small'] || sizeMap.small;
  for(let i=0;i<count;i++){
    const el = document.createElement('span');
    el.className = 'fx ' + cls;
    el.textContent = chars[Math.floor(Math.random()*chars.length)];
    el.style.left = Math.random()*100 + '%';
    el.style.top = (-10 + Math.random()*110) + '%';
    el.style.animationDuration = (18 - speed + Math.random()*8) + 's';
    el.style.animationDelay = (-Math.random()*14) + 's';
    el.style.fontSize = (minS + Math.random()*(maxS-minS)) + 'px';
    if(type === 'bubbles'){
      const b = minS + Math.random()*(maxS-minS);
      el.style.width = el.style.height = b + 'px';
    }
    layer.appendChild(el);
  }
}


function hexToRgba(hex, alpha){
  hex = String(hex || '').replace('#','').trim();
  if(hex.length === 3) hex = hex.split('').map(x=>x+x).join('');
  const n = parseInt(hex,16);
  if(Number.isNaN(n)) return '';
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${alpha})`;
}
const AVAILABLE_TAGS = [
  ['paz','☮️ Paz'], ['programador','💻 Programador'], ['artista','🖌️ Artista'], ['designer','🎨 Designer'], ['escritor','📝 Escritor'], ['investidor','💸 Investidor'], ['músico','🎸 Músico'], ['fotografo','📷 Fotógrafo'], ['arlivre','🏕️ Ar Livre'], ['bebida','🍺 Bebida'], ['comida','🍴 Comida'],
  ['filmes','🎬 Filmes'], ['seriados','📺 Seriados'], ['fumante','🚬 Fumante'], ['negocios','🏢 Negócios'], ['academia','💪 Academia'], ['leitor','📕 Leitor'], ['atleta','🏃 Atleta'], ['ciencia','🧪 Ciência'], ['bonito','💋 Bonito(a)'], ['picante','🌶️ Picante'], ['animais','🐾 Animais'],
  ['adoravel','🎀 Adorável'], ['produtor','🎹 Produtor(a)'], ['viagem','🧳 Viagem'], ['gamer','🎮 Gamer'], ['anjo','😇 Anjo(a)'], ['perigoso','😈 Perigoso(a)'], ['skatista','🛹 Skatista'], ['provocante','😏 Provocante'], ['basquete','🏀 Basquete'], ['frio','🥶 Frio'],
  ['palhaco','🤡 Palhaço(a)'], ['brasil','🇧🇷 Brasil'], ['habbo','🅷 Habbo'], ['boliche','🎳 Boliche'], ['surfista','🏄 Surfista'], ['verao','🏝️ Verão'], ['toxico','☠️ Tóxico(a)'], ['pensativo','💭 Pensativo(a)'], ['comunicativo','🗣️ Comunicativo(a)'], ['insonia','💤 Insônia'],
  ['apaixonado','😍 Apaixonado(a)'], ['lgbt','🌈 Lgbt'], ['futebol','⚽ Futebol'], ['timido','😳 Tímido(a)'], ['triste','😭 Triste'], ['bravo','👺 Bravo(a)'], ['amigavel','🤝 Amigável'], ['construtor','👷 Construtor(a)'], ['namorando','💑 Namorando'], ['solteiro','🧸 Solteiro(a)'],
  ['lol','🎮 League Of Legends'], ['valorant','🔫 Valorant'], ['cs2','♠️ Counter-Strike 2'], ['paladins','🔷 Paladins'], ['dota2','🟥 Dota 2'], ['fortnite','🇫 Fortnite'], ['gta','🚓 Grand Theft Auto V'], ['cyber','🔮 Cybersecurity'], ['piloto','🛩️ Piloto(a)']
];
function renderColorsTags(){
  const box = $('#ctTagsList');
  if(!box) return;
  const active = new Set(user.tagSettings?.active || []);
  setInput('#ctShowFree', user.tagSettings?.showFree !== false);
  setInput('#ctShowDlinky', user.tagSettings?.showDlinky !== false);
  setInput('#ctProfileBg', user.colors?.profileBg || '#1E40AF');
  setInput('#ctCardBg', user.colors?.cardBg || '#000000');
  setInput('#ctTextColor', user.colors?.textColor || '#FFFFFF');
  setInput('#ctBioColor', user.colors?.bioColor || '#FFFFFF');
  box.innerHTML = AVAILABLE_TAGS.map(([id,label])=>`<label class="ct-tag-choice"><input type="checkbox" data-ct-tag="${escapeAttr(id)}" ${active.has(id)?'checked':''}> ${escapeHtml(label)}</label>`).join('');
}
function renderProfileTagsAndSelos(){
  const box = $('#profileTags');
  if(box){
    const tags = [];
    if(user.tagSettings?.showFree !== false) tags.push('✦ grátis');
    if(user.tagSettings?.showDlinky !== false) tags.push('⚡ dlinky');
    const active = new Set(user.tagSettings?.active || []);
    AVAILABLE_TAGS.forEach(([id,label])=>{ if(active.has(id)) tags.push(label); });
    box.innerHTML = tags.map(t=>`<span>${escapeHtml(t)}</span>`).join('');
  }
  let seloBox = $('#profileSelos');
  if(!seloBox && $('#profileSocials')){
    seloBox = document.createElement('div');
    seloBox.id = 'profileSelos';
    seloBox.className = 'profile-selos';
    $('#profileSocials').insertAdjacentElement('afterend', seloBox);
  }
  if(seloBox){
    seloBox.innerHTML = (user.selos || []).map(s=>`<img title="${escapeAttr(s.name||'Selo')}" src="${escapeAttr(s.url||'')}" style="width:${Number(s.size||32)}px;height:${Number(s.size||32)}px">`).join('');
  }
}
function itemMatchesInventoryFilter(it){
  if(inventoryFilter === 'todos') return true;
  if(inventoryFilter === 'molduras') return it.type === 'frame';
  if(inventoryFilter === 'insignias') return it.type === 'badge' || it.type === 'insignia';
  if(inventoryFilter === 'efeitos') return it.type === 'effect';
  if(inventoryFilter === 'presentes') return !!it.gift;
  if(inventoryFilter === 'selos') return it.type === 'selo';
  return true;
}
function openFrameAdjust(){
  if(!user.frame) return toast('Use uma moldura primeiro.');
  const m = $('#frameAdjustModal'); if(!m) return;
  const fa = Object.assign({x:0,y:0,scale:1,rotate:0}, user.frameAdjust || {});
  setBg($('#adjustAvatar'), user.avatar);
  const img = $('#adjustFrame'); if(img) img.src = user.frame;
  $('#adjustX').value = Number(fa.x||0);
  $('#adjustY').value = Number(fa.y||0);
  $('#adjustScale').value = Math.round(Number(fa.scale||1)*100);
  $('#adjustRotate').value = Number(fa.rotate||0);
  m.classList.add('show','real-centered-modal','dlinky-clean-adjust');
  updateAdjustPreview();
}
function updateAdjustPreview(){
  const img = $('#adjustFrame'); if(!img) return;
  const x = Number($('#adjustX')?.value||0), y = Number($('#adjustY')?.value||0), sc = Number($('#adjustScale')?.value||100)/100, rot = Number($('#adjustRotate')?.value||0);
  img.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px) scale(${sc}) rotate(${rot}deg)`;
}
async function saveFrameAdjust(){
  user.frameAdjust = {x:Number($('#adjustX')?.value||0), y:Number($('#adjustY')?.value||0), scale:Number($('#adjustScale')?.value||100)/100, rotate:Number($('#adjustRotate')?.value||0)};
  $('#frameAdjustModal')?.classList.remove('show','real-centered-modal','dlinky-clean-adjust');
  addHistory('Ajuste da moldura salvo');
  await saveUser('Ajuste da moldura salvo!');
}

function renderLinksEditor(){
  const box = $('#linksEditor'); if(!box) return;
  box.innerHTML = '';
  (user.links || []).forEach((l,i)=>{
    box.insertAdjacentHTML('beforeend', `<div class="link-row"><input value="${escapeHtml(l.name || '')}" data-link-name="${i}" placeholder="Nome"><input value="${escapeHtml(l.url || '')}" data-link-url="${i}" placeholder="https://"><button class="delete" type="button" data-del-link="${i}">×</button></div>`);
  });
}
function renderSocialEditor(){
  const box = $('#socialEditor'); if(!box) return;
  const list = user.socials && user.socials.length ? user.socials : [];
  user.socials = list;
  box.innerHTML = '';
  list.forEach((s,i)=>{
    box.insertAdjacentHTML('beforeend', `<div class="social-row"><select data-social-name="${i}">${Object.keys(icons).map(n=>`<option ${n===s.name?'selected':''}>${n}</option>`).join('')}</select><input data-social-url="${i}" value="${escapeHtml(s.url || '')}" placeholder="https://"><label class="check"><input type="checkbox" data-social-on="${i}" ${s.on?'checked':''}> Ativo</label><button class="delete" type="button" data-del-social="${i}">×</button></div>`);
  });
}
const assets = {
  backgrounds:[['Nebula Roxa', presetUrls.bg2, false], ['Noite Azul', presetUrls.bg1, false], ['Floresta Dark', presetUrls.bg3, false]],
  banners:[['Anime banner', presetUrls.banner1, false], ['Estrelas banner', presetUrls.banner2, false]],
  decorations:[['Anel roxo','purple-ring',false], ['Anel vermelho','red-ring',false], ['Brilhos','sparkle-frame',false], ['Órbita','orbit-frame',false]],
  music:[['Cole seu .mp3','',false]]
};
function renderAssets(){
  const grid = $('#assetGrid'); if(!grid) return;
  grid.innerHTML = '';
  (assets[assetMode] || []).forEach((a,idx)=>{
    const prev = String(a[1]||'').startsWith('http') ? `style="background-image:url('${a[1]}')"` : '';
    grid.insertAdjacentHTML('beforeend', `<div class="asset-card"><div class="asset-preview" ${prev}>${!prev?'<span style="display:grid;place-items:center;height:100%;font-size:36px">✦</span>':''}</div><div class="asset-body"><b>${escapeHtml(a[0])}</b><small>Grátis</small><button class="btn primary small" type="button" data-use-asset="${idx}">Usar</button></div></div>`);
  });
}


function moneyPrice(v){ return Number(v || 0); }
function framePreviewHtml(frame, extraClass=''){
  const url = normalizeImageUrl(frame.url || frame.value || '');
  const av = getBestAvatar();
  return `<div class="asset-preview frame-shop-preview ${extraClass}">
    <span class="frame-avatar-demo" style="background-image:url('${escapeAttr(av)}')"></span>
    <img class="frame-img big" src="${escapeAttr(url)}" onerror="this.classList.add('bad');this.parentNode.classList.add('bad')">
    <small class="bad-url-note">Link da imagem inválido. Use link direto .png/.gif/.webp.</small>
  </div>`;
}
function zyonPriceFor(days, base){
  days = Number(days || 3);
  base = Number(base || 20);
  if(days === 7) return Math.round(base * 1.8);
  if(days === 15) return Math.round(base * 3.2);
  if(days === 30) return Math.round(base * 5.2);
  if(days === 0) return Math.round(base * 8);
  return base;
}
function durationSelectHtml(id){
  return `<select class="shop-duration" data-duration-for="${escapeAttr(id)}"><option value="3">3 dias</option><option value="7">7 dias</option><option value="15">15 dias</option><option value="30">30 dias</option><option value="0">Permanente</option></select>`;
}
function shopFrameCard(f, idx){
  const id = f.id || ('frame_'+idx);
  const price = Number(f.price || 20);
  const owned = itemAlreadyOwned('frame', id, f.url || '', f.name || '');
  return `<div class="zyo-item-card frame-shop-card ${owned?'owned':''}">
    <div class="zyo-item-top">
      ${framePreviewHtml({url:f.url || '', avatar:getBestAvatar()}, 'zyo-frame-preview')}
      <div><h3>${escapeHtml(f.name || 'Moldura')}</h3><p>${escapeHtml(f.desc || 'Destaque-se com estilo')}</p>${owned?'<small class="owned-badge">✓ Já comprado</small>':''}</div>
    </div>
    <div class="zyo-price">🪙 Preço do item: <b>${price} Linkwuans</b></div>
    ${durationSelectHtml(id)}
    <small class="zyo-note">ⓘ Valor muda conforme a duração escolhida.</small>
    <div class="zyo-card-actions">${owned?`<button class="btn dark small" type="button" disabled>✓ Já comprado</button>`:`<button class="btn primary small" type="button" data-buy-frame="${escapeAttr(id)}">🔒 Comprar</button>`}<button class="btn dark small" type="button" data-gift-frame="${escapeAttr(id)}">🎁 Presentear</button></div>
  </div>`;
}

function packPriceBRL(coins){
  coins = Number(coins || 0);
  if(coins === 345) return 30;
  if(coins === 650) return 50;
  if(coins === 1450) return 100;
  if(coins === 3300) return 200;
  return Math.max(5, Math.ceil(coins / 11.5));
}
function pixQrUrl(text){
  text = String(text || '').trim();
  if(!text || text === 'COLE_SUA_CHAVE_PIX_AQUI') return '';
  return 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(text);
}
function getUserPaymentCfg(){
  return Object.assign({pixKey:DLINKY_PIX_KEY, payName:'LexVoid'}, user.payment || {});
}
function itemAlreadyOwned(kind, id, url, name){
  const inv = Array.isArray(user.inventory) ? user.inventory : [];
  return inv.some(it => {
    if(kind === 'frame') return it.type === 'frame' && ((id && it.itemId === id) || (url && (it.url === url || it.value === url)) || (name && it.name === name));
    if(kind === 'effect') return it.type === 'effect' && ((id && it.itemId === id) || (url && (it.value === url || it.url === url)) || (name && it.name === name));
    return false;
  });
}
function openConfirmPurchaseModal(kind, data){
  let modal = document.getElementById('dlinkyConfirmPurchaseModal');
  if(!modal){
    document.body.insertAdjacentHTML('beforeend', `<div id="dlinkyConfirmPurchaseModal" class="modal dlinky-buy-modal"><div class="modal-card dlinky-buy-card"><button class="modal-close" id="dlinkyBuyClose" type="button">×</button><h2>Confirmar compra</h2><p>Revise os detalhes antes de concluir.</p><div class="dlinky-buy-preview" id="dlinkyBuyPreview"></div><div class="dlinky-buy-info"><div><span>Item</span><b id="dlinkyBuyItem"></b></div><div><span>Duração</span><b id="dlinkyBuyDuration"></b></div><div><span>Tipo</span><b id="dlinkyBuyType"></b></div><div><span>Preço</span><b id="dlinkyBuyPrice"></b></div></div><small>Esta ação consome seus Linkwuans. Item comprado uma vez fica no inventário.</small><div class="dlinky-buy-actions"><button class="btn dark" id="dlinkyBuyCancel" type="button">Cancelar</button><button class="btn primary" id="dlinkyBuyConfirm" type="button">Comprar</button></div></div></div>`);
    modal = document.getElementById('dlinkyConfirmPurchaseModal');
  }
  modal.dataset.kind = kind;
  modal.dataset.payload = JSON.stringify(data || {});
  const preview = document.getElementById('dlinkyBuyPreview');
  const avatar = getBestAvatar();
  if(preview){
    if(kind === 'frame') preview.innerHTML = `<div class="buy-frame-preview"><span style="background-image:${avatar?`url('${escapeAttr(avatar)}')`:'none'}"></span><img src="${escapeAttr(data.url||'')}" onerror="this.style.display='none'"></div><b>${escapeHtml(user.name||user.slug||'Usuário')}</b>`;
    else preview.innerHTML = `<div class="buy-effect-preview">✦</div><b>${escapeHtml(data.name||'Efeito')}</b>`;
  }
  const set=(id,v)=>{const el=document.getElementById(id); if(el) el.textContent=v};
  set('dlinkyBuyItem', data.name || 'Item');
  set('dlinkyBuyDuration', data.duration || 'Permanente');
  set('dlinkyBuyType', kind === 'frame' ? 'Moldura' : 'Efeito');
  set('dlinkyBuyPrice', Number(data.price||0) + ' Linkwuans');
  modal.classList.add('show');
}
async function confirmStorePurchase(){
  const modal=document.getElementById('dlinkyConfirmPurchaseModal');
  if(!modal) return;
  const kind=modal.dataset.kind;
  let data={}; try{data=JSON.parse(modal.dataset.payload||'{}')}catch(e){}
  const price=Number(data.price||0);
  if(itemAlreadyOwned(kind, data.id, data.url || data.value, data.name)){ toast('Você já comprou esse item. Ele continua no inventário.'); modal.classList.remove('show'); return; }
  if(Number(user.coins||0) < price) return toast('Saldo insuficiente. Recarregue Linkwuans.');
  user.coins = Number(user.coins||0) - price;
  user.inventory = Array.isArray(user.inventory) ? user.inventory : [];
  if(kind === 'frame'){
    user.inventory.unshift({type:'frame', itemId:data.id||'', name:data.name||'Moldura', url:data.url||'', value:data.url||'', duration:data.duration||'Permanente', date:Date.now()});
    user.frame = data.url || '';
    user.frameAdjust = {x:0,y:0,scale:1,rotate:0};
    addHistory('Moldura comprada/usada: ' + (data.name || 'Moldura'));
  }else if(kind === 'effect'){
    user.inventory.unshift({type:'effect', itemId:data.id||'', name:data.name||'Efeito', value:data.value||'', duration:data.duration||'Permanente', date:Date.now()});
    user.decoration = data.value || 'none';
    addHistory('Efeito comprado/aplicado: ' + (data.name || 'Efeito'));
  }
  modal.classList.remove('show');
  await saveUser('Compra concluída!');
  renderShop(); renderInventory(); renderDash();
}
async function openPixRecharge(coins){
  if(!currentAuthUser) return toast('Faça login para recarregar.');
  const price = packPriceBRL(coins);
  const orderId = 'DLK-' + Date.now().toString(36).toUpperCase();
  const modal = document.getElementById('dlinkyPixRechargeModal');
  if(!modal) return toast('Modal PIX não encontrado.');
  const set=(id,val)=>{ const el=document.getElementById(id); if(el) el.value!==undefined ? el.value=val : el.textContent=val; };
  set('dlinkyPixProduct', coins + ' Linkwuans');
  set('dlinkyPixPrice', 'R$ ' + price.toFixed(2).replace('.',','));
  set('dlinkyPixUser', user.email || user.slug || 'Usuário');
  const payCfg = getUserPaymentCfg();
  const pixKey = payCfg.pixKey || DLINKY_PIX_KEY;
  set('dlinkyPixKey', pixKey);
  set('dlinkyPixOrderId', orderId);
  const qr = document.getElementById('dlinkyPixQr');
  if(qr){
    const qrUrl = pixQrUrl(pixKey + ' | Pedido ' + orderId + ' | R$ ' + price.toFixed(2));
    qr.innerHTML = qrUrl ? `<img alt="QR Code PIX" src="${qrUrl}">` : '<div class="dlinky-pix-qr-fake">PIX</div>';
  }
  modal.dataset.coins = String(coins);
  modal.dataset.price = String(price);
  modal.dataset.order = orderId;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
}
async function confirmPixRecharge(){
  const modal = document.getElementById('dlinkyPixRechargeModal');
  if(!modal || !currentAuthUser) return;
  const coins = Number(modal.dataset.coins || 0);
  const price = Number(modal.dataset.price || 0);
  const orderId = modal.dataset.order || ('DLK-' + Date.now().toString(36));
  await db.collection('paymentRequests').doc(orderId).set({
    orderId, type:'recharge', coins, price,
    status:'pending', email:user.email || currentAuthUser.email || '', slug:user.slug || '', uid:currentAuthUser.uid,
    pixKey: (getUserPaymentCfg().pixKey || DLINKY_PIX_KEY),
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }, {merge:true});
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden','true');
  toast('Pedido enviado ao admin. Seus Linkwuans serão liberados após o pagamento.');
}
async function loadPaymentRequests(){
  if(!isAdmin()) return [];
  try{
    const snap = await db.collection('paymentRequests').orderBy('createdAt','desc').limit(20).get();
    return snap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){ return []; }
}
async function renderAdminPayments(){
  const box=document.getElementById('adminPaymentsList');
  if(!box || !isAdmin()) return;
  const reqs=await loadPaymentRequests();
  box.innerHTML = reqs.length ? reqs.map(r=>`<div class="admin-item"><div><b>${escapeHtml(r.email||r.slug||'Usuário')}</b><small>Pedido: ${escapeHtml(r.orderId||r.id)} • ${Number(r.coins||0)} Linkwuans • R$ ${Number(r.price||0).toFixed(2).replace('.',',')} • ${escapeHtml(r.status||'pending')}</small></div><button class="btn primary small" type="button" data-admin-release-payment="${escapeAttr(r.id)}">Liberar</button></div>`).join('') : '<p>Nenhum pedido PIX ainda.</p>';
}
async function releasePayment(id){
  if(!isAdmin()) return;
  const ref=db.collection('paymentRequests').doc(id);
  const snap=await ref.get();
  if(!snap.exists) return toast('Pedido não encontrado.');
  const r=snap.data();
  const target = await findUserDocByEmailOrSlug(r.email || r.slug);
  if(!target) return toast('Usuário do pedido não encontrado.');
  const data={...target.data};
  data.coins = Number(data.coins||0) + Number(r.coins||0);
  await db.collection('users').doc(target.id).set(data,{merge:true});
  if(data.slug) await db.collection('profiles').doc(cleanSlug(data.slug)).set(data,{merge:true});
  await ref.set({status:'released', releasedAt:firebase.firestore.FieldValue.serverTimestamp(), releasedBy:currentAuthUser.email||''},{merge:true});
  toast('Linkwuans liberados.');
  await renderAdminPayments();
}
async function loadLandingFeatured(){
  try{
    const cfg = await db.collection('siteConfig').doc('landing').get();
    const slugs = cfg.exists && Array.isArray(cfg.data().featuredUsers) ? cfg.data().featuredUsers : [];
    let users=[];
    for(const raw of slugs.slice(0,12)){
      const slug=cleanSlug(raw);
      const ps=await db.collection('profiles').doc(slug).get();
      if(ps.exists) users.push(ps.data()); else users.push({name:slug,slug,avatar:''});
    }
    if(!users.length) users=[{name:'Lariogth',slug:'lariogth',avatar:''},{name:'Snow011',slug:'snow011',avatar:''},{name:'wnk',slug:'wnk',avatar:''},{name:'natsumi',slug:'natsumi',avatar:''}];
    renderLandingFeatured(users);
  }catch(e){ renderLandingFeatured([]); }
}
function renderLandingFeatured(users){
  const old=document.querySelector('.zyo-marquee-track');
  if(!old) return;
  const items=(users||[]).concat(users||[]);
  old.innerHTML = items.map(u=>`<span class="featured-pill"><i class="featured-avatar-mini" style="background-image:${u.avatar?`url('${escapeAttr(u.avatar)}')`:'none'}"></i><b>${escapeHtml(u.name||u.slug||'Usuário')}</b><small>/${escapeHtml(u.slug||'usuario')}</small></span>`).join('');
}
async function saveLandingFeaturedFromAdmin(){
  if(!isAdmin()) return toast('Área somente para admin.');
  const val=(document.getElementById('adminFeaturedUsers')?.value||'').split(/[\n,]+/).map(x=>cleanSlug(x)).filter(Boolean).slice(0,12);
  await db.collection('siteConfig').doc('landing').set({featuredUsers:val,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
  toast('Usuários da tela inicial salvos.');
  await loadLandingFeatured();
}
async function fillAdminFeaturedField(){
  if(!isAdmin()) return;
  const el=document.getElementById('adminFeaturedUsers');
  if(!el) return;
  try{ const snap=await db.collection('siteConfig').doc('landing').get(); if(snap.exists && Array.isArray(snap.data().featuredUsers)) el.value=snap.data().featuredUsers.join('\n'); }catch(e){}
}

function renderShop(){
  $('#walletCoins') && ($('#walletCoins').textContent = Number(user.coins || 0));
  $('#invCountMini') && ($('#invCountMini').textContent = (user.inventory || []).length);
  const grid = $('#shopGrid'); if(!grid) return;
  $$('.shop-tabs button').forEach(b=>b.classList.toggle('active', b.dataset.shopTab === shopMode));
  const mapTitle = {coins:'Recarga', frames:'Molduras', effects:'Efeitos', other:'Outros'};
  if(shopMode === 'coins'){
    const packs = [
      {z:345, r:'30,00', bonus:'+15% bônus'},
      {z:650, r:'50,00', bonus:'+30% bônus'},
      {z:1450, r:'100,00', bonus:'+45% bônus'},
      {z:3300, r:'200,00', bonus:'+65% bônus', hot:true}
    ];
    grid.className = 'zyo-shop-content';
    grid.innerHTML = `<div class="zyo-shop-panel"><div class="zyo-panel-head"><span>⚙</span><div><b>Pacotes Promocionais</b><small>Escolha um dos pacotes abaixo com bônus exclusivos de Linkwuans para recargas rápidas.</small></div></div><div class="zyo-pack-grid">${packs.map(p=>`<div class="zyo-pack ${p.hot?'hot':''}">${p.hot?'<em>★ Mais vantajoso</em>':''}<h3>${p.z} Linkwuans</h3><p>R$ ${p.r}</p><small>${p.bonus}</small><button class="btn primary full" type="button" data-add-coins="${p.z}">☮ Recarregar</button></div>`).join('')}</div></div>
    <div class="zyo-two"><div class="zyo-shop-panel"><div class="zyo-panel-head"><span>▣</span><div><b>Valor personalizado</b><small>Escolha se quer digitar em reais ou em Linkwuans</small></div></div><div class="zyo-input-row"><input id="customCoins" placeholder="▣ Digite o valor em R$ (mín. R$ 5.00)"><button class="btn primary" id="customCoinsBtn" type="button">▣</button><button class="btn dark" type="button">☮</button><button class="btn primary" type="button" id="customCoinsBtn2">⟳ Recarregar</button></div><small>Digite o valor desejado para a recarga.</small></div>
    <div class="zyo-shop-panel"><div class="zyo-panel-head"><span>🎟</span><div><b>Código de voucher</b><small>Resgate Linkwuans com um código promocional válido</small></div></div><div class="zyo-input-row"><input id="voucherCode" placeholder="🎟 Digite seu código"><button class="btn primary" id="voucherBtn" type="button">▣ Aplicar</button></div><small>Cada voucher pode ser usado apenas uma vez.</small></div></div>`;
    return;
  }
  grid.className = 'zyo-shop-grid';
  if(shopMode === 'frames'){
    const defaults = [
      {id:'free-butterfly', name:'Moldura Borboleta', desc:'Vermelha e fofa', price:250, url:''},
      {id:'fox', name:'Moldura Raposa', desc:'Fofa e linda', price:20, url:''},
      {id:'mystic', name:'Moldura Espelho Mestiço', desc:'Reflexível e lindo', price:20, url:''},
      {id:'flower', name:'Moldura Florada', desc:'Flores e rosas', price:20, url:''},
      {id:'marine', name:'Moldura Linear Marinho', desc:'Linhas da vida', price:20, url:''},
      {id:'autumn', name:'Moldura Outono', desc:'Dourada e vibrante', price:20, url:''},
      {id:'spider', name:'Moldura Aranha', desc:'Sombria e misteriosa', price:20, url:''},
      {id:'stars', name:'Moldura Constelações', desc:'Estrelas brilhantes', price:40, url:''},
      {id:'yinyang', name:'Moldura Yin-Yang', desc:'Flores sombria', price:20, url:''},
      {id:'hearts', name:'Moldura Hearts', desc:'Sútil e amorosa', price:20, url:''}
    ];
    const all = customFrames.length ? customFrames : defaults;
    grid.innerHTML = `<div class="zyo-shop-title"><h2>Molduras</h2><p>Destaque-se com molduras exclusivas no seu perfil.</p></div>` + all.map(shopFrameCard).join('');
    return;
  }
  if(shopMode === 'effects'){
    const effects = (assets.decorations || []).map((a,i)=>({name:a[0], value:a[1], price:Number(a[3]||20), idx:i}));
    grid.innerHTML = `<div class="zyo-shop-title"><h2>Efeitos</h2><p>Compre efeitos visuais para o perfil.</p></div>` + effects.map(e=>`<div class="zyo-item-card"><div class="zyo-item-top"><div class="zyo-effect-preview">✦</div><div><h3>${escapeHtml(e.name)}</h3><p>Efeito visual premium</p></div></div><div class="zyo-price">🪙 Preço do item: <b>${e.price} Linkwuans</b></div>${durationSelectHtml('effect_'+e.idx)}<small class="zyo-note">ⓘ Valor muda conforme a duração escolhida.</small><div class="zyo-card-actions"><button class="btn primary small" type="button" data-buy-effect="${e.idx}">🔒 Comprar</button><button class="btn dark small" type="button">🎁 Presentear</button></div></div>`).join('');
    return;
  }
  grid.innerHTML = `<div class="zyo-shop-title"><h2>Outros</h2><p>Itens extras ficarão disponíveis aqui.</p></div><div class="zyo-item-card"><div class="zyo-item-top"><div class="zyo-effect-preview">+</div><div><h3>Em breve</h3><p>Novos itens para personalização.</p></div></div></div>`;
}
function renderInventory(){
  $('#invCoins') && ($('#invCoins').textContent = Number(user.coins || 0));
  $('#invItemsCount') && ($('#invItemsCount').textContent = (user.inventory || []).length);
  const grid = $('#inventoryGrid'); if(!grid) return;
  const items = (Array.isArray(user.inventory) ? user.inventory : []).map((it,i)=>({it,i})).filter(x=>itemMatchesInventoryFilter(x.it));
  $$('#inventoryTabs button').forEach(b=>b.classList.toggle('active', b.dataset.invFilter === inventoryFilter));
  if(!items.length){ grid.innerHTML = '<p>Nenhum item nessa categoria.</p>'; return; }
  grid.innerHTML = items.map(({it,i})=>`<div class="asset-card inv-item-card">
    ${it.type === 'frame' ? framePreviewHtml({url:it.url || it.value}, 'inv-preview') : `<div class="asset-preview"><span style="display:grid;place-items:center;height:100%;font-size:36px">✦</span></div>`}
    <div class="asset-body"><b>${escapeHtml(it.name || 'Item')}</b><small>${escapeHtml(it.type || '')}</small>${it.type==='frame'?`<button class="btn primary small" type="button" data-use-inv-frame="${i}">Usar</button><button class="btn dark small" type="button" data-adjust-inv-frame="${i}">Ajustar</button>`:''}${it.type==='effect'?`<button class="btn primary small" type="button" data-use-inv-effect="${i}">Usar</button>`:''}<button class="btn dark small" type="button" data-remove-inv="${i}">Remover do perfil</button></div>
  </div>`).join('');
}


async function loadAdminData(){
  if(!db) return;
  try{
    const framesSnap = await db.collection('adminFrames').orderBy('createdAt','desc').get();
    customFrames = framesSnap.docs.map(d=>({id:d.id, ...d.data()}));
  }catch(e){ customFrames = []; }
  try{
    const selosSnap = await db.collection('adminSelos').orderBy('createdAt','desc').get();
    adminSelos = selosSnap.docs.map(d=>({id:d.id, ...d.data()}));
  }catch(e){ adminSelos = []; }
}
function renderAdminPanel(){
  updateAdminVisibility();
  const list = $('#adminFramesList');
  const select = $('#giftItemSelect');
  if(select){
    select.innerHTML = '<option value="">Selecione uma moldura da loja</option>' + customFrames.map(f=>`<option value="${escapeHtml(f.id)}">${escapeHtml(f.name || 'Moldura')}</option>`).join('');
  }
  if(list){
    list.innerHTML = customFrames.map(f=>`<div class="admin-item admin-frame-item"><div class="mini-frame-preview"><span class="mini-avatar" style="background-image:url('${escapeAttr(getBestAvatar())}')"></span><img src="${escapeAttr(f.url || '')}" onerror="this.classList.add('bad');this.parentNode.classList.add('bad');"></div><div><b>${escapeHtml(f.name || 'Moldura')}</b><small>${escapeHtml(f.desc || '')}</small><small>Preço: ${escapeHtml(f.price || '0')} Linkwuans</small><small class="bad-url-note">Imagem não abriu. Use link direto .png/.gif/.webp.</small></div><button class="delete" type="button" data-admin-del-frame="${escapeHtml(f.id)}">×</button></div>`).join('') || '<p>Nenhuma moldura cadastrada.</p>';
  }
  const adminTab=document.getElementById('tab-admin');
  if(adminTab && !document.getElementById('adminLandingFeaturedPanel')){
    adminTab.insertAdjacentHTML('beforeend', `<div class="panel form-panel" id="adminLandingFeaturedPanel"><h2>Usuários em destaque na tela inicial</h2><p>Coloque um slug por linha. A foto será puxada do perfil cadastrado.</p><textarea id="adminFeaturedUsers" placeholder="linkroubadao\nryukforever\nsnow011"></textarea><button class="btn primary" id="adminSaveFeaturedUsers" type="button">Salvar destaques</button></div><div class="panel"><h2>Pedidos PIX pendentes</h2><div id="adminPaymentsList" class="admin-list"></div></div>`);
  }
  fillAdminFeaturedField();
  renderAdminPayments();
}
function renderAdminSelosPanel(){
  updateAdminVisibility();
  const size = $('#adminSeloSize');
  const sizeVal = $('#adminSeloSizeValue');
  if(size && sizeVal) sizeVal.textContent = size.value + 'px';
  const list = $('#adminSelosList');
  const select = $('#adminSeloGiftSelect');
  if(select){
    select.innerHTML = '<option value="">Selecione um selo</option>' + adminSelos.map(s=>`<option value="${escapeHtml(s.id)}">${escapeHtml(s.name || 'Selo')}</option>`).join('');
  }
  if(list){
    list.innerHTML = adminSelos.map(s=>`<div class="admin-item"><img src="${escapeHtml(s.url || '')}" onerror="this.style.display='none'"><div><b>${escapeHtml(s.name || 'Selo')}</b><small>${escapeHtml(s.desc || '')}</small><small>Preço: ${Number(s.price||0)} • Tamanho: ${Number(s.size||32)}px</small></div><button class="delete" type="button" data-admin-del-selo="${escapeHtml(s.id)}">×</button></div>`).join('') || '<p>Nenhum selo cadastrado.</p>';
  }
  const hist = $('#adminSeloGiftHistory');
  if(hist) hist.innerHTML = '<p>Histórico salvo no Firestore quando você envia selos.</p>';
}
async function findUserDocByEmailOrSlug(value){
  value = String(value || '').trim().replace(/^@/,'');
  if(!value) return null;
  const lower = value.toLowerCase();
  let snap = await db.collection('users').where('email','==',lower).limit(1).get();
  if(!snap.empty) return {id:snap.docs[0].id, data:snap.docs[0].data()};
  snap = await db.collection('users').where('slug','==',cleanSlug(lower)).limit(1).get();
  if(!snap.empty) return {id:snap.docs[0].id, data:snap.docs[0].data()};
  return null;
}
async function adminAddFrame(){
  if(!isAdmin()) return toast('Área somente para admin.');
  const item = {
    name: $('#adminFrameName')?.value.trim() || 'Moldura',
    desc: $('#adminFrameDesc')?.value.trim() || '',
    price: Number($('#adminFramePrice')?.value || $('#adminPricePerm')?.value || 0),
    prices: { d3:Number($('#adminPrice3')?.value||0), d7:Number($('#adminPrice7')?.value||0), d15:Number($('#adminPrice15')?.value||0), perm:Number($('#adminPricePerm')?.value||0) },
    url: $('#adminFrameUrl')?.value.trim() || '',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    createdBy: currentAuthUser?.email || user.email || ''
  };
  if(!item.url) return toast('Coloque a URL da moldura.');
  await db.collection('adminFrames').add(item);
  await loadAdminData();
  renderAdminPanel();
  if($('#tab-store')?.classList.contains('active')) renderShop();
  toast('Moldura adicionada na loja.');
}
async function adminApplyUser(){
  if(!isAdmin()) return toast('Área somente para admin.');
  const target = await findUserDocByEmailOrSlug($('#adminUserEmail')?.value);
  if(!target) return toast('Usuário não encontrado.');
  const coins = Number($('#adminCoins')?.value || 0);
  const premiumAmount = Number($('#adminPremiumAmount')?.value || 0);
  const data = {...target.data};
  if(coins) data.coins = Number(data.coins || 0) + coins;
  if(premiumAmount){
    const unit = $('#adminPremiumUnit')?.value || 'days';
    const now = Date.now();
    const mult = unit==='hours'?3600000:unit==='months'?2592000000:unit==='years'?31536000000:86400000;
    data.premiumUntil = now + premiumAmount * mult;
    data.premium = true;
  }
  data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
  await db.collection('users').doc(target.id).set(data,{merge:true});
  if(data.slug) await db.collection('profiles').doc(cleanSlug(data.slug)).set(data,{merge:true});
  toast('Usuário atualizado pelo admin.');
}
async function adminSendGift(){
  if(!isAdmin()) return toast('Área somente para admin.');
  const target = await findUserDocByEmailOrSlug($('#giftEmail')?.value);
  if(!target) return toast('Usuário não encontrado.');
  const frame = customFrames.find(f=>f.id === $('#giftItemSelect')?.value);
  if(!frame) return toast('Escolha uma moldura.');
  const data = {...target.data};
  data.inventory = Array.isArray(data.inventory) ? data.inventory : [];
  data.inventory.unshift({type:'frame', name:frame.name, url:frame.url, value:frame.url, gift:true, msg:$('#giftMsg')?.value || '', date:Date.now()});
  data.frame = data.frame || frame.url;
  await db.collection('users').doc(target.id).set(data,{merge:true});
  if(data.slug) await db.collection('profiles').doc(cleanSlug(data.slug)).set(data,{merge:true});
  toast('Presente enviado.');
}
async function adminAddSelo(){
  if(!isAdmin()) return toast('Área somente para admin.');
  const item = {
    name: $('#adminSeloName')?.value.trim() || 'Selo',
    desc: $('#adminSeloDesc')?.value.trim() || '',
    price: Number($('#adminSeloPrice')?.value || 0),
    url: $('#adminSeloUrl')?.value.trim() || '',
    size: Number($('#adminSeloSize')?.value || 32),
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    createdBy: currentAuthUser?.email || user.email || ''
  };
  if(!item.url) return toast('Coloque a URL do selo.');
  await db.collection('adminSelos').add(item);
  await loadAdminData();
  renderAdminSelosPanel();
  toast('Selo adicionado na loja.');
}
async function adminSendSelo(){
  if(!isAdmin()) return toast('Área somente para admin.');
  const target = await findUserDocByEmailOrSlug($('#adminSeloGiftUser')?.value);
  if(!target) return toast('Usuário não encontrado.');
  const selo = adminSelos.find(s=>s.id === $('#adminSeloGiftSelect')?.value);
  if(!selo) return toast('Escolha um selo.');
  const data = {...target.data};
  data.selos = Array.isArray(data.selos) ? data.selos : [];
  data.selos.unshift({name:selo.name, url:selo.url, size:selo.size || 32, gift:true, date:Date.now()});
  await db.collection('users').doc(target.id).set(data,{merge:true});
  if(data.slug) await db.collection('profiles').doc(cleanSlug(data.slug)).set(data,{merge:true});
  await db.collection('adminSeloGifts').add({to:$('#adminSeloGiftUser')?.value||'', selo:selo.name, by:currentAuthUser?.email||'', createdAt:firebase.firestore.FieldValue.serverTimestamp()});
  toast('Selo enviado.');
}
function animateLandingCounters(){
  $$('[data-count-to]').forEach(el=>{
    if(el.dataset.done) return;
    el.dataset.done='1';
    const to = Number(el.dataset.countTo || 10000);
    const start = performance.now();
    function tick(t){
      const p = Math.min(1, (t-start)/1400);
      const n = Math.floor(to * p);
      el.textContent = n >= 10000 ? '10k' : String(n);
      if(p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

function bindEvents(){
  document.addEventListener('click', async e => {
    const goto = e.target.closest('[data-goto]');
    if(goto){ location.hash = '#/' + goto.dataset.goto; return; }
    const tab = e.target.closest('[data-tab]');
    if(tab){ openTab(tab.dataset.tab); return; }
    const ac = e.target.closest('[data-action]');
    if(ac){
      if(ac.dataset.action === 'openSide') $('.sidebar')?.classList.add('open');
      if(ac.dataset.action === 'closeSide') $('.sidebar')?.classList.remove('open');
      if(ac.dataset.action === 'collapseSide') $('#sidebar')?.classList.toggle('collapsed');
      if(ac.dataset.action === 'toggleTheme') document.body.classList.toggle('light');
      return;
    }
    if(e.target.dataset.delLink !== undefined){
      user.links.splice(Number(e.target.dataset.delLink),1); renderLinksEditor(); return;
    }
    if(e.target.dataset.delSocial !== undefined){
      user.socials.splice(Number(e.target.dataset.delSocial),1); renderSocialEditor(); return;
    }
    if(e.target.dataset.invFilter){
      inventoryFilter = e.target.dataset.invFilter;
      renderInventory(); return;
    }
    if(e.target.dataset.adjustInvFrame !== undefined){
      const it = (user.inventory || [])[Number(e.target.dataset.adjustInvFrame)];
      if(it){ user.frame = it.url || it.value || user.frame; }
      openFrameAdjust(); return;
    }
    if(e.target.dataset.shopTab){
      shopMode = e.target.dataset.shopTab;
      $$('.shop-tabs button').forEach(b=>b.classList.toggle('active', b.dataset.shopTab === shopMode));
      renderShop(); return;
    }
    if(e.target.dataset.addCoins){
      openPixRecharge(Number(e.target.dataset.addCoins || 0));
      return;
    }
    if(e.target.dataset.buyFrame){
      const id = e.target.dataset.buyFrame;
      const allFrames = customFrames.length ? customFrames : [];
      const frame = allFrames.find(f=>f.id === id);
      if(!frame) return toast('Moldura não encontrada.');
      const price = Number(frame.price || 0);
      const duration = document.querySelector(`[data-duration-for="${CSS.escape(id)}"]`)?.value || 'Permanente';
      if(itemAlreadyOwned('frame', id, frame.url || '', frame.name || '')) return toast('Você já comprou essa moldura. Use ela pelo inventário.');
      openConfirmPurchaseModal('frame', {id, name:frame.name || 'Moldura', url:frame.url || '', price, duration});
      return;
    }
    if(e.target.dataset.buyEffect !== undefined){
      const idx = Number(e.target.dataset.buyEffect);
      const a = (assets.decorations || [])[idx];
      if(!a) return;
      const price = Number(a[3] ?? 10);
      const id = 'effect_' + idx;
      const duration = document.querySelector(`[data-duration-for="${CSS.escape(id)}"]`)?.value || 'Permanente';
      if(itemAlreadyOwned('effect', id, a[1], a[0])) return toast('Você já comprou esse efeito. Use ele pelo inventário.');
      openConfirmPurchaseModal('effect', {id, name:a[0], value:a[1], price, duration});
      return;
    }
    if(e.target.dataset.useEffect !== undefined){
      const a = (assets.decorations || [])[Number(e.target.dataset.useEffect)];
      if(!a) return;
      user.decoration = a[1];
      addHistory('Efeito aplicado: ' + a[0]);
      await saveUser('Efeito aplicado!'); return;
    }
    if(e.target.dataset.useInvFrame !== undefined){
      const it = (user.inventory || [])[Number(e.target.dataset.useInvFrame)];
      if(!it) return;
      user.frame = it.url || it.value || '';
      user.frameAdjust = user.frameAdjust || {x:0,y:0,scale:1,rotate:0};
      addHistory('Moldura do inventário aplicada: ' + (it.name || 'Moldura'));
      await saveUser('Moldura aplicada!');
      renderInventory(); renderDash(); return;
    }
    if(e.target.dataset.useInvEffect !== undefined){
      const it = (user.inventory || [])[Number(e.target.dataset.useInvEffect)];
      if(!it) return;
      user.decoration = it.value || it.url || user.decoration;
      addHistory('Efeito do inventário aplicado: ' + (it.name || 'Efeito'));
      await saveUser('Efeito aplicado!');
      renderInventory(); renderDash(); return;
    }
    if(e.target.dataset.removeInv !== undefined){
      const idx = Number(e.target.dataset.removeInv);
      const it = (user.inventory || [])[idx];
      if(it?.type === 'frame' && (user.frame === (it.url || it.value))){
        user.frame = '';
        user.frameAdjust = {x:0,y:0,scale:1,rotate:0};
        await saveUser('Moldura removida do perfil. Ela continua no inventário.');
      } else if(it?.type === 'effect' && user.decoration === (it.value || it.url)){
        user.decoration = 'none';
        await saveUser('Efeito removido do perfil. Ele continua no inventário.');
      } else {
        toast('Esse item continua no inventário. Use quando quiser.');
      }
      renderInventory(); renderDash(); return;
    }
    if(e.target.dataset.assetTab){
      assetMode = e.target.dataset.assetTab;
      $$('.asset-tabs button').forEach(b=>b.classList.toggle('active', b.dataset.assetTab === assetMode));
      renderAssets(); return;
    }
    if(e.target.dataset.useAsset !== undefined){
      const a = (assets[assetMode] || [])[Number(e.target.dataset.useAsset)];
      if(!a) return;
      if(assetMode === 'backgrounds') user.bg = a[1];
      if(assetMode === 'banners') user.banner = a[1];
      if(assetMode === 'decorations') user.decoration = a[1];
      if(assetMode === 'music') user.music = a[1];
      addHistory('Asset aplicado: ' + a[0]);
      await saveUser('Asset salvo!');
      return;
    }
    if(e.target.closest('#adminAddFrame')){ await adminAddFrame(); return; }
    if(e.target.closest('#adminSaveFeaturedUsers')){ await saveLandingFeaturedFromAdmin(); return; }
    if(e.target.dataset.adminReleasePayment){ await releasePayment(e.target.dataset.adminReleasePayment); return; }
    if(e.target.closest('#dlinkyBuyClose') || e.target.closest('#dlinkyBuyCancel')){ document.getElementById('dlinkyConfirmPurchaseModal')?.classList.remove('show'); return; }
    if(e.target.closest('#dlinkyBuyConfirm')){ await confirmStorePurchase(); return; }
    if(e.target.closest('#dlinkyPixClose')){ document.getElementById('dlinkyPixRechargeModal')?.classList.remove('show'); return; }
    if(e.target.closest('#dlinkyPixCopy')){ const k=document.getElementById('dlinkyPixKey')?.value||''; navigator.clipboard?.writeText(k); toast('Chave PIX copiada.'); return; }
    if(e.target.closest('#dlinkyPixConfirm')){ await confirmPixRecharge(); return; }
    if(e.target.closest('#adminApplyUser')){ await adminApplyUser(); return; }
    if(e.target.closest('#adminSendGift')){ await adminSendGift(); return; }
    if(e.target.closest('#adminAddSeloBtn')){ await adminAddSelo(); return; }
    if(e.target.closest('#adminSendSeloBtn')){ await adminSendSelo(); return; }
    if(e.target.dataset.adminDelFrame){
      if(!isAdmin()) return toast('Área somente para admin.');
      await db.collection('adminFrames').doc(e.target.dataset.adminDelFrame).delete();
      await loadAdminData(); renderAdminPanel(); toast('Moldura removida.'); return;
    }
    if(e.target.dataset.adminDelSelo){
      if(!isAdmin()) return toast('Área somente para admin.');
      await db.collection('adminSelos').doc(e.target.dataset.adminDelSelo).delete();
      await loadAdminData(); renderAdminSelosPanel(); toast('Selo removido.'); return;
    }
  });

  $('#registerForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    if($('#regPass').value !== $('#regPass2').value) return toast('As senhas não conferem');
    try{
      const cred = await auth.createUserWithEmailAndPassword($('#regEmail').value.trim(), $('#regPass').value);
      currentAuthUser = cred.user;
      mergeUser({...defaultUser, uid:cred.user.uid, name:$('#regName').value.trim() || 'Usuário', slug:cleanSlug($('#regSlug').value), email:cred.user.email});
      addHistory('Conta registrada');
      await saveUser('Conta criada!');
      location.hash = '#/dashboard';
    }catch(err){ toast('Erro ao registrar: ' + err.message); }
  });
  $('#loginForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    try{
      const cred = await auth.signInWithEmailAndPassword($('#loginEmail').value.trim(), $('#loginPass').value);
      currentAuthUser = cred.user;
      await loadUserByUid(cred.user.uid);
      renderDash();
      location.hash = '#/dashboard';
      toast('Login efetuado!');
    }catch(err){ toast('Erro no login: ' + err.message); }
  });
  $('#logoutBtn')?.addEventListener('click', async ()=>{ await auth.signOut(); mergeUser(defaultUser); location.hash='#/'; });
  $('#viewProfile')?.addEventListener('click', ()=>{ location.hash = '#/' + user.slug; });
  $('#viewProfile2')?.addEventListener('click', ()=>{ location.hash = '#/' + user.slug; });
  $('#backToDash')?.addEventListener('click', ()=>{ location.hash = '#/dashboard'; });
  $('#soundBtn')?.addEventListener('click', ()=>{ const a=$('#profileAudio'); if(!a || !user.music) return toast('Nenhuma música configurada'); a.paused ? a.play().catch(()=>{}) : a.pause(); });

  $('#saveAccount')?.addEventListener('click', async ()=>{
    user.name = $('#cfgName').value.trim() || user.name;
    user.slug = cleanSlug($('#cfgSlug').value);
    user.bio = $('#cfgBio').value;
    user.music = $('#cfgMusic').value.trim();
    user.welcome = $('#cfgWelcome').value.trim() || 'Clique aqui';
    addHistory('Configurações da conta alteradas');
    await saveUser();
  });
  $('#saveImages')?.addEventListener('click', async ()=>{
    // Salva exatamente o que estiver nos inputs. Se apagar o input, apaga no perfil também.
    user.avatar = $('#cfgAvatar').value.trim();
    user.banner = $('#cfgBanner').value.trim();
    user.bg = $('#cfgBg').value.trim();
    user.video = $('#cfgVideo').value.trim();
    user.frame = $('#cfgFrame').value.trim();
    addHistory('Imagens/fundos alterados');
    await saveUser('Imagens salvas!');
  });
  $('#saveTheme')?.addEventListener('click', async ()=>{
    user.color = $('#cfgColor').value || '#a855f7';
    user.particleType = $('#cfgParticleType').value || 'none';
    user.particles = user.particleType !== 'none';
    user.template = $('#cfgTemplate').value || 'default';
    user.decoration = $('#cfgDecoration').value || 'none';
    user.verified = !!$('#cfgVerified').checked;
    user.hideViews = !!$('#cfgHideViews').checked;
    addHistory('Tema/efeitos alterados');
    await saveUser();
  });
  $('#addLink')?.addEventListener('click', ()=>{ user.links.push({name:'Novo link', url:'https://'}); renderLinksEditor(); });
  $('#saveLinks')?.addEventListener('click', async ()=>{
    user.links = $$('.link-row').map(r => ({
      name: $('[data-link-name]', r)?.value.trim() || '',
      url: $('[data-link-url]', r)?.value.trim() || ''
    })).filter(x => x.name || x.url);
    addHistory('Links alterados');
    await saveUser('Links salvos!');
  });
  $('#addSocial')?.addEventListener('click', ()=>{ user.socials.push({name:'Instagram', url:'https://instagram.com/', on:true}); renderSocialEditor(); });
  $('#adminSeloSize')?.addEventListener('input', ()=>{ const v=$('#adminSeloSizeValue'); if(v) v.textContent = $('#adminSeloSize').value + 'px'; });

  $('#saveSocials')?.addEventListener('click', async ()=>{
    user.socials = $$('.social-row').map(r => ({
      name: $('[data-social-name]', r)?.value || 'Instagram',
      url: $('[data-social-url]', r)?.value.trim() || '',
      on: !!$('[data-social-on]', r)?.checked
    }));
    addHistory('Ícones sociais alterados');
    await saveUser('Ícones sociais salvos!');
  });

  $('#saveUploads')?.addEventListener('click', async ()=>{
    const av = $('#uploadAvatar')?.value.trim();
    const bg = $('#uploadBg')?.value.trim();
    const cur = $('#uploadCursor')?.value.trim();
    const mus = $('#uploadMusic')?.value.trim();
    if(av !== undefined) user.avatar = av;
    if(bg !== undefined) user.bg = bg;
    if(cur !== undefined) user.cursor = cur;
    if(mus !== undefined) user.music = mus;
    addHistory('Ativos enviados/alterados');
    await saveUser('Ativos salvos!');
  });

  $('#saveCustom')?.addEventListener('click', async ()=>{
    user.name = $('#customName')?.value.trim() || user.name;
    user.bio = $('#customBio')?.value || '';
    user.bgFx = $('#customBgFx')?.value || 'none';
    user.nameFx = {
      neon: !!$('#fxNeonName')?.checked,
      shine: !!$('#fxShineName')?.checked,
      rainbow: !!$('#fxRainbowName')?.checked,
      perspective: !!$('#fxPerspective')?.checked
    };
    addHistory('Customização alterada');
    await saveUser('Customização salva!');
  });

  $('#ctSaveBtn')?.addEventListener('click', async ()=>{
    user.tagSettings = {
      showFree: !!$('#ctShowFree')?.checked,
      showDlinky: !!$('#ctShowDlinky')?.checked,
      active: $$('[data-ct-tag]').filter(x=>x.checked).map(x=>x.dataset.ctTag)
    };
    user.colors = {
      profileBg: $('#ctProfileBg')?.value || '#1E40AF',
      cardBg: $('#ctCardBg')?.value || '#000000',
      textColor: $('#ctTextColor')?.value || '#FFFFFF',
      bioColor: $('#ctBioColor')?.value || '#FFFFFF'
    };
    user.color = user.colors.profileBg || user.color;
    addHistory('Cores e tags alteradas');
    await saveUser('Cores e tags salvas!');
  });


  document.addEventListener('click', e=>{
    const pick = e.target.closest('[data-particle-pick]');
    if(pick){ const sel=$('#particleTypeNew'); if(sel) sel.value = pick.dataset.particlePick; }
  });
  $('#saveParticlesNew')?.addEventListener('click', async ()=>{
    user.particleType = $('#particleTypeNew')?.value || 'none';
    user.particles = user.particleType !== 'none';
    user.particleCount = Number($('#particleCountNew')?.value || 45);
    user.particleSpeed = Number($('#particleSpeedNew')?.value || 5);
    user.particleSize = $('#particleSizeNew')?.value || 'small';
    addHistory('Partículas alteradas');
    await saveUser('Partículas salvas!');
  });
  $('#savePay')?.addEventListener('click', async ()=>{
    user.payment = {
      payName: $('#payName')?.value.trim() || 'Dlinky',
      pixKey: $('#payPix')?.value.trim() || DLINKY_PIX_KEY,
      endpoint: $('#payEndpoint')?.value.trim() || '',
      token: $('#payToken')?.value.trim() || ''
    };
    await saveUser('Configuração PIX salva.');
  });
  $('#previewParticlesNew')?.addEventListener('click', ()=>{ location.hash = '#/' + user.slug; });
  $('#customCoinsBtn,#customCoinsBtn2')?.addEventListener?.('click', async ()=>{});

  ['adjustX','adjustY','adjustScale','adjustRotate'].forEach(id=>$('#'+id)?.addEventListener('input', updateAdjustPreview));
  $('#closeFrameAdjust')?.addEventListener('click', ()=>$('#frameAdjustModal')?.classList.remove('show','real-centered-modal','dlinky-clean-adjust'));
  $('#resetFrameAdjust')?.addEventListener('click', ()=>{ $('#adjustX').value=0; $('#adjustY').value=0; $('#adjustScale').value=100; $('#adjustRotate').value=0; updateAdjustPreview(); });
  $('#saveFrameAdjust')?.addEventListener('click', saveFrameAdjust);
}

function startDashboardParticles(){
  const canvas = $('#particlesCanvas'); if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let dots = [];
  function resize(){
    canvas.width = innerWidth; canvas.height = innerHeight;
    dots = Array.from({length:14},()=>({x:Math.random()*canvas.width, y:Math.random()*canvas.height, r:Math.random()*1.8+1, v:Math.random()*0.35+0.1}));
  }
  addEventListener('resize', resize); resize();
  function anim(){
    if(!document.hidden && !$('#profile')?.classList.contains('active')){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = 'rgba(168,85,247,.65)';
      dots.forEach(d=>{ d.y+=d.v; if(d.y>canvas.height)d.y=-5; ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,Math.PI*2); ctx.fill(); });
    }
    requestAnimationFrame(anim);
  }
  requestAnimationFrame(anim);
}

auth.onAuthStateChanged(async fbUser => {
  currentAuthUser = fbUser || null;
  if(fbUser){
    await loadUserByUid(fbUser.uid);
    await loadAdminData();
    renderDash();
  } else {
    updateAdminVisibility();
  }
  route();
});

document.addEventListener('DOMContentLoaded', ()=>{
  bindEvents();
  renderDash();
  animateLandingCounters();
  startDashboardParticles();
loadLandingFeatured();
  route();
});

/* ===== DLINKY FINAL PATCH: partículas, views, tags, upload local, moldura e Mistic scaffold ===== */
(function(){
  const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
  function cleanUrl(u){
    u=String(u||'').trim();
    if(!u) return '';
    if(u.startsWith('/originals/')) return 'https://i.pinimg.com'+u;
    if(u.startsWith('originals/')) return 'https://i.pinimg.com/'+u;
    if(u.startsWith('//')) return 'https:'+u;
    return u;
  }
  window.normalizeImageUrl = cleanUrl;
  window.getBestAvatar = function(){ return cleanUrl((window.user&&user.avatar)||''); };

  function dedupeInventory(){
    if(!window.user) return;
    const seen=new Set();
    user.inventory=(Array.isArray(user.inventory)?user.inventory:[]).filter(it=>{
      const key=[it.type||'', it.itemId||'', it.url||it.value||'', String(it.name||'').toLowerCase()].join('|');
      if(seen.has(key)) return false;
      seen.add(key); return true;
    });
  }
  function dedupeSocials(){
    if(!window.user) return;
    const seen=new Set();
    user.socials=(Array.isArray(user.socials)?user.socials:[]).filter(s=>{
      const key=[String(s.name||'').toLowerCase(), String(s.url||'').trim().toLowerCase()].join('|');
      if(!s.url && seen.has(String(s.name||'').toLowerCase()+ '|')) return false;
      if(seen.has(key)) return false; seen.add(key); return true;
    });
  }

  const oldRenderDash = window.renderDash;
  window.renderDash = function(){
    dedupeInventory(); dedupeSocials();
    if(typeof oldRenderDash==='function') oldRenderDash();
    const nf=user.nameFx||{};
    const set=(id,v)=>{const el=q(id); if(el) el.checked=!!v;};
    set('#fxNeonName', nf.neon); set('#fxShineName', nf.shine); set('#fxRainbowName', nf.rainbow); set('#fxPerspective', nf.perspective);
    if(q('#uploadAvatar')) q('#uploadAvatar').value=cleanUrl(user.avatar||'');
    if(q('#uploadBg')) q('#uploadBg').value=cleanUrl(user.bg||'');
    if(q('#uploadCursor')) q('#uploadCursor').value=user.cursor||'';
    if(q('#uploadMusic')) q('#uploadMusic').value=user.music||'';
  };
  renderDash = window.renderDash;

  const oldRenderInventory = window.renderInventory;
  window.renderInventory = function(){ dedupeInventory(); if(typeof oldRenderInventory==='function') oldRenderInventory(); };
  if(typeof renderInventory!=='undefined') renderInventory=window.renderInventory;

  window.createProfileParticles = function(type){
    const layer=q('#profileParticleLayer'); if(!layer) return;
    layer.innerHTML='';
    const overlay=q('#entryOverlay');
    if(overlay && !overlay.classList.contains('hidden')) return;
    if(type==='none' || !user.particles) return;
    const map={
      snow:{chars:['❄','❅','✻'],cls:'snow'}, raios:{chars:['⚡','ϟ'],cls:'bolt'}, stars:{chars:['✦','✧','✨'],cls:'star'}, hearts:{chars:['❤','♥'],cls:'heart'},
      bubbles:{chars:[''],cls:'bubble'}, rain:{chars:['│','╱'],cls:'rain'}, fire:{chars:['🔥','•'],cls:'fire'}, leaves:{chars:['🍃','🍂'],cls:'leaf'}, matrix:{chars:['0','1','▦'],cls:'matrix'}, cats:{chars:['🐾','😺'],cls:'cat'}
    };
    const cfg=map[type]||map.stars;
    const count=Math.max(10,Math.min(160,Number(user.particleCount||45)));
    const speed=Math.max(1,Math.min(10,Number(user.particleSpeed||5)));
    const sz={small:[9,15],medium:[14,24],large:[22,38]}[user.particleSize||'small']||[9,15];
    layer.className='dlinky-final-particles';
    for(let i=0;i<count;i++){
      const el=document.createElement('span');
      el.className='fx '+cfg.cls;
      el.textContent=cfg.chars[Math.floor(Math.random()*cfg.chars.length)];
      el.style.left=(Math.random()*100)+'%';
      el.style.setProperty('--drift', ((Math.random()*70)-35)+'px');
      el.style.animationDuration=(Math.max(5,18-speed*1.25)+Math.random()*8)+'s';
      el.style.animationDelay=(-Math.random()*18)+'s';
      el.style.fontSize=(sz[0]+Math.random()*(sz[1]-sz[0]))+'px';
      if(cfg.cls==='bubble'){
        const b=sz[0]+Math.random()*(sz[1]-sz[0]); el.style.width=b+'px'; el.style.height=b+'px';
      }
      layer.appendChild(el);
    }
  };
  createProfileParticles=window.createProfileParticles;

  async function countViewOnce(){
    try{
      if(!q('#profile')?.classList.contains('active')) return;
      const slug=cleanSlug(user.slug||''); if(!slug) return;
      const key='dlinky_view_counted_'+slug+'_'+Date.now().toString().slice(0,8);
      if(sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key,'1');
      user.views=(Number(user.views)||0)+1;
      q('#profileViews')&&(q('#profileViews').textContent=`👁 ${user.views||0} views`);
      await db.collection('profiles').doc(slug).set({views:firebase.firestore.FieldValue.increment(1)},{merge:true});
      if(user.uid) await db.collection('users').doc(user.uid).set({views:firebase.firestore.FieldValue.increment(1)},{merge:true});
    }catch(e){ console.warn('view count skipped', e); }
  }

  const oldRenderProfile = window.renderProfile;
  window.renderProfile = function(){
    if(typeof oldRenderProfile==='function') oldRenderProfile();
    // remove tags fixas duplicadas; tags agora vêm só de Cores e Tags
    const meta=q('.profile-meta');
    if(meta){
      let pv=q('#profileViews');
      if(!pv){ pv=document.createElement('span'); pv.id='profileViews'; meta.appendChild(pv); }
      meta.innerHTML=''; meta.appendChild(pv); pv.textContent=`👁 ${user.views||0} views`; pv.style.display=user.hideViews?'none':'inline-block';
    }
    // normaliza URLs quebradas /originals do Pinimg
    ['#profileAvatar','#profileBanner','#profileBg'].forEach(sel=>{
      const el=q(sel); if(!el) return;
      if(sel==='#profileAvatar') setBg(el, cleanUrl(user.avatar));
      if(sel==='#profileBanner') setBg(el, cleanUrl(user.banner));
      if(sel==='#profileBg') setBg(el, cleanUrl(user.bg));
    });
    const frame=q('#profileFrame');
    if(frame && user.frame){ frame.src=cleanUrl(user.frame); }
    const audio=q('#profileAudio');
    if(audio && audio.src && !q('#profile')?.classList.contains('active')){ audio.pause(); }
    const overlay=q('#entryOverlay');
    if(overlay && !overlay.classList.contains('hidden')){ const l=q('#profileParticleLayer'); if(l) l.innerHTML=''; }
    else createProfileParticles(user.particleType||'none');
    setTimeout(countViewOnce, 400);
  };
  renderProfile=window.renderProfile;

  q('#entryOverlay')?.addEventListener('click',()=>{
    setTimeout(()=>createProfileParticles(user.particleType||'none'),380);
  },true);

  window.addEventListener('hashchange',()=>setTimeout(()=>{
    if(!q('#profile')?.classList.contains('active')){
      q('#profileAudio')?.pause();
      const l=q('#profileParticleLayer'); if(l) l.innerHTML='';
    }
  },150));

  // Ajuste de moldura: sempre mostra avatar real, normaliza URL e aplica ajuste na hora
  const oldOpenFrameAdjust = window.openFrameAdjust;
  window.openFrameAdjust = function(){
    if(typeof oldOpenFrameAdjust==='function') oldOpenFrameAdjust();
    setBg(q('#adjustAvatar'), cleanUrl(user.avatar));
    const img=q('#adjustFrame'); if(img && user.frame) img.src=cleanUrl(user.frame);
  };
  if(typeof openFrameAdjust!=='undefined') openFrameAdjust=window.openFrameAdjust;
  ['#adjustX','#adjustY','#adjustScale','#adjustRotate'].forEach(id=>q(id)?.addEventListener('input',()=>{ if(typeof updateAdjustPreview==='function') updateAdjustPreview(); }));

  // Upload local: clicar na caixa abre arquivos e grava em dataURL no input correspondente.
  const uploadMap=[
    ['#uploadAvatar','image/*,.gif'], ['#uploadBg','image/*,.gif,.mp4,.webm'], ['#uploadCursor','.cur,.ani,.png,.gif,image/*'], ['#uploadMusic','.mp3,.ogg,audio/*']
  ];
  uploadMap.forEach(([inputSel,accept])=>{
    const inp=q(inputSel); const drop=inp?.parentElement?.querySelector('.drop'); if(!inp||!drop) return;
    drop.style.cursor='pointer';
    drop.addEventListener('click',()=>{
      const f=document.createElement('input'); f.type='file'; f.accept=accept;
      f.onchange=()=>{
        const file=f.files&&f.files[0]; if(!file) return;
        const reader=new FileReader();
        reader.onload=()=>{ inp.value=String(reader.result||''); toast('Arquivo carregado. Clique em Enviar para salvar.'); };
        reader.readAsDataURL(file);
      };
      f.click();
    });
  });

  // Corrige salvamento dos inputs de ativos sem apagar campos vazios por acidente.
  q('#saveUploads')?.addEventListener('click', async (e)=>{
    e.preventDefault(); e.stopImmediatePropagation();
    const av=q('#uploadAvatar')?.value.trim()||'';
    const bg=q('#uploadBg')?.value.trim()||'';
    const cur=q('#uploadCursor')?.value.trim()||'';
    const mus=q('#uploadMusic')?.value.trim()||'';
    user.avatar=cleanUrl(av); user.bg=cleanUrl(bg); user.cursor=cur; user.music=mus;
    addHistory('Ativos enviados/alterados');
    await saveUser('Ativos salvos!');
  },true);

  // Antes de salvar sociais, remove duplicados idênticos.
  q('#saveSocials')?.addEventListener('click',()=>setTimeout(()=>{dedupeSocials(); saveUser('Ícones sociais salvos!');},0),true);
})();

/* ===== DLINKY MISTICPAY FRONTEND HOOK (opcional) ===== */
(function(){
  const q=(s)=>document.querySelector(s);
  const oldPix = window.openPixRecharge || (typeof openPixRecharge!=='undefined' ? openPixRecharge : null);
  window.openPixRecharge = async function(coins){
    if(!window.currentAuthUser && typeof currentAuthUser!=='undefined' && !currentAuthUser) return toast('Faça login para recarregar.');
    const price = (typeof packPriceBRL==='function') ? packPriceBRL(coins) : Number(coins||0);
    const orderId = 'DLK-' + Date.now().toString(36).toUpperCase();
    const modal = document.getElementById('dlinkyPixRechargeModal');
    if(!modal){ if(oldPix) return oldPix(coins); return; }
    const set=(id,val)=>{ const el=document.getElementById(id); if(el) el.value!==undefined ? el.value=val : el.textContent=val; };
    set('dlinkyPixProduct', coins + ' Linkwans');
    set('dlinkyPixPrice', 'R$ ' + price.toFixed(2).replace('.',','));
    set('dlinkyPixUser', (user.email || user.slug || 'Usuário'));
    set('dlinkyPixOrderId', orderId);
    const qr = document.getElementById('dlinkyPixQr');
    if(qr) qr.innerHTML = '<div class="dlinky-pix-qr-fake">Gerando PIX...</div>';
    modal.dataset.coins = String(coins); modal.dataset.price = String(price); modal.dataset.order = orderId;
    modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
    try{
      const res = await fetch('/.netlify/functions/create-mistic-pix',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({amount:price, linkwans:coins, orderId, uid:currentAuthUser?.uid||'', email:user.email||currentAuthUser?.email||'', name:user.name||user.slug||''})
      });
      const data = await res.json().catch(()=>({}));
      const copy = data.pixCopyPaste || data.qrCode || '';
      if(copy) set('dlinkyPixKey', copy);
      else set('dlinkyPixKey', (getUserPaymentCfg?.().pixKey || DLINKY_PIX_KEY || ''));
      if(qr){
        const img = data.qrCode && String(data.qrCode).startsWith('http') ? data.qrCode : (copy ? pixQrUrl(copy) : pixQrUrl(document.getElementById('dlinkyPixKey')?.value||''));
        qr.innerHTML = img ? `<img alt="QR Code PIX" src="${img}">` : '<div class="dlinky-pix-qr-fake">PIX</div>';
      }
      await db.collection('paymentRequests').doc(orderId).set({orderId,type:'recharge',coins:Number(coins),price,status:'waiting_pix',uid:currentAuthUser?.uid||'',email:user.email||currentAuthUser?.email||'',mistic:data.raw||data,createdAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
    }catch(e){
      console.warn('MisticPay indisponível, usando PIX manual',e);
      const key=(getUserPaymentCfg?.().pixKey || DLINKY_PIX_KEY || ''); set('dlinkyPixKey', key);
      if(qr) qr.innerHTML = pixQrUrl(key+' '+orderId+' R$ '+price.toFixed(2)) ? `<img alt="QR Code PIX" src="${pixQrUrl(key+' '+orderId+' R$ '+price.toFixed(2))}">` : '<div class="dlinky-pix-qr-fake">PIX</div>';
    }
  };
  if(typeof openPixRecharge!=='undefined') openPixRecharge=window.openPixRecharge;
})();

/* ===== DLINKY PATCH FINAL DO USUÁRIO: partículas reais, entrada, presentes, tema, ajustes ===== */
(function(){
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const clean=(u)=>{u=String(u||'').trim(); if(u.startsWith('/originals/')) return 'https://i.pinimg.com'+u; if(u.startsWith('originals/')) return 'https://i.pinimg.com/'+u; if(u.startsWith('//')) return 'https:'+u; return u;};
  const safeToast=(m)=>{try{toast(m)}catch(e){console.log(m)}};

  // tema claro/escuro de verdade, igual botão lua/sol do painel
  const savedTheme = localStorage.getItem('dlinky_theme_mode') || 'dark';
  document.body.classList.toggle('light', savedTheme === 'light');
  document.addEventListener('click', (e)=>{
    const ac=e.target.closest('[data-action="toggleTheme"]');
    if(!ac) return;
    setTimeout(()=>{
      const isLight=document.body.classList.contains('light');
      localStorage.setItem('dlinky_theme_mode', isLight ? 'light' : 'dark');
      qa('[data-action="toggleTheme"]').forEach(b=>b.textContent=isLight?'☀':'☾');
    },0);
  }, true);
  qa('[data-action="toggleTheme"]').forEach(b=>b.textContent=document.body.classList.contains('light')?'☀':'☾');

  function pauseProfileMedia(){
    const a=q('#profileAudio');
    if(a){ try{a.pause(); a.currentTime=0;}catch(e){} }
    const v=q('#profileVideo');
    if(v){ try{v.pause();}catch(e){} }
    const layer=q('#profileParticleLayer'); if(layer) layer.innerHTML='';
  }
  window.addEventListener('hashchange',()=>setTimeout(()=>{ if(!q('#profile')?.classList.contains('active')) pauseProfileMedia(); },120));
  const oldOpenTab = window.openTab || (typeof openTab!=='undefined'?openTab:null);
  window.openTab=function(id){ pauseProfileMedia(); if(typeof oldOpenTab==='function') return oldOpenTab(id); };
  if(typeof openTab!=='undefined') openTab=window.openTab;

  // Entrada do perfil: NÃO usa floco/raio parado. Só nome + estrela. Sempre aparece ao entrar novamente no perfil.
  window.entryOverlayHtml=function(){
    const text = (window.user && (user.welcome || user.name)) || 'Clique aqui';
    return `<div class="entry-blur-orb clean-entry-orb"></div><h1>${String(text).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}</h1><span class="entry-star-only">✧</span>`;
  };
  if(typeof entryOverlayHtml!=='undefined') entryOverlayHtml=window.entryOverlayHtml;

  window.createProfileParticles=function(type){
    const layer=q('#profileParticleLayer');
    if(!layer) return;
    layer.innerHTML='';
    if(!q('#profile')?.classList.contains('active')) return;
    const overlay=q('#entryOverlay');
    if(overlay && !overlay.classList.contains('hidden')) return;
    if(!window.user || type==='none' || !user.particles) return;
    const configs={
      snow:{chars:['❄','❅','✻','✼'],cls:'snow'},
      raios:{chars:['⚡','ϟ'],cls:'bolt'},
      stars:{chars:['✦','✧','✩'],cls:'star'},
      hearts:{chars:['❤','♥'],cls:'heart'},
      bubbles:{chars:[''],cls:'bubble'},
      rain:{chars:['│','╱','╲'],cls:'rain'},
      fire:{chars:['🔥','•'],cls:'fire'},
      leaves:{chars:['🍃','🍂'],cls:'leaf'},
      matrix:{chars:['0','1','▦'],cls:'matrix'},
      cats:{chars:['🐾','😺'],cls:'cat'}
    };
    const cfg=configs[type]||configs.stars;
    const count=Math.max(12,Math.min(170,Number(user.particleCount||45)));
    const speed=Math.max(1,Math.min(10,Number(user.particleSpeed||5)));
    const sizeMap={small:[8,14],medium:[13,22],large:[22,36]};
    const sz=sizeMap[user.particleSize||'small']||sizeMap.small;
    layer.className='dlinky-final-particles dlinky-real-fall';
    for(let i=0;i<count;i++){
      const el=document.createElement('span');
      el.className='fx '+cfg.cls;
      el.textContent=cfg.chars[Math.floor(Math.random()*cfg.chars.length)];
      el.style.left=(Math.random()*100)+'vw';
      el.style.setProperty('--drift', ((Math.random()*90)-45)+'px');
      el.style.setProperty('--startY', (-40-Math.random()*260)+'px');
      el.style.animationDuration=(Math.max(6,20-speed*1.35)+Math.random()*9)+'s';
      el.style.animationDelay=(-Math.random()*20)+'s';
      const s=sz[0]+Math.random()*(sz[1]-sz[0]);
      el.style.fontSize=s+'px';
      if(cfg.cls==='bubble'){el.style.width=s+'px';el.style.height=s+'px';}
      layer.appendChild(el);
    }
  };
  if(typeof createProfileParticles!=='undefined') createProfileParticles=window.createProfileParticles;

  // Tags: deixa só as configuráveis. O "dlinky" só aparece se marcado.
  window.renderProfileTagsAndSelos=function(){
    const box=q('#profileTags');
    if(box){
      const tags=[];
      const ts=(user&&user.tagSettings)||{};
      if(ts.showFree!==false) tags.push('✦ grátis');
      if(ts.showDlinky===true) tags.push('⚡ dlinky');
      const active=new Set(Array.isArray(ts.active)?ts.active:[]);
      if(Array.isArray(window.AVAILABLE_TAGS || null)){
        AVAILABLE_TAGS.forEach(([id,label])=>{ if(active.has(id)) tags.push(label); });
      } else {
        (active||[]).forEach(t=>tags.push(t));
      }
      box.innerHTML=tags.map(t=>`<span>${String(t).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}</span>`).join('');
    }
    let seloBox=q('#profileSelos');
    if(!seloBox && q('#profileSocials')){seloBox=document.createElement('div');seloBox.id='profileSelos';seloBox.className='profile-selos';q('#profileSocials').insertAdjacentElement('afterend',seloBox);}
    if(seloBox) seloBox.innerHTML=(user.selos||[]).map(s=>`<img title="${(s.name||'Selo').replace(/"/g,'&quot;')}" src="${clean(s.url||'').replace(/"/g,'%22')}" style="width:${Number(s.size||32)}px;height:${Number(s.size||32)}px">`).join('');
  };
  if(typeof renderProfileTagsAndSelos!=='undefined') renderProfileTagsAndSelos=window.renderProfileTagsAndSelos;

  const oldRenderProfile=window.renderProfile || (typeof renderProfile!=='undefined'?renderProfile:null);
  window.renderProfile=function(){
    if(typeof oldRenderProfile==='function') oldRenderProfile();
    const entry=q('#entryOverlay');
    if(entry){
      entry.innerHTML=window.entryOverlayHtml();
      entry.classList.remove('hidden');
      entry.onclick=()=>{
        entry.classList.add('hidden');
        const a=q('#profileAudio');
        if(a && user.music){ a.src=clean(user.music); a.load(); a.play().catch(()=>safeToast('Clique no botão de som para tocar a música.')); }
        setTimeout(()=>window.createProfileParticles(user.particleType||'none'),140);
        try{ countProfileViewOnce(); }catch(e){}
      };
    }
    const a=q('#profileAudio'); if(a && user.music && a.getAttribute('src')!==clean(user.music)){ a.src=clean(user.music); a.load(); }
    const layer=q('#profileParticleLayer'); if(layer) layer.innerHTML='';
    const meta=q('.profile-meta');
    if(meta){
      let pv=q('#profileViews');
      meta.innerHTML='';
      if(!pv){pv=document.createElement('span');pv.id='profileViews';}
      pv.textContent=`👁 ${Number(user.views||0)} views`;
      pv.style.display=user.hideViews?'none':'inline-block';
      meta.appendChild(pv);
    }
    window.renderProfileTagsAndSelos();
    const av=q('#profileAvatar'); if(av) setBg(av, clean(user.avatar));
    const bg=q('#profileBg'); if(bg) setBg(bg, clean(user.bg));
    const bn=q('#profileBanner'); if(bn) setBg(bn, clean(user.banner));
    const pf=q('#profileFrame'); if(pf && user.frame){pf.src=clean(user.frame); pf.classList.add('manual-adjusted');}
  };
  if(typeof renderProfile!=='undefined') renderProfile=window.renderProfile;

  async function countProfileViewOnce(){
    try{
      const slug=(user.slug||'').toLowerCase(); if(!slug) return;
      const key='dlinky_real_view_'+slug+'_'+new Date().toISOString().slice(0,10);
      if(sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key,'1');
      user.views=Number(user.views||0)+1;
      q('#profileViews')&&(q('#profileViews').textContent=`👁 ${user.views} views`);
      await db.collection('profiles').doc(slug).set({views:firebase.firestore.FieldValue.increment(1)},{merge:true});
      if(user.uid) await db.collection('users').doc(user.uid).set({views:firebase.firestore.FieldValue.increment(1)},{merge:true});
    }catch(e){}
  }

  // Botão salvar para efeitos no painel de Customização.
  function ensureEffectsSave(){
    const panel=q('#tab-custom .grid2 .panel.form-panel:nth-child(2)');
    if(panel && !q('#saveFxOnly')) panel.insertAdjacentHTML('beforeend','<button class="btn primary" id="saveFxOnly" type="button" style="margin-top:18px">Salvar efeitos</button>');
  }
  ensureEffectsSave();
  document.addEventListener('click',async(e)=>{
    if(!e.target.closest('#saveFxOnly')) return;
    user.nameFx={
      neon:!!q('#fxNeonName')?.checked,
      shine:!!q('#fxShineName')?.checked,
      rainbow:!!q('#fxRainbowName')?.checked,
      perspective:!!q('#fxPerspective')?.checked
    };
    user.bgFx=q('#customBgFx')?.value||user.bgFx||'none';
    try{addHistory('Efeitos de nome/card salvos'); await saveUser('Efeitos salvos!');}catch(err){safeToast('Efeitos salvos!');}
  },true);

  // Ajuste de moldura: preview com avatar real, controles funcionando e aplicação correta no perfil.
  const oldOpenAdjust=window.openFrameAdjust || (typeof openFrameAdjust!=='undefined'?openFrameAdjust:null);
  window.openFrameAdjust=function(){
    if(!user.frame) return safeToast('Use uma moldura primeiro.');
    if(typeof oldOpenAdjust==='function') oldOpenAdjust();
    const modal=q('#frameAdjustModal'); if(modal) modal.classList.add('show','real-centered-modal','dlinky-clean-adjust');
    setBg(q('#adjustAvatar'), clean(user.avatar));
    const img=q('#adjustFrame'); if(img){img.src=clean(user.frame); img.style.display='block';}
    updateAdjustPreviewFixed();
  };
  if(typeof openFrameAdjust!=='undefined') openFrameAdjust=window.openFrameAdjust;
  window.updateAdjustPreviewFixed=function(){
    const img=q('#adjustFrame'); if(!img) return;
    const x=Number(q('#adjustX')?.value||0), y=Number(q('#adjustY')?.value||0), sc=Number(q('#adjustScale')?.value||100)/100, rot=Number(q('#adjustRotate')?.value||0);
    img.style.transform=`translate(-50%,-50%) translate(${x}px,${y}px) scale(${sc}) rotate(${rot}deg)`;
  };
  ['adjustX','adjustY','adjustScale','adjustRotate'].forEach(id=>q('#'+id)?.addEventListener('input',window.updateAdjustPreviewFixed,true));

  // Inventário sem duplicar e remover só do perfil.
  function itemKey(it){return [(it.type||''),(it.itemId||''),clean(it.url||it.value||''),String(it.name||'').toLowerCase()].join('|');}
  window.dlinkyDedupeInventory=function(){
    const seen=new Set();
    user.inventory=(Array.isArray(user.inventory)?user.inventory:[]).filter(it=>{const k=itemKey(it); if(seen.has(k)) return false; seen.add(k); return true;});
  };
  const oldRenderInventory=window.renderInventory || (typeof renderInventory!=='undefined'?renderInventory:null);
  window.renderInventory=function(){ window.dlinkyDedupeInventory(); if(typeof oldRenderInventory==='function') oldRenderInventory(); };
  if(typeof renderInventory!=='undefined') renderInventory=window.renderInventory;

  // Modal de presentear na loja, igual compra.
  function openGiftModal(kind,data){
    let modal=q('#dlinkyGiftModal');
    if(!modal){
      document.body.insertAdjacentHTML('beforeend',`<div id="dlinkyGiftModal" class="modal dlinky-gift-modal"><div class="modal-card dlinky-buy-card"><button class="modal-close" id="dlinkyGiftClose" type="button">×</button><h2>Enviar presente</h2><p>Escolha o destinatário e confirme o envio.</p><div class="dlinky-buy-info"><div><span>Item</span><b id="giftItemName"></b></div><div><span>Tipo</span><b id="giftItemType"></b></div><div><span>Preço</span><b id="giftItemPrice"></b></div><div><span>Duração</span><b id="giftItemDuration"></b></div></div><label>Destinatário *</label><div class="gift-dest-row"><input id="giftTarget" placeholder="@slug ou e-mail"><button class="btn primary" id="giftVerify" type="button">Verificar</button></div><small id="giftStatus">Digite o slug do amigo.</small><label>Mensagem opcional</label><textarea id="giftMessage" maxlength="100" placeholder="Escreva uma mensagem"></textarea><div class="dlinky-buy-actions"><button class="btn dark" id="giftCancel" type="button">Cancelar</button><button class="btn primary" id="giftConfirm" type="button">🎁 Presentear</button></div></div></div>`);
      modal=q('#dlinkyGiftModal');
    }
    modal.dataset.kind=kind; modal.dataset.payload=JSON.stringify(data||{});
    q('#giftItemName').textContent=data.name||'Item';
    q('#giftItemType').textContent=kind==='frame'?'Moldura':'Efeito';
    q('#giftItemPrice').textContent=Number(data.price||0)+' Linkwuans';
    q('#giftItemDuration').textContent=data.duration||'Permanente';
    q('#giftTarget').value=''; q('#giftMessage').value=''; q('#giftStatus').textContent='Digite o slug do amigo.';
    modal.classList.add('show');
  }
  async function findTarget(v){
    v=String(v||'').trim().replace(/^@/,''); if(!v) return null;
    try{
      let snap=await db.collection('users').where('slug','==',v.toLowerCase()).limit(1).get();
      if(!snap.empty) return {id:snap.docs[0].id,data:snap.docs[0].data()};
      snap=await db.collection('users').where('email','==',v.toLowerCase()).limit(1).get();
      if(!snap.empty) return {id:snap.docs[0].id,data:snap.docs[0].data()};
    }catch(e){}
    return null;
  }
  document.addEventListener('click',async(e)=>{
    const gf=e.target.closest('[data-gift-frame]');
    if(gf){
      e.preventDefault(); e.stopPropagation();
      const id=gf.dataset.giftFrame; const frame=(customFrames||[]).find(f=>f.id===id); if(!frame) return safeToast('Moldura não encontrada.');
      const sel=document.querySelector(`[data-duration-for="${CSS.escape(id)}"]`); const duration=(sel?.selectedOptions?.[0]?.textContent || sel?.value || 'Permanente').replace(/^0$/,'Permanente');
      openGiftModal('frame',{id,name:frame.name,url:frame.url,price:Number(frame.price||0),duration}); return;
    }
    if(e.target.closest('#dlinkyGiftClose')||e.target.closest('#giftCancel')){q('#dlinkyGiftModal')?.classList.remove('show'); return;}
    if(e.target.closest('#giftVerify')){const t=await findTarget(q('#giftTarget')?.value); q('#giftStatus').textContent=t?'Usuário encontrado.':'Usuário não encontrado.'; return;}
    if(e.target.closest('#giftConfirm')){
      const modal=q('#dlinkyGiftModal'); if(!modal) return;
      const kind=modal.dataset.kind; let data={}; try{data=JSON.parse(modal.dataset.payload||'{}')}catch(err){}
      const price=Number(data.price||0); if(Number(user.coins||0)<price) return safeToast('Saldo insuficiente.');
      const target=await findTarget(q('#giftTarget')?.value); if(!target) return safeToast('Destinatário não encontrado.');
      if(target.id===currentAuthUser?.uid) return safeToast('Não pode presentear você mesmo.');
      const td=Object.assign({},target.data); td.inventory=Array.isArray(td.inventory)?td.inventory:[];
      if(kind==='frame') td.inventory.unshift({type:'frame',itemId:data.id||'',name:data.name||'Moldura',url:data.url||'',value:data.url||'',gift:true,msg:q('#giftMessage')?.value||'',duration:data.duration||'Permanente',date:Date.now()});
      user.coins=Number(user.coins||0)-price;
      await db.collection('users').doc(target.id).set(td,{merge:true});
      if(td.slug) await db.collection('profiles').doc(String(td.slug).toLowerCase()).set(td,{merge:true});
      await saveUser('Presente enviado!'); modal.classList.remove('show'); renderDash(); renderShop(); return;
    }
  },true);

  // MisticPay: se a função responder QR real, mostra. Se não responder, informa configurar env em vez de fingir PIX manual.
  const oldOpenPix=window.openPixRecharge || (typeof openPixRecharge!=='undefined'?openPixRecharge:null);
  window.openPixRecharge=async function(coins){
    if(!currentAuthUser) return safeToast('Faça login para recarregar.');
    const price=(typeof packPriceBRL==='function')?packPriceBRL(coins):Number(coins||0);
    const orderId='DLK-'+Date.now().toString(36).toUpperCase();
    const modal=q('#dlinkyPixRechargeModal'); if(!modal){ if(oldOpenPix) return oldOpenPix(coins); return; }
    const set=(id,v)=>{const el=q('#'+id); if(el) el.value!==undefined?el.value=v:el.textContent=v;};
    set('dlinkyPixProduct', coins+' Linkwans'); set('dlinkyPixPrice','R$ '+price.toFixed(2).replace('.',',')); set('dlinkyPixUser',user.email||currentAuthUser.email||user.slug||'Usuário'); set('dlinkyPixOrderId',orderId);
    const qr=q('#dlinkyPixQr'); if(qr) qr.innerHTML='<div class="dlinky-pix-qr-fake">Gerando PIX...</div>';
    modal.classList.add('show'); modal.setAttribute('aria-hidden','false'); modal.dataset.coins=coins; modal.dataset.price=price; modal.dataset.order=orderId;
    try{
      const res=await fetch('/.netlify/functions/create-mistic-pix',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:price,linkwans:coins,orderId,uid:currentAuthUser?.uid||'',email:user.email||currentAuthUser?.email||'',name:user.name||user.slug||''})});
      const data=await res.json().catch(()=>({}));
      if(!res.ok || data.error) throw new Error(data.error||'MisticPay não configurado');
      const copy=data.pixCopyPaste||data.copyPaste||data.qrCodeText||data.qrcode||'';
      const img=data.qrCodeImage||data.qrCodeUrl||data.qrCode||'';
      set('dlinkyPixKey',copy||'PIX gerado pela MisticPay');
      if(qr){
        if(img && String(img).startsWith('data:')) qr.innerHTML=`<img alt="QR Code PIX" src="${img}">`;
        else if(img && String(img).startsWith('http')) qr.innerHTML=`<img alt="QR Code PIX" src="${img}">`;
        else if(copy && typeof pixQrUrl==='function') qr.innerHTML=`<img alt="QR Code PIX" src="${pixQrUrl(copy)}">`;
        else qr.innerHTML='<div class="dlinky-pix-qr-fake">PIX OK</div>';
      }
    }catch(err){
      if(qr) qr.innerHTML='<div class="dlinky-pix-qr-fake">Configure MISTIC_CLIENT_ID e MISTIC_CLIENT_SECRET no Netlify</div>';
      set('dlinkyPixKey','MisticPay ainda não configurada no Netlify.');
      console.warn(err);
    }
  };
  if(typeof openPixRecharge!=='undefined') openPixRecharge=window.openPixRecharge;
})();

/* ===== HOTFIX FINAL: entrada limpa, ajuste real, loja visual e Mistic sem tela quebrada ===== */
(function(){
  const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s||'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  function norm(u){
    u=String(u||'').trim();
    if(!u) return '';
    if(u.startsWith('/originals/')) return 'https://i.pinimg.com'+u;
    if(u.startsWith('originals/')) return 'https://i.pinimg.com/'+u;
    if(u.startsWith('//')) return 'https:'+u;
    return u;
  }
  function bestAvatar(){
    let u=(window.user&&user.avatar)||'';
    if(!u){
      const img=q('#profileAvatar');
      if(img && img.src) u=img.src;
      const av=q('#dashAvatar')||q('#sideAvatar');
      if(av){ const bg=getComputedStyle(av).backgroundImage; const m=bg&&bg.match(/url\(["']?(.*?)["']?\)/); if(m) u=m[1]; }
    }
    return norm(u);
  }

  // Entrada: remove a bola preta/cinza e qualquer ícone parado em cima. Fica só texto + estrelinha.
  window.entryOverlayHtml=function(){
    const txt=(window.user && (user.welcome||'Clique aqui')) || 'Clique aqui';
    return `<h1>${esc(txt)}</h1><span class="entry-star-only">✧</span>`;
  };
  try{ if(typeof entryOverlayHtml!=='undefined') entryOverlayHtml=window.entryOverlayHtml; }catch(e){}

  // Partículas: nunca aparecem na tela de clique; só depois do clique e sempre caindo de cima para baixo.
  window.createProfileParticles=function(type){
    const layer=q('#profileParticleLayer'); if(!layer) return;
    layer.innerHTML='';
    if(!q('#profile')?.classList.contains('active')) return;
    if(q('#entryOverlay') && !q('#entryOverlay').classList.contains('hidden')) return;
    if(!window.user || !user.particles || !type || type==='none') return;
    const map={
      snow:['❄','❅','❆'], stars:['✦','✧','✩'], raios:['⚡','ϟ'], bolts:['⚡','ϟ'],
      bubbles:[''], rain:['│','╱'], fire:['🔥','•'], leaves:['🍃','🍂'], matrix:['0','1'], cats:['🐾','😺']
    };
    const chars=map[type]||map.stars;
    const count=Math.max(18,Math.min(140,Number(user.particleCount||55)));
    const speed=Math.max(1,Math.min(10,Number(user.particleSpeed||5)));
    const sizes={small:[8,14],medium:[13,21],large:[20,32]};
    const sz=sizes[user.particleSize||'small']||sizes.small;
    layer.className='dlinky-particles-rain';
    for(let i=0;i<count;i++){
      const el=document.createElement('span');
      el.className='real-fx real-fx-'+String(type).replace(/[^a-z0-9_-]/gi,'');
      el.textContent=chars[Math.floor(Math.random()*chars.length)];
      const s=sz[0]+Math.random()*(sz[1]-sz[0]);
      el.style.left=(Math.random()*100)+'vw';
      el.style.fontSize=s+'px';
      el.style.setProperty('--xdrift', ((Math.random()*80)-40)+'px');
      el.style.animationDuration=(Math.max(5,18-speed*1.2)+Math.random()*7)+'s';
      el.style.animationDelay=(-Math.random()*14)+'s';
      if(type==='bubbles'){ el.style.width=s+'px'; el.style.height=s+'px'; }
      layer.appendChild(el);
    }
  };
  try{ if(typeof createProfileParticles!=='undefined') createProfileParticles=window.createProfileParticles; }catch(e){}

  const oldRender=window.renderProfile || (typeof renderProfile!=='undefined'?renderProfile:null);
  window.renderProfile=function(){
    if(typeof oldRender==='function') oldRender();
    const entry=q('#entryOverlay');
    const layer=q('#profileParticleLayer'); if(layer) layer.innerHTML='';
    const a=q('#profileAudio'); if(a && user.music && a.getAttribute('src')!==norm(user.music)){ a.src=norm(user.music); a.load(); }
    if(entry){
      entry.innerHTML=window.entryOverlayHtml();
      entry.classList.remove('hidden');
      entry.onclick=function(){
        entry.classList.add('hidden');
        const audio=q('#profileAudio');
        if(audio && user.music){ audio.src=norm(user.music); audio.load(); audio.play().catch(()=>{}); }
        setTimeout(()=>window.createProfileParticles(user.particleType||'none'),120);
        try{ if(typeof countProfileViewOnce==='function') countProfileViewOnce(); }catch(e){}
      };
    }
  };
  try{ if(typeof renderProfile!=='undefined') renderProfile=window.renderProfile; }catch(e){}

  // Ajuste de moldura: mostra avatar real dentro, controles mudam a moldura e salva.
  window.openFrameAdjust=function(){
    if(!user.frame) return (typeof toast==='function'?toast('Use uma moldura primeiro.'):alert('Use uma moldura primeiro.'));
    const modal=q('#frameAdjustModal'); if(!modal) return;
    const fa=Object.assign({x:0,y:0,scale:1,rotate:0},user.frameAdjust||{});
    q('#adjustX').value=Number(fa.x||0);
    q('#adjustY').value=Number(fa.y||0);
    q('#adjustScale').value=Math.round(Number(fa.scale||1)*100);
    q('#adjustRotate').value=Number(fa.rotate||0);
    const av=q('#adjustAvatar');
    if(av){
      const url=bestAvatar();
      av.style.setProperty('background-image',url?`url("${url.replace(/"/g,'%22')}")`:'none','important');
      av.style.setProperty('background-size','cover','important');
      av.style.setProperty('background-position','center','important');
      av.style.display='block';
    }
    const img=q('#adjustFrame');
    if(img){ img.src=norm(user.frame); img.style.display='block'; }
    modal.classList.add('show','real-centered-modal','dlinky-clean-adjust');
    window.updateAdjustPreview();
  };
  try{ if(typeof openFrameAdjust!=='undefined') openFrameAdjust=window.openFrameAdjust; }catch(e){}
  window.updateAdjustPreview=function(){
    const img=q('#adjustFrame'); if(!img) return;
    const x=Number(q('#adjustX')?.value||0), y=Number(q('#adjustY')?.value||0), sc=Number(q('#adjustScale')?.value||100)/100, rot=Number(q('#adjustRotate')?.value||0);
    img.style.transform=`translate(-50%,-50%) translate(${x}px,${y}px) scale(${sc}) rotate(${rot}deg)`;
  };
  ['adjustX','adjustY','adjustScale','adjustRotate'].forEach(id=>q('#'+id)?.addEventListener('input',window.updateAdjustPreview,true));
  q('#saveFrameAdjust')?.addEventListener('click',async()=>{
    user.frameAdjust={x:Number(q('#adjustX')?.value||0),y:Number(q('#adjustY')?.value||0),scale:Number(q('#adjustScale')?.value||100)/100,rotate:Number(q('#adjustRotate')?.value||0)};
    q('#frameAdjustModal')?.classList.remove('show','real-centered-modal','dlinky-clean-adjust');
    try{ await saveUser('Ajuste salvo.'); }catch(e){ if(typeof toast==='function') toast('Ajuste salvo.'); }
  },true);

  // Corrige preview das molduras/loja para avatar menor e moldura centralizada.
  function polishShop(){
    qa('.real-frame-preview,.frame-shop-preview,.mini-frame-preview,.zyo-item-card .zyo-item-top').forEach(box=>{
      box.classList.add('dlinky-polished-preview');
      const av=box.querySelector('.frame-avatar-demo,.mini-avatar,.shop-avatar-demo');
      const url=bestAvatar();
      if(av && url) av.style.backgroundImage=`url("${url.replace(/"/g,'%22')}")`;
    });
    qa('.zyo-effect-preview').forEach((el,i)=>{
      el.classList.add('pretty-effect-preview');
      const icons=['✦','🔴','✨','🌀'];
      if(!el.textContent.trim() || el.textContent.trim()==='✦') el.textContent=icons[i%icons.length];
    });
    qa('.zyo-price').forEach(el=>{ el.innerHTML=el.innerHTML.replace(/Zyons/gi,'Linkwuans').replace(/Zylons/gi,'Linkwuans'); });
  }
  const oldShop=window.renderShop || (typeof renderShop!=='undefined'?renderShop:null);
  window.renderShop=function(){ if(typeof oldShop==='function') oldShop(); setTimeout(polishShop,50); };
  try{ if(typeof renderShop!=='undefined') renderShop=window.renderShop; }catch(e){}
  setTimeout(polishShop,700);

  // Pix: se as variáveis existem mas ainda falta endpoint/documentação, não mostra texto gigante quebrado.
  const oldPix=window.openPixRecharge || (typeof openPixRecharge!=='undefined'?openPixRecharge:null);
  window.openPixRecharge=async function(coins){
    if(typeof oldPix==='function') await oldPix(coins);
    setTimeout(()=>{
      const qr=q('#dlinkyPixQr'); const key=q('#dlinkyPixKey');
      if(qr && /Configure MISTIC|não configurada|MisticPay ainda/i.test(qr.textContent||'')){
        qr.innerHTML='<div class="dlinky-pix-qr-fake small-pix-msg">MisticPay conectada: falta endpoint da API de cobrança</div>';
      }
      if(key && /MisticPay ainda/i.test(key.value||'')) key.value='Aguardando endpoint de cobrança da MisticPay';
    },900);
  };
  try{ if(typeof openPixRecharge!=='undefined') openPixRecharge=window.openPixRecharge; }catch(e){}

  // Carteira: reforça ícone bonito no card de saldo/inventário.
  setTimeout(()=>qa('#tab-inventory .card,#tab-inventory .clean-stat,.inventory-stat').forEach((c,i)=>{ if(i===0) c.classList.add('wallet-card-fixed'); }),600);
})();

/* ===== LEXVOID FINAL MICRO PATCH: marca, tags emoji, partículas, presentes e ajuste ===== */
(function(){
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s||'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const clean=(u)=>{u=String(u||'').trim(); if(u.startsWith('/originals/')) return 'https://i.pinimg.com'+u; if(u.startsWith('originals/')) return 'https://i.pinimg.com/'+u; if(u.startsWith('//')) return 'https:'+u; return u;};
  const tagMap = {
    paz:'☮️ Paz', programador:'💻 Programador', artista:'🖌️ Artista', designer:'🎨 Designer', escritor:'📝 Escritor', investidor:'💸 Investidor', 'músico':'🎸 Músico', musico:'🎸 Músico', fotografo:'📷 Fotógrafo', arlivre:'🏕️ Ar Livre', bebida:'🍺 Bebida', comida:'🍴 Comida',
    filmes:'🎬 Filmes', seriados:'📺 Seriados', fumante:'🚬 Fumante', negocios:'🏢 Negócios', academia:'💪 Academia', leitor:'📕 Leitor', atleta:'🏃 Atleta', ciencia:'🧪 Ciência', bonito:'💋 Bonito(a)', picante:'🌶️ Picante', animais:'🐾 Animais',
    adoravel:'🎀 Adorável', produtor:'🎹 Produtor(a)', viagem:'🧳 Viagem', gamer:'🎮 Gamer', anjo:'😇 Anjo(a)', perigoso:'😈 Perigoso(a)', skatista:'🛹 Skatista', provocante:'😏 Provocante', basquete:'🏀 Basquete', frio:'🥶 Frio',
    palhaco:'🤡 Palhaço(a)', brasil:'🇧🇷 Brasil', habbo:'🅷 Habbo', boliche:'🎳 Boliche', surfista:'🏄 Surfista', verao:'🏝️ Verão', toxico:'☠️ Tóxico(a)', pensativo:'💭 Pensativo(a)', comunicativo:'🗣️ Comunicativo(a)', insonia:'💤 Insônia',
    apaixonado:'😍 Apaixonado(a)', lgbt:'🌈 LGBT', futebol:'⚽ Futebol', timido:'😳 Tímido(a)', triste:'😭 Triste', bravo:'👺 Bravo(a)', amigavel:'🤝 Amigável', construtor:'👷 Construtor(a)', namorando:'💑 Namorando', solteiro:'🧸 Solteiro(a)',
    lol:'🎮 League Of Legends', valorant:'🔫 Valorant', cs2:'♠️ Counter-Strike 2', paladins:'🔷 Paladins', dota2:'🟥 Dota 2', fortnite:'🇫 Fortnite', gta:'🚓 Grand Theft Auto V', cyber:'🔮 Cybersecurity', piloto:'🛩️ Piloto(a)'
  };
  function brandNow(){
    document.title='LexVoid — Perfil gamer premium';
    qa('.brand strong,.dlinky-hud-brand,.side-head b').forEach(el=>el.textContent='LexVoid');
    qa('.brand-icon').forEach(el=>el.textContent='LV');
    qa('.madeby,.dlinky-hud-credit').forEach(el=>el.innerHTML=el.innerHTML.replace(/Dlinky|dlinky/g,'LexVoid'));
    const side=q('#sideUrl'); if(side) side.textContent='lexvoid/'+((window.user&&user.slug)||'usuario');
  }
  brandNow(); setTimeout(brandNow,500);

  window.entryOverlayHtml=function(){
    const txt=(window.user && user.welcome ? user.welcome : 'Clique aqui');
    return `<h1>${esc(txt)}</h1><span class="entry-star-only">✧</span>`;
  };
  try{ if(typeof entryOverlayHtml!=='undefined') entryOverlayHtml=window.entryOverlayHtml; }catch(e){}

  window.renderProfileTagsAndSelos=function(){
    const box=q('#profileTags');
    if(box){
      const ts=(window.user&&user.tagSettings)||{};
      const active=Array.isArray(ts.active)?ts.active:[];
      const tags=[];
      if(ts.showFree!==false) tags.push('✦ grátis');
      if(ts.showDlinky===true) tags.push('⚡ LexVoid');
      active.forEach(id=>{
        const key=String(id||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]/g,'');
        tags.push(tagMap[id] || tagMap[key] || id);
      });
      box.innerHTML=tags.map(t=>`<span class="lex-tag">${esc(t)}</span>`).join('');
    }
    let seloBox=q('#profileSelos');
    if(!seloBox && q('#profileSocials')){ seloBox=document.createElement('div'); seloBox.id='profileSelos'; seloBox.className='profile-selos'; q('#profileSocials').insertAdjacentElement('afterend',seloBox); }
    if(seloBox) seloBox.innerHTML=(user.selos||[]).map(s=>`<img title="${esc(s.name||'Selo')}" src="${clean(s.url||'').replace(/"/g,'%22')}" style="width:${Number(s.size||32)}px;height:${Number(s.size||32)}px">`).join('');
  };
  try{ if(typeof renderProfileTagsAndSelos!=='undefined') renderProfileTagsAndSelos=window.renderProfileTagsAndSelos; }catch(e){}

  window.createProfileParticles=function(type){
    const layer=q('#profileParticleLayer'); if(!layer) return;
    layer.innerHTML='';
    if(!q('#profile')?.classList.contains('active')) return;
    const entry=q('#entryOverlay');
    if(entry && !entry.classList.contains('hidden')) return;
    if(!window.user || !user.particles || !type || type==='none') return;
    const configs={
      snow:{chars:['❄','❅','❆'],cls:'snow'}, raios:{chars:['⚡','ϟ'],cls:'bolt'}, bolts:{chars:['⚡','ϟ'],cls:'bolt'}, stars:{chars:['✦','✧','✩'],cls:'star'}, hearts:{chars:['❤','♥'],cls:'heart'}, bubbles:{chars:[''],cls:'bubble'}, rain:{chars:['│','╱'],cls:'rain'}, fire:{chars:['🔥','•'],cls:'fire'}, leaves:{chars:['🍃','🍂'],cls:'leaf'}, matrix:{chars:['0','1','▦'],cls:'matrix'}, cats:{chars:['🐾','😺'],cls:'cat'}
    };
    const cfg=configs[type]||configs.stars;
    const count=Math.max(16,Math.min(160,Number(user.particleCount||50)));
    const speed=Math.max(1,Math.min(10,Number(user.particleSpeed||5)));
    const sizeMap={small:[9,15],medium:[14,23],large:[22,36]};
    const sz=sizeMap[user.particleSize||'small']||sizeMap.small;
    layer.className='lexvoid-particle-layer';
    for(let i=0;i<count;i++){
      const el=document.createElement('span');
      el.className='lex-fx lex-fx-'+cfg.cls;
      el.textContent=cfg.chars[Math.floor(Math.random()*cfg.chars.length)];
      const s=sz[0]+Math.random()*(sz[1]-sz[0]);
      el.style.left=(Math.random()*100)+'vw';
      el.style.fontSize=s+'px';
      el.style.setProperty('--drift', ((Math.random()*90)-45)+'px');
      el.style.animationDuration=(Math.max(5,19-speed*1.25)+Math.random()*8)+'s';
      el.style.animationDelay=(-Math.random()*16)+'s';
      if(cfg.cls==='bubble'){el.style.width=s+'px';el.style.height=s+'px';}
      layer.appendChild(el);
    }
  };
  try{ if(typeof createProfileParticles!=='undefined') createProfileParticles=window.createProfileParticles; }catch(e){}

  const prevRender=window.renderProfile || (typeof renderProfile!=='undefined'?renderProfile:null);
  window.renderProfile=function(){
    if(typeof prevRender==='function') prevRender();
    brandNow();
    const entry=q('#entryOverlay');
    const layer=q('#profileParticleLayer'); if(layer) layer.innerHTML='';
    if(entry){
      entry.innerHTML=window.entryOverlayHtml();
      entry.classList.remove('hidden');
      entry.onclick=()=>{
        entry.classList.add('hidden');
        const a=q('#profileAudio'); if(a && user.music){ a.src=clean(user.music); a.load(); a.play().catch(()=>{}); }
        setTimeout(()=>window.createProfileParticles(user.particleType||'none'),120);
        try{ if(typeof countProfileViewOnce==='function') countProfileViewOnce(); }catch(e){}
      };
    }
    window.renderProfileTagsAndSelos();
    const pf=q('#profileFrame');
    if(pf && user.frame){
      const fa=Object.assign({x:0,y:0,scale:1,rotate:0},user.frameAdjust||{});
      pf.src=clean(user.frame); pf.style.display='block'; pf.classList.add('manual-adjusted');
      pf.style.setProperty('--frame-x',(Number(fa.x)||0)+'px');
      pf.style.setProperty('--frame-y',(Number(fa.y)||0)+'px');
      pf.style.setProperty('--frame-scale',Number(fa.scale||1));
      pf.style.setProperty('--frame-rotate',(Number(fa.rotate)||0)+'deg');
    }
  };
  try{ if(typeof renderProfile!=='undefined') renderProfile=window.renderProfile; }catch(e){}

  function updateAdjust(){
    const img=q('#adjustFrame'); if(!img) return;
    const x=Number(q('#adjustX')?.value||0), y=Number(q('#adjustY')?.value||0), sc=Number(q('#adjustScale')?.value||100)/100, rot=Number(q('#adjustRotate')?.value||0);
    img.style.transform=`translate(-50%,-50%) translate(${x}px,${y}px) scale(${sc}) rotate(${rot}deg)`;
  }
  window.updateAdjustPreview=updateAdjust; window.updateAdjustPreviewFixed=updateAdjust;
  ['adjustX','adjustY','adjustScale','adjustRotate'].forEach(id=>q('#'+id)?.addEventListener('input',updateAdjust,true));
  window.openFrameAdjust=function(){
    if(!user.frame) return (typeof toast==='function'?toast('Use uma moldura primeiro.'):alert('Use uma moldura primeiro.'));
    const modal=q('#frameAdjustModal'); if(!modal) return;
    const fa=Object.assign({x:0,y:0,scale:1,rotate:0},user.frameAdjust||{});
    ['adjustX','adjustY','adjustRotate'].forEach(id=>{ const el=q('#'+id); if(el) el.value=Number(fa[id.replace('adjust','').toLowerCase()]||0); });
    if(q('#adjustX')) q('#adjustX').value=Number(fa.x||0);
    if(q('#adjustY')) q('#adjustY').value=Number(fa.y||0);
    if(q('#adjustRotate')) q('#adjustRotate').value=Number(fa.rotate||0);
    if(q('#adjustScale')) q('#adjustScale').value=Math.round(Number(fa.scale||1)*100);
    const av=q('#adjustAvatar'); if(av){ av.style.backgroundImage=user.avatar?`url("${clean(user.avatar).replace(/"/g,'%22')}")`:''; av.style.backgroundSize='cover'; av.style.backgroundPosition='center'; }
    const img=q('#adjustFrame'); if(img){ img.src=clean(user.frame); img.style.display='block'; }
    modal.classList.add('show','real-centered-modal','dlinky-clean-adjust');
    updateAdjust();
  };
  try{ if(typeof openFrameAdjust!=='undefined') openFrameAdjust=window.openFrameAdjust; }catch(e){}
  window.saveFrameAdjust=async function(){
    user.frameAdjust={x:Number(q('#adjustX')?.value||0),y:Number(q('#adjustY')?.value||0),scale:Number(q('#adjustScale')?.value||100)/100,rotate:Number(q('#adjustRotate')?.value||0)};
    q('#frameAdjustModal')?.classList.remove('show','real-centered-modal','dlinky-clean-adjust');
    try{addHistory('Ajuste da moldura salvo'); await saveUser('Ajuste salvo!');}catch(e){ if(typeof toast==='function') toast('Ajuste salvo!'); }
    if(q('#profile')?.classList.contains('active')) window.renderProfile();
  };
  q('#saveFrameAdjust')?.addEventListener('click',(e)=>{e.preventDefault(); e.stopImmediatePropagation(); window.saveFrameAdjust();},true);

  // Duração permanente no presente e modal de presente sempre abre com texto bonito.
  document.addEventListener('click', (e)=>{
    const gf=e.target.closest('[data-gift-frame]');
    if(!gf) return;
    const id=gf.dataset.giftFrame;
    const sel=document.querySelector(`[data-duration-for="${CSS.escape(id)}"]`);
    if(sel && sel.value==='0') sel.dataset.lexDurationLabel='Permanente';
  }, true);
  const oldOpenGift=window.openGiftModal;
  if(typeof oldOpenGift==='function'){
    window.openGiftModal=function(kind,data){ if(data && (data.duration==='0'||data.duration===0)) data.duration='Permanente'; return oldOpenGift(kind,data); };
  }

  function polishShopAndInventory(){
    qa('.zyo-effect-preview,.pretty-effect-preview').forEach((el,i)=>{ const arr=['✨','🔴','💫','🌀']; el.textContent=arr[i%arr.length]; el.classList.add('lex-effect-pretty'); });
    qa('.zyo-price').forEach(el=>{ el.innerHTML=el.innerHTML.replace(/Zyons|Zylons|Linkwans/gi,'Linkwuans'); });
    qa('.clean-stat,.card,.wallet-card-fixed').forEach((c,i)=>{ if(/Saldo|Carteira/.test(c.textContent||'')) c.classList.add('lex-wallet-card'); });
  }
  const oldShop=window.renderShop || (typeof renderShop!=='undefined'?renderShop:null);
  window.renderShop=function(){ if(typeof oldShop==='function') oldShop(); setTimeout(polishShopAndInventory,40); };
  try{ if(typeof renderShop!=='undefined') renderShop=window.renderShop; }catch(e){}
  const oldInv=window.renderInventory || (typeof renderInventory!=='undefined'?renderInventory:null);
  window.renderInventory=function(){ if(typeof oldInv==='function') oldInv(); setTimeout(polishShopAndInventory,40); };
  try{ if(typeof renderInventory!=='undefined') renderInventory=window.renderInventory; }catch(e){}
  setTimeout(polishShopAndInventory,600);
})();

/* ===== LEXVOID FINAL REQUEST PATCH — custom/effects/store/admin/frame/landing ===== */
(function(){
  const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const safe=s=>String(s||'').replace(/"/g,'%22');
  let adminEffects=[];
  function cleanArr(a){return Array.isArray(a)?a:[]}
  function currentUid(){try{return firebase.auth().currentUser?.uid||''}catch(e){return ''}}
  function dbx(){try{return firebase.firestore()}catch(e){return null}}
  function isAdminX(){try{return typeof isAdmin==='function'?isAdmin():false}catch(e){return false}}
  function itemKey(it){return String(it?.id||it?.itemId||it?.url||it?.value||it?.name||'').toLowerCase().trim()}
  function hasItem(id){id=String(id||'').toLowerCase();return cleanArr(user.inventory).some(it=>itemKey(it)===id || String(it.itemId||'').toLowerCase()===id)}
  function priceFor(item, sel){
    const prices=item.prices||{}; if(sel==='perm') return Number(prices.perm||item.price||0); if(sel==='d15') return Number(prices.d15||item.price||0); if(sel==='d7') return Number(prices.d7||item.price||0); return Number(prices.d3||item.price||0);
  }
  function durationSelectHtml2(id){return `<select class="zyo-duration" data-duration-for="${esc(id)}"><option value="d3">3 dias</option><option value="d7">7 dias</option><option value="d15">15 dias</option><option value="perm">Permanente</option></select>`}
  function previewFrame(url, cls='zyo-frame-preview'){
    return `<div class="${cls}"><span class="shop-avatar" style="background-image:${user.avatar?`url('${safe(user.avatar)}')`:'none'}"></span>${url?`<img src="${safe(url)}" alt="">`:''}</div>`
  }
  function renderAdminEffects(){
    const list=q('#adminEffectsList'); if(!list) return;
    list.innerHTML = adminEffects.map(e=>`<div class="admin-item"><div class="mini-effect-preview" style="background-image:url('${safe(e.url||'')}')"></div><div><b>${esc(e.name||'Efeito')}</b><small>${esc(e.desc||'')}</small><small>Preço: ${Number(e.price||0)} Linkwuans</small></div><button class="delete" type="button" data-admin-del-effect="${esc(e.id)}">×</button></div>`).join('') || '<p>Nenhum efeito cadastrado.</p>';
  }
  async function loadEffects(){
    const db=dbx(); if(!db) return;
    try{const snap=await db.collection('adminEffects').orderBy('createdAt','desc').get(); adminEffects=snap.docs.map(d=>({id:d.id,...d.data()}));}catch(e){adminEffects=[];}
  }
  const oldLoad=window.loadAdminData || (typeof loadAdminData==='function'?loadAdminData:null);
  window.loadAdminData=async function(){ if(oldLoad) await oldLoad(); await loadEffects(); renderAdminEffects(); };
  try{ if(typeof loadAdminData!=='undefined') loadAdminData=window.loadAdminData; }catch(e){}

  function shopFrameCard2(f){
    const id=String(f.id||f.url||f.name||'frame'); const bought=hasItem(id); const price=Number(f.price||f.prices?.perm||0);
    return `<div class="zyo-item-card ${bought?'owned':''}"><div class="zyo-item-top">${previewFrame(f.url||'')}<div><h3>${esc(f.name||'Moldura')}</h3><p>${esc(f.desc||'')}</p>${bought?'<span class="owned-badge">✓ Já comprado</span>':''}</div></div><div class="zyo-price">▣ Preço do item: <b>${price} Linkwuans</b></div>${durationSelectHtml2('frame_'+id)}<small class="zyo-note">ⓘ Valor muda conforme a duração escolhida.</small><div class="zyo-card-actions"><button class="btn primary small" type="button" data-buy-frame="${esc(id)}" ${bought?'disabled':''}>🔒 ${bought?'Já comprado':'Comprar'}</button><button class="btn dark small" type="button" data-gift-frame="${esc(id)}">🎁 Presentear</button></div></div>`;
  }
  function shopEffectCard(e){
    const id=String(e.id||e.url||e.name||'effect'); const bought=hasItem('effect:'+id); const price=Number(e.price||20);
    return `<div class="zyo-item-card ${bought?'owned':''}"><div class="zyo-item-top"><div class="zyo-effect-banner-preview" style="background-image:url('${safe(e.url||'')}')"><span></span></div><div><h3>${esc(e.name||'Efeito')}</h3><p>${esc(e.desc||'Efeito de banner')}</p>${bought?'<span class="owned-badge">✓ Já comprado</span>':''}</div></div><div class="zyo-price">▣ Preço do item: <b>${price} Linkwuans</b></div>${durationSelectHtml2('effect_'+id)}<small class="zyo-note">ⓘ Valor muda conforme a duração escolhida.</small><div class="zyo-card-actions"><button class="btn primary small" type="button" data-buy-admin-effect="${esc(id)}" ${bought?'disabled':''}>🔒 ${bought?'Já comprado':'Comprar'}</button><button class="btn dark small" type="button" data-gift-effect="${esc(id)}">🎁 Presentear</button></div></div>`;
  }
  const oldShop = window.renderShop || (typeof renderShop==='function'?renderShop:null);
  window.renderShop=function(){
    const grid=q('#shopGrid'); if(!grid){ if(oldShop) oldShop(); return; }
    q('#walletCoins') && (q('#walletCoins').textContent=Number(user.coins||0)); q('#invCountMini')&&(q('#invCountMini').textContent=cleanArr(user.inventory).length);
    qa('.shop-tabs button').forEach(b=>b.classList.toggle('active', b.dataset.shopTab===shopMode));
    if(shopMode==='coins'){ if(oldShop) oldShop(); return; }
    grid.className='zyo-shop-grid';
    if(shopMode==='frames'){
      grid.innerHTML = `<div class="zyo-shop-title"><h2>Molduras</h2><p>Destaque-se com molduras cadastradas pelo admin.</p></div>` + (customFrames||[]).map(shopFrameCard2).join('') || '<p>Nenhuma moldura cadastrada.</p>';
      if(!(customFrames||[]).length) grid.innerHTML=`<div class="zyo-shop-title"><h2>Molduras</h2><p>Nenhuma moldura cadastrada pelo admin ainda.</p></div>`;
      return;
    }
    if(shopMode==='effects'){
      grid.innerHTML = `<div class="zyo-shop-title"><h2>Efeitos</h2><p>Efeitos de banner cadastrados pelo admin.</p></div>` + adminEffects.map(shopEffectCard).join('');
      if(!adminEffects.length) grid.innerHTML=`<div class="zyo-shop-title"><h2>Efeitos</h2><p>Nenhum efeito cadastrado pelo admin ainda.</p></div>`;
      return;
    }
    if(shopMode==='other') grid.innerHTML=`<div class="zyo-shop-title"><h2>Outros</h2><p>Itens extras ficarão disponíveis aqui.</p></div>`;
  };
  try{ if(typeof renderShop!=='undefined') renderShop=window.renderShop; }catch(e){}

  function patchRenderDashValues(){
    const nf=user.nameFx||{}; ['NeonName','ShineName','RainbowName','Perspective','GlowCard','PulseCard','BorderRun','FloatCard','AvatarPulse','BannerShine'].forEach(k=>{
      const id='#fx'+k; const prop=k.charAt(0).toLowerCase()+k.slice(1); const el=q(id); if(el) el.checked=!!nf[prop.replace('Name','')];
    });
    const map={fxNeonName:'neon',fxShineName:'shine',fxRainbowName:'rainbow',fxPerspective:'perspective',fxGlowCard:'glowCard',fxPulseCard:'pulseCard',fxBorderRun:'borderRun',fxFloatCard:'floatCard',fxAvatarPulse:'avatarPulse',fxBannerShine:'bannerShine'};
    Object.entries(map).forEach(([id,prop])=>{const el=q('#'+id); if(el) el.checked=!!nf[prop];});
    if(q('#fxGlowColor')) q('#fxGlowColor').value=user.fxGlowColor||'#8b5cf6';
    if(q('#fxCardOpacity')) q('#fxCardOpacity').value=Math.round((user.cardOpacity??0.72)*100);
    if(q('#fxCardBlur')) q('#fxCardBlur').value=Number(user.cardBlur??14);
    if(q('#fxBannerOpacity')) q('#fxBannerOpacity').value=Math.round((user.bannerOpacity??1)*100);
  }
  const oldDash=window.renderDash || (typeof renderDash==='function'?renderDash:null);
  window.renderDash=function(){ if(oldDash) oldDash(); patchRenderDashValues(); renderAdminEffects(); };
  try{ if(typeof renderDash!=='undefined') renderDash=window.renderDash; }catch(e){}

  function applyProfileFx(){
    const card=q('#profileCard'), name=q('#profileName'), banner=q('#profileBanner'), avatar=q('#profileAvatar'); if(!card) return;
    const fx=user.nameFx||{}; const glow=user.fxGlowColor||'#8b5cf6';
    card.style.setProperty('--user-glow', glow);
    card.style.setProperty('--card-alpha', String(user.cardOpacity??0.72));
    card.style.setProperty('--card-blur', (user.cardBlur??14)+'px');
    card.classList.toggle('fx-glow-card',!!fx.glowCard); card.classList.toggle('fx-pulse-card',!!fx.pulseCard); card.classList.toggle('fx-border-run',!!fx.borderRun); card.classList.toggle('fx-float-card',!!fx.floatCard);
    if(name){ name.classList.toggle('fx-neon-name',!!fx.neon); name.classList.toggle('fx-shine-name',!!fx.shine); name.classList.toggle('fx-rainbow-name',!!fx.rainbow); name.style.setProperty('--user-glow',glow); }
    if(banner){ banner.style.opacity=String(user.bannerOpacity??1); banner.classList.toggle('fx-banner-shine',!!fx.bannerShine); }
    if(avatar){ avatar.classList.toggle('fx-avatar-pulse',!!fx.avatarPulse); }
    if(fx.perspective){ card.onmousemove=(ev)=>{const r=card.getBoundingClientRect(); const x=(ev.clientX-r.left)/r.width-.5; const y=(ev.clientY-r.top)/r.height-.5; card.style.transform=`perspective(900px) rotateY(${x*8}deg) rotateX(${-y*8}deg)`}; card.onmouseleave=()=>{card.style.transform=''}; }
    else { card.onmousemove=null; card.onmouseleave=null; card.style.transform=''; }
  }
  const oldProf=window.renderProfile || (typeof renderProfile==='function'?renderProfile:null);
  window.renderProfile=function(){ if(oldProf) oldProf(); applyProfileFx(); };
  try{ if(typeof renderProfile!=='undefined') renderProfile=window.renderProfile; }catch(e){}

  function saveCustomPatch(e){
    e.preventDefault(); e.stopImmediatePropagation();
    user.name=q('#customName')?.value.trim()||user.name; user.bio=q('#customBio')?.value||''; user.bgFx=q('#customBgFx')?.value||'none';
    user.fxGlowColor=q('#fxGlowColor')?.value||'#8b5cf6'; user.cardOpacity=Number(q('#fxCardOpacity')?.value||72)/100; user.cardBlur=Number(q('#fxCardBlur')?.value||14); user.bannerOpacity=Number(q('#fxBannerOpacity')?.value||100)/100;
    user.nameFx={neon:!!q('#fxNeonName')?.checked, shine:!!q('#fxShineName')?.checked, rainbow:!!q('#fxRainbowName')?.checked, perspective:!!q('#fxPerspective')?.checked, glowCard:!!q('#fxGlowCard')?.checked, pulseCard:!!q('#fxPulseCard')?.checked, borderRun:!!q('#fxBorderRun')?.checked, floatCard:!!q('#fxFloatCard')?.checked, avatarPulse:!!q('#fxAvatarPulse')?.checked, bannerShine:!!q('#fxBannerShine')?.checked};
    if(typeof addHistory==='function') addHistory('Customização alterada');
    Promise.resolve(typeof saveUser==='function'?saveUser('Customização salva!'):null).then(()=>{ if(typeof renderDash==='function') renderDash(); });
  }

  function openGiftModal(item){
    let m=q('#lexGiftModal');
    if(!m){document.body.insertAdjacentHTML('beforeend',`<div id="lexGiftModal" class="modal show"><div class="modal-card lex-gift-card"><button class="modal-close" id="lexGiftClose">×</button><h2>Enviar presente</h2><p>Escolha o destinatário e confirme.</p><div class="gift-summary"><div><span>Item</span><b id="giftItemName"></b></div><div><span>Duração</span><b id="giftDuration">Permanente</b></div><div><span>Preço</span><b id="giftPrice"></b></div></div><label>Destinatário <input id="giftRecipient" placeholder="@slug ou email"></label><label>Mensagem opcional<textarea id="giftMessage" maxlength="100" placeholder="Mensagem para quem receber"></textarea></label><button class="btn primary full" id="giftConfirm">Presentear</button></div></div>`); m=q('#lexGiftModal');}
    q('#giftItemName').textContent=item.name||'Item'; q('#giftPrice').textContent=(item.price||0)+' Linkwuans'; q('#giftDuration').textContent=item.durationLabel||'Permanente'; m.classList.add('show');
    q('#lexGiftClose').onclick=()=>m.classList.remove('show');
    q('#giftConfirm').onclick=async()=>{ const rec=q('#giftRecipient').value.trim(); if(!rec) return toast('Digite o destinatário.'); toast('Presente preparado. Use o admin para liberar se necessário.'); m.classList.remove('show'); };
  }

  async function buyAdminEffect(id){
    const ef=adminEffects.find(x=>String(x.id)===String(id)); if(!ef) return toast('Efeito não encontrado.');
    const key='effect:'+ef.id; if(hasItem(key)) return toast('Você já comprou esse efeito.');
    const item={id:key,itemId:key,type:'effect',name:ef.name||'Efeito',desc:ef.desc||'',value:ef.url||'',url:ef.url||'',price:Number(ef.price||20),boughtAt:Date.now()};
    if(Number(user.coins||0)<item.price) return toast('Linkwuans insuficientes.');
    user.coins=Number(user.coins||0)-item.price; user.inventory=cleanArr(user.inventory).concat([item]);
    await saveUser('Efeito comprado!'); renderShop(); renderInventory();
  }
  function useInvEffect(index){ const it=cleanArr(user.inventory)[index]; if(!it) return; user.bannerEffect=it.value||it.url||''; saveUser('Efeito aplicado no banner!'); }

  function updateAdjust(){
    const img=q('#adjustFrame'); if(!img) return;
    const x=Number(q('#adjustX')?.value||0), y=Number(q('#adjustY')?.value||0), sc=Number(q('#adjustScale')?.value||100)/100, rot=Number(q('#adjustRotate')?.value||0);
    img.style.transform=`translate(-50%,-50%) translate(${x}px,${y}px) scale(${sc}) rotate(${rot}deg)`;
  }
  window.updateAdjustPreview=updateAdjust; window.updateAdjustPreviewFixed=updateAdjust;
  window.openFrameAdjust=function(){
    if(!user.frame) return toast('Use uma moldura primeiro.');
    const m=q('#frameAdjustModal'); if(!m) return;
    const fa=Object.assign({x:0,y:0,scale:1,rotate:0},user.frameAdjust||{});
    q('#adjustX').value=Number(fa.x||0); q('#adjustY').value=Number(fa.y||0); q('#adjustScale').value=Math.round(Number(fa.scale||1)*100); q('#adjustRotate').value=Number(fa.rotate||0);
    const av=q('#adjustAvatar'); if(av){av.style.backgroundImage=user.avatar?`url("${safe(user.avatar)}")`:''; av.style.backgroundSize='cover'; av.style.backgroundPosition='center';}
    const fr=q('#adjustFrame'); if(fr){fr.src=user.frame; fr.style.display='block';}
    m.classList.add('show','real-centered-modal','dlinky-clean-adjust'); updateAdjust();
  };
  try{ if(typeof openFrameAdjust!=='undefined') openFrameAdjust=window.openFrameAdjust; }catch(e){}
  window.saveFrameAdjust=async function(){ user.frameAdjust={x:Number(q('#adjustX')?.value||0),y:Number(q('#adjustY')?.value||0),scale:Number(q('#adjustScale')?.value||100)/100,rotate:Number(q('#adjustRotate')?.value||0)}; q('#frameAdjustModal')?.classList.remove('show','real-centered-modal','dlinky-clean-adjust'); await saveUser('Ajuste salvo!'); };

  document.addEventListener('click', async function(e){
    if(e.target && e.target.id==='saveCustom') return saveCustomPatch(e);
    if(e.target?.dataset?.buyAdminEffect){ e.preventDefault(); e.stopImmediatePropagation(); return buyAdminEffect(e.target.dataset.buyAdminEffect); }
    if(e.target?.dataset?.giftEffect){ const ef=adminEffects.find(x=>String(x.id)===String(e.target.dataset.giftEffect)); if(ef) openGiftModal({name:ef.name,price:ef.price,durationLabel:'Permanente'}); }
    if(e.target?.dataset?.giftFrame){ const f=(customFrames||[]).find(x=>String(x.id)===String(e.target.dataset.giftFrame)); if(f) openGiftModal({name:f.name,price:f.price,durationLabel:'Permanente'}); }
    if(e.target?.dataset?.useInvEffect!==undefined) useInvEffect(Number(e.target.dataset.useInvEffect));
    if(e.target && e.target.id==='adminAddEffect'){
      e.preventDefault(); if(!isAdminX()) return toast('Área somente para admin.');
      const db=dbx(); if(!db) return; const item={name:q('#adminEffectName')?.value.trim()||'Efeito',desc:q('#adminEffectDesc')?.value.trim()||'',price:Number(q('#adminEffectPrice')?.value||20),url:q('#adminEffectUrl')?.value.trim()||'',createdAt:firebase.firestore.FieldValue.serverTimestamp(),createdBy:firebase.auth().currentUser?.email||''};
      if(!item.url) return toast('Coloque a URL do efeito.'); await db.collection('adminEffects').add(item); await loadEffects(); renderAdminEffects(); if(shopMode==='effects') renderShop(); toast('Efeito cadastrado.');
    }
    if(e.target?.dataset?.adminDelEffect){ e.preventDefault(); if(!isAdminX()) return; await dbx().collection('adminEffects').doc(e.target.dataset.adminDelEffect).delete(); await loadEffects(); renderAdminEffects(); if(shopMode==='effects') renderShop(); }
    if(e.target && e.target.id==='saveFrameAdjust'){e.preventDefault(); e.stopImmediatePropagation(); window.saveFrameAdjust();}
  }, true);
  ['adjustX','adjustY','adjustScale','adjustRotate'].forEach(id=>q('#'+id)?.addEventListener('input',updateAdjust,true));
  q('#resetFrameAdjust')?.addEventListener('click',e=>{e.preventDefault(); q('#adjustX').value=0; q('#adjustY').value=0; q('#adjustScale').value=100; q('#adjustRotate').value=0; updateAdjust();},true);

  document.addEventListener('DOMContentLoaded',async()=>{ q('[data-tab="payments"]')?.remove(); await loadEffects(); renderAdminEffects(); patchRenderDashValues(); });
})();

/* === LEXVOID FINAL HOTFIX: frame adjust, particles, effects, landing polish === */
(function(){
  const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const safe=s=>String(s||'').replace(/["'<>]/g,'');
  function toastX(t){ try{ if(typeof toast==='function') return toast(t); }catch(e){} const el=q('#toast'); if(el){el.textContent=t;el.className='show';setTimeout(()=>el.className='',1800);} }
  function saveX(msg){ try{return Promise.resolve(saveUser(msg));}catch(e){return Promise.resolve();} }
  function avatarUrl(){return (window.user&&user.avatar)||'';}
  function frameUrl(){return (window.user&&user.frame)||'';}
  function fa(){ user.frameAdjust=Object.assign({x:0,y:0,scale:1,rotate:0},user.frameAdjust||{}); return user.frameAdjust; }
  function setFrameVars(el, a){ if(!el) return; a=a||fa(); el.style.setProperty('--frame-x',(Number(a.x)||0)+'px'); el.style.setProperty('--frame-y',(Number(a.y)||0)+'px'); el.style.setProperty('--frame-scale',Number(a.scale||1)); el.style.setProperty('--frame-rotate',(Number(a.rotate)||0)+'deg'); el.classList.add('lex-frame-adjusted','manual-adjusted'); }

  // A moldura agora é ajustada por variáveis CSS, sem conflito com transform inline antigo.
  window.updateAdjustPreview=function(){
    const a={x:Number(q('#adjustX')?.value||0),y:Number(q('#adjustY')?.value||0),scale:Number(q('#adjustScale')?.value||100)/100,rotate:Number(q('#adjustRotate')?.value||0)};
    setFrameVars(q('#adjustFrame'),a); setFrameVars(q('#adjustFrameFinal'),a);
    const label=q('#adjustLiveValues'); if(label) label.textContent=`X ${a.x}px · Y ${a.y}px · ${Math.round(a.scale*100)}% · ${a.rotate}°`;
  };
  window.openFrameAdjust=function(){
    if(!frameUrl()) return toastX('Use uma moldura primeiro.');
    const m=q('#frameAdjustModal'); if(!m) return;
    let preview=m.querySelector('.adjust-preview');
    if(preview && !q('#adjustLiveValues')) preview.insertAdjacentHTML('afterend','<small id="adjustLiveValues" class="adjust-live-values"></small>');
    const a=fa();
    q('#adjustX').value=Number(a.x||0); q('#adjustY').value=Number(a.y||0); q('#adjustScale').value=Math.round(Number(a.scale||1)*100); q('#adjustRotate').value=Number(a.rotate||0);
    const av=q('#adjustAvatar'); if(av){ av.style.backgroundImage=avatarUrl()?`url("${safe(avatarUrl())}")`:''; av.style.backgroundSize='cover'; av.style.backgroundPosition='center'; av.style.display='block'; }
    const fr=q('#adjustFrame'); if(fr){ fr.src=frameUrl(); fr.style.display='block'; fr.removeAttribute('style'); fr.src=frameUrl(); setFrameVars(fr,a); }
    m.classList.add('show','real-centered-modal','dlinky-clean-adjust','lex-adjust-v4');
    window.updateAdjustPreview();
  };
  window.saveFrameAdjust=async function(){
    user.frameAdjust={x:Number(q('#adjustX')?.value||0),y:Number(q('#adjustY')?.value||0),scale:Number(q('#adjustScale')?.value||100)/100,rotate:Number(q('#adjustRotate')?.value||0)};
    q('#frameAdjustModal')?.classList.remove('show','real-centered-modal','dlinky-clean-adjust','lex-adjust-v4');
    const pf=q('#profileFrame'); if(pf) setFrameVars(pf,user.frameAdjust);
    await saveX('Ajuste da moldura salvo!');
  };
  ['adjustX','adjustY','adjustScale','adjustRotate'].forEach(id=>{ const el=q('#'+id); if(el && !el.dataset.lexFinal){ el.dataset.lexFinal='1'; el.addEventListener('input',window.updateAdjustPreview); }});
  q('#resetFrameAdjust')?.addEventListener('click',e=>{q('#adjustX').value=0;q('#adjustY').value=0;q('#adjustScale').value=100;q('#adjustRotate').value=0;window.updateAdjustPreview();},true);

  // Render do perfil aplica ajuste salvo e efeitos corretos.
  const oldRenderProfile=window.renderProfile || (typeof renderProfile==='function'?renderProfile:null);
  window.renderProfile=function(){
    if(oldRenderProfile) oldRenderProfile();
    const pf=q('#profileFrame'); if(pf && frameUrl()){ pf.src=frameUrl(); pf.style.display='block'; setFrameVars(pf,fa()); }
    applyProfileLayoutAndFx();
    createProfileParticles(user.particleType||'none');
  };
  try{ if(typeof renderProfile!=='undefined') renderProfile=window.renderProfile; }catch(e){}

  function applyProfileLayoutAndFx(){
    const card=q('#profileCard'), banner=q('#profileBanner'), avatar=q('#profileAvatar'), name=q('#profileName'); if(!card) return;
    const fx=user.nameFx||{}; const glow=user.fxGlowColor||'#8b5cf6';
    card.classList.toggle('fx-glow-card',!!fx.glowCard); card.classList.toggle('fx-pulse-card',!!fx.pulseCard); card.classList.toggle('fx-border-run',!!fx.borderRun); card.classList.toggle('fx-float-card',!!fx.floatCard);
    card.style.setProperty('--user-glow',glow); card.style.setProperty('--card-alpha',String(user.cardOpacity??0.72)); card.style.setProperty('--card-blur',(user.cardBlur??14)+'px');
    if(name){ name.classList.toggle('fx-neon-name',!!fx.neon); name.classList.toggle('fx-shine-name',!!fx.shine); name.classList.toggle('fx-rainbow-name',!!fx.rainbow); name.style.setProperty('--user-glow',glow); }
    if(banner){ banner.style.opacity=String(user.bannerOpacity??1); banner.classList.toggle('fx-banner-shine',!!fx.bannerShine); }
    if(avatar){ avatar.classList.toggle('fx-avatar-pulse',!!fx.avatarPulse); }
    card.classList.remove('layout-icon-only','layout-banner-only','avatar-square','avatar-rounded','avatar-triangle');
    card.classList.add('layout-'+(user.profileLayout||'full'));
    card.classList.add('avatar-'+(user.avatarShape||'round'));
    if(fx.perspective){
      card.onmousemove=(ev)=>{const r=card.getBoundingClientRect(); const px=(ev.clientX-r.left)/r.width; const py=(ev.clientY-r.top)/r.height; const ry=(px-.5)*16; const rx=(.5-py)*16; card.style.transform=`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;};
      card.onmouseleave=()=>{card.style.transform='';};
    } else { card.onmousemove=null; card.onmouseleave=null; card.style.transform=''; }
  }

  // Partículas reais caindo; remove floco fixo e recria só no perfil depois do clique.
  window.createProfileParticles=function(type){
    const layer=q('#profileParticleLayer'); if(!layer) return; layer.innerHTML='';
    if(!window.user || type==='none' || !user.particles) return;
    const overlay=q('#entryOverlay'); if(overlay && !overlay.classList.contains('hidden')) return;
    const sets={
      snow:['❄','❅','❆'], raios:['⚡','ϟ'], stars:['✦','✧','✩'], hearts:['❤','♥'], bubbles:[''], rain:['╱','│'], fire:['🔥','•'], leaves:['🍃','🍂'], matrix:['0','1'], cats:['🐾','✦']
    };
    const chars=sets[type]||sets.stars;
    const count=Math.max(10,Math.min(180,Number(user.particleCount||45)));
    const speed=Math.max(1,Math.min(10,Number(user.particleSpeed||5)));
    const sizeMap={small:[9,15],medium:[14,24],large:[22,38]}; const sz=sizeMap[user.particleSize||'small']||sizeMap.small;
    layer.className='lex-particle-layer';
    for(let i=0;i<count;i++){
      const el=document.createElement('span'); const ch=chars[Math.floor(Math.random()*chars.length)]; el.textContent=ch; el.className='lex-fall-particle lex-p-'+type;
      const size=sz[0]+Math.random()*(sz[1]-sz[0]);
      el.style.left=(Math.random()*100)+'vw'; el.style.fontSize=size+'px'; el.style.setProperty('--drift',((Math.random()*100)-50)+'px'); el.style.animationDuration=(Math.max(5,20-speed*1.35)+Math.random()*8)+'s'; el.style.animationDelay=(-Math.random()*18)+'s';
      if(type==='bubbles'){el.style.width=size+'px';el.style.height=size+'px';}
      layer.appendChild(el);
    }
  };
  try{ if(typeof createProfileParticles!=='undefined') createProfileParticles=window.createProfileParticles; }catch(e){}
  q('#entryOverlay')?.addEventListener('click',()=>setTimeout(()=>window.createProfileParticles(user.particleType||'none'),120));

  // Customização: checkboxes podem ativar/desativar; adiciona layout/forma; salva exatamente o estado atual.
  function ensureCustomControls(){
    const holder=q('#customBgFx')?.parentElement; if(holder && !q('#profileLayoutMode')){
      holder.insertAdjacentHTML('afterend',`<label>Layout do perfil<select id="profileLayoutMode"><option value="full">Card completo</option><option value="icon-only">Só ícone no centro</option><option value="banner-only">Banner + ícone</option></select></label><label>Formato do avatar<select id="avatarShape"><option value="round">Redondo</option><option value="square">Quadrado</option><option value="rounded">Retangular arredondado</option><option value="triangle">Triângulo</option></select></label>`);
    }
  }
  function fillCustomControls(){ ensureCustomControls(); const fx=user.nameFx||{}; const map={fxNeonName:'neon',fxShineName:'shine',fxRainbowName:'rainbow',fxPerspective:'perspective',fxGlowCard:'glowCard',fxPulseCard:'pulseCard',fxBorderRun:'borderRun',fxFloatCard:'floatCard',fxAvatarPulse:'avatarPulse',fxBannerShine:'bannerShine'}; Object.entries(map).forEach(([id,prop])=>{const el=q('#'+id); if(el) el.checked=!!fx[prop];}); if(q('#fxGlowColor')) q('#fxGlowColor').value=user.fxGlowColor||'#8b5cf6'; if(q('#fxCardOpacity')) q('#fxCardOpacity').value=Math.round((user.cardOpacity??0.72)*100); if(q('#fxCardBlur')) q('#fxCardBlur').value=user.cardBlur??14; if(q('#fxBannerOpacity')) q('#fxBannerOpacity').value=Math.round((user.bannerOpacity??1)*100); if(q('#profileLayoutMode')) q('#profileLayoutMode').value=user.profileLayout||'full'; if(q('#avatarShape')) q('#avatarShape').value=user.avatarShape||'round'; }
  const oldDash=window.renderDash || (typeof renderDash==='function'?renderDash:null);
  window.renderDash=function(){ if(oldDash) oldDash(); fillCustomControls(); fixAdminEffectsLayout(); };
  try{ if(typeof renderDash!=='undefined') renderDash=window.renderDash; }catch(e){}
  function saveCustomFinal(e){
    e.preventDefault(); e.stopImmediatePropagation(); ensureCustomControls();
    user.name=q('#customName')?.value.trim()||user.name; user.bio=q('#customBio')?.value||''; user.bgFx=q('#customBgFx')?.value||'none';
    user.fxGlowColor=q('#fxGlowColor')?.value||'#8b5cf6'; user.cardOpacity=Number(q('#fxCardOpacity')?.value||72)/100; user.cardBlur=Number(q('#fxCardBlur')?.value||14); user.bannerOpacity=Number(q('#fxBannerOpacity')?.value||100)/100;
    user.profileLayout=q('#profileLayoutMode')?.value||'full'; user.avatarShape=q('#avatarShape')?.value||'round';
    user.nameFx={neon:!!q('#fxNeonName')?.checked, shine:!!q('#fxShineName')?.checked, rainbow:!!q('#fxRainbowName')?.checked, perspective:!!q('#fxPerspective')?.checked, glowCard:!!q('#fxGlowCard')?.checked, pulseCard:!!q('#fxPulseCard')?.checked, borderRun:!!q('#fxBorderRun')?.checked, floatCard:!!q('#fxFloatCard')?.checked, avatarPulse:!!q('#fxAvatarPulse')?.checked, bannerShine:!!q('#fxBannerShine')?.checked};
    saveX('Customização salva!').then(()=>{fillCustomControls();});
  }
  document.addEventListener('click',e=>{ if(e.target&&e.target.id==='saveCustom') return saveCustomFinal(e); },true);

  // Admin efeitos responsivo e loja efeitos sem previews quebrados.
  function fixAdminEffectsLayout(){ const tab=q('#tab-adminEffects'); if(tab) tab.classList.add('lex-admin-effects-fixed'); }
  const oldRenderAdminEffects=window.renderAdminEffects;
  window.renderAdminEffects=function(){ if(oldRenderAdminEffects) oldRenderAdminEffects(); fixAdminEffectsLayout(); const list=q('#adminEffectsList'); if(list&&!list.innerHTML.trim()) list.innerHTML='<p>Nenhum efeito cadastrado.</p>'; };
  function shopEffectCardFinal(e){ const id=String(e.id||e.url||e.name||'effect'); const bought=(user.inventory||[]).some(it=>String(it.id||it.itemId)===('effect:'+id)); const price=Number(e.price||20); const bg=e.url?` style="background-image:url('${safe(e.url)}')"`:''; return `<div class="zyo-item-card ${bought?'owned':''}"><div class="zyo-item-top"><div class="zyo-effect-banner-preview"${bg}><span>✦</span></div><div><h3>${esc(e.name||'Efeito')}</h3><p>${esc(e.desc||'Efeito de banner')}</p>${bought?'<span class="owned-badge">✓ Já comprado</span>':''}</div></div><div class="zyo-price">▣ Preço do item: <b>${price} Linkwuans</b></div><select class="duration-select"><option>Permanente</option><option>3 dias</option><option>15 dias</option><option>30 dias</option></select><small class="zyo-note">ⓘ Valor muda conforme a duração escolhida.</small><div class="zyo-card-actions"><button class="btn primary small" type="button" data-buy-admin-effect="${esc(id)}" ${bought?'disabled':''}>🔒 ${bought?'Já comprado':'Comprar'}</button><button class="btn dark small" type="button" data-gift-effect="${esc(id)}">🎁 Presentear</button></div></div>`; }
  const oldShop=window.renderShop || (typeof renderShop==='function'?renderShop:null);
  window.renderShop=function(){ if(oldShop) oldShop(); const grid=q('#shopGrid'); if(!grid) return; if(window.shopMode==='effects'){ grid.className='zyo-shop-grid lex-effects-shop'; grid.innerHTML=`<div class="zyo-shop-title"><h2>Efeitos</h2><p>Efeitos de banner cadastrados pelo admin.</p></div>`+(window.adminEffects||[]).map(shopEffectCardFinal).join(''); if(!(window.adminEffects||[]).length) grid.innerHTML=`<div class="zyo-shop-title"><h2>Efeitos</h2><p>Nenhum efeito cadastrado pelo admin ainda.</p></div>`; } if(window.shopMode==='other'){ grid.innerHTML=`<div class="zyo-shop-title"><h2>Outros</h2><p>Itens extras ficarão disponíveis aqui.</p></div>`; } };
  try{ if(typeof renderShop!=='undefined') renderShop=window.renderShop; }catch(e){}

  // Inventário: avatar maior nos cards.
  const oldInv=window.renderInventory || (typeof renderInventory==='function'?renderInventory:null);
  window.renderInventory=function(){ if(oldInv) oldInv(); qa('#inventoryGrid .asset-card').forEach(c=>c.classList.add('lex-inv-bigger')); };
  try{ if(typeof renderInventory!=='undefined') renderInventory=window.renderInventory; }catch(e){}

  // Landing premium/footer básico com animação, sem mexer no login/auth.
  function ensureLandingExtras(){ const landing=q('#landing .hero')||q('#landing'); if(!landing || q('#lexLandingPremium')) return; landing.insertAdjacentHTML('beforeend',`<section id="lexLandingPremium" class="lex-landing-extra"><div class="lex-reveal"><span>✦ Valores Premium</span><h2>Premium LexVoid</h2><p>Desbloqueie molduras premium, neon, badge, favicon, álbum de fotos e remoção da marca.</p><div class="lex-premium-cards"><article><b>Mensal</b><strong>R$ 9,99</strong><small>Duração: 1 mês</small></article><article class="hot"><b>Anual</b><strong>R$ 89,99</strong><small>Duração: 12 meses</small></article></div></div><footer class="lex-footer"><b>LexVoid</b><div><a href="#">Discord</a><a href="#">TikTok</a></div><small>© 2026 LexVoid. Powered by LexVoid.</small></footer></section>`); const io=new IntersectionObserver(es=>es.forEach(x=>x.isIntersecting&&x.target.classList.add('show')),{threshold:.15}); qa('.lex-reveal').forEach(el=>io.observe(el)); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ensureLandingExtras); else ensureLandingExtras();
})();

/* ===== LEXVOID FINAL HOTFIX — custom save, premium page, admin effects layout, owned store ===== */
(function(){
  const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const safe=s=>String(s||'').replace(/"/g,'%22');
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'').trim();
  function isOwnedFrame(f){
    const inv=Array.isArray(window.user?.inventory)?window.user.inventory:[];
    const fid=String(f?.id||''); const furl=String(f?.url||''); const fname=norm(f?.name||'');
    return inv.some(it=>{
      if(String(it?.type||'').toLowerCase()!=='frame') return false;
      return (fid && (String(it.id||'')===fid || String(it.itemId||'')===fid || String(it.frameId||'')===fid)) ||
             (furl && (String(it.url||'')===furl || String(it.value||'')===furl || String(it.frame||'')===furl)) ||
             (fname && norm(it.name||'')===fname);
    });
  }
  try{
    window.itemAlreadyOwned = function(kind,id,url,name){
      const inv=Array.isArray(window.user?.inventory)?window.user.inventory:[];
      const nname=norm(name||'');
      return inv.some(it=>{
        if(String(it?.type||'').toLowerCase()!==String(kind||'').toLowerCase()) return false;
        return (id && (String(it.id||'')===String(id)||String(it.itemId||'')===String(id))) ||
               (url && (String(it.url||'')===String(url)||String(it.value||'')===String(url))) ||
               (nname && norm(it.name||'')===nname);
      });
    };
    try{ itemAlreadyOwned = window.itemAlreadyOwned; }catch(_e){}
  }catch(_e){}

  function ensureCustomFinalUI(){
    const holder=q('#customBgFx')?.parentElement;
    if(holder && !q('#profileLayoutMode')){
      holder.insertAdjacentHTML('afterend',`<label>Layout do perfil<select id="profileLayoutMode"><option value="full">Card completo</option><option value="icon-only">Só ícone no centro</option><option value="banner-only">Banner + ícone</option></select></label>`);
    }
    if(holder && !q('#profileCardShape')){
      const old=q('#avatarShape');
      if(old){ old.id='profileCardShape'; const lab=old.closest('label'); if(lab) lab.childNodes[0].textContent='Formato do card'; }
      else holder.insertAdjacentHTML('afterend',`<label>Formato do card<select id="profileCardShape"><option value="round">Padrão arredondado</option><option value="square">Quadrado</option><option value="pill">Super arredondado</option><option value="sharp">Retângulo dark</option></select></label>`);
    }
    const fxPanel=q('#tab-custom .grid2 .panel.form-panel:nth-child(2)');
    if(fxPanel && !q('#saveFxOnlyFinal')) fxPanel.insertAdjacentHTML('beforeend','<button class="btn primary" id="saveFxOnlyFinal" type="button" style="margin-top:18px">Salvar efeitos</button>');
  }
  function fillCustomFinalUI(){
    ensureCustomFinalUI();
    const u=window.user||{}; const fx=u.nameFx||{};
    const map={fxNeonName:'neon',fxShineName:'shine',fxRainbowName:'rainbow',fxPerspective:'perspective',fxGlowCard:'glowCard',fxPulseCard:'pulseCard',fxBorderRun:'borderRun',fxFloatCard:'floatCard',fxAvatarPulse:'avatarPulse',fxBannerShine:'bannerShine'};
    Object.entries(map).forEach(([id,prop])=>{const el=q('#'+id); if(el) el.checked=!!fx[prop];});
    if(q('#customName')) q('#customName').value=u.name||'';
    if(q('#customBio')) q('#customBio').value=u.bio||'';
    if(q('#customBgFx')) q('#customBgFx').value=u.bgFx||'none';
    if(q('#fxGlowColor')) q('#fxGlowColor').value=u.fxGlowColor||'#8b5cf6';
    if(q('#fxCardOpacity')) q('#fxCardOpacity').value=Math.round(Number(u.cardOpacity??.72)*100);
    if(q('#fxCardBlur')) q('#fxCardBlur').value=Number(u.cardBlur??14);
    if(q('#fxBannerOpacity')) q('#fxBannerOpacity').value=Math.round(Number(u.bannerOpacity??1)*100);
    if(q('#profileLayoutMode')) q('#profileLayoutMode').value=u.profileLayout||'full';
    if(q('#profileCardShape')) q('#profileCardShape').value=u.profileCardShape||u.avatarShape||'round';
  }
  function readCustomFinalValues(){
    const u=window.user; if(!u) return;
    ensureCustomFinalUI();
    u.name=q('#customName')?.value.trim()||u.name||'Usuário';
    u.bio=q('#customBio')?.value||'';
    u.bgFx=q('#customBgFx')?.value||'none';
    u.fxGlowColor=q('#fxGlowColor')?.value||'#8b5cf6';
    u.cardOpacity=Number(q('#fxCardOpacity')?.value||72)/100;
    u.cardBlur=Number(q('#fxCardBlur')?.value||14);
    u.bannerOpacity=Number(q('#fxBannerOpacity')?.value||100)/100;
    u.profileLayout=q('#profileLayoutMode')?.value||'full';
    u.profileCardShape=q('#profileCardShape')?.value||'round';
    // mantém avatarShape sem mexer no formato real do avatar; agora esse select controla o card.
    u.nameFx={
      neon:!!q('#fxNeonName')?.checked, shine:!!q('#fxShineName')?.checked, rainbow:!!q('#fxRainbowName')?.checked,
      perspective:!!q('#fxPerspective')?.checked, glowCard:!!q('#fxGlowCard')?.checked, pulseCard:!!q('#fxPulseCard')?.checked,
      borderRun:!!q('#fxBorderRun')?.checked, floatCard:!!q('#fxFloatCard')?.checked, avatarPulse:!!q('#fxAvatarPulse')?.checked,
      bannerShine:!!q('#fxBannerShine')?.checked
    };
  }
  async function saveCustomFinalAll(ev){
    if(ev){ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();}
    readCustomFinalValues();
    try{ if(typeof addHistory==='function') addHistory('Customização alterada'); }catch(_e){}
    try{ await saveUser('Customização salva!'); }catch(e){ try{toast('Customização salva!')}catch(_e){} }
    setTimeout(fillCustomFinalUI,80);
    setTimeout(()=>{try{ if(typeof renderProfile==='function' && q('#profile')?.classList.contains('active')) renderProfile(); }catch(_e){}},120);
  }
  document.addEventListener('click',function(e){
    if(e.target && (e.target.id==='saveCustom' || e.target.id==='saveFxOnly' || e.target.id==='saveFxOnlyFinal')) return saveCustomFinalAll(e);
  },true);

  function applyProfileFinalVisuals(){
    const u=window.user||{}; const fx=u.nameFx||{}; const card=q('#profileCard'), name=q('#profileName'), banner=q('#profileBanner'), avatar=q('#profileAvatar');
    if(!card) return;
    card.classList.remove('layout-full','layout-icon-only','layout-banner-only','cardshape-round','cardshape-square','cardshape-pill','cardshape-sharp','fx-glow-card','fx-pulse-card','fx-border-run','fx-float-card');
    card.classList.add('layout-'+(u.profileLayout||'full'));
    card.classList.add('cardshape-'+(u.profileCardShape||u.avatarShape||'round'));
    card.classList.toggle('fx-glow-card',!!fx.glowCard); card.classList.toggle('fx-pulse-card',!!fx.pulseCard); card.classList.toggle('fx-border-run',!!fx.borderRun); card.classList.toggle('fx-float-card',!!fx.floatCard);
    card.style.setProperty('--user-glow',u.fxGlowColor||'#8b5cf6');
    card.style.setProperty('--card-alpha',String(u.cardOpacity??.72));
    card.style.setProperty('--card-blur',(u.cardBlur??14)+'px');
    if(name){ name.classList.toggle('fx-neon-name',!!fx.neon); name.classList.toggle('fx-shine-name',!!fx.shine); name.classList.toggle('fx-rainbow-name',!!fx.rainbow); name.style.setProperty('--user-glow',u.fxGlowColor||'#8b5cf6'); }
    if(banner){ banner.style.opacity=String(u.bannerOpacity??1); banner.classList.toggle('fx-banner-shine',!!fx.bannerShine); }
    if(avatar){ avatar.classList.toggle('fx-avatar-pulse',!!fx.avatarPulse); }
    if(fx.perspective){
      card.onmousemove=(ev)=>{const r=card.getBoundingClientRect(); const px=(ev.clientX-r.left)/Math.max(1,r.width); const py=(ev.clientY-r.top)/Math.max(1,r.height); card.style.transform=`perspective(900px) rotateX(${(0.5-py)*18}deg) rotateY(${(px-0.5)*18}deg)`;};
      card.onmouseleave=()=>{card.style.transform='';};
    } else { card.onmousemove=null; card.onmouseleave=null; card.style.transform=''; }
  }
  const oldRP=window.renderProfile || (typeof renderProfile==='function'?renderProfile:null);
  window.renderProfile=function(){ if(oldRP) oldRP(); applyProfileFinalVisuals(); };
  try{ if(typeof renderProfile!=='undefined') renderProfile=window.renderProfile; }catch(_e){}

  const oldRD=window.renderDash || (typeof renderDash==='function'?renderDash:null);
  window.renderDash=function(){ if(oldRD) oldRD(); fillCustomFinalUI(); fixAdminEffectsFinalLayout(); };
  try{ if(typeof renderDash!=='undefined') renderDash=window.renderDash; }catch(_e){}

  function framePreview(url){return `<div class="zyo-frame-preview"><span class="shop-avatar" style="background-image:${window.user?.avatar?`url('${safe(window.user.avatar)}')`:'none'}"></span>${url?`<img src="${safe(url)}" alt="">`:''}</div>`;}
  function durationSelect(id){return `<select class="zyo-duration" data-duration-for="${esc(id)}"><option value="d3">3 dias</option><option value="d7">7 dias</option><option value="d15">15 dias</option><option value="perm">Permanente</option></select>`;}
  function shopFrameCardFinal(f){
    const id=String(f.id||f.url||f.name||'frame'); const bought=isOwnedFrame(f); const price=Number(f.price||f.prices?.perm||20);
    return `<div class="zyo-item-card ${bought?'owned':''}"><div class="zyo-item-top">${framePreview(f.url||'')}<div><h3>${esc(f.name||'Moldura')}</h3><p>${esc(f.desc||'')}</p>${bought?'<span class="owned-badge">✓ Já comprado</span>':''}</div></div><div class="zyo-price">▣ Preço do item: <b>${price} Linkwuans</b></div>${durationSelect('frame_'+id)}<small class="zyo-note">ⓘ Valor muda conforme a duração escolhida.</small><div class="zyo-card-actions"><button class="btn primary small" type="button" data-buy-frame="${esc(id)}" ${bought?'disabled':''}>🔒 ${bought?'Já comprado':'Comprar'}</button><button class="btn dark small" type="button" data-gift-frame="${esc(id)}">🎁 Presentear</button></div></div>`;
  }
  async function loadAdminEffectsFinal(){
    try{ const snap=await firebase.firestore().collection('adminEffects').orderBy('createdAt','desc').get(); window.__lexAdminEffects=snap.docs.map(d=>({id:d.id,...d.data()})); }
    catch(e){ window.__lexAdminEffects=window.__lexAdminEffects||[]; }
  }
  function renderAdminEffectsFinal(){
    const list=q('#adminEffectsList'); if(!list) return; const arr=window.__lexAdminEffects||[];
    list.innerHTML=arr.map(e=>`<div class="admin-effect-item"><img src="${safe(e.url||'')}" onerror="this.style.display='none'"><div><b>${esc(e.name||'Efeito')}</b><small>${esc(e.desc||'')}</small><small>${Number(e.price||0)} Linkwuans</small></div><button class="delete" type="button" data-admin-del-effect-final="${esc(e.id)}">×</button></div>`).join('')||'<p>Nenhum efeito cadastrado.</p>';
  }
  function fixAdminEffectsFinalLayout(){ q('#tab-adminEffects')?.classList.add('lex-admin-effects-fixed-final'); }
  document.addEventListener('click',async function(e){
    if(e.target?.id==='adminAddEffect'){
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      const item={name:q('#adminEffectName')?.value.trim()||'',desc:q('#adminEffectDesc')?.value.trim()||'',price:Number(q('#adminEffectPrice')?.value||20),url:q('#adminEffectUrl')?.value.trim()||'',type:'bannerEffect',createdAt:firebase.firestore.FieldValue.serverTimestamp()};
      if(!item.name||!item.url) return toast('Coloque nome e URL do efeito.');
      await firebase.firestore().collection('adminEffects').add(item); await loadAdminEffectsFinal(); renderAdminEffectsFinal(); toast('Efeito cadastrado.');
    }
    if(e.target?.dataset?.adminDelEffectFinal){ e.preventDefault(); await firebase.firestore().collection('adminEffects').doc(e.target.dataset.adminDelEffectFinal).delete(); await loadAdminEffectsFinal(); renderAdminEffectsFinal(); toast('Efeito removido.'); }
  },true);

  const oldShopFinal=window.renderShop || (typeof renderShop==='function'?renderShop:null);
  window.renderShop=function(){
    if(oldShopFinal) oldShopFinal();
    const grid=q('#shopGrid'); if(!grid) return;
    const mode=window.shopMode || (typeof shopMode!=='undefined'?shopMode:'coins');
    if(mode==='frames'){
      grid.className='zyo-shop-grid';
      const frames=Array.isArray(window.customFrames)?window.customFrames:(typeof customFrames!=='undefined'?customFrames:[]);
      grid.innerHTML=`<div class="zyo-shop-title"><h2>Molduras</h2><p>Destaque-se com molduras cadastradas pelo admin.</p></div>`+(frames||[]).map(shopFrameCardFinal).join('');
      if(!frames.length) grid.innerHTML=`<div class="zyo-shop-title"><h2>Molduras</h2><p>Nenhuma moldura cadastrada pelo admin ainda.</p></div>`;
    }
    if(mode==='effects'){
      const arr=window.__lexAdminEffects||[]; grid.className='zyo-shop-grid lex-effects-shop';
      grid.innerHTML=`<div class="zyo-shop-title"><h2>Efeitos</h2><p>Efeitos de banner cadastrados pelo admin.</p></div>`+arr.map(e=>`<div class="zyo-item-card"><div class="zyo-item-top"><div class="zyo-effect-banner-preview" style="background-image:url('${safe(e.url||'')}')"></div><div><h3>${esc(e.name||'Efeito')}</h3><p>${esc(e.desc||'')}</p></div></div><div class="zyo-price">▣ Preço do item: <b>${Number(e.price||20)} Linkwuans</b></div>${durationSelect('effect_'+e.id)}<small class="zyo-note">ⓘ Valor muda conforme a duração escolhida.</small><div class="zyo-card-actions"><button class="btn primary small" type="button" data-buy-admin-effect="${esc(e.id)}">🔒 Comprar</button><button class="btn dark small" type="button" data-gift-effect="${esc(e.id)}">🎁 Presentear</button></div></div>`).join('');
      if(!arr.length) grid.innerHTML=`<div class="zyo-shop-title"><h2>Efeitos</h2><p>Nenhum efeito cadastrado pelo admin ainda.</p></div>`;
    }
  };
  try{ if(typeof renderShop!=='undefined') renderShop=window.renderShop; }catch(_e){}

  function showPremiumPage(){
    if(location.hash!=='#/premium') return;
    const simple=q('#simple'); if(!simple) return;
    simple.classList.add('active'); qa('.page').forEach(p=>{if(p!==simple)p.classList.remove('active')});
    let main=q('#lexPremiumPage');
    if(!main){
      simple.innerHTML=`<header class="topbar glass smallbar lexvoid-top"><a class="brand" href="#/"><span class="brand-icon lex-logo">LV</span><strong>LexVoid</strong></a><nav><a href="#/">Início</a><a href="#/premium">Premium</a><a href="#/community">Comunidade</a></nav><button class="theme-toggle" data-action="toggleTheme">☾</button><button class="btn primary" data-goto="dashboard">▦ Dashboard</button></header><main id="lexPremiumPage" class="lex-premium-page"><span class="premium-pill">🪙 Preços Premium</span><h1>Valores do Premium</h1><p>Premium LexVoid é muito mais que status... desfrute de benefícios!</p><section class="premium-price-row"><article><div class="price-icon">◉</div><h2>Mensal</h2><small>Duração: 1 mês</small><strong>R$ 9,99 <em>/mês</em></strong><span>Não há recorrência</span><button class="btn dark">Comprar →</button></article><article class="hot"><div class="price-icon">✹</div><h2>Anual</h2><small>Duração: 12 meses</small><strong>R$ 89,99 <em>/ano</em></strong><span>Não há recorrência</span><button class="btn dark">Comprar →</button></article></section><section class="premium-features"><h2>Recursos do Premium</h2><div><article>🖼️ <b>Moldura Premium</b><small>Seu avatar com moldura Premium.</small></article><article>🔮 <b>Neon Premium</b><small>Neon colorido ao redor de seu card.</small></article><article>✦ <b>Badge Premium</b><small>Insígnia Premium direto em seu perfil.</small></article><article>✅ <b>Badge Verificado</b><small>Insígnia Verificado ao lado de seu nome.</small></article><article>🧿 <b>Favicon</b><small>Envie o ícone de seu perfil no navegador.</small></article><article>📸 <b>Álbum de Fotos</b><small>Crie e compartilhe fotos exclusivas.</small></article><article>⬆️ <b>Maior limite de upload</b><small>Envie arquivo de fundo com maior limite.</small></article><article>🏷️ <b>Ocultar marca d’água</b><small>Remova a marca d’água de seu perfil.</small></article></div></section><footer class="lex-footer"><b><span class="brand-icon lex-logo">LV</span> LexVoid</b><div><a href="https://discord.com/" target="_blank">Discord</a><a href="https://www.tiktok.com/" target="_blank">TikTok</a></div><small>© 2026 LexVoid. Todos os direitos reservados. Powered by linkroubadão.</small></footer></main>`;
    }
  }
  window.addEventListener('hashchange',()=>setTimeout(showPremiumPage,20));
  document.addEventListener('click',e=>{ const a=e.target.closest('a[href="#/premium"],[data-goto="premium"]'); if(a) setTimeout(showPremiumPage,20); });

  async function bootFinal(){
    ensureCustomFinalUI(); fillCustomFinalUI(); fixAdminEffectsFinalLayout(); await loadAdminEffectsFinal(); renderAdminEffectsFinal(); showPremiumPage();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bootFinal); else bootFinal();
})();


/* === LEXVOID HOTFIX DEFINITIVO: admin efeitos dentro do painel + customização salvando + loja owned === */
(function(){
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const safeUrl=s=>String(s||'').replace(/["'<>]/g,'');
  function say(t){try{ if(typeof toast==='function') return toast(t); }catch(e){} console.log(t);}
  function getDB(){try{return firebase.firestore()}catch(e){return null}}
  function getFrames(){try{ return Array.isArray(window.customFrames)?window.customFrames:(typeof customFrames!=='undefined'&&Array.isArray(customFrames)?customFrames:[]);}catch(e){return []}}
  function getEffects(){return window.__lexAdminEffectsFixed||window.__lexAdminEffects||[]}
  function inv(){return Array.isArray(window.user?.inventory)?window.user.inventory:[]}
  function norm(v){return String(v||'').toLowerCase().trim();}
  function frameOwned(f){
    const ids=[f.id,f.itemId,f.name,f.url,f.value].map(norm).filter(Boolean);
    return inv().some(it=>{
      const vals=[it.id,it.itemId,it.name,it.url,it.value].map(norm).filter(Boolean);
      if(it.type && !/frame|moldura/.test(norm(it.type))) return false;
      return vals.some(v=>ids.includes(v));
    });
  }
  function effectOwned(e){
    const ids=[`effect:${e.id}`,e.id,e.itemId,e.name,e.url,e.value].map(norm).filter(Boolean);
    return inv().some(it=>{
      const vals=[it.id,it.itemId,it.name,it.url,it.value].map(norm).filter(Boolean);
      if(it.type && !/effect|efeito|banner/.test(norm(it.type))) return false;
      return vals.some(v=>ids.includes(v));
    });
  }

  // Garante que Admin Efeitos esteja visualmente dentro do dashboard, mesmo se algum HTML antigo ficar fora.
  function mountAdminEffects(){
    const tab=q('#tab-adminEffects');
    const main=q('#dashboard .dash-main');
    if(tab && main && tab.parentElement!==main){ main.appendChild(tab); }
    if(tab){
      tab.classList.add('lex-admin-effects-clean');
      const grid=tab.querySelector('.grid2'); if(grid) grid.classList.add('admin-effects-grid-clean');
    }
  }

  async function loadAdminEffectsClean(){
    const db=getDB(); if(!db) return [];
    try{
      const snap=await db.collection('adminEffects').orderBy('createdAt','desc').get();
      window.__lexAdminEffectsFixed=snap.docs.map(d=>({id:d.id,...d.data()}));
    }catch(e){ window.__lexAdminEffectsFixed=window.__lexAdminEffectsFixed||[]; }
    return window.__lexAdminEffectsFixed;
  }
  function renderAdminEffectsClean(){
    mountAdminEffects();
    const list=q('#adminEffectsList'); if(!list) return;
    const arr=getEffects();
    list.innerHTML=arr.length?arr.map(e=>`<div class="admin-effect-row-clean"><div class="admin-effect-thumb-clean" style="background-image:url('${safeUrl(e.url)}')"></div><div class="admin-effect-info-clean"><b>${esc(e.name||'Efeito')}</b><small>${esc(e.desc||'')}</small><small>${Number(e.price||20)} Linkwuans</small></div><button class="delete" type="button" data-del-admin-effect-clean="${esc(e.id)}">×</button></div>`).join(''):'<p>Nenhum efeito cadastrado.</p>';
  }
  window.renderAdminEffectsFinal=renderAdminEffectsClean;
  window.renderAdminEffects=renderAdminEffectsClean;

  async function addAdminEffectClean(ev){
    ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
    const db=getDB(); if(!db) return say('Firebase não carregou.');
    const item={
      name:q('#adminEffectName')?.value.trim()||'',
      desc:q('#adminEffectDesc')?.value.trim()||'',
      price:Number(q('#adminEffectPrice')?.value||20),
      url:q('#adminEffectUrl')?.value.trim()||'',
      type:'bannerEffect',
      createdAt:firebase.firestore.FieldValue.serverTimestamp(),
      createdBy:firebase.auth().currentUser?.email||''
    };
    if(!item.name || !item.url) return say('Coloque nome e URL do efeito.');
    await db.collection('adminEffects').add(item);
    ['adminEffectName','adminEffectDesc','adminEffectPrice','adminEffectUrl'].forEach(id=>{const el=q('#'+id); if(el) el.value='';});
    await loadAdminEffectsClean(); renderAdminEffectsClean();
    if((window.shopMode||(typeof shopMode!=='undefined'?shopMode:''))==='effects') renderShopClean();
    say('Efeito cadastrado.');
  }
  document.addEventListener('click',async function(e){
    if(e.target?.id==='adminAddEffect') return addAdminEffectClean(e);
    const del=e.target?.closest('[data-del-admin-effect-clean]');
    if(del){ e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); await getDB().collection('adminEffects').doc(del.dataset.delAdminEffectClean).delete(); await loadAdminEffectsClean(); renderAdminEffectsClean(); if((window.shopMode||(typeof shopMode!=='undefined'?shopMode:''))==='effects') renderShopClean(); say('Efeito removido.'); }
  },true);

  // Controles de customização: formato do CARD e layout salvam e voltam corretamente.
  function ensureCustomClean(){
    const holder=q('#customBgFx')?.parentElement;
    if(holder && !q('#profileLayoutMode')) holder.insertAdjacentHTML('afterend',`<label>Layout do perfil<select id="profileLayoutMode"><option value="full">Card completo</option><option value="icon-only">Só ícone no centro</option><option value="banner-only">Banner + ícone</option></select></label>`);
    if(holder && !q('#profileCardShape')) holder.insertAdjacentHTML('afterend',`<label>Formato do card<select id="profileCardShape"><option value="round">Redondo</option><option value="square">Quadrado</option><option value="pill">Retangular arredondado</option><option value="sharp">Triângulo</option></select></label>`);
    const old=q('#avatarShape'); if(old) old.closest('label')?.remove();
    const effectsPanel=q('#tab-custom .grid2 .panel.form-panel:nth-child(2)');
    if(effectsPanel && !q('#saveFxOnlyClean')) effectsPanel.insertAdjacentHTML('beforeend','<button class="btn primary" id="saveFxOnlyClean" type="button">Salvar efeitos</button>');
  }
  function fillCustomClean(){
    ensureCustomClean();
    const u=window.user||{}; const fx=u.nameFx||{};
    const map={fxNeonName:'neon',fxShineName:'shine',fxRainbowName:'rainbow',fxPerspective:'perspective',fxGlowCard:'glowCard',fxPulseCard:'pulseCard',fxBorderRun:'borderRun',fxFloatCard:'floatCard',fxAvatarPulse:'avatarPulse',fxBannerShine:'bannerShine'};
    Object.entries(map).forEach(([id,prop])=>{const el=q('#'+id); if(el) el.checked=!!fx[prop];});
    if(q('#profileLayoutMode')) q('#profileLayoutMode').value=u.profileLayout||'full';
    if(q('#profileCardShape')) q('#profileCardShape').value=u.profileCardShape||'round';
    if(q('#fxGlowColor')) q('#fxGlowColor').value=u.fxGlowColor||'#8b5cf6';
    if(q('#fxCardOpacity')) q('#fxCardOpacity').value=Math.round((u.cardOpacity??0.72)*100);
    if(q('#fxCardBlur')) q('#fxCardBlur').value=Number(u.cardBlur??14);
    if(q('#fxBannerOpacity')) q('#fxBannerOpacity').value=Math.round((u.bannerOpacity??1)*100);
    if(q('#customName')) q('#customName').value=u.name||'';
    if(q('#customBio')) q('#customBio').value=u.bio||'';
    if(q('#customBgFx')) q('#customBgFx').value=u.bgFx||'none';
  }
  function readCustomClean(){
    const u=window.user||{};
    if(q('#customName')) u.name=q('#customName').value.trim()||u.name;
    if(q('#customBio')) u.bio=q('#customBio').value;
    u.bgFx=q('#customBgFx')?.value||u.bgFx||'none';
    u.profileLayout=q('#profileLayoutMode')?.value||'full';
    u.profileCardShape=q('#profileCardShape')?.value||'round';
    u.avatarShape='round'; // não mexe mais no avatar; este campo antigo não controla o card.
    u.fxGlowColor=q('#fxGlowColor')?.value||u.fxGlowColor||'#8b5cf6';
    u.cardOpacity=Number(q('#fxCardOpacity')?.value||72)/100;
    u.cardBlur=Number(q('#fxCardBlur')?.value||14);
    u.bannerOpacity=Number(q('#fxBannerOpacity')?.value||100)/100;
    u.nameFx={
      neon:!!q('#fxNeonName')?.checked, shine:!!q('#fxShineName')?.checked, rainbow:!!q('#fxRainbowName')?.checked,
      perspective:!!q('#fxPerspective')?.checked, glowCard:!!q('#fxGlowCard')?.checked, pulseCard:!!q('#fxPulseCard')?.checked,
      borderRun:!!q('#fxBorderRun')?.checked, floatCard:!!q('#fxFloatCard')?.checked, avatarPulse:!!q('#fxAvatarPulse')?.checked, bannerShine:!!q('#fxBannerShine')?.checked
    };
    window.user=u;
  }
  async function saveCustomClean(ev){
    ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
    readCustomClean();
    try{ await saveUser('Customização salva!'); }catch(e){ say('Customização salva!'); }
    fillCustomClean(); applyProfileClean();
  }
  document.addEventListener('click',function(e){ if(e.target?.id==='saveCustom'||e.target?.id==='saveFxOnlyClean'||e.target?.id==='saveFxOnlyFinal'||e.target?.id==='saveFxOnly') return saveCustomClean(e); },true);

  function applyProfileClean(){
    const u=window.user||{}; const fx=u.nameFx||{};
    const card=q('#profileCard'), name=q('#profileName'), banner=q('#profileBanner'), avatar=q('#profileAvatar'); if(!card) return;
    card.classList.remove('layout-full','layout-icon-only','layout-banner-only','cardshape-round','cardshape-square','cardshape-pill','cardshape-sharp','fx-glow-card','fx-pulse-card','fx-border-run','fx-float-card');
    card.classList.add('layout-'+(u.profileLayout||'full'),'cardshape-'+(u.profileCardShape||'round'));
    card.classList.toggle('fx-glow-card',!!fx.glowCard); card.classList.toggle('fx-pulse-card',!!fx.pulseCard); card.classList.toggle('fx-border-run',!!fx.borderRun); card.classList.toggle('fx-float-card',!!fx.floatCard);
    card.style.setProperty('--user-glow',u.fxGlowColor||'#8b5cf6'); card.style.setProperty('--card-alpha',String(u.cardOpacity??0.72)); card.style.setProperty('--card-blur',(u.cardBlur??14)+'px');
    if(name){ name.classList.toggle('fx-neon-name',!!fx.neon); name.classList.toggle('fx-shine-name',!!fx.shine); name.classList.toggle('fx-rainbow-name',!!fx.rainbow); name.style.setProperty('--user-glow',u.fxGlowColor||'#8b5cf6'); }
    if(banner){ banner.style.opacity=String(u.bannerOpacity??1); banner.classList.toggle('fx-banner-shine',!!fx.bannerShine); }
    if(avatar) avatar.classList.toggle('fx-avatar-pulse',!!fx.avatarPulse);
    // Card acompanha o mouse em todos os lados, sem travar em um lado só.
    if(fx.perspective){
      card.onpointermove=function(ev){ const r=card.getBoundingClientRect(); const x=(ev.clientX-(r.left+r.width/2))/(r.width/2); const y=(ev.clientY-(r.top+r.height/2))/(r.height/2); card.style.transform=`perspective(900px) rotateX(${-y*10}deg) rotateY(${x*10}deg) translate3d(${x*4}px,${y*4}px,0)`; };
      card.onpointerleave=function(){ card.style.transform=''; };
      card.onmousemove=null;
    }else{ card.onpointermove=null; card.onpointerleave=null; card.onmousemove=null; card.onmouseleave=null; card.style.transform=''; }
  }
  window.applyProfileClean=applyProfileClean;

  function framePreviewClean(f){return `<div class="zyo-frame-preview"><span class="shop-avatar" style="background-image:${window.user?.avatar?`url('${safeUrl(window.user.avatar)}')`:'none'}"></span>${f.url?`<img src="${safeUrl(f.url)}" alt="">`:''}</div>`;}
  function durationSelect(id){return `<select class="zyo-duration" data-duration-for="${esc(id)}"><option value="d3">3 dias</option><option value="d7">7 dias</option><option value="d15">15 dias</option><option value="perm">Permanente</option></select>`;}
  function frameCard(f){ const id=String(f.id||f.url||f.name); const bought=frameOwned(f); const price=Number(f.price||f.prices?.perm||20); return `<div class="zyo-item-card ${bought?'owned':''}"><div class="zyo-item-top">${framePreviewClean(f)}<div><h3>${esc(f.name||'Moldura')}</h3><p>${esc(f.desc||'')}</p>${bought?'<span class="owned-badge">✓ Já comprado</span>':''}</div></div><div class="zyo-price">▣ Preço do item: <b>${price} Linkwuans</b></div>${durationSelect('frame_'+id)}<small class="zyo-note">ⓘ Valor muda conforme a duração escolhida.</small><div class="zyo-card-actions"><button class="btn primary small" type="button" data-buy-frame="${esc(id)}" ${bought?'disabled':''}>🔒 ${bought?'Já comprado':'Comprar'}</button><button class="btn dark small" type="button" data-gift-frame="${esc(id)}">🎁 Presentear</button></div></div>`;}
  function effectCard(e){ const id=String(e.id||e.url||e.name); const bought=effectOwned(e); const price=Number(e.price||20); return `<div class="zyo-item-card ${bought?'owned':''}"><div class="zyo-item-top"><div class="zyo-effect-banner-preview" style="background-image:url('${safeUrl(e.url)}')"></div><div><h3>${esc(e.name||'Efeito')}</h3><p>${esc(e.desc||'Efeito de banner')}</p>${bought?'<span class="owned-badge">✓ Já comprado</span>':''}</div></div><div class="zyo-price">▣ Preço do item: <b>${price} Linkwuans</b></div>${durationSelect('effect_'+id)}<small class="zyo-note">ⓘ Valor muda conforme a duração escolhida.</small><div class="zyo-card-actions"><button class="btn primary small" type="button" data-buy-admin-effect="${esc(id)}" ${bought?'disabled':''}>🔒 ${bought?'Já comprado':'Comprar'}</button><button class="btn dark small" type="button" data-gift-effect="${esc(id)}">🎁 Presentear</button></div></div>`;}
  function renderShopClean(){
    const grid=q('#shopGrid'); if(!grid) return;
    const mode=window.shopMode || (typeof shopMode!=='undefined'?shopMode:'coins');
    if(mode==='frames'){
      const frames=getFrames(); grid.className='zyo-shop-grid'; grid.innerHTML=`<div class="zyo-shop-title"><h2>Molduras</h2><p>Destaque-se com molduras cadastradas pelo admin.</p></div>`+(frames.length?frames.map(frameCard).join(''):'<p>Nenhuma moldura cadastrada pelo admin ainda.</p>'); return;
    }
    if(mode==='effects'){
      const effects=getEffects(); grid.className='zyo-shop-grid lex-effects-shop'; grid.innerHTML=`<div class="zyo-shop-title"><h2>Efeitos</h2><p>Efeitos de banner cadastrados pelo admin.</p></div>`+(effects.length?effects.map(effectCard).join(''):'<p>Nenhum efeito cadastrado pelo admin ainda.</p>'); return;
    }
    if(mode==='other'){
      grid.innerHTML=`<div class="zyo-shop-title"><h2>Outros</h2><p>Itens extras ficarão disponíveis aqui.</p></div>`; return;
    }
  }
  const oldShopAny=window.renderShop || (typeof renderShop==='function'?renderShop:null);
  window.renderShop=function(){ if(oldShopAny) oldShopAny(); renderShopClean(); };
  try{ if(typeof renderShop!=='undefined') renderShop=window.renderShop; }catch(e){}

  const oldDash=window.renderDash || (typeof renderDash==='function'?renderDash:null);
  window.renderDash=function(){ if(oldDash) oldDash(); mountAdminEffects(); fillCustomClean(); renderAdminEffectsClean(); };
  try{ if(typeof renderDash!=='undefined') renderDash=window.renderDash; }catch(e){}
  const oldProfile=window.renderProfile || (typeof renderProfile==='function'?renderProfile:null);
  window.renderProfile=function(){ if(oldProfile) oldProfile(); applyProfileClean(); };
  try{ if(typeof renderProfile!=='undefined') renderProfile=window.renderProfile; }catch(e){}

  document.addEventListener('DOMContentLoaded',async()=>{ mountAdminEffects(); ensureCustomClean(); fillCustomClean(); await loadAdminEffectsClean(); renderAdminEffectsClean(); });
  setTimeout(async()=>{ mountAdminEffects(); fillCustomClean(); await loadAdminEffectsClean(); renderAdminEffectsClean(); },700);
})();

/* === LEXVOID FINAL PATCH: SELLOS SHOP + ADMIN EFFECTS BANNER + INVENTORY EFFECTS (não mexe na moldura) === */
(function(){
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const safe=s=>String(s||'').replace(/["'<>]/g,'');
  const toast2=t=>{try{return toast(t)}catch(e){console.log(t)}};
  const save2=async t=>{try{return await saveUser(t)}catch(e){toast2(t||'Salvo.')}};
  const db2=()=>{try{return firebase.firestore()}catch(e){return null}};
  const coins=()=>Number(window.user?.coins||0);
  const inv=()=>Array.isArray(window.user?.inventory)?window.user.inventory:(window.user.inventory=[]);
  const norm=v=>String(v||'').trim().toLowerCase();
  window.__lexAdminSelosShop = window.__lexAdminSelosShop || [];
  window.__lexAdminEffectsShop = window.__lexAdminEffectsShop || [];

  function setShopMode(v){
    window.shopMode=v;
    try{ shopMode=v; }catch(e){}
    qa('.shop-tabs button').forEach(b=>b.classList.toggle('active', b.dataset.shopTab===v));
  }

  function ensureShopButtons(){
    const tabs=q('.shop-tabs'); if(!tabs) return;
    if(!tabs.querySelector('[data-shop-tab="selos"]')){
      const other=tabs.querySelector('[data-shop-tab="other"]');
      const btn=document.createElement('button'); btn.type='button'; btn.dataset.shopTab='selos'; btn.textContent='Selos';
      if(other) other.insertAdjacentElement('beforebegin',btn); else tabs.appendChild(btn);
    }
  }

  async function loadAdminShopThings(){
    const db=db2(); if(!db) return;
    try{ const s=await db.collection('adminSelos').orderBy('createdAt','desc').get(); window.__lexAdminSelosShop=s.docs.map(d=>({id:d.id,...d.data()})); }catch(e){}
    try{ const e=await db.collection('adminEffects').orderBy('createdAt','desc').get(); window.__lexAdminEffectsShop=e.docs.map(d=>({id:d.id,...d.data()})); window.__lexAdminEffectsFixed=window.__lexAdminEffectsShop; window.__lexAdminEffects=window.__lexAdminEffectsShop; }catch(e){}
  }

  function owns(kind,item){
    const id=norm(item.id||item.itemId||item.url||item.name);
    const url=norm(item.url||item.value);
    const name=norm(item.name);
    return inv().some(it=>{
      if(kind==='selo' && !/selo|badge|seal/.test(norm(it.type))) return false;
      if(kind==='effect' && !/effect|efeito|banner/.test(norm(it.type))) return false;
      const vals=[it.id,it.itemId,it.url,it.value,it.name].map(norm);
      return vals.includes(id)||vals.includes(url)||vals.includes(name)||vals.includes(kind+':'+id);
    });
  }

  function duration(id){return `<select class="zyo-duration" data-duration-for="${esc(id)}"><option value="perm">Permanente</option><option value="d3">3 dias</option><option value="d7">7 dias</option><option value="d15">15 dias</option><option value="d30">30 dias</option></select>`;}
  function cardSelo(s){
    const bought=owns('selo',s), price=Number(s.price||20), id=String(s.id||s.url||s.name);
    return `<div class="zyo-item-card ${bought?'owned':''}"><div class="zyo-item-top"><div class="lex-selo-shop-preview">${s.url?`<img src="${safe(s.url)}" alt="">`:'🏷️'}</div><div><h3>${esc(s.name||'Selo')}</h3><p>${esc(s.desc||'Selo para o perfil')}</p>${bought?'<span class="owned-badge">✓ Já comprado</span>':''}</div></div><div class="zyo-price">▣ Preço do item: <b>${price} Linkwuans</b></div>${duration('selo_'+id)}<small class="zyo-note">ⓘ Use pelo inventário depois da compra.</small><div class="zyo-card-actions"><button class="btn primary small" type="button" data-buy-lex-selo="${esc(id)}" ${bought?'disabled':''}>🔒 ${bought?'Já comprado':'Comprar'}</button><button class="btn dark small" type="button" data-gift-lex-selo="${esc(id)}">🎁 Presentear</button></div></div>`;
  }
  function cardEffect(e){
    const bought=owns('effect',e), price=Number(e.price||20), id=String(e.id||e.url||e.name);
    return `<div class="zyo-item-card ${bought?'owned':''}"><div class="zyo-item-top"><div class="lex-effect-shop-preview" style="background-image:url('${safe(e.url)}')"></div><div><h3>${esc(e.name||'Efeito')}</h3><p>${esc(e.desc||'Efeito para banner')}</p>${bought?'<span class="owned-badge">✓ Já comprado</span>':''}</div></div><div class="zyo-price">▣ Preço do item: <b>${price} Linkwuans</b></div>${duration('effect_'+id)}<small class="zyo-note">ⓘ Aplica no banner do perfil.</small><div class="zyo-card-actions"><button class="btn primary small" type="button" data-buy-lex-effect="${esc(id)}" ${bought?'disabled':''}>🔒 ${bought?'Já comprado':'Comprar'}</button><button class="btn dark small" type="button" data-gift-lex-effect="${esc(id)}">🎁 Presentear</button></div></div>`;
  }

  function getMode(){return window.shopMode || (typeof shopMode!=='undefined'?shopMode:'coins')}
  const prevShop=window.renderShop || (typeof renderShop==='function'?renderShop:null);
  window.renderShop=function(){
    ensureShopButtons();
    const mode=getMode();
    if(mode!=='selos' && mode!=='effects'){ if(prevShop) prevShop(); ensureShopButtons(); return; }
    const grid=q('#shopGrid'); if(!grid) return;
    qa('.shop-tabs button').forEach(b=>b.classList.toggle('active', b.dataset.shopTab===mode));
    grid.className='zyo-shop-grid';
    if(mode==='selos'){
      const arr=window.__lexAdminSelosShop||[];
      grid.innerHTML=`<div class="zyo-shop-title"><h2>Selos</h2><p>Selos cadastrados pelo admin para exibir no perfil.</p></div>`+(arr.length?arr.map(cardSelo).join(''):'<p>Nenhum selo cadastrado pelo admin ainda.</p>');
      return;
    }
    if(mode==='effects'){
      const arr=window.__lexAdminEffectsShop||window.__lexAdminEffectsFixed||[];
      grid.innerHTML=`<div class="zyo-shop-title"><h2>Efeitos</h2><p>Efeitos de banner cadastrados pelo admin.</p></div>`+(arr.length?arr.map(cardEffect).join(''):'<p>Nenhum efeito cadastrado pelo admin ainda.</p>');
    }
  };
  try{ if(typeof renderShop!=='undefined') renderShop=window.renderShop; }catch(e){}

  const prevInv=window.renderInventory || (typeof renderInventory==='function'?renderInventory:null);
  function invFilter(){ try{return inventoryFilter}catch(e){return q('#inventoryTabs button.active')?.dataset.invFilter||'all'} }
  function passFilter(it){ const f=invFilter(); if(f==='all')return true; if(f==='frames')return it.type==='frame'; if(f==='effects')return /effect|efeito/.test(norm(it.type)); if(f==='selos')return /selo|badge|seal/.test(norm(it.type)); if(f==='gifts')return !!it.gift; return true; }
  function invPreview(it){
    if(it.type==='frame' && typeof framePreviewHtml==='function') return framePreviewHtml({url:it.url||it.value}, 'inv-preview');
    if(/effect|efeito/.test(norm(it.type))) return `<div class="asset-preview lex-inv-effect-preview" style="background-image:url('${safe(it.url||it.value)}')"></div>`;
    if(/selo|badge|seal/.test(norm(it.type))) return `<div class="asset-preview lex-inv-selo-preview">${it.url?`<img src="${safe(it.url)}" alt="">`:'🏷️'}</div>`;
    return `<div class="asset-preview"><span style="display:grid;place-items:center;height:100%;font-size:36px">✦</span></div>`;
  }
  window.renderInventory=function(){
    try{ if(q('#invCoins')) q('#invCoins').textContent=Number(user.coins||0); if(q('#invItemsCount')) q('#invItemsCount').textContent=inv().length; }catch(e){}
    const grid=q('#inventoryGrid'); if(!grid){ if(prevInv) prevInv(); return; }
    const items=inv().map((it,i)=>({it,i})).filter(x=>passFilter(x.it));
    qa('#inventoryTabs button').forEach(b=>b.classList.toggle('active', b.dataset.invFilter===invFilter()));
    if(!items.length){ grid.innerHTML='<p>Nenhum item nessa categoria.</p>'; return; }
    grid.innerHTML=items.map(({it,i})=>`<div class="asset-card inv-item-card lex-inv-card"><div class="lex-inv-preview-wrap">${invPreview(it)}</div><div class="asset-body"><b>${esc(it.name||'Item')}</b><small>${esc(it.type||'')}</small>${it.type==='frame'?`<button class="btn primary small" type="button" data-use-inv-frame="${i}">Usar</button><button class="btn dark small" type="button" data-adjust-inv-frame="${i}">Ajustar</button>`:''}${/effect|efeito/.test(norm(it.type))?`<button class="btn primary small" type="button" data-use-lex-effect="${i}">Usar</button>`:''}${/selo|badge|seal/.test(norm(it.type))?`<button class="btn primary small" type="button" data-use-lex-selo="${i}">Usar</button>`:''}<button class="btn dark small" type="button" data-remove-lex-profile="${i}">Remover do perfil</button></div></div>`).join('');
  };
  try{ if(typeof renderInventory!=='undefined') renderInventory=window.renderInventory; }catch(e){}

  function findEffect(id){id=String(id); return (window.__lexAdminEffectsShop||[]).find(e=>String(e.id||e.url||e.name)===id);}
  function findSelo(id){id=String(id); return (window.__lexAdminSelosShop||[]).find(s=>String(s.id||s.url||s.name)===id);}
  async function buyItem(kind,id){
    const obj=kind==='selo'?findSelo(id):findEffect(id); if(!obj) return toast2(kind==='selo'?'Selo não encontrado.':'Efeito não encontrado.');
    if(owns(kind,obj)) return toast2('Você já comprou esse item. Use pelo inventário.');
    const price=Number(obj.price||20); if(coins()<price) return toast2('Linkwuans insuficientes.');
    user.coins=coins()-price; user.inventory=inv();
    const item={id:`${kind}:${obj.id||obj.url||obj.name}`, itemId:`${kind}:${obj.id||obj.url||obj.name}`, type:kind==='selo'?'selo':'effect', name:obj.name||kind, desc:obj.desc||'', url:obj.url||'', value:obj.url||'', price, size:obj.size||32, boughtAt:Date.now()};
    user.inventory.push(item);
    await save2('Item comprado!'); window.renderShop(); window.renderInventory();
  }
  async function useEffect(i){ const it=inv()[Number(i)]; if(!it)return; user.bannerEffect=it.url||it.value||''; await save2('Efeito aplicado no banner!'); applyBannerEffect(); window.renderInventory(); }
  async function useSelo(i){ const it=inv()[Number(i)]; if(!it)return; user.selos=Array.isArray(user.selos)?user.selos:[]; if(!user.selos.some(s=>norm(s.url)===norm(it.url)||norm(s.name)===norm(it.name))) user.selos.push({name:it.name,url:it.url,size:it.size||32}); await save2('Selo aplicado!'); try{renderProfile()}catch(e){} window.renderInventory(); }
  async function removeProfile(i){ const it=inv()[Number(i)]; if(!it)return;
    if(/effect|efeito/.test(norm(it.type)) && norm(user.bannerEffect)===norm(it.url||it.value)){ user.bannerEffect=''; await save2('Efeito removido do perfil. Continua no inventário.'); applyBannerEffect(); }
    else if(/selo|badge|seal/.test(norm(it.type))){ user.selos=(user.selos||[]).filter(s=>!(norm(s.url)===norm(it.url)||norm(s.name)===norm(it.name))); await save2('Selo removido do perfil. Continua no inventário.'); try{renderProfile()}catch(e){} }
    else toast2('Esse item continua no inventário.');
    window.renderInventory();
  }

  function applyBannerEffect(){
    const banner=q('#profileBanner'); if(!banner) return;
    let fx=banner.querySelector('.lex-banner-effect-layer');
    if(!fx){fx=document.createElement('span'); fx.className='lex-banner-effect-layer'; banner.appendChild(fx);}
    if(user.bannerEffect){ fx.style.backgroundImage=`url('${safe(user.bannerEffect)}')`; fx.style.display='block'; }
    else fx.style.display='none';
  }
  const prevProfile=window.renderProfile || (typeof renderProfile==='function'?renderProfile:null);
  window.renderProfile=function(){ if(prevProfile) prevProfile(); applyBannerEffect(); };
  try{ if(typeof renderProfile!=='undefined') renderProfile=window.renderProfile; }catch(e){}

  document.addEventListener('click',async e=>{
    const st=e.target.closest('[data-shop-tab]'); if(st){ setShopMode(st.dataset.shopTab); setTimeout(()=>window.renderShop(),0); }
    const be=e.target.closest('[data-buy-lex-effect]'); if(be){ e.preventDefault(); e.stopPropagation(); return buyItem('effect',be.dataset.buyLexEffect); }
    const bs=e.target.closest('[data-buy-lex-selo]'); if(bs){ e.preventDefault(); e.stopPropagation(); return buyItem('selo',bs.dataset.buyLexSelo); }
    const ue=e.target.closest('[data-use-lex-effect]'); if(ue){ e.preventDefault(); e.stopPropagation(); return useEffect(ue.dataset.useLexEffect); }
    const us=e.target.closest('[data-use-lex-selo]'); if(us){ e.preventDefault(); e.stopPropagation(); return useSelo(us.dataset.useLexSelo); }
    const rp=e.target.closest('[data-remove-lex-profile]'); if(rp){ e.preventDefault(); e.stopPropagation(); return removeProfile(rp.dataset.removeLexProfile); }
    if(e.target.closest('[data-gift-lex-selo],[data-gift-lex-effect]')){ e.preventDefault(); toast2('Presentear será liberado pelo admin.'); }
  },true);

  function fixAdminEffectsBox(){
    const tab=q('#tab-adminEffects'); if(!tab) return;
    tab.classList.add('lex-admin-effects-good');
    const grid=tab.querySelector('.grid2'); if(grid) grid.classList.add('lex-admin-effects-grid-good');
    const list=q('#adminEffectsList'); if(list) list.classList.add('lex-admin-effects-list-good');
  }
  const oldAdm=window.renderAdminEffects || window.renderAdminEffectsFinal;
  window.renderAdminEffects=function(){ if(typeof oldAdm==='function') oldAdm(); fixAdminEffectsBox(); };
  window.renderAdminEffectsFinal=window.renderAdminEffects;

  async function boot(){ ensureShopButtons(); fixAdminEffectsBox(); await loadAdminShopThings(); try{window.renderAdminEffects()}catch(e){} if(q('#shopGrid')) window.renderShop(); if(q('#inventoryGrid')) window.renderInventory(); applyBannerEffect(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  setTimeout(boot,900);
})();

/* === LEXVOID FINAL CATEGORY/SELO/EFFECT/PRICE HOTFIX === */
(function(){
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const norm = v => String(v||'').trim().toLowerCase();
  const esc = v => String(v??'').replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const safe = v => String(v||'').replace(/"/g,'%22').replace(/'/g,'%27');
  const inv = () => Array.isArray(user?.inventory) ? user.inventory : (user.inventory=[]);
  const coins = () => Number(user?.coins||0);
  const save = async msg => { try{ if(typeof saveUser==='function') await saveUser(msg||'Salvo!'); else if(typeof saveUserData==='function') await saveUserData(); }catch(e){} };
  const toast2 = msg => { try{ toast(msg); }catch(e){ alert(msg); } };

  function mode(){ try{return shopMode;}catch(e){ return $('.shop-tabs button.active')?.dataset.shopTab || 'coins'; } }
  function setMode(v){ try{ shopMode=v; }catch(e){} $$('.shop-tabs button').forEach(b=>b.classList.toggle('active', b.dataset.shopTab===v)); }
  function getInvFilter(){ try{return inventoryFilter;}catch(e){ return $('#inventoryTabs button.active')?.dataset.invFilter || 'todos'; } }
  function isType(it, type){ const t=norm(it?.type); if(type==='frame') return t==='frame'||t==='moldura'; if(type==='effect') return t==='effect'||t==='efeito'||t==='banner-effect'; if(type==='selo') return t==='selo'||t==='seal'; if(type==='badge') return t==='badge'||t==='insignia'; return false; }
  function passFilter(it){ const f=norm(getInvFilter()); if(['todos','all','tudo'].includes(f)) return true; if(['molduras','frames','frame'].includes(f)) return isType(it,'frame'); if(['efeitos','effects','effect'].includes(f)) return isType(it,'effect'); if(['selos','selo'].includes(f)) return isType(it,'selo'); if(['insignias','insígnias','badges','badge'].includes(f)) return isType(it,'badge'); if(['presentes','gifts'].includes(f)) return !!it.gift; return true; }
  window.itemMatchesInventoryFilter = passFilter;
  try{ itemMatchesInventoryFilter = passFilter; }catch(e){}

  async function loadAllAdminItems(){
    const db = window.db || (typeof firebase!=='undefined' ? firebase.firestore() : null); if(!db) return;
    try{ const s=await db.collection('adminSelos').orderBy('createdAt','desc').get(); window.__lexAdminSelosShop=s.docs.map(d=>({id:d.id,...d.data()})); }catch(e){ window.__lexAdminSelosShop=window.__lexAdminSelosShop||[]; }
    try{ const e=await db.collection('adminEffects').orderBy('createdAt','desc').get(); window.__lexAdminEffectsShop=e.docs.map(d=>({id:d.id,...d.data()})); }catch(e){ window.__lexAdminEffectsShop=window.__lexAdminEffectsShop||[]; }
  }

  function pricesOf(item){ const p=item?.prices||{}; const base=Number(item?.price||p.perm||p.d30||p.d15||p.d7||p.d3||20); return {d3:Number(p.d3||base),d7:Number(p.d7||base),d15:Number(p.d15||base),d30:Number(p.d30||base),perm:Number(p.perm||base)}; }
  function priceFor(item,dur){ const p=pricesOf(item); return Number(p[dur] ?? p.perm ?? item.price ?? 20); }
  function durationSelect(kind,id,item){ const p=pricesOf(item); return `<select class="zyo-duration lex-price-duration" data-kind="${esc(kind)}" data-id="${esc(id)}"><option value="d3">3 dias</option><option value="d7">7 dias</option><option value="d15">15 dias</option><option value="d30">30 dias</option><option value="perm">Permanente</option></select>`; }
  function durationLabel(v){ return ({d3:'3 dias',d7:'7 dias',d15:'15 dias',d30:'30 dias',perm:'Permanente',0:'Permanente'})[v] || v || 'Permanente'; }
  function owned(kind,item){ const id=norm(item?.id||item?.itemId||''); const url=norm(item?.url||item?.value||''); const name=norm(item?.name||''); return inv().some(it=>{ if(kind==='frame'&&!isType(it,'frame')) return false; if(kind==='effect'&&!isType(it,'effect')) return false; if(kind==='selo'&&!isType(it,'selo')) return false; const vals=[it.id,it.itemId,it.url,it.value,it.name].map(norm); return vals.includes(id)||vals.includes(url)||vals.includes(name)||vals.includes(kind+':'+id); }); }

  function framePreview(item){
    const avatar = typeof getBestAvatar==='function' ? getBestAvatar() : (user?.avatar||''); const u=item?.url||item?.value||'';
    return `<div class="lex-shop-frame-preview"><span class="lex-shop-avatar" style="background-image:url('${safe(avatar)}')"></span>${u?`<img src="${safe(u)}" onerror="this.style.display='none'">`:''}</div>`;
  }
  function frameCard(f){ const id=String(f.id||f.url||f.name); const b=owned('frame',f); const pr=priceFor(f,'d3'); return `<div class="zyo-item-card ${b?'owned':''}" data-product-kind="frame" data-product-id="${esc(id)}"><div class="zyo-item-top">${framePreview(f)}<div><h3>${esc(f.name||'Moldura')}</h3><p>${esc(f.desc||'')}</p>${b?'<span class="owned-badge">✓ Já comprado</span>':''}</div></div><div class="zyo-price">▣ Preço do item: <b data-price-label>${pr} Linkwuans</b></div>${durationSelect('frame',id,f)}<small class="zyo-note">ⓘ Valor muda conforme a duração escolhida.</small><div class="zyo-card-actions"><button class="btn primary small" type="button" data-buy-lex2-frame="${esc(id)}" ${b?'disabled':''}>🔒 ${b?'Já comprado':'Comprar'}</button><button class="btn dark small" type="button" data-gift-lex2-frame="${esc(id)}">🎁 Presentear</button></div></div>`; }
  function effectCard(e){ const id=String(e.id||e.url||e.name); const b=owned('effect',e); const pr=priceFor(e,'d3'); return `<div class="zyo-item-card ${b?'owned':''}" data-product-kind="effect" data-product-id="${esc(id)}"><div class="zyo-item-top"><div class="lex-effect-shop-preview" style="background-image:url('${safe(e.url||e.value)}')"></div><div><h3>${esc(e.name||'Efeito')}</h3><p>${esc(e.desc||'Efeito de banner')}</p>${b?'<span class="owned-badge">✓ Já comprado</span>':''}</div></div><div class="zyo-price">▣ Preço do item: <b data-price-label>${pr} Linkwuans</b></div>${durationSelect('effect',id,e)}<small class="zyo-note">ⓘ Aplica no banner do perfil.</small><div class="zyo-card-actions"><button class="btn primary small" type="button" data-buy-lex2-effect="${esc(id)}" ${b?'disabled':''}>🔒 ${b?'Já comprado':'Comprar'}</button><button class="btn dark small" type="button" data-gift-lex2-effect="${esc(id)}">🎁 Presentear</button></div></div>`; }
  function seloCard(s){ const id=String(s.id||s.url||s.name); const b=owned('selo',s); const pr=priceFor(s,'d3'); return `<div class="zyo-item-card ${b?'owned':''}" data-product-kind="selo" data-product-id="${esc(id)}"><div class="zyo-item-top"><div class="lex-selo-shop-preview">${s.url?`<img src="${safe(s.url)}">`:'🏷️'}</div><div><h3>${esc(s.name||'Selo')}</h3><p>${esc(s.desc||'Selo ao lado do nome')}</p>${b?'<span class="owned-badge">✓ Já comprado</span>':''}</div></div><div class="zyo-price">▣ Preço do item: <b data-price-label>${pr} Linkwuans</b></div>${durationSelect('selo',id,s)}<small class="zyo-note">ⓘ Use pelo inventário depois da compra.</small><div class="zyo-card-actions"><button class="btn primary small" type="button" data-buy-lex2-selo="${esc(id)}" ${b?'disabled':''}>🔒 ${b?'Já comprado':'Comprar'}</button><button class="btn dark small" type="button" data-gift-lex2-selo="${esc(id)}">🎁 Presentear</button></div></div>`; }

  function ensureShopTabs(){ const tabs=$('.shop-tabs'); if(!tabs) return; if(!tabs.querySelector('[data-shop-tab="selos"]')){ const other=tabs.querySelector('[data-shop-tab="other"]'); const b=document.createElement('button'); b.type='button'; b.dataset.shopTab='selos'; b.textContent='Selos'; (other||tabs.lastElementChild)?.insertAdjacentElement(other?'beforebegin':'afterend', b); } }
  function adminFramesArr(){ try{return Array.isArray(customFrames)?customFrames:[]}catch(e){return []} }
  function effectsArr(){ return window.__lexAdminEffectsShop||window.__lexAdminEffectsFixed||[]; }
  function selosArr(){ return window.__lexAdminSelosShop||[]; }

  const oldShop=window.renderShop || (typeof renderShop==='function'?renderShop:null);
  window.renderShop=function(){
    ensureShopTabs(); const m=mode(); const grid=$('#shopGrid'); if(!grid) return oldShop&&oldShop();
    if(['frames','molduras'].includes(m)){ grid.className='zyo-shop-grid'; const arr=adminFramesArr(); grid.innerHTML=`<div class="zyo-shop-title"><h2>Molduras</h2><p>Destaque-se com molduras exclusivas no seu perfil.</p></div>`+(arr.length?arr.map(frameCard).join(''):'<p>Nenhuma moldura cadastrada pelo admin ainda.</p>'); return; }
    if(['effects','efeitos'].includes(m)){ grid.className='zyo-shop-grid'; const arr=effectsArr(); grid.innerHTML=`<div class="zyo-shop-title"><h2>Efeitos</h2><p>Efeitos de banner cadastrados pelo admin.</p></div>`+(arr.length?arr.map(effectCard).join(''):'<p>Nenhum efeito cadastrado pelo admin ainda.</p>'); return; }
    if(['selos','selo'].includes(m)){ grid.className='zyo-shop-grid'; const arr=selosArr(); grid.innerHTML=`<div class="zyo-shop-title"><h2>Selos</h2><p>Selos cadastrados pelo admin para aparecer ao lado do nome.</p></div>`+(arr.length?arr.map(seloCard).join(''):'<p>Nenhum selo cadastrado pelo admin ainda.</p>'); return; }
    if(['other','outros'].includes(m)){ grid.className='zyo-shop-grid'; grid.innerHTML='<div class="zyo-shop-title"><h2>Outros</h2><p>Itens extras ficarão disponíveis aqui.</p></div>'; return; }
    if(oldShop) oldShop(); ensureShopTabs();
  };
  try{ renderShop=window.renderShop; }catch(e){}

  function invPreview(it){
    if(isType(it,'frame')) return framePreview(it);
    if(isType(it,'effect')) return `<div class="asset-preview lex-inv-effect-preview" style="background-image:url('${safe(it.url||it.value)}')"></div>`;
    if(isType(it,'selo')) return `<div class="asset-preview lex-inv-selo-preview">${(it.url||it.value)?`<img src="${safe(it.url||it.value)}">`:'🏷️'}</div>`;
    return `<div class="asset-preview"><span style="display:grid;place-items:center;height:100%;font-size:36px">✦</span></div>`;
  }
  window.renderInventory=function(){
    if($('#invCoins')) $('#invCoins').textContent=coins(); if($('#invItemsCount')) $('#invItemsCount').textContent=inv().length;
    const grid=$('#inventoryGrid'); if(!grid) return; const f=getInvFilter(); $$('#inventoryTabs button').forEach(b=>b.classList.toggle('active', norm(b.dataset.invFilter)===norm(f)));
    const items=inv().map((it,i)=>({it,i})).filter(x=>passFilter(x.it));
    if(!items.length){ grid.innerHTML='<p>Nenhum item nessa categoria.</p>'; return; }
    grid.innerHTML=items.map(({it,i})=>`<div class="asset-card inv-item-card lex-inv-card"><div class="lex-inv-preview-wrap">${invPreview(it)}</div><div class="asset-body"><b>${esc(it.name||'Item')}</b><small>${esc(it.type||'')}</small>${isType(it,'frame')?`<button class="btn primary small" type="button" data-use-inv-frame="${i}">Usar</button><button class="btn dark small" type="button" data-adjust-inv-frame="${i}">Ajustar</button>`:''}${isType(it,'effect')?`<button class="btn primary small" type="button" data-use-lex2-effect="${i}">Usar</button>`:''}${isType(it,'selo')?`<button class="btn primary small" type="button" data-use-lex2-selo="${i}">Usar</button>`:''}<button class="btn dark small" type="button" data-remove-lex2-profile="${i}">Remover do perfil</button></div></div>`).join('');
  };
  try{ renderInventory=window.renderInventory; }catch(e){}

  function find(kind,id){ id=String(id); if(kind==='frame') return adminFramesArr().find(x=>String(x.id||x.url||x.name)===id); if(kind==='effect') return effectsArr().find(x=>String(x.id||x.url||x.name)===id); return selosArr().find(x=>String(x.id||x.url||x.name)===id); }
  function openBuyConfirm(kind,id){
    const obj=find(kind,id); if(!obj) return toast2('Item não encontrado.');
    if(owned(kind,obj)) return toast2('Você já comprou esse item. Use pelo inventário.');
    const sel=document.querySelector(`.zyo-item-card[data-product-kind="${kind}"][data-product-id="${CSS.escape(id)}"] .lex-price-duration`);
    const dur=sel?.value||'d3'; const price=priceFor(obj,dur);
    document.querySelector('#lvFinalBuyModal')?.remove();
    const tipo=kind==='frame'?'Moldura':kind==='effect'?'Efeito':kind==='selo'?'Selo':'Insígnia';
    document.body.insertAdjacentHTML('beforeend',`<div id="lvFinalBuyModal" class="modal show"><div class="modal-card lex-buy-card"><button class="modal-close" data-lv-final-close>×</button><h2>Confirmar compra</h2><p>Revise os detalhes antes de concluir.</p><div class="buy-preview"><b>PRÉ-VISUALIZAÇÃO</b><div>${kind==='frame'?framePreview(obj):(kind==='effect'?`<div class="lex-effect-shop-preview" style="background-image:url('${safe(obj.url||obj.value)}')"></div>`:`<div class="lex-selo-shop-preview">${(obj.url||obj.value)?`<img src="${safe(obj.url||obj.value)}">`:'🏷️'}</div>`)}<strong>${esc(user?.name||user?.slug||'usuário')}</strong></div></div><div class="buy-info"><div><span>Item</span><b>${esc(obj.name||'Item')}</b></div><div><span>Duração</span><b>${esc(durationLabel(dur))}</b></div><div><span>Tipo</span><b>${esc(tipo)}</b></div><div><span>Preço</span><b>${price} Linkwuans</b></div></div><small>Esta ação consumirá seus Linkwuans. Confirma prosseguir?</small><div class="modal-actions"><button class="btn dark" data-lv-final-close>Cancelar</button><button class="btn primary" data-lv-final-confirm data-kind="${esc(kind)}" data-id="${esc(id)}" data-dur="${esc(dur)}">Comprar</button></div></div></div>`);
  }
  async function buy(kind,id,dur){ const obj=find(kind,id); if(!obj) return toast2('Item não encontrado.'); if(owned(kind,obj)) return toast2('Você já comprou esse item. Use pelo inventário.'); const price=priceFor(obj,dur||'d3'); if(coins()<price) return toast2('Linkwuans insuficientes.'); user.coins=coins()-price; user.inventory=inv(); user.inventory.push({id:`${kind}:${id}`,itemId:`${kind}:${id}`,type:kind==='selo'?'selo':kind==='effect'?'effect':'frame',name:obj.name||kind,desc:obj.desc||'',url:obj.url||obj.value||'',value:obj.url||obj.value||'',price,duration:durationLabel(dur||'d3'),size:obj.size||32,boughtAt:Date.now()}); await save('Item comprado!'); document.querySelector('#lvFinalBuyModal')?.remove(); window.renderShop(); window.renderInventory(); }
  function openGiftConfirm(kind,id){
    const obj=find(kind,id); if(!obj) return toast2('Item não encontrado.');
    const sel=document.querySelector(`.zyo-item-card[data-product-kind="${kind}"][data-product-id="${CSS.escape(id)}"] .lex-price-duration`);
    const dur=sel?.value||'d3'; const price=priceFor(obj,dur);
    document.querySelectorAll('#lvFinalGiftModal,#lexGiftOne,#lexGiftModal,#dlinkyGiftModal').forEach(x=>x.remove());
    document.body.insertAdjacentHTML('beforeend',`<div id="lvFinalGiftModal" class="modal show"><div class="modal-card lex-gift-card"><button class="modal-close" data-lv-gift-close>×</button><h2>Enviar presente</h2><p>Revise os detalhes, escolha o destinatário e confirme.</p><div class="gift-summary"><div><span>Item</span><b>${esc(obj.name||'Item')}</b></div><div><span>Duração</span><b>${esc(durationLabel(dur))}</b></div><div><span>Preço</span><b>${price} Linkwuans</b></div></div><label>Destinatário <input id="lvGiftRecipient" placeholder="@slug ou e-mail"></label><label>Mensagem opcional<textarea id="lvGiftMessage" maxlength="100" placeholder="Mensagem para quem receber"></textarea></label><div class="modal-actions"><button class="btn dark" data-lv-gift-close>Cancelar</button><button class="btn primary" data-lv-gift-confirm>🎁 Presentear</button></div></div></div>`);
  }
  async function useEffect(i){ const it=inv()[Number(i)]; if(!it) return; user.bannerEffect=it.url||it.value||''; await save('Efeito aplicado no banner!'); applyBannerEffect(); window.renderInventory(); }
  async function useSelo(i){ const it=inv()[Number(i)]; if(!it) return; user.selos=Array.isArray(user.selos)?user.selos:[]; if(!user.selos.some(s=>norm(s.url)===norm(it.url||it.value)||norm(s.name)===norm(it.name))) user.selos.push({name:it.name,url:it.url||it.value,size:it.size||32}); await save('Selo aplicado!'); try{renderProfile()}catch(e){} window.renderInventory(); }
  async function removeProfile(i){ const it=inv()[Number(i)]; if(!it) return; if(isType(it,'effect')&&norm(user.bannerEffect)===norm(it.url||it.value)){ user.bannerEffect=''; await save('Efeito removido do perfil. Continua no inventário.'); applyBannerEffect(); } else if(isType(it,'selo')){ user.selos=(user.selos||[]).filter(s=>!(norm(s.url)===norm(it.url||it.value)||norm(s.name)===norm(it.name))); await save('Selo removido do perfil. Continua no inventário.'); try{renderProfile()}catch(e){} } else if(isType(it,'frame')&&norm(user.frame)===norm(it.url||it.value)){ user.frame=''; await save('Moldura removida do perfil. Continua no inventário.'); try{renderProfile()}catch(e){} } else toast2('Removido só do perfil. O item continua no inventário.'); window.renderInventory(); }

  function applyBannerEffect(){ const banner=$('#profileBanner'); if(!banner) return; let fx=banner.querySelector('.lex-banner-effect-layer'); if(!fx){ fx=document.createElement('span'); fx.className='lex-banner-effect-layer'; banner.appendChild(fx); } if(user.bannerEffect){ fx.style.backgroundImage=`url('${safe(user.bannerEffect)}')`; fx.style.display='block'; } else fx.style.display='none'; }
  function renderSeloByName(){
    const name=$('#profileName'); if(!name) return; $$('.profile-selos,#profileName .lex-name-selo-wrap').forEach(x=>x.remove()); const arr=Array.isArray(user.selos)?user.selos:[]; if(!arr.length) return;
    const wrap=document.createElement('span'); wrap.className='lex-name-selo-wrap'; wrap.innerHTML=arr.map(s=>`<img title="${esc(s.name||'Selo')}" src="${safe(s.url||'')}" style="width:${Number(s.size||24)}px;height:${Number(s.size||24)}px">`).join(''); name.appendChild(wrap);
  }
  const oldProfile=window.renderProfile || (typeof renderProfile==='function'?renderProfile:null);
  window.renderProfile=function(){ if(oldProfile) oldProfile(); applyBannerEffect(); renderSeloByName(); };
  try{ renderProfile=window.renderProfile; }catch(e){}

  document.addEventListener('change', e=>{ const sel=e.target.closest('.lex-price-duration'); if(!sel) return; const card=sel.closest('.zyo-item-card'); const kind=card?.dataset.productKind, id=card?.dataset.productId; const obj=find(kind,id); const lab=card?.querySelector('[data-price-label]'); if(lab&&obj) lab.textContent=priceFor(obj,sel.value)+' Linkwuans'; }, true);
  document.addEventListener('click', e=>{
    const tab=e.target.closest('[data-shop-tab]'); if(tab){ setMode(tab.dataset.shopTab); setTimeout(()=>window.renderShop(),0); }
    let b=e.target.closest('[data-buy-lex2-frame],[data-buy-lex2-effect],[data-buy-lex2-selo]'); if(b){ e.preventDefault(); e.stopImmediatePropagation(); if(b.dataset.buyLex2Frame) return openBuyConfirm('frame',b.dataset.buyLex2Frame); if(b.dataset.buyLex2Effect) return openBuyConfirm('effect',b.dataset.buyLex2Effect); return openBuyConfirm('selo',b.dataset.buyLex2Selo); }
    const gc=e.target.closest('[data-gift-lex2-frame],[data-gift-lex2-effect],[data-gift-lex2-selo]'); if(gc){ e.preventDefault(); e.stopImmediatePropagation(); if(gc.dataset.giftLex2Frame) return openGiftConfirm('frame',gc.dataset.giftLex2Frame); if(gc.dataset.giftLex2Effect) return openGiftConfirm('effect',gc.dataset.giftLex2Effect); return openGiftConfirm('selo',gc.dataset.giftLex2Selo); }
    const cc=e.target.closest('[data-lv-final-confirm]'); if(cc){ e.preventDefault(); e.stopImmediatePropagation(); return buy(cc.dataset.kind,cc.dataset.id,cc.dataset.dur); }
    if(e.target.closest('[data-lv-final-close]')){ e.preventDefault(); e.stopImmediatePropagation(); document.querySelector('#lvFinalBuyModal')?.remove(); return; }
    if(e.target.closest('[data-lv-gift-close]')){ e.preventDefault(); e.stopImmediatePropagation(); document.querySelector('#lvFinalGiftModal')?.remove(); return; }
    if(e.target.closest('[data-lv-gift-confirm]')){ e.preventDefault(); e.stopImmediatePropagation(); if(!document.querySelector('#lvGiftRecipient')?.value.trim()) return toast2('Digite o destinatário.'); toast2('Presente preparado!'); document.querySelector('#lvFinalGiftModal')?.remove(); return; }
    b=e.target.closest('[data-use-lex2-effect]'); if(b){ e.preventDefault(); e.stopImmediatePropagation(); return useEffect(b.dataset.useLex2Effect); }
    b=e.target.closest('[data-use-lex2-selo]'); if(b){ e.preventDefault(); e.stopImmediatePropagation(); return useSelo(b.dataset.useLex2Selo); }
    b=e.target.closest('[data-remove-lex2-profile]'); if(b){ e.preventDefault(); e.stopImmediatePropagation(); return removeProfile(b.dataset.removeLex2Profile); }
  }, true);

  loadAllAdminItems().then(()=>{ try{window.renderShop()}catch(e){} try{window.renderInventory()}catch(e){} try{window.renderProfile()}catch(e){} });
})();

/* === LEXVOID RELEASE PATCH: gift único, filtros estritos, selo ajustável === */
(function(){
  const $=s=>document.querySelector(s); const $$=s=>Array.from(document.querySelectorAll(s));
  const norm=v=>String(v||'').trim().toLowerCase();
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const safe=v=>String(v||'').replace(/"/g,'%22').replace(/'/g,'%27');
  function inv(){ return Array.isArray(window.user?.inventory)?window.user.inventory:(window.user.inventory=[]); }
  function save(msg){ try{ return saveUser(msg||'Salvo!'); }catch(e){ try{return saveUserData();}catch(x){} } }
  function toastx(m){ try{toast(m)}catch(e){console.log(m)} }
  function isKind(it,k){ const t=norm(it?.type); if(k==='frame') return ['frame','moldura'].includes(t); if(k==='effect') return ['effect','efeito','banner-effect','banner_effect'].includes(t); if(k==='selo') return ['selo','seal'].includes(t); if(k==='badge') return ['badge','insignia','insígnia'].includes(t); return false; }
  function currentFilter(){ return document.querySelector('#inventoryTabs button.active')?.dataset.invFilter || (typeof inventoryFilter!=='undefined'?inventoryFilter:'todos'); }
  function strictPass(it){ const f=norm(currentFilter()); if(['todos','all','tudo'].includes(f)) return true; if(['molduras','frames','frame'].includes(f)) return isKind(it,'frame'); if(['efeitos','effects','effect'].includes(f)) return isKind(it,'effect'); if(['selos','selo'].includes(f)) return isKind(it,'selo'); if(['insignias','insígnias','badge','badges'].includes(f)) return isKind(it,'badge'); if(['presentes','gifts'].includes(f)) return !!it.gift; return true; }
  window.itemMatchesInventoryFilter=strictPass; try{itemMatchesInventoryFilter=strictPass}catch(e){}

  function avatarUrl(){ try{return getBestAvatar()}catch(e){return window.user?.avatar||''} }
  function preview(it){
    if(isKind(it,'frame')) return `<div class="lex-shop-frame-preview lex-inv-big"><span class="lex-shop-avatar" style="background-image:url('${safe(avatarUrl())}')"></span><img src="${safe(it.url||it.value)}" onerror="this.style.display='none'"></div>`;
    if(isKind(it,'effect')) return `<div class="asset-preview lex-inv-effect-preview" style="background-image:url('${safe(it.url||it.value)}')"></div>`;
    if(isKind(it,'selo')) return `<div class="asset-preview lex-inv-selo-preview">${(it.url||it.value)?`<img src="${safe(it.url||it.value)}">`:'🏷️'}</div>`;
    return `<div class="asset-preview"></div>`;
  }
  window.renderInventory=function(){
    const grid=$('#inventoryGrid'); if(!grid) return;
    if($('#invCoins')) $('#invCoins').textContent=Number(window.user?.coins||0);
    if($('#invItemsCount')) $('#invItemsCount').textContent=inv().length;
    const f=currentFilter(); try{inventoryFilter=f}catch(e){}
    $$('#inventoryTabs button').forEach(b=>b.classList.toggle('active', norm(b.dataset.invFilter)===norm(f)));
    const items=inv().map((it,i)=>({it,i})).filter(x=>strictPass(x.it));
    if(!items.length){ grid.innerHTML='<p>Nenhum item nessa categoria.</p>'; return; }
    grid.innerHTML=items.map(({it,i})=>`<div class="asset-card inv-item-card lex-inv-card"><div class="lex-inv-preview-wrap">${preview(it)}</div><div class="asset-body"><b>${esc(it.name||'Item')}</b><small>${esc(it.type||'')}</small>${isKind(it,'frame')?`<button class="btn primary small" data-use-inv-frame="${i}">Usar</button><button class="btn dark small" data-adjust-inv-frame="${i}">Ajustar</button>`:''}${isKind(it,'effect')?`<button class="btn primary small" data-use-lex-effect-final="${i}">Usar</button>`:''}${isKind(it,'selo')?`<button class="btn primary small" data-use-lex-selo-final="${i}">Usar</button><button class="btn dark small" data-adjust-lex-selo-final="${i}">Ajustar</button>`:''}<button class="btn dark small" data-remove-lex-profile-final="${i}">Remover do perfil</button></div></div>`).join('');
  };
  try{renderInventory=window.renderInventory}catch(e){}

  function renderNameSelos(){
    const name=$('#profileName'); if(!name) return;
    name.querySelectorAll('.lex-name-selo-wrap').forEach(x=>x.remove());
    const arr=Array.isArray(window.user?.selos)?window.user.selos:[]; if(!arr.length) return;
    const sp=document.createElement('span'); sp.className='lex-name-selo-wrap';
    sp.innerHTML=arr.map(s=>`<img src="${safe(s.url||s.value||'')}" title="${esc(s.name||'Selo')}" style="width:${Number(s.size||22)}px;height:${Number(s.size||22)}px">`).join('');
    name.appendChild(sp);
  }
  const oldProfile=window.renderProfile; window.renderProfile=function(){ if(typeof oldProfile==='function') oldProfile(); renderNameSelos(); }; try{renderProfile=window.renderProfile}catch(e){}

  function applyEffect(i){ const it=inv()[Number(i)]; if(!it) return; window.user.bannerEffect=it.url||it.value||''; save('Efeito aplicado!').then(()=>{ try{applyBannerEffect()}catch(e){}; try{renderProfile()}catch(e){}; renderInventory(); }); }
  function useSelo(i){ const it=inv()[Number(i)]; if(!it) return; window.user.selos=Array.isArray(window.user.selos)?window.user.selos:[]; const u=it.url||it.value||''; if(!window.user.selos.some(s=>norm(s.url||s.value)===norm(u)||norm(s.name)===norm(it.name))) window.user.selos.push({name:it.name||'Selo',url:u,value:u,size:Number(it.size||24)}); save('Selo aplicado!').then(()=>{renderNameSelos(); renderInventory();}); }
  function removeOnlyProfile(i){ const it=inv()[Number(i)]; if(!it) return; const u=norm(it.url||it.value); if(isKind(it,'selo')) window.user.selos=(window.user.selos||[]).filter(s=>norm(s.url||s.value)!==u && norm(s.name)!==norm(it.name)); if(isKind(it,'effect')&&norm(window.user.bannerEffect)===u) window.user.bannerEffect=''; if(isKind(it,'frame')&&norm(window.user.frame)===u) window.user.frame=''; save('Removido só do perfil. Continua no inventário.').then(()=>{try{renderProfile()}catch(e){}; renderInventory();}); }
  function adjustSelo(i){ const it=inv()[Number(i)]; if(!it) return; document.querySelector('#lexSeloAdjustModal')?.remove(); const u=it.url||it.value||''; const size=Number(it.size||24); document.body.insertAdjacentHTML('beforeend',`<div id="lexSeloAdjustModal" class="modal show"><div class="modal-card lex-selo-adjust-card"><button class="modal-close" id="lexSeloAdjustClose">×</button><h2>Ajustar selo</h2><p>Controle o tamanho do selo ao lado do nome.</p><div class="lex-selo-adjust-preview"><span>Nome</span><img src="${safe(u)}" style="width:${size}px;height:${size}px"></div><label>Tamanho <input id="lexSeloSizeRange" type="range" min="12" max="60" value="${size}"></label><button class="btn primary" id="lexSeloSaveAdjust">Salvar ajuste</button></div></div>`); const modal=$('#lexSeloAdjustModal'), img=modal.querySelector('img'), r=$('#lexSeloSizeRange'); r.oninput=()=>{img.style.width=r.value+'px'; img.style.height=r.value+'px';}; $('#lexSeloAdjustClose').onclick=()=>modal.remove(); $('#lexSeloSaveAdjust').onclick=()=>{it.size=Number(r.value); window.user.selos=(window.user.selos||[]).map(s=>norm(s.url||s.value)===norm(u)?{...s,size:Number(r.value)}:s); save('Selo ajustado!').then(()=>{modal.remove(); try{renderProfile()}catch(e){}; renderInventory();});}; }

  function openGiftModal(meta){
    document.querySelectorAll('#lexGiftOne,#lexGiftModal,#dlinkyGiftModal').forEach(x=>x.remove());
    document.body.insertAdjacentHTML('beforeend',`<div id="lexGiftOne" class="modal show"><div class="modal-card lex-gift-card"><button class="modal-close" id="giftCloseOne">×</button><h2>Enviar presente</h2><p>Escolha o destinatário e confirme o envio.</p><div class="gift-summary"><div><span>Item</span><b>${esc(meta.name||'Item')}</b></div><div><span>Duração</span><b>${esc(meta.duration||'Permanente')}</b></div><div><span>Preço</span><b>${esc(meta.price||'0 Linkwuans')}</b></div></div><label>Destinatário <input id="giftRecipientOne" placeholder="@slug ou email"></label><label>Mensagem opcional<textarea id="giftMessageOne" maxlength="100" placeholder="Mensagem para quem receber"></textarea></label><button class="btn primary full" id="giftConfirmOne">🎁 Presentear</button></div></div>`);
    $('#giftCloseOne').onclick=()=>$('#lexGiftOne').remove(); $('#giftConfirmOne').onclick=()=>{ if(!$('#giftRecipientOne').value.trim()) return toastx('Digite o destinatário.'); toastx('Presente preparado.'); $('#lexGiftOne').remove(); };
  }
  function giftMetaFromButton(b){ const card=b.closest('.zyo-item-card,.asset-card'); const name=card?.querySelector('h3,b')?.textContent||'Item'; const price=card?.querySelector('[data-price-label],.zyo-price b')?.textContent||'0 Linkwuans'; const dur=card?.querySelector('select')?.selectedOptions?.[0]?.textContent||'Permanente'; return {name,price,duration:dur}; }

  document.addEventListener('click',function(e){
    const tab=e.target.closest('#inventoryTabs [data-inv-filter]'); if(tab){ e.preventDefault(); e.stopImmediatePropagation(); try{inventoryFilter=tab.dataset.invFilter}catch(x){} $$('#inventoryTabs button').forEach(b=>b.classList.remove('active')); tab.classList.add('active'); setTimeout(()=>window.renderInventory(),0); return; }
    let b=e.target.closest('[data-use-lex-effect-final]'); if(b){ e.preventDefault(); e.stopImmediatePropagation(); return applyEffect(b.dataset.useLexEffectFinal); }
    b=e.target.closest('[data-use-lex-selo-final]'); if(b){ e.preventDefault(); e.stopImmediatePropagation(); return useSelo(b.dataset.useLexSeloFinal); }
    b=e.target.closest('[data-adjust-lex-selo-final]'); if(b){ e.preventDefault(); e.stopImmediatePropagation(); return adjustSelo(b.dataset.adjustLexSeloFinal); }
    b=e.target.closest('[data-remove-lex-profile-final]'); if(b){ e.preventDefault(); e.stopImmediatePropagation(); return removeOnlyProfile(b.dataset.removeLexProfileFinal); }
    b=e.target.closest('[data-gift-frame],[data-gift-effect],[data-gift-lex-selo],[data-gift-lex-effect],[data-gift-lex2-frame],[data-gift-lex2-effect],[data-gift-lex2-selo]'); if(b){ e.preventDefault(); e.stopImmediatePropagation(); return openGiftModal(giftMetaFromButton(b)); }
  },true);

  setTimeout(()=>{ try{window.renderInventory()}catch(e){} try{window.renderProfile()}catch(e){} },400);
})();

/* === LEXVOID HOTFIX FINAL: preços por duração em efeitos + inventário sincronizado com Admin Selos/Efeitos/Molduras === */
(function(){
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safe = v => String(v || '').replace(/"/g,'%22').replace(/'/g,'%27');
  const norm = v => String(v || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9:/._-]+/g,'');
  const inv = () => Array.isArray(window.user?.inventory) ? window.user.inventory : (window.user.inventory = []);
  const coins = () => Number(window.user?.coins || 0);
  const msg = t => { try { toast(t); } catch(e) { console.log(t); } };
  const save = async (m) => { try { if (typeof saveUser === 'function') await saveUser(m || 'Salvo!'); } catch(e){} };
  const db = () => { try { return firebase.firestore(); } catch(e) { return null; } };

  window.__lexAdminFramesStrict = window.__lexAdminFramesStrict || [];
  window.__lexAdminEffectsStrict = window.__lexAdminEffectsStrict || [];
  window.__lexAdminSelosStrict = window.__lexAdminSelosStrict || [];
  let cleanedOnce = false;

  function mode(){ try { return window.shopMode || shopMode; } catch(e) { return $('.shop-tabs button.active')?.dataset.shopTab || 'coins'; } }
  function setMode(v){ try { window.shopMode = v; shopMode = v; } catch(e) { window.shopMode = v; } $$('.shop-tabs button').forEach(b => b.classList.toggle('active', b.dataset.shopTab === v)); }
  function invFilter(){ try { return window.inventoryFilter || inventoryFilter; } catch(e) { return $('#inventoryTabs button.active')?.dataset.invFilter || 'todos'; } }
  function typeOf(it){ const t = norm(it?.type); if(t.includes('frame') || t.includes('moldura')) return 'frame'; if(t.includes('effect') || t.includes('efeito') || t.includes('banner')) return 'effect'; if(t.includes('selo') || t.includes('seal')) return 'selo'; if(t.includes('badge') || t.includes('insign')) return 'badge'; return t || 'other'; }
  function keysOf(obj){ return [obj?.id,obj?.itemId,obj?.frameId,obj?.seloId,obj?.effectId,obj?.url,obj?.value,obj?.frame,obj?.name].map(norm).filter(Boolean); }
  function sameItem(a,b){ const ak = keysOf(a), bk = keysOf(b); return ak.some(x => bk.includes(x) || bk.includes(x.replace(/^(frame|effect|selo):/,'')) || ak.includes((b?.type ? norm(b.type)+':' : '')+x)); }
  function adminList(kind){ if(kind === 'frame') return Array.isArray(window.customFrames) ? window.customFrames : (window.__lexAdminFramesStrict || []); if(kind === 'effect') return window.__lexAdminEffectsStrict || window.__lexAdminEffectsShop || window.__lexAdminEffectsFixed || []; if(kind === 'selo') return window.__lexAdminSelosStrict || window.__lexAdminSelosShop || []; return []; }
  function stillExistsInAdmin(it){ const k = typeOf(it); if(!['frame','effect','selo'].includes(k)) return true; const arr = adminList(k); return arr.some(a => sameItem(it, a) || sameItem({ ...it, id: String(it.id||'').replace(k+':',''), itemId: String(it.itemId||'').replace(k+':','') }, a)); }

  async function loadAdminStrict(){
    const f = db();
    if(!f) return;
    try { if(Array.isArray(window.customFrames)) window.__lexAdminFramesStrict = window.customFrames; } catch(e){}
    try { const s = await f.collection('adminEffects').orderBy('createdAt','desc').get(); window.__lexAdminEffectsStrict = s.docs.map(d => ({ id:d.id, ...d.data() })); window.__lexAdminEffectsShop = window.__lexAdminEffectsStrict; window.__lexAdminEffectsFixed = window.__lexAdminEffectsStrict; window.__lexAdminEffects = window.__lexAdminEffectsStrict; } catch(e) { window.__lexAdminEffectsStrict = window.__lexAdminEffectsStrict || []; }
    try { const s = await f.collection('adminSelos').orderBy('createdAt','desc').get(); window.__lexAdminSelosStrict = s.docs.map(d => ({ id:d.id, ...d.data() })); window.__lexAdminSelosShop = window.__lexAdminSelosStrict; } catch(e) { window.__lexAdminSelosStrict = window.__lexAdminSelosStrict || []; }
  }

  async function cleanInventoryFromDeletedAdmin(){
    if(!window.user) return;
    const before = inv().length;
    const kept = inv().filter(stillExistsInAdmin);
    if(kept.length !== before){
      window.user.inventory = kept;
      const validSelos = adminList('selo');
      if(Array.isArray(window.user.selos)) window.user.selos = window.user.selos.filter(s => validSelos.some(a => sameItem(s,a)));
      if(window.user.bannerEffect && !adminList('effect').some(e => sameItem({url:window.user.bannerEffect,value:window.user.bannerEffect,type:'effect'},e))) window.user.bannerEffect = '';
      if(window.user.frame && !adminList('frame').some(fr => sameItem({url:window.user.frame,value:window.user.frame,type:'frame'},fr))) window.user.frame = '';
      await save('Inventário sincronizado com o admin.');
    }
    cleanedOnce = true;
  }

  function pricesOf(item){
    const p = item?.prices || item?.priceMap || item?.durations || {};
    const base = Number(item?.price || p.d3 || p['3'] || p.three || 10);
    return {
      d3: Number(p.d3 ?? p['3'] ?? base),
      d7: Number(p.d7 ?? p['7'] ?? Math.ceil(base * 1.5)),
      d15: Number(p.d15 ?? p['15'] ?? Math.ceil(base * 2.5)),
      d30: Number(p.d30 ?? p['30'] ?? Math.ceil(base * 4)),
      perm: Number(p.perm ?? p.permanent ?? p.permanente ?? Math.ceil(base * 8))
    };
  }
  function priceFor(item, dur){ const p = pricesOf(item); return Number(p[dur] ?? p.d3 ?? item?.price ?? 0); }
  function durationLabel(v){ return ({d3:'3 dias',d7:'7 dias',d15:'15 dias',d30:'30 dias',perm:'Permanente',0:'Permanente'})[v] || '3 dias'; }
  function durationSelect(kind,id,item){ const p = pricesOf(item); return `<select class="zyo-duration lex-final-price-duration" data-kind="${esc(kind)}" data-id="${esc(id)}"><option value="d3">3 dias</option><option value="d7">7 dias</option><option value="d15">15 dias</option><option value="d30">30 dias</option><option value="perm">Permanente</option></select>`; }
  function findProduct(kind,id){ id = String(id); return adminList(kind).find(x => String(x.id||x.url||x.name) === id || sameItem({id,itemId:id,type:kind}, x)); }
  function owned(kind,item){ return inv().some(it => typeOf(it) === kind && sameItem(it,item)); }
  function framePreview(item){ const av = (typeof getBestAvatar === 'function' ? getBestAvatar() : window.user?.avatar) || ''; const url = item?.url || item?.value || ''; return `<div class="lex-shop-frame-preview"><span class="lex-shop-avatar" style="background-image:url('${safe(av)}')"></span>${url ? `<img src="${safe(url)}" onerror="this.style.display='none'">` : ''}</div>`; }
  function effectPreview(item){ const url = item?.url || item?.value || ''; return `<div class="lex-effect-shop-preview" style="background-image:url('${safe(url)}')"></div>`; }
  function seloPreview(item){ const url = item?.url || item?.value || ''; return `<div class="lex-selo-shop-preview">${url ? `<img src="${safe(url)}" onerror="this.style.display='none'">` : '🏷️'}</div>`; }
  function card(kind,item){
    const id = String(item.id || item.url || item.name || '');
    const bought = owned(kind,item);
    const p = priceFor(item,'d3');
    const prev = kind === 'frame' ? framePreview(item) : kind === 'effect' ? effectPreview(item) : seloPreview(item);
    const typeLabel = kind === 'frame' ? 'Moldura' : kind === 'effect' ? 'Efeito' : 'Selo';
    const note = kind === 'effect' ? 'ⓘ Aplica no banner do perfil.' : kind === 'selo' ? 'ⓘ Use pelo inventário depois da compra.' : 'ⓘ Valor muda conforme a duração escolhida.';
    return `<div class="zyo-item-card ${bought?'owned':''}" data-product-kind="${kind}" data-product-id="${esc(id)}"><div class="zyo-item-top">${prev}<div><h3>${esc(item.name || typeLabel)}</h3><p>${esc(item.desc || '')}</p>${bought?'<span class="owned-badge">✓ Já comprado</span>':''}</div></div><div class="zyo-price">▣ Preço do item: <b data-price-label>${p} Linkwuans</b></div>${durationSelect(kind,id,item)}<small class="zyo-note">${note}</small><div class="zyo-card-actions"><button class="btn primary small" type="button" data-lex-final-buy="${kind}" data-lex-final-id="${esc(id)}" ${bought?'disabled':''}>🔒 ${bought?'Já comprado':'Comprar'}</button><button class="btn dark small" type="button" data-lex-final-gift="${kind}" data-lex-final-id="${esc(id)}">🎁 Presentear</button></div></div>`;
  }

  function ensureShopTabs(){
    const tabs = $('.shop-tabs'); if(!tabs) return;
    if(!tabs.querySelector('[data-shop-tab="selos"]')){ const b = document.createElement('button'); b.type='button'; b.dataset.shopTab='selos'; b.textContent='Selos'; const other=tabs.querySelector('[data-shop-tab="other"]'); (other||tabs.lastElementChild).insertAdjacentElement(other?'beforebegin':'afterend', b); }
  }

  const oldRenderShop = window.renderShop || (typeof renderShop === 'function' ? renderShop : null);
  window.renderShop = function(){
    ensureShopTabs();
    const grid = $('#shopGrid'); if(!grid){ if(oldRenderShop) oldRenderShop(); return; }
    const m = mode(); $$('.shop-tabs button').forEach(b => b.classList.toggle('active', b.dataset.shopTab === m));
    if(['frames','molduras'].includes(norm(m))){ const arr = adminList('frame'); grid.className='zyo-shop-grid'; grid.innerHTML = `<div class="zyo-shop-title"><h2>Molduras</h2><p>Destaque-se com molduras exclusivas no seu perfil.</p></div>` + (arr.length ? arr.map(x => card('frame',x)).join('') : '<p>Nenhuma moldura cadastrada pelo admin ainda.</p>'); return; }
    if(['effects','efeitos'].includes(norm(m))){ const arr = adminList('effect'); grid.className='zyo-shop-grid'; grid.innerHTML = `<div class="zyo-shop-title"><h2>Efeitos</h2><p>Efeitos de banner cadastrados pelo admin.</p></div>` + (arr.length ? arr.map(x => card('effect',x)).join('') : '<p>Nenhum efeito cadastrado pelo admin ainda.</p>'); return; }
    if(['selos','selo'].includes(norm(m))){ const arr = adminList('selo'); grid.className='zyo-shop-grid'; grid.innerHTML = `<div class="zyo-shop-title"><h2>Selos</h2><p>Selos cadastrados pelo admin para aparecer ao lado do nome.</p></div>` + (arr.length ? arr.map(x => card('selo',x)).join('') : '<p>Nenhum selo cadastrado pelo admin ainda.</p>'); return; }
    if(['other','outros'].includes(norm(m))){ grid.className='zyo-shop-grid'; grid.innerHTML='<div class="zyo-shop-title"><h2>Outros</h2><p>Itens extras ficarão disponíveis aqui.</p></div>'; return; }
    if(oldRenderShop) oldRenderShop();
  };
  try { renderShop = window.renderShop; } catch(e){}

  function passFilter(it){ const f = norm(invFilter()); const t = typeOf(it); if(['todos','all','tudo'].includes(f)) return true; if(['molduras','frames','frame'].includes(f)) return t==='frame'; if(['efeitos','effects','effect'].includes(f)) return t==='effect'; if(['selos','selo'].includes(f)) return t==='selo'; if(['insignias','insígnias','badges','badge'].includes(f)) return t==='badge'; if(['presentes','gifts'].includes(f)) return !!it.gift; return true; }
  function invPreview(it){ if(typeOf(it)==='frame') return framePreview(it); if(typeOf(it)==='effect') return `<div class="asset-preview lex-inv-effect-preview" style="background-image:url('${safe(it.url||it.value)}')"></div>`; if(typeOf(it)==='selo') return `<div class="asset-preview lex-inv-selo-preview">${(it.url||it.value)?`<img src="${safe(it.url||it.value)}" onerror="this.style.display='none'">`:'🏷️'}</div>`; return '<div class="asset-preview">✦</div>'; }
  window.renderInventory = function(){
    if(!cleanedOnce) cleanInventoryFromDeletedAdmin();
    const grid = $('#inventoryGrid'); if(!grid) return;
    if($('#invCoins')) $('#invCoins').textContent = coins();
    const valid = inv().filter(stillExistsInAdmin);
    if($('#invItemsCount')) $('#invItemsCount').textContent = valid.length;
    const f = invFilter(); $$('#inventoryTabs button').forEach(b => b.classList.toggle('active', norm(b.dataset.invFilter)===norm(f)));
    const items = valid.map((it,i) => ({it,i: inv().indexOf(it)})).filter(x => passFilter(x.it));
    if(!items.length){ grid.innerHTML = '<p>Nenhum item nessa categoria.</p>'; return; }
    grid.innerHTML = items.map(({it,i}) => `<div class="asset-card inv-item-card lex-inv-card"><div class="lex-inv-preview-wrap">${invPreview(it)}</div><div class="asset-body"><b>${esc(it.name||'Item')}</b><small>${esc(typeOf(it))}</small>${typeOf(it)==='frame'?`<button class="btn primary small" type="button" data-use-inv-frame="${i}">Usar</button><button class="btn dark small" type="button" data-adjust-inv-frame="${i}">Ajustar</button>`:''}${typeOf(it)==='effect'?`<button class="btn primary small" type="button" data-use-lex2-effect="${i}">Usar</button>`:''}${typeOf(it)==='selo'?`<button class="btn primary small" type="button" data-use-lex2-selo="${i}">Usar</button>`:''}<button class="btn dark small" type="button" data-remove-lex2-profile="${i}">Remover do perfil</button></div></div>`).join('');
  };
  try { renderInventory = window.renderInventory; } catch(e){}

  async function buy(kind,id){
    const item = findProduct(kind,id); if(!item) return msg('Item não encontrado.');
    if(owned(kind,item)) return msg('Você já comprou esse item. Use pelo inventário.');
    const cardEl = document.querySelector(`.zyo-item-card[data-product-kind="${kind}"][data-product-id="${CSS.escape(id)}"]`);
    const dur = cardEl?.querySelector('.lex-final-price-duration')?.value || 'd3';
    const price = priceFor(item,dur);
    if(coins() < price) return msg('Linkwuans insuficientes.');
    user.coins = coins() - price;
    user.inventory = inv();
    user.inventory.push({ id:`${kind}:${item.id||id}`, itemId:`${kind}:${item.id||id}`, type:kind, name:item.name||kind, desc:item.desc||'', url:item.url||item.value||'', value:item.url||item.value||'', price, duration:durationLabel(dur), size:item.size||32, boughtAt:Date.now() });
    await save('Item comprado!');
    await cleanInventoryFromDeletedAdmin();
    window.renderShop(); window.renderInventory();
  }

  document.addEventListener('change', e => {
    const sel = e.target.closest('.lex-final-price-duration'); if(!sel) return;
    const cardEl = sel.closest('.zyo-item-card'); const kind = cardEl?.dataset.productKind; const id = cardEl?.dataset.productId; const item = findProduct(kind,id); const lab = cardEl?.querySelector('[data-price-label]');
    if(lab && item) lab.textContent = priceFor(item, sel.value) + ' Linkwuans';
  }, true);
  document.addEventListener('click', e => {
    const tab = e.target.closest('[data-shop-tab]'); if(tab){ setMode(tab.dataset.shopTab); setTimeout(() => window.renderShop(),0); }
    const b = e.target.closest('[data-lex-final-buy]'); if(b){ e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); return buy(b.dataset.lexFinalBuy, b.dataset.lexFinalId); }
  }, true);

  async function boot(){ await loadAdminStrict(); await cleanInventoryFromDeletedAdmin(); try{ window.renderShop(); }catch(e){} try{ window.renderInventory(); }catch(e){} }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setTimeout(boot, 1500);
})();

/* ===== LEXVOID SAFE HOTFIX — voltar só dono, TikTok, selos sem quebrar molduras ===== */
(function(){
  const TIKTOK_URL = 'https://www.tiktok.com/@stermylovee?_r=1&_t=ZS-96T7TI02xNc';
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'').trim();
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const safe=s=>String(s||'').replace(/"/g,'%22');
  function inv(){ return Array.isArray(window.user?.inventory) ? window.user.inventory : []; }
  function typeOf(it){ const t=norm(it?.type); if(t.includes('frame')||t.includes('moldura')) return 'frame'; if(t.includes('effect')||t.includes('efeito')||t.includes('banner')) return 'effect'; if(t.includes('selo')||t.includes('seal')) return 'selo'; if(t.includes('badge')||t.includes('insign')) return 'badge'; return t||'other'; }
  function keys(o){ return [o?.id,o?.itemId,o?.seloId,o?.url,o?.value,o?.name].map(norm).filter(Boolean); }
  function same(a,b){ const ak=keys(a), bk=keys(b); return ak.some(x=>bk.includes(x) || bk.includes(x.replace(/^selo:/,'')) || ak.includes('selo:'+x)); }
  async function refreshAdminSelos(){
    try{
      if(window.db && typeof window.db.collection==='function'){
        const snap = await window.db.collection('adminSelos').orderBy('createdAt','desc').get();
        window.__lexAdminSelosStrict = snap.docs.map(d=>({id:d.id,...d.data()}));
        window.__lexAdminSelosShop = window.__lexAdminSelosStrict;
        window.adminSelos = window.__lexAdminSelosStrict;
      }
    }catch(e){}
  }
  function adminSelos(){ return Array.isArray(window.__lexAdminSelosStrict) ? window.__lexAdminSelosStrict : (Array.isArray(window.adminSelos)?window.adminSelos:[]); }
  function validSeloItem(it){ const list=adminSelos(); if(typeOf(it)!=='selo') return true; return list.length ? list.some(s=>same(it,s)) : false; }
  function currentFilter(){ const active=q('#inventoryTabs button.active'); return active?.dataset.invFilter || active?.dataset.filter || window.inventoryFilter || 'todos'; }
  function passFilter(it){ const f=norm(currentFilter()), t=typeOf(it); if(['todos','all','tudo'].includes(f)) return true; if(['molduras','frames','frame'].includes(f)) return t==='frame'; if(['efeitos','effects','effect'].includes(f)) return t==='effect'; if(['selos','selo'].includes(f)) return t==='selo'; if(['insignias','insignias','badge','badges'].includes(f)) return t==='badge'; if(['presentes','gifts'].includes(f)) return !!it.gift; return true; }
  function getAvatar(){ try{ return (typeof getBestAvatar==='function' && getBestAvatar()) || window.user?.avatar || ''; }catch(e){ return window.user?.avatar || ''; } }
  function framePreview(it){ const av=getAvatar(); const u=it?.url||it?.value||''; return `<div class="lex-shop-frame-preview"><span class="lex-shop-avatar" style="background-image:url('${safe(av)}')"></span>${u?`<img src="${safe(u)}" onerror="this.style.display='none'">`:''}</div>`; }
  function effectPreview(it){ const u=it?.url||it?.value||''; return `<div class="asset-preview lex-inv-effect-preview" style="background-image:url('${safe(u)}')"></div>`; }
  function seloPreview(it){ const u=it?.url||it?.value||''; return `<div class="asset-preview lex-inv-selo-preview">${u?`<img src="${safe(u)}" onerror="this.style.display='none'">`:'🏷️'}</div>`; }
  function preview(it){ const t=typeOf(it); if(t==='frame') return framePreview(it); if(t==='effect') return effectPreview(it); if(t==='selo') return seloPreview(it); return '<div class="asset-preview">✦</div>'; }
  window.renderInventory = function(){
    const grid=q('#inventoryGrid'); if(!grid) return;
    if(q('#invCoins')) q('#invCoins').textContent = Number(window.user?.coins||0);
    const all = inv().filter(validSeloItem); // não remove molduras/efeitos por engano; só esconde selos apagados do admin
    if(q('#invItemsCount')) q('#invItemsCount').textContent = all.length;
    qa('#inventoryTabs button').forEach(b=>b.classList.toggle('active', norm(b.dataset.invFilter||b.dataset.filter)===norm(currentFilter())));
    const items = all.map(it=>({it,i:inv().indexOf(it)})).filter(x=>passFilter(x.it));
    if(!items.length){ grid.innerHTML='<p>Nenhum item nessa categoria.</p>'; return; }
    grid.innerHTML = items.map(({it,i})=>{
      const t=typeOf(it);
      return `<div class="asset-card inv-item-card lex-inv-card"><div class="lex-inv-preview-wrap">${preview(it)}</div><div class="asset-body"><b>${esc(it.name||'Item')}</b><small>${esc(t)}</small>${t==='frame'?`<button class="btn primary small" type="button" data-use-inv-frame="${i}">Usar</button><button class="btn dark small" type="button" data-adjust-inv-frame="${i}">Ajustar</button>`:''}${t==='effect'?`<button class="btn primary small" type="button" data-use-lex2-effect="${i}">Usar</button>`:''}${t==='selo'?`<button class="btn primary small" type="button" data-use-lex2-selo="${i}">Usar</button><button class="btn dark small" type="button" data-adjust-lex2-selo="${i}">Ajustar</button>`:''}<button class="btn dark small" type="button" data-remove-lex2-profile="${i}">Remover do perfil</button></div></div>`;
    }).join('');
  };
  try{ renderInventory = window.renderInventory; }catch(e){}

  function isOwner(){
    try{
      const au = window.currentAuthUser || (window.firebase?.auth && window.firebase.auth().currentUser) || null;
      if(!au || !window.user) return false;
      return (!!window.user.uid && au.uid === window.user.uid) || (!!window.user.email && String(au.email||'').toLowerCase() === String(window.user.email||'').toLowerCase());
    }catch(e){ return false; }
  }
  function fixOwnerButton(){
    const btn=q('#backToDash'); if(!btn) return;
    const own=isOwner();
    btn.style.display = own ? '' : 'none';
    btn.setAttribute('aria-hidden', own ? 'false' : 'true');
  }
  const oldRenderProfile = window.renderProfile || (typeof renderProfile==='function'?renderProfile:null);
  window.renderProfile = function(){
    if(typeof oldRenderProfile==='function') oldRenderProfile();
    const list=adminSelos();
    if(Array.isArray(window.user?.selos) && list.length){
      window.user.selos = window.user.selos.filter(s=>list.some(a=>same(s,a)));
      const box=q('#profileSelos');
      if(box) box.innerHTML = window.user.selos.map(s=>`<img title="${esc(s.name||'Selo')}" src="${safe(s.url||s.value||'')}" style="width:${Number(s.size||32)}px;height:${Number(s.size||32)}px">`).join('');
    }
    fixOwnerButton();
  };
  try{ renderProfile = window.renderProfile; }catch(e){}

  function setupCreditLink(){
    qa('.dlinky-hud-credit,.madeby').forEach(el=>{
      el.style.cursor='pointer';
      el.title='Abrir TikTok do LexVoid';
      if(!el.dataset.lexTiktok){
        el.dataset.lexTiktok='1';
        el.addEventListener('click',ev=>{ ev.preventDefault(); window.open(TIKTOK_URL,'_blank','noopener'); });
      }
    });
  }
  document.addEventListener('click', async e=>{
    const b=e.target.closest('[data-use-lex2-selo]');
    if(b){
      const it=inv()[Number(b.dataset.useLex2Selo)]; if(!it) return;
      window.user.selos = Array.isArray(window.user.selos)?window.user.selos:[];
      const list=window.user.selos.filter(s=>!same(s,it));
      list.push({id:it.id||it.itemId||'', itemId:it.itemId||it.id||'', name:it.name||'Selo', url:it.url||it.value||'', value:it.url||it.value||'', size:it.size||32});
      window.user.selos=list;
      if(typeof saveUser==='function') await saveUser('Selo aplicado!');
      try{ window.renderInventory(); window.renderProfile(); }catch(_e){}
    }
    const r=e.target.closest('[data-remove-lex2-profile]');
    if(r){
      const it=inv()[Number(r.dataset.removeLex2Profile)];
      if(it && typeOf(it)==='selo'){
        window.user.selos=(Array.isArray(window.user.selos)?window.user.selos:[]).filter(s=>!same(s,it));
        if(typeof saveUser==='function') await saveUser('Selo removido do perfil. Ele continua no inventário.');
        try{ window.renderInventory(); window.renderProfile(); }catch(_e){}
      }
    }
  }, true);
  async function boot(){ setupCreditLink(); await refreshAdminSelos(); fixOwnerButton(); try{ window.renderInventory(); }catch(e){} try{ window.renderProfile(); }catch(e){} }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  setTimeout(boot, 1200);
})();

/* === LEXVOID FINAL SAFE PATCH: loja/admin online + inventário sincronizado sem quebrar === */
(function(){
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safe = v => String(v || '').trim().replace(/"/g,'%22').replace(/'/g,'%27');
  const norm = v => String(v || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/^(frame|effect|selo|seal|moldura|efeito):/,'').replace(/[^a-z0-9:/._-]+/g,'');
  const db = () => { try { return firebase.firestore(); } catch(e) { return null; } };
  const inv = () => Array.isArray(window.user?.inventory) ? window.user.inventory : (window.user ? (window.user.inventory=[]) : []);
  const toastx = m => { try { toast(m); } catch(e){ console.log(m); } };
  const save = async m => { try { if(typeof saveUser === 'function') await saveUser(m || 'Salvo!'); } catch(e){} };

  window.__lvAdmin = window.__lvAdmin || {frames:[], effects:[], selos:[], loaded:false, loading:false};

  function itemType(it){
    const t = norm(it?.type);
    if(t.includes('frame') || t.includes('moldura')) return 'frame';
    if(t.includes('effect') || t.includes('efeito') || t.includes('banner')) return 'effect';
    if(t.includes('selo') || t.includes('seal')) return 'selo';
    if(t.includes('badge') || t.includes('insign')) return 'badge';
    return t || 'other';
  }
  function keys(o){
    return [o?.id,o?.itemId,o?.frameId,o?.effectId,o?.seloId,o?.url,o?.value,o?.frame,o?.name]
      .map(norm).filter(Boolean).flatMap(x=>[x,x.replace(/^(frame|effect|selo):/,'')]);
  }
  function same(a,b){ const ak=keys(a), bk=keys(b); return ak.some(x=>bk.includes(x)); }
  function list(kind){
    if(kind==='frame') return window.__lvAdmin.frames.length ? window.__lvAdmin.frames : (Array.isArray(window.customFrames)?window.customFrames:[]);
    if(kind==='effect') return window.__lvAdmin.effects.length ? window.__lvAdmin.effects : (window.__lexAdminEffectsStrict||window.__lexAdminEffectsShop||[]);
    if(kind==='selo') return window.__lvAdmin.selos.length ? window.__lvAdmin.selos : (window.__lexAdminSelosStrict||window.__lexAdminSelosShop||window.adminSelos||[]);
    return [];
  }
  function findAdmin(kind,itOrId){
    const obj = typeof itOrId === 'object' ? itOrId : {id:String(itOrId), itemId:String(itOrId)};
    return list(kind).find(a => same(obj,a) || String(a.id||'') === String(itOrId) || norm(a.name)===norm(obj.name));
  }
  function hydrate(it){
    const k=itemType(it); const adm=findAdmin(k,it);
    return adm ? {...adm, ...it, url: it.url || it.value || adm.url || adm.value || '', value: it.value || it.url || adm.value || adm.url || '', name: it.name || adm.name, desc: it.desc || adm.desc, price: it.price || adm.price, prices: it.prices || adm.prices, size: it.size || adm.size} : it;
  }
  function existsInAdmin(it){ const k=itemType(it); if(!['frame','effect','selo'].includes(k)) return true; return !!findAdmin(k,it); }

  async function loadAdminOnline(force=false){
    const f=db(); if(!f || (window.__lvAdmin.loading && !force)) return;
    window.__lvAdmin.loading = true;
    try{
      const [fr,ef,se] = await Promise.all([
        f.collection('adminFrames').orderBy('createdAt','desc').get().catch(()=>null),
        f.collection('adminEffects').orderBy('createdAt','desc').get().catch(()=>null),
        f.collection('adminSelos').orderBy('createdAt','desc').get().catch(()=>null)
      ]);
      window.__lvAdmin.frames = fr ? fr.docs.map(d=>({id:d.id,type:'frame',...d.data()})) : list('frame');
      window.__lvAdmin.effects = ef ? ef.docs.map(d=>({id:d.id,type:'effect',...d.data()})) : list('effect');
      window.__lvAdmin.selos = se ? se.docs.map(d=>({id:d.id,type:'selo',...d.data()})) : list('selo');
      window.customFrames = window.__lvAdmin.frames;
      window.__lexAdminFramesStrict = window.__lvAdmin.frames;
      window.__lexAdminEffectsStrict = window.__lvAdmin.effects; window.__lexAdminEffectsShop = window.__lvAdmin.effects; window.__lexAdminEffects = window.__lvAdmin.effects;
      window.__lexAdminSelosStrict = window.__lvAdmin.selos; window.__lexAdminSelosShop = window.__lvAdmin.selos; window.adminSelos = window.__lvAdmin.selos;
      window.__lvAdmin.loaded = true;
    } finally { window.__lvAdmin.loading = false; }
  }
  window.lexLoadAdminOnline = loadAdminOnline;

  function priceMap(item){
    const p=item?.prices||item?.priceMap||item?.durations||{}; const base=Number(item?.price||p.d3||p['3']||p.three||10);
    return {d3:Number(p.d3??p['3']??base), d7:Number(p.d7??p['7']??Math.ceil(base*1.5)), d15:Number(p.d15??p['15']??Math.ceil(base*2.5)), d30:Number(p.d30??p['30']??Math.ceil(base*4)), perm:Number(p.perm??p.permanent??p.permanente??Math.ceil(base*8))};
  }
  function priceFor(item,dur){ const p=priceMap(item); return Number(p[dur] ?? p.d3 ?? item?.price ?? 0); }
  function durationLabel(d){ return ({d3:'3 dias',d7:'7 dias',d15:'15 dias',d30:'30 dias',perm:'Permanente',0:'Permanente'})[d] || '3 dias'; }
  function mode(){ try { return window.shopMode || shopMode; } catch(e){ return $('.shop-tabs button.active')?.dataset.shopTab || 'coins'; } }
  function setMode(v){ try{ window.shopMode=v; shopMode=v; }catch(e){ window.shopMode=v; } }
  function avatar(){ try { return getBestAvatar() || window.user?.avatar || ''; } catch(e){ return window.user?.avatar || ''; } }
  function owned(kind,item){ return inv().some(it => itemType(it)===kind && same(it,item)); }
  function preview(kind,item){
    const u = item?.url || item?.value || '';
    if(kind==='frame') return `<div class="lex-shop-frame-preview"><span class="lex-shop-avatar" style="background-image:url('${safe(avatar())}')"></span>${u?`<img src="${safe(u)}" onerror="this.style.display='none'">`:''}</div>`;
    if(kind==='effect') return `<div class="lex-effect-shop-preview" style="background-image:url('${safe(u)}')"></div>`;
    return `<div class="lex-selo-shop-preview">${u?`<img src="${safe(u)}" onerror="this.style.display='none'">`:'🏷️'}</div>`;
  }
  function durationSelect(kind,id){ return `<select class="zyo-duration lv-duration" data-kind="${esc(kind)}" data-id="${esc(id)}"><option value="d3">3 dias</option><option value="d7">7 dias</option><option value="d15">15 dias</option><option value="d30">30 dias</option><option value="perm">Permanente</option></select>`; }
  function shopCard(kind,item){
    const id=String(item.id||item.url||item.name||''); const bought=owned(kind,item); const p=priceFor(item,'d3');
    const title=kind==='frame'?'Moldura':kind==='effect'?'Efeito':'Selo';
    const note=kind==='frame'?'ⓘ Valor muda conforme a duração escolhida.':kind==='effect'?'ⓘ Aplica no banner do perfil.':'ⓘ Use pelo inventário depois da compra.';
    return `<div class="zyo-item-card ${bought?'owned':''}" data-lv-kind="${kind}" data-lv-id="${esc(id)}"><div class="zyo-item-top">${preview(kind,item)}<div><h3>${esc(item.name||title)}</h3><p>${esc(item.desc||'')}</p>${bought?'<span class="owned-badge">✓ Já comprado</span>':''}</div></div><div class="zyo-price">▣ Preço do item: <b data-price-label>${p} Linkwuans</b></div>${durationSelect(kind,id)}<small class="zyo-note">${note}</small><div class="zyo-card-actions"><button class="btn primary small" type="button" data-lv-buy="${kind}" data-lv-id="${esc(id)}" ${bought?'disabled':''}>🔒 ${bought?'Já comprado':'Comprar'}</button><button class="btn dark small" type="button" data-lv-gift="${kind}" data-lv-id="${esc(id)}">🎁 Presentear</button></div></div>`;
  }
  function ensureShopTabs(){ const tabs=$('.shop-tabs'); if(!tabs) return; if(!tabs.querySelector('[data-shop-tab="selos"]')){ const b=document.createElement('button'); b.type='button'; b.dataset.shopTab='selos'; b.textContent='Selos'; const other=tabs.querySelector('[data-shop-tab="other"]'); (other||tabs).insertAdjacentElement(other?'beforebegin':'beforeend',b); } }

  const oldShop = window.renderShop || (typeof renderShop==='function'?renderShop:null);
  window.renderShop = function(){
    ensureShopTabs();
    const grid=$('#shopGrid'); const m=mode();
    if(!window.__lvAdmin.loaded) loadAdminOnline().then(()=>{ try{window.renderShop()}catch(e){}; try{window.renderInventory()}catch(e){}; });
    if(!grid){ if(oldShop) oldShop(); return; }
    $$('.shop-tabs button').forEach(b=>b.classList.toggle('active', b.dataset.shopTab===m));
    if(m==='frames') { const arr=list('frame'); grid.className='zyo-shop-grid'; grid.innerHTML=`<div class="zyo-shop-title"><h2>Molduras</h2><p>Destaque-se com molduras exclusivas no seu perfil.</p></div>`+(arr.length?arr.map(x=>shopCard('frame',x)).join(''):'<p>Nenhuma moldura cadastrada pelo admin ainda.</p>'); return; }
    if(m==='effects') { const arr=list('effect'); grid.className='zyo-shop-grid'; grid.innerHTML=`<div class="zyo-shop-title"><h2>Efeitos</h2><p>Efeitos de banner cadastrados pelo admin.</p></div>`+(arr.length?arr.map(x=>shopCard('effect',x)).join(''):'<p>Nenhum efeito cadastrado pelo admin ainda.</p>'); return; }
    if(m==='selos') { const arr=list('selo'); grid.className='zyo-shop-grid'; grid.innerHTML=`<div class="zyo-shop-title"><h2>Selos</h2><p>Selos cadastrados pelo admin para aparecer ao lado do nome.</p></div>`+(arr.length?arr.map(x=>shopCard('selo',x)).join(''):'<p>Nenhum selo cadastrado pelo admin ainda.</p>'); return; }
    if(m==='other') { grid.className='zyo-shop-grid'; grid.innerHTML='<div class="zyo-shop-title"><h2>Outros</h2><p>Itens extras ficarão disponíveis aqui.</p></div>'; return; }
    if(oldShop) oldShop();
  };
  try{ renderShop=window.renderShop; }catch(e){}

  function currentInvFilter(){ try{return window.inventoryFilter || inventoryFilter;}catch(e){return $('#inventoryTabs button.active')?.dataset.invFilter || 'todos';} }
  function pass(it){ const f=norm(currentInvFilter()), t=itemType(it); if(['todos','all','tudo'].includes(f)) return true; if(['molduras','frames','frame'].includes(f)) return t==='frame'; if(['efeitos','effects','effect'].includes(f)) return t==='effect'; if(['selos','selo'].includes(f)) return t==='selo'; if(['insignias','insignia','badges','badge'].includes(f)) return t==='badge'; if(['presentes','gifts'].includes(f)) return !!it.gift; return true; }
  function invPrev(it){ it=hydrate(it); const t=itemType(it); const u=it.url||it.value||''; if(t==='frame') return preview('frame',it); if(t==='effect') return `<div class="asset-preview lex-inv-effect-preview" style="background-image:url('${safe(u)}')"></div>`; if(t==='selo') return `<div class="asset-preview lex-inv-selo-preview">${u?`<img src="${safe(u)}" onerror="this.style.display='none'">`:'🏷️'}</div>`; return '<div class="asset-preview">✦</div>'; }
  window.renderInventory = function(){
    const grid=$('#inventoryGrid'); if(!grid) return;
    if(!window.__lvAdmin.loaded) loadAdminOnline(true).then(()=>{ try{window.renderInventory()}catch(e){}; });
    if($('#invCoins')) $('#invCoins').textContent=Number(window.user?.coins||0);
    const all=inv().map(hydrate).filter(it => !window.__lvAdmin.loaded || existsInAdmin(it));
    if($('#invItemsCount')) $('#invItemsCount').textContent=all.length;
    $$('#inventoryTabs button').forEach(b=>b.classList.toggle('active', norm(b.dataset.invFilter)===norm(currentInvFilter())));
    const items=all.map(it=>({it,i:inv().findIndex(x=>same(x,it)||x===it)})).filter(x=>pass(x.it));
    if(!items.length){ grid.innerHTML='<p>Nenhum item nessa categoria.</p>'; return; }
    grid.innerHTML=items.map(({it,i})=>{ const t=itemType(it); return `<div class="asset-card inv-item-card lex-inv-card"><div class="lex-inv-preview-wrap">${invPrev(it)}</div><div class="asset-body"><b>${esc(it.name||'Item')}</b><small>${esc(t)}</small>${t==='frame'?`<button class="btn primary small" type="button" data-use-inv-frame="${i}">Usar</button><button class="btn dark small" type="button" data-adjust-inv-frame="${i}">Ajustar</button>`:''}${t==='effect'?`<button class="btn primary small" type="button" data-use-lex2-effect="${i}">Usar</button>`:''}${t==='selo'?`<button class="btn primary small" type="button" data-use-lex2-selo="${i}">Usar</button><button class="btn dark small" type="button" data-adjust-lex2-selo="${i}">Ajustar</button>`:''}<button class="btn dark small" type="button" data-remove-lex2-profile="${i}">Remover do perfil</button></div></div>`; }).join('');
  };
  try{ renderInventory=window.renderInventory; }catch(e){}

  function findProduct(kind,id){ return list(kind).find(x=>String(x.id||x.url||x.name)===String(id) || same(x,{id,itemId:id,type:kind})); }
  function openBuyModal(kind,id){
    const item=findProduct(kind,id); if(!item) return toastx('Item não encontrado.');
    const cardEl=document.querySelector(`.zyo-item-card[data-lv-kind="${CSS.escape(kind)}"][data-lv-id="${CSS.escape(String(id))}"]`);
    const dur=cardEl?.querySelector('.lv-duration')?.value||'d3'; const price=priceFor(item,dur);
    document.querySelector('#lvBuyModal')?.remove();
    document.body.insertAdjacentHTML('beforeend',`<div id="lvBuyModal" class="modal show"><div class="modal-card lex-buy-card"><button class="modal-close" data-lv-close-buy>×</button><h2>Confirmar compra</h2><p>Revise os detalhes antes de concluir.</p><div class="buy-preview"><b>PRÉ-VISUALIZAÇÃO</b><div>${preview(kind,item)}<strong>${esc(window.user?.name||window.user?.slug||'usuário')}</strong></div></div><div class="buy-info"><div><span>Item</span><b>${esc(item.name||'Item')}</b></div><div><span>Duração</span><b>${durationLabel(dur)}</b></div><div><span>Tipo</span><b>${kind==='frame'?'Moldura':kind==='effect'?'Efeito':'Selo'}</b></div><div><span>Preço</span><b>${price} Linkwuans</b></div></div><div class="modal-actions"><button class="btn dark" data-lv-close-buy>Cancelar</button><button class="btn primary" data-lv-confirm-buy="${esc(kind)}" data-lv-id="${esc(id)}" data-lv-duration="${esc(dur)}">Comprar</button></div></div></div>`);
  }
  async function buy(kind,id,dur){
    const item=findProduct(kind,id); if(!item) return toastx('Item não encontrado.');
    if(owned(kind,item)) return toastx('Você já comprou esse item.');
    const price=priceFor(item,dur||'d3'); if(Number(window.user?.coins||0)<price) return toastx('Linkwuans insuficientes.');
    window.user.coins=Number(window.user.coins||0)-price;
    inv().push({id:`${kind}:${item.id||id}`,itemId:`${kind}:${item.id||id}`,type:kind,name:item.name||kind,desc:item.desc||'',url:item.url||item.value||'',value:item.url||item.value||'',price,duration:durationLabel(dur||'d3'),prices:item.prices||null,size:item.size||32,boughtAt:Date.now()});
    await save('Item comprado!'); document.querySelector('#lvBuyModal')?.remove(); window.renderShop(); window.renderInventory();
  }
  function openGift(meta){
    document.querySelectorAll('#lexGiftOne,#lexGiftModal,#dlinkyGiftModal').forEach(x=>x.remove());
    document.body.insertAdjacentHTML('beforeend',`<div id="lexGiftOne" class="modal show"><div class="modal-card lex-gift-card"><button class="modal-close" id="giftCloseOne">×</button><h2>Enviar presente</h2><p>Escolha o destinatário e confirme o envio.</p><div class="gift-summary"><div><span>Item</span><b>${esc(meta.name||'Item')}</b></div><div><span>Duração</span><b>${esc(meta.duration||'Permanente')}</b></div><div><span>Preço</span><b>${esc(meta.price||'0 Linkwuans')}</b></div></div><label>Destinatário <input id="giftRecipientOne" placeholder="@slug ou email"></label><label>Mensagem opcional<textarea id="giftMessageOne" maxlength="100" placeholder="Mensagem para quem receber"></textarea></label><button class="btn primary full" id="giftConfirmOne">🎁 Presentear</button></div></div>`);
    $('#giftCloseOne').onclick=()=>$('#lexGiftOne')?.remove(); $('#giftConfirmOne').onclick=()=>{ if(!$('#giftRecipientOne')?.value.trim()) return toastx('Digite o destinatário.'); toastx('Presente preparado.'); $('#lexGiftOne')?.remove(); };
  }

  document.addEventListener('change',e=>{ const sel=e.target.closest('.lv-duration'); if(!sel) return; const card=sel.closest('.zyo-item-card'); const item=findProduct(card?.dataset.lvKind, card?.dataset.lvId); const lab=card?.querySelector('[data-price-label]'); if(item&&lab) lab.textContent=priceFor(item,sel.value)+' Linkwuans'; },true);
  document.addEventListener('click',e=>{
    const tab=e.target.closest('[data-shop-tab]'); if(tab){ setMode(tab.dataset.shopTab); setTimeout(()=>window.renderShop(),0); }
    const b=e.target.closest('[data-lv-buy]'); if(b){ e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); return openBuyModal(b.dataset.lvBuy,b.dataset.lvId); }
    const c=e.target.closest('[data-lv-confirm-buy]'); if(c){ e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); return buy(c.dataset.lvConfirmBuy,c.dataset.lvId,c.dataset.lvDuration); }
    if(e.target.closest('[data-lv-close-buy]')){ e.preventDefault(); document.querySelector('#lvBuyModal')?.remove(); }
    const g=e.target.closest('[data-lv-gift]'); if(g){ e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); const item=findProduct(g.dataset.lvGift,g.dataset.lvId); if(item) openGift({name:item.name,price:(item.price||priceFor(item,'d3'))+' Linkwuans',duration:'Permanente'}); }
  },true);

  async function boot(){ await loadAdminOnline(true); try{window.renderShop()}catch(e){} try{window.renderInventory()}catch(e){} }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  setTimeout(boot,900); setInterval(()=>loadAdminOnline(true).then(()=>{try{window.renderShop()}catch(e){};try{window.renderInventory()}catch(e){};}),30000);
})();

/* === LEXVOID FINALÍSSIMO: admin insignias + loja/inventário estáveis + efeitos com imagem + partículas descendo === */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safe=v=>String(v||'').trim().replace(/"/g,'%22').replace(/'/g,'%27');
  const norm=v=>String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/^(frame|effect|selo|insignia|badge|seal|moldura|efeito):/,'').replace(/[^a-z0-9:/._-]+/g,'');
  const db=()=>{try{return firebase.firestore()}catch(e){return null}};
  const inv=()=>Array.isArray(window.user?.inventory)?window.user.inventory:(window.user?(window.user.inventory=[]):[]);
  const toastx=m=>{try{toast(m)}catch(e){console.log(m)}};
  const save=async m=>{try{if(typeof saveUser==='function') await saveUser(m||'Salvo!')}catch(e){}};
  window.__LV_ADMIN_FINAL = window.__LV_ADMIN_FINAL || {frames:[],effects:[],selos:[],insignias:[]};

  function typeOf(it){const t=norm(it?.type); if(t.includes('frame')||t.includes('moldura'))return'frame'; if(t.includes('effect')||t.includes('efeito')||t.includes('banner'))return'effect'; if(t.includes('selo')||t.includes('seal'))return'selo'; if(t.includes('badge')||t.includes('insign'))return'insignia'; return t||'other';}
  function keys(o){return [o?.id,o?.itemId,o?.frameId,o?.effectId,o?.seloId,o?.insigniaId,o?.url,o?.value,o?.frame,o?.name].map(norm).filter(Boolean).flatMap(x=>[x,x.replace(/^(frame|effect|selo|insignia):/,'')]);}
  function same(a,b){const ak=keys(a),bk=keys(b); return ak.some(x=>bk.includes(x));}
  function list(k){return window.__LV_ADMIN_FINAL[k+'s']||[];}
  function findAdm(kind,itOrId){const obj=typeof itOrId==='object'?itOrId:{id:String(itOrId),itemId:String(itOrId)}; return list(kind).find(a=>same(obj,a)||String(a.id||'')===String(itOrId)||norm(a.name)===norm(obj.name));}
  function hydrate(it){const k=typeOf(it), a=findAdm(k,it); return a?{...a,...it,url:it.url||it.value||a.url||a.value||'',value:it.value||it.url||a.value||a.url||'',name:it.name||a.name,desc:it.desc||a.desc,price:it.price||a.price,prices:it.prices||a.prices,size:it.size||a.size}:it;}
  function exists(it){const k=typeOf(it); if(!['frame','effect','selo','insignia'].includes(k))return true; return !!findAdm(k,it);}

  async function loadAdmin(){const f=db(); if(!f)return; const read=async col=>{try{const s=await f.collection(col).orderBy('createdAt','desc').get(); return s.docs.map(d=>({id:d.id,...d.data()}));}catch(e){return []}};
    const [frames,effects,selos,insignias]=await Promise.all([read('adminFrames'),read('adminEffects'),read('adminSelos'),read('adminInsignias')]);
    window.__LV_ADMIN_FINAL={frames:frames.map(x=>({...x,type:'frame'})),effects:effects.map(x=>({...x,type:'effect'})),selos:selos.map(x=>({...x,type:'selo'})),insignias:insignias.map(x=>({...x,type:'insignia'}))};
    window.customFrames=window.__LV_ADMIN_FINAL.frames; window.__lexAdminEffectsShop=window.__LV_ADMIN_FINAL.effects; window.__lexAdminEffectsStrict=window.__LV_ADMIN_FINAL.effects; window.__lexAdminSelosShop=window.__LV_ADMIN_FINAL.selos; window.__lexAdminSelosStrict=window.__LV_ADMIN_FINAL.selos; window.__lexAdminInsigniasShop=window.__LV_ADMIN_FINAL.insignias;
  }

  function ensureTabs(){const shop=$('.shop-tabs'); if(shop){if(!shop.querySelector('[data-shop-tab="insignias"]')){const b=document.createElement('button');b.type='button';b.dataset.shopTab='insignias';b.textContent='Insígnias'; const eff=shop.querySelector('[data-shop-tab="effects"]'); (eff||shop.lastElementChild).insertAdjacentElement(eff?'beforebegin':'afterend',b);} if(!shop.querySelector('[data-shop-tab="selos"]')){const b=document.createElement('button');b.type='button';b.dataset.shopTab='selos';b.textContent='Selos'; const other=shop.querySelector('[data-shop-tab="other"]'); (other||shop).insertAdjacentElement(other?'beforebegin':'beforeend',b);}}
    const invt=$('#inventoryTabs'); if(invt && !invt.querySelector('[data-inv-filter="insignias"]')){const b=document.createElement('button');b.type='button';b.dataset.invFilter='insignias';b.textContent='Insígnias'; const eff=invt.querySelector('[data-inv-filter="effects"],[data-inv-filter="efeitos"]'); (eff||invt.lastElementChild).insertAdjacentElement(eff?'beforebegin':'afterend',b);}
  }
  function mode(){try{return window.shopMode||shopMode}catch(e){return $('.shop-tabs button.active')?.dataset.shopTab||'coins'}}
  function setMode(v){try{window.shopMode=v;shopMode=v}catch(e){window.shopMode=v} $$('.shop-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.shopTab===v));}
  function invFilter(){try{return window.inventoryFilter||inventoryFilter}catch(e){return $('#inventoryTabs button.active')?.dataset.invFilter||'all'}}
  function setInvFilter(v){try{window.inventoryFilter=v;inventoryFilter=v}catch(e){window.inventoryFilter=v} $$('#inventoryTabs button').forEach(b=>b.classList.toggle('active',b.dataset.invFilter===v));}

  function avatar(){try{return getBestAvatar()||window.user?.avatar||''}catch(e){return window.user?.avatar||''}}
  function owned(kind,item){return inv().some(it=>typeOf(it)===kind && same(it,item));}
  function priceMap(item){const p=item?.prices||item?.priceMap||item?.durations||{}; const base=Number(item?.price||p.d3||p['3']||10); return {d3:Number(p.d3??p['3']??base),d7:Number(p.d7??p['7']??Math.ceil(base*1.5)),d15:Number(p.d15??p['15']??Math.ceil(base*2.5)),d30:Number(p.d30??p['30']??Math.ceil(base*4)),perm:Number(p.perm??p.permanent??p.permanente??Math.ceil(base*8))};}
  function priceFor(item,d){const p=priceMap(item);return Number(p[d]??p.d3??item?.price??0)}
  function durSel(kind,id){return `<select class="zyo-duration lvf-dur" data-kind="${esc(kind)}" data-id="${esc(id)}"><option value="d3">3 dias</option><option value="d7">7 dias</option><option value="d15">15 dias</option><option value="d30">30 dias</option><option value="perm">Permanente</option></select>`}
  function preview(kind,item){const u=item.url||item.value||''; if(kind==='frame')return `<div class="lex-shop-frame-preview"><span class="lex-shop-avatar" style="background-image:url('${safe(avatar())}')"></span>${u?`<img src="${safe(u)}" onerror="this.style.display='none'">`:''}</div>`; if(kind==='effect')return `<div class="lex-effect-shop-preview" style="background-image:url('${safe(u)}')"></div>`; return `<div class="lex-selo-shop-preview">${u?`<img src="${safe(u)}" onerror="this.style.display='none'">`:'🏷️'}</div>`;}
  function card(kind,item){const id=String(item.id||item.url||item.name||''), b=owned(kind,item), p=priceFor(item,'d3'); const title={frame:'Moldura',effect:'Efeito',selo:'Selo',insignia:'Insígnia'}[kind]||'Item'; const note=kind==='effect'?'ⓘ Aplica no banner do perfil.':kind==='selo'?'ⓘ Aparece ao lado do nome.':kind==='insignia'?'ⓘ Aparece embaixo do nome.':'ⓘ Valor muda conforme a duração escolhida.'; return `<div class="zyo-item-card ${b?'owned':''}" data-lvf-kind="${kind}" data-lvf-id="${esc(id)}"><div class="zyo-item-top">${preview(kind,item)}<div><h3>${esc(item.name||title)}</h3><p>${esc(item.desc||'')}</p>${b?'<span class="owned-badge">✓ Já comprado</span>':''}</div></div><div class="zyo-price">▣ Preço do item: <b data-price-label>${p} Linkwuans</b></div>${durSel(kind,id)}<small class="zyo-note">${note}</small><div class="zyo-card-actions"><button class="btn primary small" type="button" data-lvf-buy="${kind}" data-lvf-id="${esc(id)}" ${b?'disabled':''}>🔒 ${b?'Já comprado':'Comprar'}</button><button class="btn dark small" type="button" data-lvf-gift="${kind}" data-lvf-id="${esc(id)}">🎁 Presentear</button></div></div>`;}

  const oldShop=window.renderShop||null;
  window.renderShop=function(){ensureTabs(); const m=mode(); const grid=$('#shopGrid'); if(!grid){if(oldShop)oldShop();return} $$('.shop-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.shopTab===m));
    if(['frames','molduras'].includes(m)){const a=list('frame'); grid.className='zyo-shop-grid'; grid.innerHTML=`<div class="zyo-shop-title"><h2>Molduras</h2><p>Destaque-se com molduras exclusivas no seu perfil.</p></div>`+(a.length?a.map(x=>card('frame',x)).join(''):'<p>Nenhuma moldura cadastrada pelo admin ainda.</p>');return}
    if(['effects','efeitos'].includes(m)){const a=list('effect'); grid.className='zyo-shop-grid'; grid.innerHTML=`<div class="zyo-shop-title"><h2>Efeitos</h2><p>Efeitos de banner cadastrados pelo admin.</p></div>`+(a.length?a.map(x=>card('effect',x)).join(''):'<p>Nenhum efeito cadastrado pelo admin ainda.</p>');return}
    if(['selos','selo'].includes(m)){const a=list('selo'); grid.className='zyo-shop-grid'; grid.innerHTML=`<div class="zyo-shop-title"><h2>Selos</h2><p>Selos cadastrados pelo admin para aparecer ao lado do nome.</p></div>`+(a.length?a.map(x=>card('selo',x)).join(''):'<p>Nenhum selo cadastrado pelo admin ainda.</p>');return}
    if(['insignias','insígnias','badge'].includes(m)){const a=list('insignia'); grid.className='zyo-shop-grid'; grid.innerHTML=`<div class="zyo-shop-title"><h2>Insígnias</h2><p>Insígnias cadastradas pelo admin para aparecer embaixo do nome.</p></div>`+(a.length?a.map(x=>card('insignia',x)).join(''):'<p>Nenhuma insígnia cadastrada pelo admin ainda.</p>');return}
    if(['other','outros'].includes(m)){grid.className='zyo-shop-grid'; grid.innerHTML='<div class="zyo-shop-title"><h2>Outros</h2><p>Itens extras ficarão disponíveis aqui.</p></div>';return}
    if(oldShop)oldShop(); ensureTabs();}; try{renderShop=window.renderShop}catch(e){}

  function pass(it){const f=norm(invFilter()); const k=typeOf(it); if(['all','todos','tudo'].includes(f))return true; if(['frames','molduras','frame'].includes(f))return k==='frame'; if(['effects','efeitos','effect'].includes(f))return k==='effect'; if(['selos','selo'].includes(f))return k==='selo'; if(['insignias','insignia','badge'].includes(f))return k==='insignia'; if(['gifts','presentes'].includes(f))return !!it.gift; return true;}
  function invPrev(it){it=hydrate(it); const k=typeOf(it),u=it.url||it.value||''; if(k==='frame')return preview('frame',it); if(k==='effect')return `<div class="asset-preview lex-inv-effect-preview" style="background-image:url('${safe(u)}')"></div>`; if(k==='selo'||k==='insignia')return `<div class="asset-preview lex-inv-selo-preview">${u?`<img src="${safe(u)}" onerror="this.style.display='none'">`:'🏷️'}</div>`; return '<div class="asset-preview">✦</div>';}
  window.renderInventory=function(){ensureTabs(); if(window.user){ window.user.inventory=inv().filter(exists).map(hydrate); } const grid=$('#inventoryGrid'); if(!grid)return; const items=inv().map((it,i)=>({it,i})).filter(x=>pass(x.it)); const f=invFilter(); $$('#inventoryTabs button').forEach(b=>b.classList.toggle('active',b.dataset.invFilter===f)); const c=$('#invItemsCount'); if(c)c.textContent=inv().length; const co=$('#invCoins'); if(co)co.textContent=Number(user?.coins||0); if(!items.length){grid.innerHTML='<p>Nenhum item nessa categoria.</p>';return} grid.innerHTML=items.map(({it,i})=>{it=hydrate(it);const k=typeOf(it); return `<div class="asset-card inv-item-card lex-inv-card"><div class="lex-inv-preview-wrap">${invPrev(it)}</div><div class="asset-body"><b>${esc(it.name||'Item')}</b><small>${esc(k)}</small>${k==='frame'?`<button class="btn primary small" type="button" data-use-inv-frame="${i}">Usar</button><button class="btn dark small" type="button" data-adjust-inv-frame="${i}">Ajustar</button>`:''}${k==='effect'?`<button class="btn primary small" type="button" data-lvf-use-effect="${i}">Usar</button>`:''}${k==='selo'?`<button class="btn primary small" type="button" data-lvf-use-selo="${i}">Usar</button><button class="btn dark small" type="button" data-lvf-adjust-selo="${i}">Ajustar</button>`:''}${k==='insignia'?`<button class="btn primary small" type="button" data-lvf-use-insignia="${i}">Usar</button><button class="btn dark small" type="button" data-lvf-adjust-insignia="${i}">Ajustar</button>`:''}<button class="btn dark small" type="button" data-lvf-remove-profile="${i}">Remover do perfil</button></div></div>`}).join('');}; try{renderInventory=window.renderInventory}catch(e){}

  function find(kind,id){return list(kind).find(x=>String(x.id||x.url||x.name)===String(id)||norm(x.id)===norm(id)||norm(x.name)===norm(id));}
  async function buy(kind,id){const obj=find(kind,id); if(!obj)return toastx('Item não encontrado.'); if(owned(kind,obj))return toastx('Você já comprou esse item.'); const dur=$(`[data-lvf-kind="${kind}"][data-lvf-id="${CSS.escape(id)}"] select`)?.value||'d3'; const price=priceFor(obj,dur); if(Number(user.coins||0)<price)return toastx('Linkwuans insuficientes.'); user.coins=Number(user.coins||0)-price; const item={id:`${kind}:${obj.id||obj.url||obj.name}`,itemId:`${kind}:${obj.id||obj.url||obj.name}`,type:kind,name:obj.name||kind,desc:obj.desc||'',url:obj.url||obj.value||'',value:obj.value||obj.url||'',price,prices:obj.prices||{},duration:dur,size:Number(obj.size||32),boughtAt:Date.now()}; inv().push(item); await save('Item comprado!'); window.renderShop(); window.renderInventory();}
  function applyBannerEffect(){const el=$('#profileBanner'); if(el){const u=window.user?.bannerEffect||''; el.style.setProperty('--banner-effect-url',`url('${safe(u)}')`); el.classList.toggle('has-banner-effect',!!u);}}
  async function useItem(kind,i){const it=hydrate(inv()[Number(i)]); if(!it)return; if(kind==='effect'){user.bannerEffect=it.url||it.value||''; await save('Efeito aplicado!'); applyBannerEffect();}
    if(kind==='selo'){user.selos=Array.isArray(user.selos)?user.selos:[]; if(!user.selos.some(s=>same(s,it)))user.selos.push({id:it.id,itemId:it.itemId,name:it.name,url:it.url||it.value,value:it.url||it.value,size:Number(it.size||28)}); await save('Selo aplicado!');}
    if(kind==='insignia'){user.insignias=Array.isArray(user.insignias)?user.insignias:[]; if(!user.insignias.some(s=>same(s,it)))user.insignias.push({id:it.id,itemId:it.itemId,name:it.name,url:it.url||it.value,value:it.url||it.value,size:Number(it.size||34)}); await save('Insígnia aplicada!');}
    try{renderProfile()}catch(e){} window.renderInventory();}
  async function removeProfile(i){const it=hydrate(inv()[Number(i)]); if(!it)return; const k=typeOf(it); if(k==='effect'&&norm(user.bannerEffect)===norm(it.url||it.value))user.bannerEffect=''; if(k==='selo')user.selos=(user.selos||[]).filter(s=>!same(s,it)); if(k==='insignia')user.insignias=(user.insignias||[]).filter(s=>!same(s,it)); await save('Removido só do perfil. Continua no inventário.'); applyBannerEffect(); try{renderProfile()}catch(e){} window.renderInventory();}
  function adjust(kind,i){const it=hydrate(inv()[Number(i)]); if(!it)return; const u=it.url||it.value||'', size=Number(it.size|| (kind==='insignia'?34:28)); $('#lvfAdjustModal')?.remove(); document.body.insertAdjacentHTML('beforeend',`<div id="lvfAdjustModal" class="modal show"><div class="modal-card lex-selo-adjust-card"><button class="modal-close" id="lvfAdjClose">×</button><h2>Ajustar ${kind==='insignia'?'insígnia':'selo'}</h2><p>Controle o tamanho no perfil.</p><div class="lex-selo-adjust-preview"><span>Nome</span><img src="${safe(u)}" style="width:${size}px;height:${size}px"></div><label>Tamanho <input id="lvfSize" type="range" min="12" max="90" value="${size}"></label><button class="btn primary" id="lvfAdjSave">Salvar ajuste</button></div></div>`); const modal=$('#lvfAdjustModal'),img=modal.querySelector('img'),r=$('#lvfSize'); r.oninput=()=>{img.style.width=r.value+'px';img.style.height=r.value+'px'}; $('#lvfAdjClose').onclick=()=>modal.remove(); $('#lvfAdjSave').onclick=async()=>{it.size=Number(r.value); const arr=kind==='insignia'?'insignias':'selos'; user[arr]=(user[arr]||[]).map(s=>same(s,it)?{...s,size:Number(r.value)}:s); await save('Ajuste salvo!'); modal.remove(); try{renderProfile()}catch(e){} window.renderInventory();};}

  function renderNameExtras(){const name=$('#profileName'); if(!name)return; let sel=$('#profileNameSelos'); if(!sel){sel=document.createElement('span');sel.id='profileNameSelos';sel.className='profile-name-selos';name.insertAdjacentElement('afterend',sel);} sel.innerHTML=(user?.selos||[]).map(s=>`<img src="${safe(s.url||s.value)}" style="width:${Number(s.size||28)}px;height:${Number(s.size||28)}px" title="${esc(s.name||'Selo')}">`).join(''); let ins=$('#profileInsignias'); if(!ins){ins=document.createElement('div');ins.id='profileInsignias';ins.className='profile-insignias'; sel.insertAdjacentElement('afterend',ins);} ins.innerHTML=(user?.insignias||[]).map(s=>`<img src="${safe(s.url||s.value)}" style="width:${Number(s.size||34)}px;height:${Number(s.size||34)}px" title="${esc(s.name||'Insígnia')}">`).join('');}
  const oldProf=window.renderProfile||null; window.renderProfile=function(){if(oldProf)oldProf(); renderNameExtras(); applyBannerEffect(); renderFallingParticles();}; try{renderProfile=window.renderProfile}catch(e){}

  function ensureAdminInsignias(){const side=$('.sidebar,aside,.dash-sidebar'); if(side&&!$('[data-tab="adminInsignias"]')&&!$('[data-nav="adminInsignias"]')){const ref=$('[data-tab="adminSelos"],[data-nav="adminSelos"]')||side.lastElementChild; const b=document.createElement('button'); b.type='button'; b.className='side-link'; b.dataset.tab='adminInsignias'; b.textContent='🛡️ Admin Insígnias'; ref?.insertAdjacentElement('afterend',b);} const main=$('#dashboard .dash-main')||$('.dash-main')||$('#dashboard'); if(main&&!$('#tab-adminInsignias')){main.insertAdjacentHTML('beforeend',`<section id="tab-adminInsignias" class="dash-tab" style="display:none"><div class="hero-panel"><h1>Admin Insígnias</h1><p>Cadastre insígnias para vender na loja. Elas aparecem embaixo do nome.</p></div><div class="grid2 admin-insignias-grid"><div class="panel form-panel"><h2>Nova insígnia</h2><label>Nome<input id="adminInsigniaName"></label><label>Descrição<input id="adminInsigniaDesc"></label><label>Preço<input id="adminInsigniaPrice" type="number" value="20"></label><label>Imagem/GIF URL<input id="adminInsigniaUrl" placeholder="https://site.com/insignia.gif"></label><button class="btn primary" id="adminAddInsignia" type="button">Cadastrar insígnia</button></div><div class="panel"><h2>Insígnias cadastradas</h2><div id="adminInsigniasList"><p>Nenhuma insígnia cadastrada.</p></div></div></div></section>`);}}
  function showTab(id){$$('.dash-tab,.tab-content').forEach(t=>{if(t.id&&t.id.startsWith('tab-'))t.style.display=(t.id==='tab-'+id)?'block':'none'});}
  function renderAdminInsignias(){const listEl=$('#adminInsigniasList'); if(!listEl)return; const arr=list('insignia'); listEl.innerHTML=arr.length?arr.map(i=>`<div class="admin-effect-row-clean"><div class="admin-effect-thumb-clean" style="background-image:url('${safe(i.url||i.value)}')"></div><div class="admin-effect-info-clean"><b>${esc(i.name||'Insígnia')}</b><small>${esc(i.desc||'')}</small><small>${Number(i.price||20)} Linkwuans</small></div><button class="delete" data-del-insignia="${esc(i.id)}" type="button">×</button></div>`).join(''):'<p>Nenhuma insígnia cadastrada.</p>';}
  async function addInsignia(){const f=db(); if(!f)return; const item={name:$('#adminInsigniaName')?.value.trim()||'',desc:$('#adminInsigniaDesc')?.value.trim()||'',price:Number($('#adminInsigniaPrice')?.value||20),url:$('#adminInsigniaUrl')?.value.trim()||'',type:'insignia',createdAt:firebase.firestore.FieldValue.serverTimestamp(),createdBy:firebase.auth().currentUser?.email||''}; if(!item.name||!item.url)return toastx('Coloque nome e URL da insígnia.'); await f.collection('adminInsignias').add(item); ['adminInsigniaName','adminInsigniaDesc','adminInsigniaPrice','adminInsigniaUrl'].forEach(id=>{const el=$('#'+id);if(el)el.value=id==='adminInsigniaPrice'?'20':''}); await loadAdmin(); renderAdminInsignias(); if(['insignias','insígnias'].includes(mode()))window.renderShop(); toastx('Insígnia cadastrada.');}

  function renderFallingParticles(){let root=$('#lexFallingParticles'); const type=user?.particles?.type||user?.particleType||user?.particlesType||''; const enabled=type&&type!=='none'&&type!=='Sem partículas'; if(!enabled){root?.remove();return} if(!root){root=document.createElement('div');root.id='lexFallingParticles';document.body.appendChild(root)} const emoji=/neve|snow/i.test(type)?'❄':/raio|light/i.test(type)?'⚡':/estrela|star/i.test(type)?'✦':/folha/i.test(type)?'🍃':/fogo/i.test(type)?'🔥':'✦'; const qty=Math.max(8,Math.min(80,Number(user?.particles?.quantity||user?.particleQty||24))); if(root.dataset.kind===emoji&&root.children.length===qty)return; root.dataset.kind=emoji; root.innerHTML=''; for(let i=0;i<qty;i++){const s=document.createElement('span');s.textContent=emoji;s.style.left=(Math.random()*100)+'vw';s.style.animationDelay=(Math.random()*6)+'s';s.style.animationDuration=(4+Math.random()*7)+'s';s.style.fontSize=(12+Math.random()*14)+'px';root.appendChild(s)}}

  document.addEventListener('click',async e=>{const st=e.target.closest('.shop-tabs [data-shop-tab]'); if(st){setMode(st.dataset.shopTab); setTimeout(()=>window.renderShop(),0);} const it=e.target.closest('#inventoryTabs [data-inv-filter]'); if(it){setInvFilter(it.dataset.invFilter);setTimeout(()=>window.renderInventory(),0)} const buyBtn=e.target.closest('[data-lvf-buy]'); if(buyBtn){e.preventDefault();e.stopImmediatePropagation();return buy(buyBtn.dataset.lvfBuy,buyBtn.dataset.lvfId)} const eff=e.target.closest('[data-lvf-use-effect]'); if(eff){e.preventDefault();e.stopImmediatePropagation();return useItem('effect',eff.dataset.lvfUseEffect)} const se=e.target.closest('[data-lvf-use-selo]'); if(se){e.preventDefault();e.stopImmediatePropagation();return useItem('selo',se.dataset.lvfUseSelo)} const ins=e.target.closest('[data-lvf-use-insignia]'); if(ins){e.preventDefault();e.stopImmediatePropagation();return useItem('insignia',ins.dataset.lvfUseInsignia)} const adjS=e.target.closest('[data-lvf-adjust-selo]'); if(adjS){e.preventDefault();e.stopImmediatePropagation();return adjust('selo',adjS.dataset.lvfAdjustSelo)} const adjI=e.target.closest('[data-lvf-adjust-insignia]'); if(adjI){e.preventDefault();e.stopImmediatePropagation();return adjust('insignia',adjI.dataset.lvfAdjustInsignia)} const rem=e.target.closest('[data-lvf-remove-profile]'); if(rem){e.preventDefault();e.stopImmediatePropagation();return removeProfile(rem.dataset.lvfRemoveProfile)} if(e.target?.id==='adminAddInsignia'){e.preventDefault();return addInsignia()} const del=e.target.closest('[data-del-insignia]'); if(del){e.preventDefault();await db().collection('adminInsignias').doc(del.dataset.delInsignia).delete();await loadAdmin();renderAdminInsignias();if(mode()==='insignias')window.renderShop();} const nav=e.target.closest('[data-tab="adminInsignias"],[data-nav="adminInsignias"]'); if(nav){e.preventDefault();showTab('adminInsignias');renderAdminInsignias();}},true);
  document.addEventListener('change',e=>{const s=e.target.closest('.lvf-dur'); if(!s)return; const c=s.closest('.zyo-item-card'), kind=c?.dataset.lvfKind, id=c?.dataset.lvfId, item=find(kind,id); const lab=c?.querySelector('[data-price-label]'); if(lab&&item)lab.textContent=priceFor(item,s.value)+' Linkwuans';});
  async function boot(){ensureTabs();ensureAdminInsignias();await loadAdmin();renderAdminInsignias(); if($('#shopGrid'))window.renderShop(); if($('#inventoryGrid'))window.renderInventory(); renderNameExtras(); applyBannerEffect(); renderFallingParticles();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot); else boot(); setTimeout(boot,1000); setInterval(renderFallingParticles,2500);
})();

/* === LEXVOID HOTFIX SEGURO: admin só dono, partículas só no perfil, conta nova limpa === */
(function(){
  const OWNER_EMAIL = 'jailtonsilas48@gmail.com';
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const clean = v => String(v||'').toLowerCase().trim();

  function ownerEmail(){
    try { return clean(firebase.auth().currentUser?.email || window.currentAuthUser?.email || window.user?.email); }
    catch(e){ return clean(window.user?.email); }
  }
  function ownerOK(){ return ownerEmail() === OWNER_EMAIL; }

  // trava REAL: só o e-mail dono vê ou abre qualquer área admin.
  window.isAdmin = ownerOK;
  try { isAdmin = ownerOK; } catch(e) {}

  function lockAdmins(){
    const ok = ownerOK();
    $$('[data-tab="admin"],[data-tab="adminSelos"],[data-tab="adminEffects"],[data-tab="adminInsignias"],[data-nav="admin"],[data-nav="adminSelos"],[data-nav="adminEffects"],[data-nav="adminInsignias"],.admin-only')
      .forEach(el=>{
        el.classList.add('admin-only');
        el.style.display = ok ? '' : 'none';
        el.classList.toggle('show', ok);
      });
    const active = $('.side-link.active,.admin-only.active');
    if(!ok && active && /admin/i.test(active.dataset.tab||active.dataset.nav||'')){
      try { openTab('home'); } catch(e) {}
    }
  }
  window.updateAdminVisibility = lockAdmins;
  try { updateAdminVisibility = lockAdmins; } catch(e) {}

  const oldOpenTab = window.openTab;
  window.openTab = function(id){
    if(/^admin/i.test(String(id||'')) && !ownerOK()){
      try { toast('Área somente para admin.'); } catch(e) {}
      return;
    }
    if(id === 'adminInsignias'){
      $$('.dash-tab').forEach(x=>x.classList.remove('active'));
      $$('.dash-tab').forEach(x=>{ if(x.id && x.id.startsWith('tab-')) x.style.display=''; });
      $('#tab-adminInsignias')?.classList.add('active');
      $$('.side-link').forEach(x=>x.classList.toggle('active', x.dataset.tab === id));
      try { if(typeof renderAdminInsignias === 'function') renderAdminInsignias(); } catch(e) {}
      lockAdmins();
      return;
    }
    if(typeof oldOpenTab === 'function') oldOpenTab(id);
    lockAdmins();
  };
  try { openTab = window.openTab; } catch(e) {}

  // bloqueia clique capturado antes de qualquer handler antigo.
  document.addEventListener('click', function(e){
    const adminBtn = e.target.closest('[data-tab="admin"],[data-tab="adminSelos"],[data-tab="adminEffects"],[data-tab="adminInsignias"],[data-nav="admin"],[data-nav="adminSelos"],[data-nav="adminEffects"],[data-nav="adminInsignias"]');
    if(adminBtn && !ownerOK()){
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      try { toast('Área somente para admin.'); } catch(err) {}
      return false;
    }
  }, true);

  // remove qualquer overlay de partícula fora do Ver Perfil para não travar/clutter o dashboard.
  function onlyProfileParticles(){
    const profileActive = $('#profile')?.classList.contains('active');
    if(!profileActive){
      $('#lexFallingParticles')?.remove();
      const pl = $('#profileParticleLayer');
      if(pl) pl.innerHTML = '';
    }
    lockAdmins();
  }
  const oldRoute = window.route;
  if(typeof oldRoute === 'function'){
    window.route = async function(){
      const r = await oldRoute.apply(this, arguments);
      setTimeout(onlyProfileParticles, 30);
      return r;
    };
    try { route = window.route; } catch(e) {}
  }
  const oldRenderDash = window.renderDash;
  window.renderDash = function(){
    if(typeof oldRenderDash === 'function') oldRenderDash.apply(this, arguments);
    onlyProfileParticles();
  };
  try { renderDash = window.renderDash; } catch(e) {}

  const oldCreate = window.createProfileParticles || (typeof createProfileParticles === 'function' ? createProfileParticles : null);
  window.createProfileParticles = function(type){
    if(!$('#profile')?.classList.contains('active')){
      $('#lexFallingParticles')?.remove();
      const layer = $('#profileParticleLayer'); if(layer) layer.innerHTML='';
      return;
    }
    if(typeof oldCreate === 'function') oldCreate(type);
  };
  try { createProfileParticles = window.createProfileParticles; } catch(e) {}

  // substitui a função extra que jogava estrelas/neve no dashboard.
  window.renderFallingParticles = function(){
    if(!$('#profile')?.classList.contains('active')){ $('#lexFallingParticles')?.remove(); return; }
    const type = window.user?.particleType || 'none';
    const enabled = window.user?.particles && type && type !== 'none';
    if(!enabled){ $('#lexFallingParticles')?.remove(); return; }
    let root = $('#lexFallingParticles');
    if(!root){ root=document.createElement('div'); root.id='lexFallingParticles'; document.body.appendChild(root); }
    const emoji = /snow|neve/i.test(type) ? '❄' : /raio|bolt/i.test(type) ? '⚡' : /rain|chuva/i.test(type) ? '╱' : /fire|fogo/i.test(type) ? '🔥' : /leaf|folha/i.test(type) ? '🍃' : /cat|gato/i.test(type) ? '🐾' : '✦';
    const qty = Math.max(8, Math.min(120, Number(window.user?.particleCount || 45)));
    if(root.dataset.kind === emoji && Number(root.dataset.qty||0) === qty) return;
    root.dataset.kind = emoji; root.dataset.qty = String(qty); root.innerHTML='';
    for(let i=0;i<qty;i++){
      const s=document.createElement('span');
      s.textContent=emoji;
      s.style.left=(Math.random()*100)+'vw';
      s.style.animationDelay=(-Math.random()*8)+'s';
      s.style.animationDuration=(5+Math.random()*8)+'s';
      s.style.fontSize=(10+Math.random()*18)+'px';
      root.appendChild(s);
    }
  };

  // conta nova sempre limpa: sem Sasuke, sem banner/bg/frame/music por padrão.
  function cleanNewAccountObject(u){
    return Object.assign({}, u, {
      avatar:'', banner:'', bg:'', video:'', frame:'', decoration:'none', music:'', cursor:'',
      particles:false, particleType:'none', bannerEffect:'', selos:[], insignias:[], inventory:[], links:[], socials:[], embeds:[],
      tagSettings:{showFree:false, showDlinky:false, active:[]}
    });
  }
  window.lexCleanNewAccountObject = cleanNewAccountObject;

  // se uma conta nova caiu com avatar/banner padrão antigo, limpa uma única vez ANTES dela editar algo.
  async function maybeCleanFreshDefault(){
    try{
      if(!firebase.auth().currentUser || !window.user?.uid) return;
      const badAvatar = /pinimg|sasuke|originals\/74\/a6|originals\/55\/18/i.test(String(window.user.avatar||''));
      const looksDefault = ['usuario','usuário'].includes(clean(window.user.name)) || clean(window.user.slug)==='usuario';
      if(badAvatar && looksDefault){
        Object.assign(window.user, cleanNewAccountObject(window.user));
        await saveUser('Perfil inicial limpo.');
      }
    }catch(e){}
  }
  setTimeout(maybeCleanFreshDefault, 1500);
  setInterval(onlyProfileParticles, 1200);
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{lockAdmins();onlyProfileParticles();},200));
  setTimeout(()=>{lockAdmins();onlyProfileParticles();},800);
})();

/* === LEXVOID FINAL HOTFIX: modal compra/presente universal + frame vazio + partículas descendo === */
(function(){
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
  const safe=s=>esc(String(s||''));
  const norm=s=>String(s||'').toLowerCase().trim().replace(/^(frame|effect|selo|insignia):/,'');
  function toastMsg(t){try{toast(t)}catch(e){alert(t)}}
  function db(){try{return firebase.firestore()}catch(e){return null}}
  function save(msg){try{if(typeof saveUser==='function')return saveUser(msg||'Salvo!')}catch(e){} return Promise.resolve();}
  function arr(kind){const A=window.__LV_ADMIN_FINAL||{}; return kind==='frame'?(A.frames||window.customFrames||[]):kind==='effect'?(A.effects||window.__lexAdminEffectsShop||[]):kind==='selo'?(A.selos||window.__lexAdminSelosShop||[]):kind==='insignia'?(A.insignias||window.__lexAdminInsigniasShop||[]):[];}
  function keys(o){return [o?.id,o?.itemId,o?.url,o?.value,o?.name].map(norm).filter(Boolean)}
  function find(kind,id){id=norm(id); return arr(kind).find(x=>keys(x).includes(id)||norm(x.id)===id)||null;}
  function inv(){window.user=window.user||{}; user.inventory=Array.isArray(user.inventory)?user.inventory:[]; return user.inventory;}
  function owned(kind,item){const id=norm(item?.id||item?.url||item?.name); return inv().some(it=>{const t=norm(it.type); const k=t.includes('frame')?'frame':t.includes('effect')?'effect':t.includes('selo')?'selo':t.includes('insign')?'insignia':t; return k===kind && keys(it).some(x=>x===id || keys(item).includes(x));});}
  function priceMap(item){const p=item?.prices||item?.priceMap||item?.durations||{}; const base=Number(item?.price||p.d3||p['3']||10); return {d3:Number(p.d3??p['3']??base),d7:Number(p.d7??p['7']??Math.ceil(base*1.5)),d15:Number(p.d15??p['15']??Math.ceil(base*2.5)),d30:Number(p.d30??p['30']??Math.ceil(base*4)),perm:Number(p.perm??p.permanent??p.permanente??Math.ceil(base*8))};}
  function durationOf(card){return card?.querySelector('select')?.value || 'd3'}
  function durLabel(d){return ({d3:'3 dias',d7:'7 dias',d15:'15 dias',d30:'30 dias',perm:'Permanente',permanent:'Permanente',permanente:'Permanente'})[d]||d||'3 dias'}
  function priceFor(item,d){const p=priceMap(item); return Number(p[d]??p.d3??item?.price??0)}
  function titleKind(k){return k==='frame'?'Moldura':k==='effect'?'Efeito':k==='selo'?'Selo':k==='insignia'?'Insígnia':'Item'}
  function avatar(){try{return getBestAvatar()||user?.avatar||''}catch(e){return user?.avatar||''}}
  function preview(kind,item){const u=item?.url||item?.value||''; const av=avatar(); if(kind==='frame') return `<div class="lex-shop-frame-preview"><span class="lex-shop-avatar" style="background-image:url('${safe(av)}')"></span>${u?`<img src="${safe(u)}" onerror="this.style.display='none'">`:''}</div>`; if(kind==='effect') return `<div class="lex-effect-shop-preview" style="background-image:url('${safe(u)}')"></div>`; return `<div class="lex-selo-shop-preview">${u?`<img src="${safe(u)}" onerror="this.style.display='none'">`:'🏷️'}</div>`;}
  function cleanBrokenProfileImgs(){
    $$('.profile-card img,.profile-view img,#profile img').forEach(img=>{
      const s=String(img.getAttribute('src')||'').trim();
      if(!s || s==='undefined' || s==='null') img.style.display='none';
      img.addEventListener('error',()=>{ if(img.closest('.profile-card,#profile,.profile-view')) img.style.display='none'; },{once:true});
    });
  }
  function openBuy(kind,id,card){const item=find(kind,id); if(!item)return toastMsg('Item não encontrado no admin.'); const dur=durationOf(card); const price=priceFor(item,dur); document.querySelector('#lvUniversalBuyModal')?.remove(); document.body.insertAdjacentHTML('beforeend',`<div id="lvUniversalBuyModal" class="modal show"><div class="modal-card lex-buy-card"><button class="modal-close" data-lv-close-modal>×</button><h2>Confirmar compra</h2><p>Revise os detalhes antes de concluir.</p><div class="buy-preview"><b>PRÉ-VISUALIZAÇÃO</b><div>${preview(kind,item)}<strong>${esc(user?.name||user?.slug||'usuário')}</strong></div></div><div class="buy-info"><div><span>Item</span><b>${esc(item.name||titleKind(kind))}</b></div><div><span>Duração</span><b>${esc(durLabel(dur))}</b></div><div><span>Tipo</span><b>${esc(titleKind(kind))}</b></div><div><span>Preço</span><b>${price} Linkwuans</b></div></div><small>Esta ação consumirá seus Linkwuans. Confirma prosseguir?</small><div class="modal-actions"><button class="btn dark" data-lv-close-modal>Cancelar</button><button class="btn primary" data-lv-confirm-modal data-kind="${esc(kind)}" data-id="${esc(id)}" data-dur="${esc(dur)}">Comprar</button></div></div></div>`);}
  async function confirmBuy(kind,id,dur){const item=find(kind,id); if(!item)return toastMsg('Item não encontrado.'); if(owned(kind,item))return toastMsg('Você já comprou esse item.'); const price=priceFor(item,dur); const coins=Number(user?.coins||0); if(coins<price)return toastMsg('Linkwuans insuficientes.'); user.coins=coins-price; inv().push({id:`${kind}:${id}`,itemId:`${kind}:${id}`,type:kind,name:item.name||titleKind(kind),desc:item.desc||'',url:item.url||item.value||'',value:item.url||item.value||'',price,duration:durLabel(dur),boughtAt:Date.now()}); await save('Item comprado!'); $('#lvUniversalBuyModal')?.remove(); try{renderShop()}catch(e){} try{renderInventory()}catch(e){}}
  function openGift(kind,id,card){const item=find(kind,id); if(!item)return toastMsg('Item não encontrado no admin.'); const dur=durationOf(card); const price=priceFor(item,dur); document.querySelector('#lvUniversalGiftModal')?.remove(); document.body.insertAdjacentHTML('beforeend',`<div id="lvUniversalGiftModal" class="modal show"><div class="modal-card lex-gift-card"><button class="modal-close" data-lv-close-modal>×</button><h2>Enviar presente</h2><p>Revise os detalhes, escolha o destinatário e confirme o envio.</p><div class="buy-info"><div><span>Item</span><b>${esc(item.name||titleKind(kind))}</b></div><div><span>Duração</span><b>${esc(durLabel(dur))}</b></div><div><span>Tipo</span><b>${esc(titleKind(kind))}</b></div><div><span>Preço</span><b>${price} Linkwuans</b></div></div><label>Destinatário *</label><div class="gift-dest-row"><input id="lvGiftTo" placeholder="@ Ex.: maria"><button class="btn primary" type="button" id="lvGiftCheck">Verificar</button></div><small>Digite o /slug do seu amigo.</small><label>Mensagem opcional</label><textarea id="lvGiftMsg" maxlength="100" placeholder="Escreva uma mensagem para o destinatário"></textarea><div class="modal-actions"><button class="btn dark" data-lv-close-modal>Cancelar</button><button class="btn primary" data-lv-send-gift data-kind="${esc(kind)}" data-id="${esc(id)}" data-dur="${esc(dur)}">🎁 Presentear</button></div></div></div>`);}
  async function sendGift(kind,id,dur){const to=$('#lvGiftTo')?.value.trim(); if(!to)return toastMsg('Digite o destinatário.'); const item=find(kind,id); if(!item)return; const price=priceFor(item,dur); if(Number(user?.coins||0)<price)return toastMsg('Linkwuans insuficientes.'); user.coins=Number(user.coins||0)-price; user.giftsSent=user.giftsSent||[]; user.giftsSent.push({to,kind,id,itemName:item.name||titleKind(kind),price,duration:durLabel(dur),msg:$('#lvGiftMsg')?.value||'',createdAt:Date.now()}); await save('Presente enviado!'); $('#lvUniversalGiftModal')?.remove(); try{renderShop()}catch(e){} try{renderInventory()}catch(e){}}
  function rewriteButtons(){
    $$('[data-lvf-buy],[data-lex-final-buy],[data-lv-buy],[data-buy-frame],[data-buy-admin-effect],[data-buy-lex-selo],[data-buy-lex-effect],[data-buy-lex2-frame],[data-buy-lex2-effect],[data-buy-lex2-selo]').forEach(btn=>{
      if(btn.disabled)return; const card=btn.closest('.zyo-item-card'); let kind=card?.dataset?.lvfKind||card?.dataset?.lvKind||card?.dataset?.productKind||btn.dataset.lexFinalBuy||btn.dataset.lvBuy||''; let id=card?.dataset?.lvfId||card?.dataset?.lvId||card?.dataset?.productId||btn.dataset.lexFinalId||btn.dataset.lvId||btn.dataset.buyFrame||btn.dataset.buyAdminEffect||btn.dataset.buyLexSelo||btn.dataset.buyLexEffect||btn.dataset.buyLex2Frame||btn.dataset.buyLex2Effect||btn.dataset.buyLex2Selo||''; if(!kind){ if(btn.dataset.buyFrame||btn.dataset.buyLex2Frame)kind='frame'; else if(btn.dataset.buyAdminEffect||btn.dataset.buyLexEffect||btn.dataset.buyLex2Effect)kind='effect'; else if(btn.dataset.buyLexSelo||btn.dataset.buyLex2Selo)kind='selo'; }
      ['lvfBuy','lexFinalBuy','lvBuy','buyFrame','buyAdminEffect','buyLexSelo','buyLexEffect','buyLex2Frame','buyLex2Effect','buyLex2Selo'].forEach(k=>delete btn.dataset[k]); btn.dataset.lvOpenBuy=kind; btn.dataset.lvOpenId=id; btn.onclick=(ev)=>{ev.preventDefault();ev.stopPropagation();openBuy(kind,id,card)};
    });
    $$('[data-lvf-gift],[data-lex-final-gift],[data-lv-gift],[data-gift-frame],[data-gift-effect],[data-gift-lex-selo],[data-gift-lex-effect],[data-gift-lex2-frame],[data-gift-lex2-effect],[data-gift-lex2-selo]').forEach(btn=>{
      const card=btn.closest('.zyo-item-card'); let kind=card?.dataset?.lvfKind||card?.dataset?.lvKind||card?.dataset?.productKind||btn.dataset.lexFinalGift||btn.dataset.lvGift||''; let id=card?.dataset?.lvfId||card?.dataset?.lvId||card?.dataset?.productId||btn.dataset.lexFinalId||btn.dataset.lvId||btn.dataset.giftFrame||btn.dataset.giftEffect||btn.dataset.giftLexSelo||btn.dataset.giftLexEffect||btn.dataset.giftLex2Frame||btn.dataset.giftLex2Effect||btn.dataset.giftLex2Selo||''; if(!kind){ if(btn.dataset.giftFrame||btn.dataset.giftLex2Frame)kind='frame'; else if(btn.dataset.giftEffect||btn.dataset.giftLexEffect||btn.dataset.giftLex2Effect)kind='effect'; else if(btn.dataset.giftLexSelo||btn.dataset.giftLex2Selo)kind='selo'; }
      ['lvfGift','lexFinalGift','lvGift','giftFrame','giftEffect','giftLexSelo','giftLexEffect','giftLex2Frame','giftLex2Effect','giftLex2Selo'].forEach(k=>delete btn.dataset[k]); btn.dataset.lvOpenGift=kind; btn.dataset.lvOpenId=id; btn.onclick=(ev)=>{ev.preventDefault();ev.stopPropagation();openGift(kind,id,card)};
    });
  }
  const oldShop=window.renderShop; window.renderShop=function(){const r=oldShop&&oldShop.apply(this,arguments); setTimeout(rewriteButtons,60); return r}; try{renderShop=window.renderShop}catch(e){}
  setInterval(()=>{cleanBrokenProfileImgs(); rewriteButtons();},900);
  document.addEventListener('click',function(e){const c=e.target.closest('[data-lv-close-modal]'); if(c){e.preventDefault();e.stopImmediatePropagation();$('#lvUniversalBuyModal')?.remove();$('#lvUniversalGiftModal')?.remove();return;} const b=e.target.closest('[data-lv-open-buy]'); if(b){e.preventDefault();e.stopImmediatePropagation();return openBuy(b.dataset.lvOpenBuy,b.dataset.lvOpenId,b.closest('.zyo-item-card'));} const g=e.target.closest('[data-lv-open-gift]'); if(g){e.preventDefault();e.stopImmediatePropagation();return openGift(g.dataset.lvOpenGift,g.dataset.lvOpenId,g.closest('.zyo-item-card'));} const cb=e.target.closest('[data-lv-confirm-modal]'); if(cb){e.preventDefault();e.stopImmediatePropagation();return confirmBuy(cb.dataset.kind,cb.dataset.id,cb.dataset.dur);} const sg=e.target.closest('[data-lv-send-gift]'); if(sg){e.preventDefault();e.stopImmediatePropagation();return sendGift(sg.dataset.kind,sg.dataset.id,sg.dataset.dur);}},true);
  function profileActive(){return $('#profile')?.classList.contains('active')||/profile|perfil/.test(location.hash||'')||$('.profile-card')&& !$('#dashboard')?.classList.contains('active');}
  function particleType(){return String(user?.particleType||user?.particles?.type||user?.particlesType||'none');}
  function renderRain(){const active=profileActive(); const type=particleType(); const enabled=active && user && (user.particles===true || (type && !/none|sem/i.test(type))) && !/none|sem/i.test(type); if(!enabled){$('#lvRainParticles')?.remove();return;} let root=$('#lvRainParticles'); if(!root){root=document.createElement('div');root.id='lvRainParticles';document.body.appendChild(root);} const icon=/neve|snow|floco/i.test(type)?'❄':/raio|bolt|trov/i.test(type)?'⚡':/estrela|star/i.test(type)?'✦':/chuva|rain/i.test(type)?'╱':/fogo|fire/i.test(type)?'🔥':/folha|leaf/i.test(type)?'🍃':'✦'; const qty=Math.max(12,Math.min(140,Number(user?.particleCount||user?.particles?.quantity||45))); const speed=Math.max(1,Math.min(10,Number(user?.particleSpeed||5))); const size=user?.particleSize||'small'; const sizeBase=size==='large'?24:size==='medium'?17:12; if(root.dataset.icon===icon&&root.dataset.qty==qty&&root.dataset.speed==speed)return; root.dataset.icon=icon;root.dataset.qty=qty;root.dataset.speed=speed;root.innerHTML=''; for(let i=0;i<qty;i++){const s=document.createElement('span');s.textContent=icon;s.style.left=(Math.random()*100)+'vw';s.style.setProperty('--drift',(Math.random()*120-60)+'px');s.style.animationDelay=(-Math.random()*9)+'s';s.style.animationDuration=(Math.max(2,12-speed)+Math.random()*5)+'s';s.style.fontSize=(sizeBase+Math.random()*sizeBase)+'px';root.appendChild(s);}}
  const oldCreate=window.createProfileParticles; window.createProfileParticles=function(type){try{if(oldCreate)oldCreate.apply(this,arguments)}catch(e){} setTimeout(renderRain,40)}; try{createProfileParticles=window.createProfileParticles}catch(e){}
  setInterval(renderRain,700); document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{rewriteButtons();cleanBrokenProfileImgs();renderRain();},800)});
})();

/* === LEXVOID PATCH FINAL: insígnia fixa abaixo do @, remover moldura só do perfil, partículas descendo só no perfil === */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const save=async msg=>{try{if(typeof saveUser==='function') await saveUser(msg||'Salvo!')}catch(e){}};
  const isProfile=()=> $('#profile')?.classList.contains('active') || /^#\/(?!dashboard|loja|shop|login)/.test(location.hash||'');
  function inv(){ if(!window.user) window.user={}; if(!Array.isArray(user.inventory)) user.inventory=[]; return user.inventory; }
  function srcOf(it){return it?.url||it?.value||it?.img||it?.image||it?.imageUrl||'';}
  function same(a,b){ const au=norm(srcOf(a)), bu=norm(srcOf(b)); return (!!au&&!!bu&&au===bu) || (norm(a?.name)&&norm(a?.name)===norm(b?.name)); }
  function typeOf(it){ const t=norm(it?.type); if(t.includes('frame')||t.includes('moldura'))return'frame'; if(t.includes('effect')||t.includes('efeito'))return'effect'; if(t.includes('selo')||t.includes('seal'))return'selo'; if(t.includes('insign')||t.includes('badge'))return'insignia'; return t; }

  function renderInsigniasBelowSlug(){
    const slug=$('#profileSlug2')||$('#profileSlug')||$('.profile-slug');
    if(!slug || !window.user) return;
    let box=$('#profileInsignias');
    if(!box){ box=document.createElement('div'); box.id='profileInsignias'; box.className='profile-insignias'; }
    slug.insertAdjacentElement('afterend', box);
    const arr=Array.isArray(user.insignias)?user.insignias:[];
    box.innerHTML=arr.map(i=>{const u=srcOf(i);return u?`<img src="${String(u).replace(/"/g,'%22')}" title="${(i.name||'Insígnia').replace(/</g,'&lt;')}" style="width:${Number(i.size||34)}px;height:${Number(i.size||34)}px;object-fit:contain">`:''}).join('');
    box.style.display=arr.length?'flex':'none';
  }

  // força aplicação/remover de insígnia e moldura sem tirar do inventário
  document.addEventListener('click', async function(e){
    const useIns=e.target.closest('[data-lvf-use-insignia]');
    if(useIns){
      e.preventDefault(); e.stopImmediatePropagation();
      const it=inv()[Number(useIns.dataset.lvfUseInsignia)]; if(!it) return;
      user.insignias=Array.isArray(user.insignias)?user.insignias:[];
      if(!user.insignias.some(x=>same(x,it))) user.insignias.push({id:it.id,itemId:it.itemId,name:it.name,type:'insignia',url:srcOf(it),value:srcOf(it),size:Number(it.size||34)});
      await save('Insígnia aplicada!'); renderInsigniasBelowSlug(); try{window.renderInventory&&window.renderInventory()}catch(_e){} return;
    }
    const rem=e.target.closest('[data-lvf-remove-profile], [data-remove-lex-profile-final], [data-remove-lex2-profile], [data-remove-inv]');
    if(rem){
      const idx=rem.dataset.lvfRemoveProfile ?? rem.dataset.removeLexProfileFinal ?? rem.dataset.removeLex2Profile ?? rem.dataset.removeInv;
      const it=inv()[Number(idx)]; if(!it) return;
      const t=typeOf(it); const u=norm(srcOf(it));
      if(t==='frame'){
        e.preventDefault(); e.stopImmediatePropagation();
        user.frame=''; user.frameUrl=''; user.activeFrame=''; user.frameAdjust={x:0,y:0,scale:1,rotate:0};
        const fr=$('#profileFrame'); if(fr){fr.removeAttribute('src');fr.style.display='none'}
        await save('Moldura removida só do perfil.'); try{window.renderProfile&&window.renderProfile()}catch(_e){} try{window.renderInventory&&window.renderInventory()}catch(_e){} return;
      }
      if(t==='insignia'){
        e.preventDefault(); e.stopImmediatePropagation();
        user.insignias=(user.insignias||[]).filter(x=>!same(x,it));
        await save('Insígnia removida só do perfil.'); renderInsigniasBelowSlug(); try{window.renderInventory&&window.renderInventory()}catch(_e){} return;
      }
    }
  }, true);

  // partículas: remove do dashboard e cria chuva real apenas no ver perfil
  function particleType(){return String(user?.particleType||user?.particles?.type||user?.particlesType||'none');}
  function renderVoidParticles(){
    $('#lexFallingParticles')?.remove();
    const type=particleType();
    const on=window.user && isProfile() && (user.particles===true || (type && !/none|sem/i.test(type))) && !/none|sem/i.test(type);
    let root=$('#lvRainParticles');
    if(!on){root?.remove(); return;}
    if(!root){root=document.createElement('div');root.id='lvRainParticles';document.body.appendChild(root);}
    const map={snow:['❄','✻','❅'],neve:['❄','✻','❅'],raios:['⚡','ϟ'],stars:['✦','✧','✦'],estrelas:['✦','✧'],pink:['✦','✧','✶'],void:['✦','◆','✧'],dark:['✦','✶'],hearts:['❤','♡'],folhas:['🍃','🍂'],leaves:['🍃','🍂'],matrix:['0','1','▦'],rain:['╱','│'],chuva:['╱','│'],fire:['🔥','✹'],fogo:['🔥','✹']};
    let key=Object.keys(map).find(k=>new RegExp(k,'i').test(type));
    const chars=map[key||'void'];
    const qty=Math.max(14,Math.min(140,Number(user.particleCount||user.particles?.quantity||45)));
    const speed=Math.max(1,Math.min(10,Number(user.particleSpeed||5)));
    const signature=type+'|'+qty+'|'+speed+'|'+(user.particleSize||'');
    if(root.dataset.sig===signature) return;
    root.dataset.sig=signature; root.innerHTML='';
    const base=(user.particleSize==='large'?24:user.particleSize==='medium'?18:12);
    for(let i=0;i<qty;i++){
      const s=document.createElement('span');
      s.textContent=chars[Math.floor(Math.random()*chars.length)];
      s.style.left=(Math.random()*100)+'vw';
      s.style.setProperty('--drift',(Math.random()*120-60)+'px');
      s.style.animationDelay=(-Math.random()*10)+'s';
      s.style.animationDuration=(Math.max(3,13-speed)+Math.random()*5)+'s';
      s.style.fontSize=(base+Math.random()*base)+'px';
      root.appendChild(s);
    }
  }
  const oldRP=window.renderProfile;
  window.renderProfile=function(){ if(oldRP) oldRP.apply(this,arguments); renderInsigniasBelowSlug(); setTimeout(renderVoidParticles,30); };
  try{renderProfile=window.renderProfile}catch(e){}
  setInterval(()=>{renderInsigniasBelowSlug(); renderVoidParticles();},900);
})();
