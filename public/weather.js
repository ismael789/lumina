(() => {
  const form = document.getElementById('clima-form');
  const input = document.getElementById('ciudad-clima');
  const estado = document.getElementById('clima-estado');
  const result = document.getElementById('clima-result');
  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const ciudad = input.value.trim();
    if (!ciudad) { estado.textContent = 'Escribe una ciudad.'; return; }
    estado.textContent = 'Consultando clima…'; result.hidden = true;
    try {
      const response = await fetch('/api/clima?ciudad=' + encodeURIComponent(ciudad));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo consultar el clima.');
      result.innerHTML = '<img src="https://openweathermap.org/img/wn/' + encodeURIComponent(data.icono) + '@2x.png" alt=""><div><div class="clima-temp">' + esc(data.temperatura) + ' °C</div><div>' + esc(data.ciudad) + ', ' + esc(data.pais) + ' · ' + esc(data.descripcion) + '</div><div class="clima-meta">Sensación ' + esc(data.sensacion) + ' °C · Humedad ' + esc(data.humedad) + '% · Viento ' + esc(data.viento) + ' km/h</div></div>';
      result.hidden = false; estado.textContent = 'Información actualizada.';
    } catch (error) { estado.textContent = error.message; }
  });
})();
