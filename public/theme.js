(() => {
  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.type = 'image/svg+xml';
  favicon.href = 'favicon.svg?v=2';
  document.head.appendChild(favicon);

  const key = 'lumina-theme';
  const saved = localStorage.getItem(key);
  const theme = saved === 'light' || saved === 'navy' ? saved : 'navy';
  document.documentElement.dataset.theme = theme;

  const button = document.createElement('button');
  button.className = 'theme-toggle';
  button.type = 'button';
  button.setAttribute('aria-label', 'Cambiar tema');

  const update = () => {
    const isLight = document.documentElement.dataset.theme === 'light';
    button.textContent = isLight ? '☾' : '☀';
    button.title = isLight ? 'Cambiar al tema azul marino' : 'Cambiar al tema blanco';
  };

  const searchForm = document.createElement('form');
  searchForm.className = 'nav-search';
  searchForm.innerHTML = '<input name="q" type="search" maxlength="80" placeholder="Buscar libros…" aria-label="Buscar libros"><button type="submit" aria-label="Buscar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path stroke-linecap="round" d="m20 20-4-4"></path></svg></button>';
  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = searchForm.elements.q.value.trim();
    window.location.href = 'libros.html' + (query ? '?q=' + encodeURIComponent(query) : '');
  });

  button.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'navy' : 'light';
    document.documentElement.dataset.theme = next;
    localStorage.setItem(key, next);
    update();
  });

  const nav = document.querySelector('nav');
  if (nav) { nav.appendChild(searchForm); nav.appendChild(button); }
  update();
})();
