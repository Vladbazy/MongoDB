const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/lab9_journal');

const reviewSchema = new mongoose.Schema({ name: String, message: String, rating: Number });
const articleSchema = new mongoose.Schema({
  title: String, authors: [String], date: Date, content: String, tags: [String], reviews: [reviewSchema]
});
const Article = mongoose.model('Article', articleSchema);

const articles = [
  {
    title: "Искусственный интеллект в медицине",
    authors: ["Иванов И.И.", "Петров П.П."],
    date: new Date("2025-03-10"),
    content: "Обзор применения нейросетей в диагностике...",
    tags: ["AI", "Медицина"],
    reviews: [{ name: "User1", message: "Отлично!", rating: 9 }]
  },
  {
    title: "Блокчейн в логистике",
    authors: ["Сидоров С.С."],
    date: new Date("2025-04-15"),
    content: "Анализ внедрения распределённых реестров...",
    tags: ["Блокчейн", "Логистика"],
    reviews: []
  },
  {
    title: "Экологический мониторинг с помощью дронов",
    authors: ["Кузнецова А.В.", "Иванов И.И."],
    date: new Date("2025-05-20"),
    content: "Методы сбора данных о состоянии атмосферы...",
    tags: ["Экология", "Дроны"],
    reviews: [{ name: "Student", message: "Полезно", rating: 7 }]
  },
  {
    title: "Квантовые вычисления: состояние и перспективы",
    authors: ["Морозов Д.Д."],
    date: new Date("2025-01-12"),
    content: "Современные архитектуры кубитов...",
    tags: ["Квант", "Физика"],
    reviews: [{ name: "Physicist", message: "Не хватает формул", rating: 6 }]
  },
  {
    title: "Цифровая трансформация образования",
    authors: ["Петров П.П.", "Смирнова Е.Е."],
    date: new Date("2025-06-01"),
    content: "Роль LMS и VR в современном обучении...",
    tags: ["EdTech", "Образование"],
    reviews: [{ name: "Teacher", message: "Согласен", rating: 10 }]
  }
];

async function run() {
  try {
    await Article.deleteMany({});
    await Article.insertMany(articles);
    console.log("✅ В БД добавлено 5 документов.");
  } catch (e) {
    console.error("❌ Ошибка:", e);
  } finally {
    mongoose.disconnect();
  }
}

run();