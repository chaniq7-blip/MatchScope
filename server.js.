
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.APISPORTS_KEY;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://chaniq7-blip.github.io");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/", (req, res) => {
  res.json({
    app: "MatchScope API",
    status: "online"
  });
});

app.get("/api/fixtures", async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({
      error: "Липсва API ключът в настройките на сървъра."
    });
  }

  const days = Math.min(
    7,
    Math.max(1, Number.parseInt(req.query.days || "3", 10) || 3)
  );

  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + days);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  try {
    const url = new URL("https://v3.football.api-sports.io/fixtures");
    url.searchParams.set("from", formatDate(from));
    url.searchParams.set("to", formatDate(to));
    url.searchParams.set("timezone", "Europe/Sofia");

    const response = await fetch(url, {
      headers: {
        "x-apisports-key": API_KEY
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Грешка при заявката към футболния API.",
        details: data
      });
    }

    return res.json(data);
  } catch (error) {
    return res.status(502).json({
      error: "Неуспешна връзка с футболния API."
    });
  }
});

app.listen(PORT, () => {
  console.log(`MatchScope API is running on port ${PORT}`);
});
