document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return document.body.innerHTML = '<p>Статья не указана</p>';

  try {
    const res = await fetch(`/api/articles/${id}`);
    const a = await res.json();
    if (!a.title) return document.body.innerHTML = '<p>Статья не найдена</p>';

    document.getElementById('title').textContent = a.title;
    document.getElementById('meta').innerHTML = `👥 ${a.authors.join(', ')} | 📅 ${new Date(a.date).toLocaleDateString('ru-RU')}`;
    document.getElementById('tags').textContent = a.tags.length ? `🏷️ ${a.tags.join(', ')}` : '';
    document.getElementById('content').innerText = a.content;

    const revBox = document.getElementById('reviews');
    if (!a.reviews.length) {
      revBox.innerHTML = '<p>Нет рецензий</p>';
      return;
    }
    revBox.innerHTML = a.reviews.map(r => `
      <div class="review">
        <strong>${r.name}</strong> <span class="rating">⭐ ${r.rating}/10</span>
        <p>${r.message}</p>
      </div>`).join('');
  } catch {
    document.body.innerHTML = '<p>Ошибка загрузки статьи</p>';
  }
});