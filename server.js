import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const CPSC_ROOT = "https://www.saferproducts.gov/RestWebServices/Recall";

/** Construye URL a CPSC con un solo campo (evita AND demasiado restrictivo). */
function cpscUrl({ field, value, start, end }) {
  const params = new URLSearchParams({ format: "json" });
  if (value) params.append(field, value);
  if (start) params.append("RecallDateStart", start);
  if (end) params.append("RecallDateEnd", end);
  return `${CPSC_ROOT}?${params.toString()}`;
}

/** Normaliza un registro de la CPSC a un objeto compacto. */
function normalize(rec) {
  // Campos planos
  const {
    RecallID,
    RecallNumber,
    RecallDate,
    LastPublishDate,
    URL,
    Title,
    Description
  } = rec;

  const firstHazard = (rec.Hazards?.[0]?.Name || "").trim();
  const remedy = (rec.Remedies?.[0]?.Name || "").trim();
  const images = (rec.Images || []).map(i => i.URL).filter(Boolean);
  const products = (rec.Products || []).map(p => ({
    name: p.Name,
    type: p.Type,
    model: p.Model,
    categoryId: p.CategoryID
  }));

  return {
    id: RecallID,
    number: RecallNumber,
    title: Title,
    url: URL,
    published: LastPublishDate || RecallDate,
    description: Description,
    hazard: firstHazard,
    remedy,
    images,
    products
  };
}

/** Búsqueda principal: hace hasta 3 consultas y fusiona (por id) */
app.get("/api/recalls", async (req, res) => {
  const { q, start, end, limit = "20" } = req.query;
  const lim = Math.min(parseInt(limit || "20", 10), 100);

  const queries = [
    cpscUrl({ field: "ProductName", value: q || "toy", start, end }),
    cpscUrl({ field: "RecallTitle", value: q || "toy", start, end }),
    cpscUrl({ field: "Hazard", value: q || "choking", start, end })
  ];

  try {
    const results = await Promise.allSettled(queries.map(u => axios.get(u, { timeout: 15000 })));
    const merged = new Map();

    for (const r of results) {
      if (r.status !== "fulfilled" || !Array.isArray(r.value.data)) continue;
      for (const rec of r.value.data) {
        // Filtra “toy-like”
        const products = (rec.Products || []);
        const isToy =
          products.some(p =>
            /toy|juguete|doll|lego|figure|puzzle|game/i.test([p.Type, p.Name, p.Description].join(" "))
          ) ||
          /toy|juguete/i.test(`${rec.Title} ${rec.Description}`);
        if (!isToy) continue;

        merged.set(rec.RecallID, rec);
      }
    }

    // Ordena por fecha de publicación descendente
    const ordered = [...merged.values()]
      .map(normalize)
      .sort(
        (a, b) => new Date(b.published || 0).getTime() - new Date(a.published || 0).getTime()
      )
      .slice(0, lim);

    res.json({ count: ordered.length, items: ordered });
  } catch (err) {
    res.status(500).json({ error: "Error fetching CPSC API", detail: String(err) });
  }
});

/** Resumen “IA” opcional (usa OpenAI o Gemini si configuras la key en .env). */
app.post("/api/summarize", async (req, res) => {
  const { text, forAge } = req.body || {};
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!OPENAI_API_KEY && !GEMINI_API_KEY) {
    return res.status(501).json({ error: "No LLM API key configured" });
  }

  try {
    let summary = "";
    if (OPENAI_API_KEY) {
      // OpenAI Responses API (modelo económico)
      const payload = {
        model: "gpt-4o-mini",
        input: [
          {
            role: "user",
            content: `Summarize toy recall risk in 3 bullet points for parents of a child aged ${forAge || "3+"}. Be concise and action-oriented.\n\n${text}`
          }
        ]
      };
      const r = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await r.json();
      summary = data.output_text || data.choices?.[0]?.message?.content || "";
    } else {
      // Gemini 1.5 Flash
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Summarize toy recall risk in 3 bullet points for parents of a child aged ${forAge || "3+"}. Be concise and action-oriented.\n\n${text}` }]
          }]
        })
      });
      const data = await r.json();
      summary = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n") || "";
    }
    res.json({ summary });
  } catch (e) {
    res.status(500).json({ error: "LLM summarize failed", detail: String(e) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Toy Recall Radar listening on :${PORT}`));
