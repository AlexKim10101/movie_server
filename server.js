const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(bodyParser.json());

// Чтение переменных окружения
const PORT = process.env.PORT || 3000;
const BACKUP_FILE_PATH = process.env.BACKUP_FILE_PATH || "backup.txt";

// Хранилище фильмов
let movies = [];

// Чтение файла бэкапа при запуске
fs.readFile(BACKUP_FILE_PATH, "utf8", (err, data) => {
	if (err) {
		console.error("Error reading backup file:", err);
		return;
	}

	data.split("\n").forEach(line => {
		if (line.trim()) {
			try {
				const movie = JSON.parse(line);
				movies.push(movie);
				const imgPath = path.join(__dirname, "images", `${movie.id}.jpeg`);
				fs.writeFileSync(imgPath, movie.img, "base64");
			} catch (e) {
				console.error("Error parsing line:", line, e);
			}
		}
	});

	console.log("Backup file loaded successfully.");
});

// Эндпоинт /ping
app.get("/ping", (req, res) => {
	res.send("pong");
});

// Эндпоинт /echo
app.post("/echo", (req, res) => {
	res.json(req.body);
});

// Эндпоинт для получения карточки фильма по ID
app.get("/api/v1/movie/:movie_id", (req, res) => {
	const movie = movies.find(m => m.id === req.params.movie_id);
	if (!movie) {
		return res.status(404).send("Movie not found");
	}

	const filmCard = {
		id: movie.id,
		title: movie.title,
		description: movie.description,
		genre: movie.genre,
		release_year: movie.release_year,
	};

	res.json(filmCard);
});

// Эндпоинт для поиска фильмов по названию с пангинацией
app.get("/api/v1/search", (req, res) => {
	const { title, page = 1 } = req.query;
	if (!title) {
		return res.status(400).send('Query parameter "title" is required');
	}

	const pageSize = 10;
	const searchResults = movies
		.filter(m => m.title.toLowerCase().includes(title.toLowerCase()))
		.slice((page - 1) * pageSize, page * pageSize)
		.map(m => ({
			id: m.id,
			title: m.title,
			description: m.description,
			genre: m.genre,
			release_year: m.release_year,
		}));

	res.json({ search_result: searchResults });
});

// Эндпоинт для получения изображения постера
app.get("/static/images/:movie_id.jpeg", (req, res) => {
	const imgPath = path.join(__dirname, "images", `${req.params.movie_id}.jpeg`);
	if (fs.existsSync(imgPath)) {
		res.sendFile(imgPath);
	} else {
		res.status(404).send("Image not found");
	}
});

// Обработка несуществующих маршрутов
app.use((req, res) => {
	res.status(404).send("Not Found");
});

// Запуск сервера
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
