
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
