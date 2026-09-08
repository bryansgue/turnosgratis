/* TurnosGratis — renderizador compartido. Config por página en window.GAME. */
(function(){
var G = window.GAME || {};
var ICO={
  coin:'<svg width="__S__" height="__S__" viewBox="0 0 24 24" fill="none"><path d="M12 6v12M9 8.5c0-1.1 1.2-1.8 3-1.8s3 .8 3 1.7c0 2.5-6 1.5-6 4 0 1.1 1.3 1.8 3 1.8s3-.8 3-1.7" stroke="#8a5a12" stroke-width="1.7" stroke-linecap="round"/></svg>',
  dice:'<svg width="__S__" height="__S__" viewBox="0 0 24 24" fill="none"><rect x="5" y="5" width="14" height="14" rx="3.5" stroke="#8a5a12" stroke-width="1.7"/><circle cx="9.2" cy="9.2" r="1.3" fill="#8a5a12"/><circle cx="14.8" cy="14.8" r="1.3" fill="#8a5a12"/><circle cx="14.8" cy="9.2" r="1.3" fill="#8a5a12"/><circle cx="9.2" cy="14.8" r="1.3" fill="#8a5a12"/></svg>',
  fire:'<svg width="__S__" height="__S__" viewBox="0 0 24 24" fill="none"><path d="M12 3c1 3-1.5 4-1.5 6.5C10.5 11 11 12 12 12s1.8-1 1.5-2.5C15.5 11 17 13 17 15.5A5 5 0 1 1 7 15.5c0-2 1-3.5 2.2-5C9 12 9.5 13 10.5 13" stroke="#8a5a12" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  clock:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v4l2.5 1.5" stroke-linecap="round"/></svg>',
  menu:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a89e8a" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  shield:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#57cf88" stroke-width="1.8"><path d="M12 3l7 3v5c0 4.4-3 8-7 10-4-2-7-5.6-7-10V6l7-3z"/><path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  check:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#57cf88" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M8.5 12l2.3 2.3L15.5 9.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bolt:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f6c53f" stroke-width="1.8"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" stroke-linejoin="round"/></svg>',
  copy:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#211803" stroke-width="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8" stroke-linecap="round"/></svg>'
};
function ic(name,s){return (ICO[name]||ICO.coin).replace(/__S__/g,s||24);}
function $(id){return document.getElementById(id);}
function set(id,html){var e=$(id);if(e)e.innerHTML=html;}
function txt(id,t){var e=$(id);if(e)e.textContent=t;}

var GI=G.icon||'coin';
set('brand-coin',ic(GI,16));
set('foot-coin',ic(GI,13));
set('menu-ico',ICO.menu);

// TRUST (según tipo)
var prov=G.provider||'el juego';
if(G.type==='code'){
  set('trust',
    '<div class="t">'+ICO.shield+'<span>Códigos <b>oficiales</b> de '+prov+' — nunca piden tu contraseña</span></div>'+
    '<div class="t">'+ICO.check+'<span><b>Actualizados a diario</b> — sacamos los vencidos</span></div>'+
    '<div class="t">'+ICO.bolt+'<span>Se canjean en el <b>sitio oficial</b> — sin apps raras</span></div>');
}else{
  set('trust',
    '<div class="t">'+ICO.shield+'<span>Enlaces <b>oficiales</b> de '+prov+' — nunca piden tu contraseña</span></div>'+
    '<div class="t">'+ICO.check+'<span><b>Verificados</b> uno por uno — sacamos los vencidos</span></div>'+
    '<div class="t">'+ICO.bolt+'<span><b>Sin registro</b> ni descargas — un toque y listo</span></div>');
}

function hace(iso){var s=Math.floor((Date.now()-new Date(iso))/60000);if(s<1)return 'recién';if(s<60)return 'hace '+s+' min';var h=Math.floor(s/60);if(h<24)return 'hace '+h+' h';return 'hace '+Math.floor(h/24)+' d';}
function expira(dstr){var y=+dstr.slice(0,4),m=+dstr.slice(4,6)-1,d=+dstr.slice(6,8);var exp=new Date(Date.UTC(y,m,d));exp.setUTCDate(exp.getUTCDate()+3);var hrs=Math.floor((exp-Date.now())/3600000);if(hrs<=0)return{t:'vence pronto',soon:true};if(hrs<24)return{t:'vence en '+hrs+' h',soon:true};return{t:'vence en '+Math.ceil(hrs/24)+' días',soon:false};}
function hoyYMD(){return new Date().toISOString().slice(0,10).replace(/-/g,'');}
function esc(s){return String(s).replace(/[<>&"]/g,function(c){return{'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c];});}

fetch('/data/'+G.key+'.json?t='+Date.now()).then(function(r){return r.json();}).then(function(d){
  var items=d.items||[];
  txt('fresh-txt','Actualizado '+hace(d.updated_at));
  txt('sec-cnt',(items.length)+' activas');
  var grid=$('grid'),featW=$('feat-wrap');
  // STATS
  if(G.type==='code'){
    set('stats','<div class="stat"><b>'+items.length+'</b><span>códigos hoy</span></div>'+
      '<div class="stat"><b>1</b><span>toque para copiar</span></div>'+
      '<div class="stat ok"><b>100%</b><span>al día</span></div>');
  }else{
    var tot=items.reduce(function(a,l){return a+(l.spins||0);},0);
    var s2=tot>0?('+'+(tot>=1000?(tot/1000).toFixed(1).replace('.0','')+'k':tot)):items.length;
    set('stats','<div class="stat"><b>'+items.length+'</b><span>recompensas</span></div>'+
      '<div class="stat"><b>'+s2+'</b><span>'+(G.unit||'premios')+' hoy</span></div>'+
      '<div class="stat ok"><b>100%</b><span>verificadas</span></div>');
  }
  if(!items.length){if(featW)featW.innerHTML='';grid.innerHTML='<div class="empty">No hay recompensas activas ahora mismo. Volvé en un rato 🙂</div>';return;}

  if(G.type==='code'){
    // CTA de canje + grid de códigos con "Copiar"
    if(featW){featW.innerHTML='<div class="redeem"><span>Copiá un código y canjealo en el '+(G.redeemName||'sitio oficial')+
      '</span><a class="go" href="'+(G.redeemUrl||'#')+'" target="_blank" rel="noopener nofollow" style="width:auto;padding:11px 20px">Ir a canjear</a></div>';}
    grid.innerHTML=items.map(function(it,i){
      var code=esc(it.code||'');
      return '<div class="tile code">'+(i<3?'<span class="nb">NUEVO</span>':'')+
        '<div class="co">'+ic(GI,25)+'</div>'+
        '<div class="cd">'+code+'</div>'+
        '<button class="go" data-code="'+code+'">'+ICO.copy+' Copiar</button></div>';
    }).join('');
    grid.addEventListener('click',function(e){
      var b=e.target.closest('button[data-code]');if(!b)return;
      var c=b.getAttribute('data-code');
      (navigator.clipboard&&navigator.clipboard.writeText(c)||Promise.reject()).then(function(){
        b.classList.add('copied');b.innerHTML='✓ ¡Copiado!';setTimeout(function(){b.classList.remove('copied');b.innerHTML=ICO.copy+' Copiar';},1600);
      }).catch(function(){
        var ta=document.createElement('textarea');ta.value=c;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');}catch(_){}document.body.removeChild(ta);
        b.classList.add('copied');b.innerHTML='✓ ¡Copiado!';setTimeout(function(){b.classList.remove('copied');b.innerHTML=ICO.copy+' Copiar';},1600);
      });
    });
    return;
  }

  // LINK type (Coin Master / Monopoly GO)
  var hoy=hoyYMD(),links=items.slice();
  var fi=0,mx=-1;links.forEach(function(l,i){if((l.spins||0)>mx){mx=l.spins||0;fi=i;}});
  var claim=G.claim||'Reclamar',unit=G.unit||'premios';
  if(featW){
    var f=links.splice(fi,1)[0],fe=f.date?expira(f.date):{t:'',soon:false};
    featW.innerHTML='<div class="feat"><div class="co">'+ic(GI,32)+'</div>'+
      '<div style="flex:1;min-width:0"><div class="k">★ Mega recompensa'+(f.date===hoy?' · nueva':'')+'</div>'+
      '<div class="amt">'+(f.spins?f.spins:('Más '+unit))+' <small>'+(f.spins?unit:'gratis')+'</small></div>'+
      (fe.t?'<div class="exp '+(fe.soon?'soon':'ok')+'">'+ICO.clock+' '+fe.t+'</div>':'')+'</div>'+
      '<a class="go" href="'+f.url+'" target="_blank" rel="noopener nofollow" style="width:auto;align-self:stretch;display:flex;align-items:center">'+claim+'</a></div>';
  }
  grid.innerHTML=links.map(function(l){
    var e=l.date?expira(l.date):{t:'',soon:false},nuevo=l.date===hoy;
    var amt=l.spins?('<div class="amt">'+l.spins+'</div><div class="u">'+unit+' gratis</div>'):('<div class="amt txt">'+unit.charAt(0).toUpperCase()+unit.slice(1)+'</div><div class="u">gratis</div>');
    return '<div class="tile'+(nuevo?' new':'')+'">'+(nuevo?'<span class="nb">NUEVO</span>':'')+
      '<div class="co">'+ic(GI,25)+'</div>'+amt+
      (e.t?'<div class="exp '+(e.soon?'soon':'ok')+'">'+ICO.clock+' '+e.t+'</div>':'<div class="exp ok" style="visibility:hidden">·</div>')+
      '<a class="go" href="'+l.url+'" target="_blank" rel="noopener nofollow">'+claim+'</a></div>';
  }).join('');
}).catch(function(){var g=$('grid');if(g)g.innerHTML='<div class="empty">No se pudieron cargar. Recargá la página.</div>';});
})();
