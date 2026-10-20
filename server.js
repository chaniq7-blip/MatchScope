
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.APISPORTS_KEY;

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://chaniq7-blip.github.io"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.get("/", (req, res) => {
  res.json({
    app: "MatchScope API",
    status: "online"
  });
});

function getSofiaDate(offset = 0) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Sofia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const values = {};
  for (const part of parts) {
    values[part.type] = part.value;
  }

  const date = new Date(Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day) + offset
  ));

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0")
  ].join("-");
}

app.get("/api/fixtures", async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({
      error: "Липсва API ключът APISPORTS_KEY в настройките на Render."
    });
  }

  const days = Math.min(
    7,
    Math.max(1, Number.parseInt(req.query.days || "3", 10) || 3)
  );

  try {
    const dates = Array.from(
      { length: days },
      (_, index) => getSofiaDate(index)
    );

    const results = await Promise.all(
      dates.map(async (date) => {
        const url = new URL(
          "https://v3.football.api-sports.io/fixtures"
        );

        url.searchParams.set("date", date);
        url.searchParams.set("timezone", "Europe/Sofia");

        const response = await fetch(url, {
          headers: {
            "x-apisports-key": API_KEY
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(JSON.stringify({
            date,
            status: response.status,
            details: data
          }));
        }

        if (
          data.errors &&
          Object.keys(data.errors).length > 0
        ) {
          throw new Error(JSON.stringify({
            date,
            details: data.errors
          }));
        }

        return data.response || [];
      })
    );

    const fixtures = results.flat();

    fixtures.sort((a, b) => {
      return new Date(a.fixture.date) - new Date(b.fixture.date);
    });

    return res.json({
      get: "fixtures",
      parameters: {
        days,
        dates,
        timezone: "Europe/Sofia"
      },
      errors: {},
      results: fixtures.length,
      paging: {
        current: 1,
        total: 1
      },
      response: fixtures
    });
  } catch (error) {
    console.error("MatchScope fixtures error:", error.message);

    return res.status(502).json({
      error: "Не успяхме да заредим мачовете.",
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`MatchScope API is running on port ${PORT}`);
});
