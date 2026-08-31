/*
 * Lightweight visual effects shared by the casino games — plain canvas +
 * CSS, no external library. Keeps the Mini App fast to load in Telegram's
 * WebView instead of pulling in a full game engine for a confetti burst.
 */

function burstConfetti(count = 26) {
  const canvas = document.createElement("canvas");
  canvas.className = "fx-confetti-canvas";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const colors = ["#3ddc84", "#6ab3f3", "#ffd166", "#ff6b6b", "#c77dff"];
  const originX = canvas.width / 2;
  const originY = canvas.height / 3;

  const particles = Array.from({ length: count }, () => ({
    x: originX,
    y: originY,
    vx: (Math.random() - 0.5) * 10,
    vy: -Math.random() * 8 - 4,
    size: 4 + Math.random() * 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 0.4,
    life: 0,
  }));

  const gravity = 0.35;
  const maxLife = 70;

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      if (p.life >= maxLife) continue;
      alive = true;
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;
      p.life += 1;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - p.life / maxLife);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
    if (alive) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(frame);
}

// Shows "+120" (or any short text) floating up and fading above the given
// element — used right where a win happened (balance card, a box, a reel).
function floatingText(anchorEl, text, variant) {
  const rect = anchorEl.getBoundingClientRect();
  const node = document.createElement("div");
  node.className = `fx-float fx-float-${variant || "good"}`;
  node.textContent = text;
  node.style.left = `${rect.left + rect.width / 2}px`;
  node.style.top = `${rect.top}px`;
  document.body.appendChild(node);
  node.addEventListener("animationend", () => node.remove());
}
