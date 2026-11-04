/* NORDA theme control. The existing site script continues to own language,
   ticketing, contact, cart and scroll-reveal behaviour. */
(function(){
  var root=document.documentElement;
  var tools=document.querySelector('.tools');
  if(!tools)return;
  var btn=document.createElement('button');
  btn.type='button';
  btn.className='theme-toggle';
  btn.id='themeToggle';
  btn.setAttribute('aria-pressed','false');
  var labels={
    ar:{light:'تفعيل الوضع الفاتح',dark:'تفعيل الوضع الداكن'},
    en:{light:'Switch to light theme',dark:'Switch to dark theme'},
    fr:{light:'Activer le thème clair',dark:'Activer le thème sombre'}
  };
  function sync(){
    var dark=root.dataset.theme==='dark';
    var lang=(root.lang||'ar').slice(0,2);
    var copy=labels[lang]||labels.en;
    btn.setAttribute('aria-pressed',dark?'true':'false');
    btn.setAttribute('aria-label',dark?copy.light:copy.dark);
    btn.title=dark?copy.light:copy.dark;
    btn.innerHTML=dark
      ?'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>'
      :'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.6 8.6 0 1 0 20.2 15.2Z"/></svg>';
  }
  var lang=document.getElementById('langBtn');
  tools.insertBefore(btn,lang||tools.firstChild);
  btn.addEventListener('click',function(){
    root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';
    try{localStorage.setItem('norda_theme',root.dataset.theme)}catch(e){}
    sync();
  });
  sync();
  window.addEventListener('storage',function(e){
    if(e.key==='norda_theme'&&e.newValue){
      root.dataset.theme=e.newValue==='dark'?'dark':'light';
      sync();
    }
  });
})();