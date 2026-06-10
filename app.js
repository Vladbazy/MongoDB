const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = 3000;

// Подключение к MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/lab9_journal')
  .then(() => console.log('✅ MongoDB подключена'))
  .catch(err => console.error('❌ Ошибка подключения:', err));

// === СХЕМЫ ===

// Схема рецензии
const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  message: { type: String, required: true },
  rating: { type: Number, min: 1, max: 10, required: true }
});

// Схема статьи
const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  authors: [{ type: String, required: true }],
  date: { type: Date, default: Date.now },
  content: { type: String, required: true },
  tags: [{ type: String }],
  reviews: [reviewSchema]
});

const Article = mongoose.model('Article', articleSchema);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// === МАРШРУТЫ (ВАЖЕН ПОРЯДОК!) ===

// 1. Получить всех уникальных авторов (Лаба 9, пункт 2.5)
app.get('/api/authors', async (req, res) => {
  try {
    const docs = await Article.find({}, 'authors');
    const all = docs.flatMap(d => d.authors);
    res.json([...new Set(all)].sort());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2. ТОП статей по рейтингу (Лаба 10, пункт 3.4)
// ДОЛЖЕН БЫТЬ ПЕРЕД /api/articles/:id
app.get('/api/articles/top', async (req, res) => {
  try {
    const articles = await Article.find({});
    
    const ranked = articles.map(a => {
      const reviews = a.reviews || [];
      const count = reviews.length;
      const avg = count ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count : 0;
      return { ...a.toObject(), avgRating: avg, reviewCount: count };
    });
    
    // Сортировка: по убыванию рейтинга, при равенстве - по количеству отзывов
    ranked.sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount);
    
    const top = ranked.slice(0, 5).map(a => ({
      _id: a._id,
      title: a.title || 'Без названия',
      authors: Array.isArray(a.authors) ? a.authors.join(', ') : 'Неизвестно',
      date: a.date ? new Date(a.date).toLocaleDateString('ru-RU') : '-',
      avgRating: a.avgRating.toFixed(1),
      reviewCount: a.reviewCount
    }));
    
    res.json(top);
  } catch (e) {
    console.error('Ошибка топ:', e);
    res.status(500).json({ error: e.message });
  }
});

// 3. Получить список статей с фильтрами (Лаба 9, пункты 2.3-2.4 + Лаба 10, пункт 3.5)
app.get('/api/articles', async (req, res) => {
  try {
    const { titleSearch, authorSearch, dateFrom, dateTo } = req.query;
    let query = {};

    // Поиск по названию (регистронезависимый)
    if (titleSearch?.trim()) {
      query.title = { $regex: titleSearch.trim(), $options: 'i' };
    }
    
    // Поиск по автору
    if (authorSearch) {
      query.authors = authorSearch;
    }
    
    // Поиск по диапазону дат
    if (dateFrom) {
      query.date = { ...query.date, $gte: new Date(dateFrom) };
    }
    if (dateTo) {
      query.date = { ...query.date, $lte: new Date(dateTo + 'T23:59:59') };
    }

    const list = await Article.find(query).select('title authors date');
    const result = list.map((a, i) => ({
      _id: a._id,
      num: i + 1,
      title: a.title,
      authors: a.authors.join(', '),
      date: new Date(a.date).toLocaleDateString('ru-RU')
    }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 4. Получить одну статью полностью (Лаба 10, пункт 3.1)
// ДОЛЖЕН БЫТЬ ПОСЛЕ /api/articles и /api/articles/top
app.get('/api/articles/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Статья не найдена' });
    }
    res.json(article);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 5. Добавить рецензию к статье (Новое требование)
app.post('/api/articles/:id/reviews', async (req, res) => {
  try {
    const { name, message, rating } = req.body;
    
    // Валидация
    if (!name || !message || !rating || rating < 1 || rating > 10) {
      return res.status(400).json({ 
        error: 'Некорректные данные (оценка 1-10, имя и текст обязательны)' 
      });
    }

    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Статья не найдена' });
    }

    // Добавляем рецензию
    article.reviews.push({ 
      name: name.trim(), 
      message: message.trim(), 
      rating: Number(rating) 
    });
    await article.save();

    res.status(201).json({ 
      message: 'Рецензия добавлена', 
      reviews: article.reviews 
    });
  } catch (e) {
    console.error('Ошибка добавления рецензии:', e);
    res.status(500).json({ error: e.message });
  }
});

// 6. Создать статью (Лаба 10, пункт 3.3)
app.post('/api/articles', async (req, res) => {
  try {
    const { title, authors, content, tags } = req.body;
    
    const newArticle = new Article({ 
      title, 
      authors: authors.split(',').map(s => s.trim()), 
      content, 
      tags: tags ? tags.split(',').map(s => s.trim()) : [], 
      reviews: [] 
    });
    
    await newArticle.save();
    res.status(201).json(newArticle);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// 7. Удалить статью (Лаба 10, пункт 3.2)
app.delete('/api/articles/:id', async (req, res) => {
  try {
    await Article.findByIdAndDelete(req.params.id);
    res.json({ message: 'Удалено' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === ЗАПУСК СЕРВЕРА ===
app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});