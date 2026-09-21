const hover = window.matchMedia('(hover: hover) and (pointer: fine)');

document.querySelectorAll('.art-card').forEach(card => {
  const button = card.querySelector('.art-toggle');
  const front = card.querySelector('.art-front');
  const back = card.querySelector('.art-back');
  const show = flipped => {
    card.classList.toggle('is-flipped', flipped);
    button.setAttribute('aria-pressed', String(flipped));
    front.setAttribute('aria-hidden', String(flipped));
    back.setAttribute('aria-hidden', String(!flipped));
  };
  card.addEventListener('pointerenter', event => {
    if (hover.matches && event.pointerType !== 'touch') show(true);
  });
  card.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'touch') show(false);
  });
  button.addEventListener('click', () => show(!card.classList.contains('is-flipped')));
  button.addEventListener('keydown', event => {
    if (event.key === 'Escape') show(false);
  });
  button.addEventListener('blur', () => show(false));
});
