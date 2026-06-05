const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = 3000;

// Подключение к MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/lab9_journal')
  .then(() => console.log('✅ MongoDB подключена'))
  .catch(err => console.error('❌ Ошибка подключения:', err));

// Схемы (создадут коллекцию автоматически при первом запросе)
const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  message: { type: String, required: true },
  rating: { type: Number, min: 1, max: 10, required: true }
});

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  authors: [{ type: String, required: true }],
  date: { type: Date, default: Date.now },
  content: { type: String, required: true },
  tags: [{ type: String }],
  reviews: [reviewSchema]
});

const Article = mongoose.model('Article', articleSchema);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 2.5 API: получить всех уникальных авторов для выпадающего списка
app.get('/api/authors', async (req, res) => {
  try {
    const docs = await Article.find({}, 'authors');
    const all = docs.flatMap(d => d.authors);
    res.json([...new Set(all)].sort());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2.3–2.4 API: получить статьи (с фильтрацией по названию и автору)
app.get('/api/articles', async (req, res) => {
  try {
    const { titleSearch, authorSearch } = req.query;
    let query = {};

    if (titleSearch?.trim()) query.title = { $regex: titleSearch.trim(), $options: 'i' };
    if (authorSearch) query.authors = authorSearch;

    const list = await Article.find(query).select('title authors date');
    
    // Формируем ответ с порядковым номером и датой в формате ДД.ММ.ГГГГ
    const result = list.map((a, i) => ({
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

app.listen(PORT, () => {
  console.log(`🌐 Сервер запущен: http://localhost:${PORT}`);
});