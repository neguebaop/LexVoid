
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
