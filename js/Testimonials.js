(() => {
  const root = document.getElementById('testimonial-carousel');
  if (!root) return;

  const viewport = root.querySelector('.viewport');
  const track = root.querySelector('.track');
  const cards = Array.from(root.querySelectorAll('.card'));
  // navigation removed (auto only)

  const state = {
    index: 0,
    cardGap: 24,
    cardWidth: 280,
  };

  function measure() {
    const style = getComputedStyle(cards[0]);
    state.cardWidth = cards[0].getBoundingClientRect().width;
    state.cardGap = Number.parseFloat(style.marginRight || '24') || 24; // fallback
  }

  function centerIndexFromOffset(offsetPx) {
    const viewportWidth = viewport.getBoundingClientRect().width;
    const centerX = viewportWidth / 2;
    const cardFull = state.cardWidth + 24; // approximate with css gap
    const relative = centerX + offsetPx;
    const index = Math.round(relative / cardFull) - 1; // map to nearest card
    return Math.max(0, Math.min(cards.length - 1, index));
  }

  function applyTransform(offsetPx) {
    track.style.transform = `translate3d(${offsetPx}px,0,0)`;
  }

  function updateCenterByPosition() {
    const viewportRect = viewport.getBoundingClientRect();
    const viewportCenter = viewportRect.left + viewportRect.width / 2;
    let best = { el: null, dist: Infinity };
    state.allCards.forEach((card) => {
      const r = card.getBoundingClientRect();
      const center = r.left + r.width / 2;
      const d = Math.abs(center - viewportCenter);
      if (d < best.dist) best = { el: card, dist: d };
    });
    state.allCards.forEach((card) => {
      if (card === best.el) {
        if (!card.classList.contains('is-center')) {
          card.classList.add('is-center');
          card.classList.remove('animate');
          void card.offsetWidth;
          card.classList.add('animate');
        }
      } else {
        card.classList.remove('is-center', 'animate');
      }
    });
  }

  function init() {
    measure();
    // duplicate head and tail for seamless loop
    const cloneHead = cards.map(c => c.cloneNode(true));
    const cloneTail = cards.map(c => c.cloneNode(true));
    cloneHead.forEach(n => track.appendChild(n));
    cloneTail.reverse().forEach(n => track.insertBefore(n, track.firstChild));

    state.allCards = Array.from(track.querySelectorAll('.card'));

    // start offset so that we begin at the original first card
    const cardFull = state.cardWidth + 24;
    state.offset = -(cards.length * cardFull);
    applyTransform(state.offset);
    updateCenterByPosition();
  }

  // disable user control: no buttons, no click to center

  // resize handler
  window.addEventListener('resize', () => {
    measure();
    applyTransform();
  });

  init();

  // smooth continuous auto-scroll
  const SPEED = 40; // px per second
  let last = performance.now();
  function loop(now){
    const dt = (now - last) / 1000; // seconds
    last = now;
    const cardFull = state.cardWidth + 24;
    state.offset -= SPEED * dt; // move left

    // wrap seamlessly
    const maxShift = cardFull * cards.length;
    if (state.offset <= -(maxShift * 2)) {
      state.offset += maxShift;
    }
    applyTransform(state.offset);
    updateCenterByPosition();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();


