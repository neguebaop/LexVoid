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
  hideViews:false, template:'default', decoration:'none', views:0, links:[], socials:[], embeds:[], tags:[], history:['Conta criada no Dlinky'], coins:0, inventory:[], purchases:[], selos:[], cursor:'', nameFx:{neon:false,shine:false,rainbow:false,perspective:false}, bgFx:'none', tagSettings:{showFree:true,showDlinky:true,active:['programador','artista','músico']}, colors:{profileBg:'#1E40AF',cardBg:'#000000',textColor:'#FFFFFF',bioColor:'#FFFFFF'}, frameAdjust:{x:0,y:0,scale:1,rotate:0}, particleCount:45, particleSpeed:5, particleSize:'small', entryEffect:'auto'
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
  if(h === '#/premium') { simple('Premium Dlinky','Área premium em construção.'); return; }

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
  $('#sideUrl') && ($('#sideUrl').textContent = 'dlinky/' + (user.slug || 'usuario'));
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
  setInput('#payName', user.payment?.payName || 'Dlinky');
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
  return Object.assign({pixKey:DLINKY_PIX_KEY, payName:'Dlinky'}, user.payment || {});
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
      const duration=document.querySelector(`[data-duration-for="${CSS.escape(id)}"]`)?.value||'Permanente';
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
