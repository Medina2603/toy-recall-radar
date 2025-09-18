# 🧸 Toy Recall Radar

Toy Recall Radar is a demo application built with **Node.js + Express** that helps parents and toy retailers stay informed about toy recalls.  
It integrates the **CPSC public API** (U.S. Consumer Product Safety Commission) to fetch toy recall data and uses **OpenAI** (`gpt-4o-mini`) to generate concise, actionable summaries of risks.

---

## ✨ Features
- 🔍 Search toy recalls from the **CPSC API** by keyword and date.
- 🧾 Display details such as hazards, remedies, and product images.
- 🤖 **AI-powered summaries**: explains risks in 3–5 bullet points tailored for parents.
- 📱 Simple web UI with a search bar and interactive cards.
- 🌐 Ready for deployment on **Render** or **Railway**.

---

## 🛠️ Tech Stack
- **Backend:** Node.js, Express, Axios
- **AI Integration:** OpenAI SDK (`gpt-4o-mini` via Responses API)
- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Extras:** CORS, dotenv for environment variables

---

## ⚙️ Environment Variables
Create a `.env` file in the root folder:

```bash
OPENAI_API_KEY=sk-xxxxxxx
PORT=3000
