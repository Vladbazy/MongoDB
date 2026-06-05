document.addEventListener('DOMContentLoaded', () => {
  const results = document.getElementById('results');
  const titleInput = document.getElementById('title-input');
  const authorSelect = document.getElementById('author-select');

  // Загрузка авторов в выпадающий список
  fetch('/api/authors')
    .then(r => r.json())
    .then(authors => {
      authors.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a; opt.textContent = a;
        authorSelect.appendChild(opt);
      });
    });

  // Универсальная функция запроса
  const loadArticles = async (params = '') => {
    try {
      const res = await fetch(`/api/articles${params}`);
      const data = await res.json();
      if (!data.length) {
        results.innerHTML = '<p>Статьи не найдены.</p>';
        return;
      }
      results.innerHTML = `<ul>${data.map(a => 
        `<li><strong>${a.num}.</strong> ${a.title} | <em>Авторы:</em> ${a.authors} | <em>Дата:</em> ${a.date}</li>`
      ).join('')}</ul>`;
    } catch {
      results.innerHTML = '<p>Ошибка загрузки.</p>';
    }
  };

  document.getElementById('btn-list').onclick = () => loadArticles();
  document.getElementById('btn-title').onclick = () => {
    const val = titleInput.value.trim();
    loadArticles(`?titleSearch=${encodeURIComponent(val)}`);
  };
  document.getElementById('btn-author').onclick = () => {
    const val = authorSelect.value;
    if (!val) return alert('Выберите автора!');
    loadArticles(`?authorSearch=${encodeURIComponent(val)}`);
  };
});