document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return document.body.innerHTML = '<p>Статья не указана</p>';

  const titleEl = document.getElementById('title');
  const metaEl = document.getElementById('meta');
  const tagsEl = document.getElementById('tags');
  const contentEl = document.getElementById('content');
  const reviewsEl = document.getElementById('reviews');
  const reviewForm = document.getElementById('review-form');

  // Функция загрузки данных
  const loadArticle = async () => {
    try {
      const res = await fetch(`/api/articles/${id}`);
      const a = await res.json();
      if (!a.title) return document.body.innerHTML = '<p>Статья не найдена</p>';

      titleEl.textContent = a.title;
      metaEl.innerHTML = `👥 ${a.authors.join(', ')} | 📅 ${new Date(a.date).toLocaleDateString('ru-RU')}`;
      tagsEl.textContent = a.tags.length ? `🏷️ ${a.tags.join(', ')}` : '';
      contentEl.innerText = a.content;

      // Отрисовка рецензий
      reviewsEl.innerHTML = '';
      if (!a.reviews || a.reviews.length === 0) {
        reviewsEl.innerHTML = '<p style="color:#777;">Нет рецензий. Будьте первым!</p>';
      } else {
        a.reviews.forEach(r => {
          const div = document.createElement('div');
          div.className = 'review';
          div.innerHTML = `<strong>${r.name}</strong> <span class="rating">⭐ ${r.rating}/10</span><p style="margin:0.3rem 0 0;">${r.message}</p>`;
          reviewsEl.appendChild(div);
        });
      }
    } catch (e) {
      console.error(e);
      document.body.innerHTML = '<p>Ошибка загрузки статьи</p>';
    }
  };

  // Обработка отправки формы
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('rev-name').value.trim();
      const message = document.getElementById('rev-message').value.trim();
      const rating = parseInt(document.getElementById('rev-rating').value, 10);

      if (!name || !message || isNaN(rating) || rating < 1 || rating > 10) {
        alert('Заполните все поля корректно (оценка 1-10)');
        return;
      }

      try {
        const res = await fetch(`/api/articles/${id}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, message, rating })
        });
        const data = await res.json();
        if (res.ok) {
          alert('Рецензия добавлена!');
          reviewForm.reset();
          await loadArticle(); // Обновляем список рецензий
        } else {
          alert(' Ошибка: ' + data.error);
        }
      } catch (err) {
        alert('Ошибка отправки запроса');
      }
    });
  }

  await loadArticle();
});