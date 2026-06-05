document.addEventListener('DOMContentLoaded', () => {
  const results = document.getElementById('results');
  const topBox = document.getElementById('top-results');
  const titleInput = document.getElementById('title-input');
  const authorSelect = document.getElementById('author-select');
  const dateFrom = document.getElementById('date-from');
  const dateTo = document.getElementById('date-to');

  // ФУНКЦИЯ ЗАГРУЗКИ АВТОРОВ
  const loadAuthors = () => {
    fetch('/api/authors')
      .then(r => r.json())
      .then(authors => {
        // Очищаем список и добавляем пункт по умолчанию
        authorSelect.innerHTML = '<option value="">Выберите автора</option>';
        authors.forEach(a => {
          const opt = document.createElement('option');
          opt.value = a; opt.textContent = a;
          authorSelect.appendChild(opt);
        });
      });
  };

  // Загружаем авторов при старте
  loadAuthors();

  // ФУНКЦИЯ ЗАГРУЗКИ СПИСКА СТАТЕЙ
  const loadArticles = async (params = '') => {
    topBox.style.display = 'none';
    try {
      const res = await fetch(`/api/articles${params}`);
      const data = await res.json();
      if (!data.length) { results.innerHTML = '<p>Статьи не найдены.</p>'; return; }
      
      results.innerHTML = `<ul>${data.map(a => `
        <li>
          <span><strong>${a.num}.</strong> ${a.title} | <em>${a.authors}</em> | ${a.date}</span>
          <span>
            <button class="icon-btn" title="Открыть" onclick="window.location.href='article.html?id=${a._id}'">👁️</button>
            <button class="icon-btn" title="Удалить" onclick="deleteArticle('${a._id}')">🗑️</button>
          </span>
        </li>`).join('')}</ul>`;
    } catch { results.innerHTML = '<p>Ошибка загрузки.</p>'; }
  };

  // УДАЛЕНИЕ СТАТЬИ
  window.deleteArticle = async (id) => {
    if (!confirm('Удалить статью?')) return;
    try {
      await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      loadArticles();
    } catch { alert('Ошибка удаления'); }
  };

  // СОЗДАНИЕ СТАТЬИ 
  document.getElementById('btn-create').onclick = async () => {
    const title = prompt('Название статьи:');
    if (!title) return;
    const authors = prompt('Авторы (через запятую):');
    const content = prompt('Содержимое статьи:');
    if (!authors || !content) return alert('Заполните все поля');
    
    try {
      await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, authors, content, tags: '', reviews: [] })
      });
      loadArticles(); // Обновляем список статей
      loadAuthors();  // Обновляем список авторов (если добавился новый)
      alert('Статья создана!');
    } catch { alert('Ошибка создания'); }
  };

  // === ТОП СТАТЕЙ (Пункт 3.4) ===
  document.getElementById('btn-top').onclick = async () => {
    try {
      const res = await fetch('/api/articles/top');
      const data = await res.json();
      topBox.innerHTML = `<h4>🏆 Топ-5 по рейтингу</h4>` + 
        data.map((a, i) => `<div style="margin:0.3rem 0;"><strong>${i+1}.</strong> ${a.title} | Рейтинг: ${a.avgRating} | Отзовов: ${a.reviewCount}</div>`).join('');
      topBox.style.display = 'block';
    } catch { alert('Ошибка загрузки топа (см. консоль)'); }
  };

  // === ОБРАБОТЧИКИ КНОПОК ===
  document.getElementById('btn-list').onclick = () => loadArticles();
  document.getElementById('btn-title').onclick = () => loadArticles(`?titleSearch=${encodeURIComponent(titleInput.value.trim())}`);
  document.getElementById('btn-author').onclick = () => {
    const v = authorSelect.value; if (!v) return alert('Выберите автора');
    loadArticles(`?authorSearch=${encodeURIComponent(v)}`);
  };
  document.getElementById('btn-date').onclick = () => {
    if (!dateFrom.value || !dateTo.value) return alert('Укажите обе даты');
    loadArticles(`?dateFrom=${dateFrom.value}&dateTo=${dateTo.value}`);
  };

  // Начальная загрузка
  loadArticles();
});