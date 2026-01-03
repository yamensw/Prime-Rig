/* Prime Rig — liquid glass interactions (no libraries) */
(function(){
  const $ = (sel, el=document)=> el.querySelector(sel);
  const $$ = (sel, el=document)=> Array.from(el.querySelectorAll(sel));

  // Smooth anchor scrolling
  $$('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const id = a.getAttribute('href');
      if(!id || id === '#') return;
      const target = document.querySelector(id);
      if(!target) return;
      e.preventDefault();
      target.scrollIntoView({behavior: 'smooth', block:'start'});
      history.replaceState(null, '', id);
    });
  });

  // Active nav highlight
  const sections = $$('section[id]');
  const navLinks = $$('.nav-links a[href^="#"]');
  const linkById = new Map(navLinks.map(a => [a.getAttribute('href').slice(1), a]));
  const obsNav = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        navLinks.forEach(a=>a.classList.remove('active'));
        const id = entry.target.id;
        const a = linkById.get(id);
        if(a) a.classList.add('active');
      }
    });
  }, { rootMargin: "-40% 0px -55% 0px", threshold: 0.01 });
  sections.forEach(s=>obsNav.observe(s));

  // Hero headline stagger (wrap words)
  const title = $('.hero-title');
  if(title && !title.dataset.staggered){
    const raw = (title.textContent || '').trim();
    const words = raw.split(/\s+/).filter(Boolean);
    title.textContent = '';
    words.forEach((w,i)=>{
      const span = document.createElement('span');
      span.textContent = w;
      span.style.opacity = '0';
      span.style.filter = 'blur(8px)';
      span.style.transform = 'translateY(14px)';
      span.style.display = 'inline-block';
      span.style.willChange = 'transform, opacity, filter';
      title.appendChild(span);
      if(i < words.length - 1) title.appendChild(document.createTextNode(' '));
      requestAnimationFrame(()=>{
        setTimeout(()=>{
          span.style.transition = 'opacity 520ms var(--ease-out), transform 520ms var(--ease-out), filter 620ms var(--ease-out)';
          span.style.opacity = '1';
          span.style.filter = 'blur(0px)';
          span.style.transform = 'translateY(0px)';
        }, 60 + i*70);
      });
    });
    title.dataset.staggered = "true";
  }

  // Scroll reveal
  const reveals = $$('.reveal-on-scroll');
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  reveals.forEach(el=>obs.observe(el));

  // Button effects: ripple + sheen + micro bounce
  function ensureSheen(btn){
    if(btn.querySelector('.sheen')) return;
    const sheen = document.createElement('span');
    sheen.className = 'sheen';
    btn.appendChild(sheen);
  }

  function ripple(btn, x, y){
    const r = document.createElement('span');
    r.className = 'ripple';
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 0.8;
    r.style.width = r.style.height = size + 'px';
    r.style.left = (x - rect.left - size/2) + 'px';
    r.style.top = (y - rect.top - size/2) + 'px';
    btn.appendChild(r);
    r.addEventListener('animationend', ()=> r.remove(), {once:true});
  }

  $$('.btn').forEach(btn=>{
    ensureSheen(btn);

    btn.addEventListener('pointerdown', (e)=>{
      // ripple from click point
      ripple(btn, e.clientX, e.clientY);

      // sheen slide
      btn.classList.remove('sheen-play');
      void btn.offsetWidth; // restart animation
      btn.classList.add('sheen-play');
      setTimeout(()=>btn.classList.remove('sheen-play'), 500);

      // micro-bounce (snappy)
      btn.animate(
        [
          { transform: getComputedStyle(btn).transform },
          { transform: 'translateY(0px) scale(0.985)' },
          { transform: 'translateY(-1px) scale(1.01)' },
          { transform: 'translateY(0px) scale(1)' }
        ],
        { duration: 260, easing: 'cubic-bezier(.2,.9,.2,1)' }
      );
    });
  });

  // Contact form -> mailto (client-side)
  const form = $('#demoForm');
  if(form){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = $('#name').value.trim();
      const company = $('#company').value.trim();
      const email = $('#email').value.trim();
      const message = $('#message').value.trim();

      const subject = encodeURIComponent('Prime Rig — Demo Request');
      const body = encodeURIComponent(
        `Name: ${name}\nCompany: ${company}\nEmail: ${email}\n\nMessage:\n${message}\n`
      );
      window.location.href = `mailto:contact@prime-rig.com?subject=${subject}&body=${body}`;
    });
  }

  // Attempt autoplay: ensure muted + playsinline
  const v = $('#heroVideo');
  if(v){
    v.muted = true;
    v.playsInline = true;
    const play = ()=> v.play().catch(()=>{ /* user gesture required */ });
    // try now and on first interaction
    play();
    window.addEventListener('pointerdown', play, {once:true});
  }
})();
