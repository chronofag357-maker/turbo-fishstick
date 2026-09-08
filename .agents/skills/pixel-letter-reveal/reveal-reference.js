  // Raster alpha mask: explicitly repaint revealed cells, avoiding SVG mask repaint bugs.
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(!reduced.matches){
    const maskCanvas=document.createElement('canvas');
    maskCanvas.width=96;maskCanvas.height=32;
    const ctx=maskCanvas.getContext('2d');
    const cells=Array.from({length:96*32},(_,i)=>i);
    for(let i=cells.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cells[i],cells[j]]=[cells[j],cells[i]];}
    let shown=0,frame=0,startTime=null;
    function paint(){const url='url('+maskCanvas.toDataURL()+')';brand.style.maskImage=url;brand.style.webkitMaskImage=url;}
    brand.style.maskSize='100% 100%';brand.style.webkitMaskSize='100% 100%';
    paint();glint.style.visibility='hidden';brand.classList.add('is-assembling');terminal.classList.add('is-assembling');
    function finish(){
      cancelAnimationFrame(frame);brand.style.maskImage='';brand.style.webkitMaskImage='';
      brand.classList.remove('is-assembling');glint.style.visibility='';
      terminal.classList.remove('is-assembling');edgeSize.disconnect();edge.remove();
      // Start a fresh animation timeline at completion, not mid-cycle from page load.
      glint.style.animation='none';
      void glint.offsetWidth;
      if(!reduced.matches)glint.style.animation='welcome-contour-glint 3s 0s ease-in-out infinite both';
      reduced.removeEventListener('change',onChange);
    }
    function onChange(){if(reduced.matches)finish();}
    reduced.addEventListener('change',onChange);
    function tick(now){
      if(startTime===null)startTime=now;
      const target=Math.min(cells.length,Math.floor((now-startTime)/5000*cells.length));
      for(const path of edge.children)path.style.strokeDashoffset=String(100-100*target/cells.length);
      if(target>shown){ctx.fillStyle='white';while(shown<target){const p=cells[shown++];ctx.fillRect(p%96,Math.floor(p/96),1,1);}paint();}
      if(shown===cells.length)finish();else frame=requestAnimationFrame(tick);
    }
    document.fonts.ready.then(()=>{if(!reduced.matches)frame=requestAnimationFrame(tick);});
  }else{edgeSize.disconnect();edge.remove();}
