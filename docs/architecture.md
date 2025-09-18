# 🏗️ Architecture Overview

The Toy Recall Radar app has a **client-server** structure.

## Components
- **Frontend** (public/index.html)
  - Provides a simple UI to search toy recalls.
  - Calls `/api/recalls` and `/api/summarize`.
- **Backend** (server.js, Node.js + Express)
  - `/api/recalls`: fetches data from the CPSC API and filters toy-related recalls.
  - `/api/summarize`: sends recall text to OpenAI (`gpt-4o-mini`) and returns bullet-point summaries.
- **External APIs**
  - [CPSC Recall API](https://www.saferproducts.gov/RestWebServices/Recall)
  - [OpenAI Responses API](https://platform.openai.com/docs/)

## Data Flow
1. User searches recalls → frontend calls `/api/recalls`.
2. Backend fetches CPSC JSON → normalizes → returns JSON to frontend.
3. User clicks **Summarize** → frontend calls `/api/summarize`.
4. Backend queries OpenAI → returns concise summary.
