(()=>{
  'use strict';
  const root=document.documentElement,hero=document.getElementById('accueil');
  const picture=hero.querySelector('.hero-picture'),heroImage=document.getElementById('hero-image');
  const frieze=document.getElementById('les-coupes'),location=document.getElementById('nous-trouver'),closing=document.getElementById('contact');
  const toggle=document.getElementById('motion-toggle'),key='karim.motion.paused';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(pointer:fine)');
  const connection=navigator.connection;let manual=false;
  try{manual=localStorage.getItem(key)==='1';}catch{}
  let enabled=false,frame=0,intro=[],observer=null,openedOnce=false,pointerX=0,pointerY=0,sketchAsked=false;
  const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,n));
  const span=(n,a,b)=>clamp((n-a)/(b-a));
  const vars=[
    ['--hero-x','--hero-y','--hero-scale','--line-x','--line-y'],
    ['--frieze-x','--frieze-y','--frieze-scale','--wipe','--draw-hero','--draw-frieze'],
    ['--number-y','--skyline-x','--w1','--w2','--w3','--w4','--w5','--teeth'],
    ['--closing-y','--closing-scale','--draw-closing','--dev','--line','--land']
  ];
  const sceneList=[hero,frieze,location,closing];

  function cancelIntro(){intro.forEach(a=>a.cancel());intro=[];}
  function clearMotion(){cancelAnimationFrame(frame);frame=0;cancelIntro();sceneList.forEach((scene,i)=>vars[i].forEach(v=>scene.style.removeProperty(v)));}

  function update(){
    frame=0;if(!enabled||document.hidden)return;
    const h=innerHeight,w=innerWidth,wide=w>700;
    const hr=hero.getBoundingClientRect();
    if(hr.bottom>0&&hr.top<h){
      const p=clamp(-hr.top/hr.height);
      hero.style.setProperty('--hero-x',pointerX+'px');
      hero.style.setProperty('--hero-y',(p*15+pointerY)+'px');
      hero.style.setProperty('--hero-scale',1+p*.012);
      hero.style.setProperty('--line-x',(-pointerX*.5)+'px');
      hero.style.setProperty('--line-y',(-pointerY*.5-p*4)+'px');
      if(p>.035&&intro.length)cancelIntro();
    }
    const f=frieze.getBoundingClientRect();
    if(f.bottom>0&&f.top<h){
      const p=clamp((h-f.top)/(h+f.height));
      frieze.style.setProperty('--frieze-x',wide?((p-.5)*14)+'px':'0px');
      frieze.style.setProperty('--frieze-y',((p-.5)*(wide?12:4))+'px');
      frieze.style.setProperty('--frieze-scale',wide?'1.018':'1.006');
      // The brush crosses the frieze while it rises, done before the scene settles.
      const paint=wide?span(f.top,h*.86,h*.1):span(f.top+f.height,h*1.02,h*.72);
      frieze.style.setProperty('--wipe',paint);
      frieze.style.setProperty('--draw-hero',span(f.top,h,h*.45));
      if(paint>.72)frieze.classList.add('is-written');
    }
    const l=location.getBoundingClientRect();
    if(l.bottom>0&&l.top<h){
      const p=clamp((h-l.top)/(h+l.height));
      location.style.setProperty('--number-y',((p-.5)*10)+'px');
      location.style.setProperty('--skyline-x',((p-.5)*8)+'px');
      frieze.style.setProperty('--draw-frieze',span(l.top,h*1.08,h*.62));
      // The 14 is written stroke by stroke, then the comb teeth come out one at a time.
      const n=span(l.top,h*.9,h*.9-l.height*.92);
      location.style.setProperty('--w1',span(n,0,.13));
      location.style.setProperty('--w2',span(n,.1,.38));
      location.style.setProperty('--w3',span(n,.36,.56));
      location.style.setProperty('--w4',span(n,.54,.66));
      location.style.setProperty('--w5',span(n,.62,.86));
      location.style.setProperty('--teeth',span(n,.82,1));
    }
    const c=closing.getBoundingClientRect();
    if(c.bottom>0&&c.top<h){
      const p=clamp((h-c.top)/(h+c.height));
      closing.style.setProperty('--closing-y',((p-.5)*(wide?18:5))+'px');
      closing.style.setProperty('--closing-scale',wide?'1.018':'1.004');
      // Scroll ends with the closing's bottom on the window's bottom: every range lands on that position.
      const end=Math.min(h-c.height,h*.3),start=h*.92;
      closing.style.setProperty('--draw-closing',span(c.top,h,h*.45));
      closing.style.setProperty('--dev',span(c.top,start,start-(start-end)*.8));
      const line=span(c.top,h*.62,end);
      closing.style.setProperty('--line',span(line,0,.82));
      closing.style.setProperty('--land',span(line,.78,1));
    }
  }
  function request(){if(enabled&&!frame&&!document.hidden)frame=requestAnimationFrame(update);}

  // Pencil line from the saffron seam down to the underline of "c'est le vôtre.", wherever the layout puts it.
  const closingLine=closing.querySelector('.closing-line'),closingTrait=closing.querySelector('.trait-closing');
  function traceLine(){
    const box=closing.getBoundingClientRect();if(!box.width||innerWidth<=700)return;
    const stage=closing.querySelector('.closing-stage').getBoundingClientRect(),s=stage.height/1014;
    const t=closingTrait.getBoundingClientRect(),x=t.left-box.left,y=t.bottom-box.top-t.height*.12;
    const sx=Math.min(1071*s,x-30),sy=135*s;
    closingLine.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);
    closingLine.querySelector('path').setAttribute('d',`M${sx} ${sy}C${sx-78} ${sy+(y-sy)*.46} ${x-130} ${y+11} ${x+3} ${y}`);
  }

  function reveal(){
    if(observer)observer.disconnect();
    if(!enabled||!('IntersectionObserver'in window)){document.querySelectorAll('[data-reveal]').forEach(el=>el.classList.add('is-visible'));frieze.classList.add('is-written');return;}
    observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target);}}),{threshold:.12});
    document.querySelectorAll('[data-reveal]').forEach(el=>observer.observe(el));
  }

  // The graphite plate only loads when it will be seen; the wipe arms itself if the frieze is still below the fold.
  function loadSketch(){
    if(sketchAsked||!enabled)return;sketchAsked=true;
    const plates=[...frieze.querySelectorAll('[data-src]')];
    plates.forEach(img=>{img.src=img.dataset.src;});
    (plates[0].decode?.()??Promise.resolve()).then(()=>{if(enabled&&frieze.getBoundingClientRect().top>innerHeight*.86)frieze.classList.add('has-sketch');request();}).catch(()=>{});
  }

  async function opening(){
    if(openedOnce||!enabled||scrollY>25)return;openedOnce=true;
    await Promise.allSettled([document.fonts?.ready??Promise.resolve(),heroImage.decode?.()??Promise.resolve()]);
    if(!enabled||scrollY>25||!picture.animate)return;
    intro.push(picture.animate([{clipPath:'polygon(0 0,15% 0,0 100%,0 100%)',filter:'grayscale(1)',opacity:.5},{clipPath:'polygon(0 0,100% 0,100% 100%,0 100%)',filter:'grayscale(0)',opacity:1}],{duration:2000,easing:'cubic-bezier(.2,.65,.25,1)'}));
    hero.querySelectorAll('.ink-line path').forEach((path,i)=>intro.push(path.animate([{strokeDashoffset:'1'},{strokeDashoffset:'0'}],{duration:1700,delay:i*120,easing:'ease-out',fill:'backwards'})));
    intro.push(hero.querySelector('h1').animate([{transform:'translateY(14px)',opacity:.45},{transform:'translateY(0)',opacity:1}],{duration:850,delay:160,easing:'ease-out',fill:'backwards'}));
    intro.push(hero.querySelector('.hero-script').animate([{clipPath:'inset(-.2em 100% -.35em -.1em)'},{clipPath:'inset(-.2em -.1em -.35em -.1em)'}],{duration:1050,delay:320,easing:'cubic-bezier(.3,.6,.3,1)',fill:'backwards'}));
    intro.push(hero.querySelector('.trait-hero').animate([{clipPath:'inset(-20% 100% -20% 0)'},{clipPath:'inset(-20% -2% -20% 0)'}],{duration:800,delay:1150,easing:'ease-out',fill:'backwards'}));
    Promise.allSettled(intro.map(a=>a.finished)).then(()=>{intro=[];});
  }

  function setMotion(){
    const constrained=reduced.matches||Boolean(connection?.saveData);
    enabled=!manual&&!constrained;root.classList.toggle('js-motion',enabled);root.classList.toggle('motion-off',!enabled);
    toggle.disabled=constrained;toggle.setAttribute('aria-pressed',String(!enabled));toggle.setAttribute('aria-label',constrained?'Animations réduites selon vos préférences':enabled?'Mettre en pause les animations':'Reprendre les animations');toggle.querySelector('[aria-hidden]').textContent=enabled?'Ⅱ':'▷';
    clearMotion();reveal();if(enabled){request();opening();loadSketch();}
  }

  root.classList.add('js');setMotion();traceLine();
  document.fonts?.ready.then(traceLine);
  toggle.addEventListener('click',()=>{manual=enabled;try{localStorage.setItem(key,manual?'1':'0');}catch{}setMotion();});
  reduced.addEventListener?.('change',setMotion);connection?.addEventListener?.('change',setMotion);
  addEventListener('scroll',request,{passive:true});
  addEventListener('resize',()=>{traceLine();request();},{passive:true});
  addEventListener('load',traceLine);
  hero.addEventListener('pointermove',event=>{if(!enabled||!fine.matches||innerWidth<=800)return;const r=hero.getBoundingClientRect();pointerX=((event.clientX-r.left)/r.width-.5)*6;pointerY=((event.clientY-r.top)/r.height-.5)*6;request();},{passive:true});
  hero.addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;request();},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;cancelIntro();}else request();});
  document.querySelectorAll('.mobile-menu nav a').forEach(a=>a.addEventListener('click',()=>a.closest('details').removeAttribute('open')));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.mobile-menu[open]').forEach(el=>{el.removeAttribute('open');el.querySelector('summary').focus();});});

  // Hovering a word keeps its field in colour and sends the other two back to pencil.
  document.querySelectorAll('[data-service]').forEach(word=>{
    const on=()=>{frieze.dataset.focus=word.dataset.service;},off=()=>{delete frieze.dataset.focus;};
    word.addEventListener('pointerenter',on);word.addEventListener('pointerleave',off);word.addEventListener('focus',on);word.addEventListener('blur',off);
  });

  const dialog=document.getElementById('service-dialog'),tabs=[...document.querySelectorAll('[data-tab]')];let returnFocus=null;
  function selectService(name,focus=false){const item=window.KARIM.services[name];if(!item)return;document.getElementById('service-title').textContent=item.title;document.getElementById('service-description').textContent=item.description;document.getElementById('service-panel').setAttribute('aria-labelledby','tab-'+name);tabs.forEach(tab=>{const active=tab.dataset.tab===name;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus();});}
  document.querySelectorAll('[data-service]').forEach(a=>a.addEventListener('click',e=>{if(e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||!dialog.showModal)return;e.preventDefault();returnFocus=a;selectService(a.dataset.service);dialog.showModal();document.getElementById('tab-'+a.dataset.service).focus();}));
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectService(tab.dataset.tab));tab.addEventListener('keydown',e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();selectService(tabs[n].dataset.tab,true);});});
  document.getElementById('service-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
  dialog.addEventListener('close',()=>returnFocus?.focus());
})();
