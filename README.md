# Interview Coach

An interview-preparation tool that generates tailored practice questions for
a given role, accepts written answers, and returns a structured evaluation —
a numeric score, identified strengths, areas for improvement, and short
coaching feedback.

## Overview

The application consists of a Flask API backend powered by LangChain, and a
static HTML/CSS/JS frontend. The backend supports either OpenAI or Anthropic
as the underlying language model provider, selectable via configuration.

## How it works

1. The user specifies a role or topic (e.g. "Backend engineer, Python & distributed systems").
2. The backend requests a set of interview questions from the LLM via LangChain,
   returned as structured data through a Pydantic output parser.
3. The user answers a question in the browser.
4. The answer is sent to the backend for evaluation, which returns a score
   (1–10), strengths, areas for improvement, and short feedback — again as
   structured, typed data rather than free-form text.
5. The frontend renders the result as a report, including a score-ring visualization.

## Architecture

```
interview-prep-guide/
├── backend/
│   ├── app.py              Flask API — two endpoints, generate + evaluate
│   ├── chains.py           LangChain prompts, output schemas, chain wiring
│   ├── llm.py              Selects OpenAI or Anthropic based on .env
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── index.html          Two-pane layout: question agenda + active session
│   ├── style.css
│   └── script.js           Calls the Flask API, renders the score ring
└── README.md
```

The frontend and backend are decoupled: the frontend is static and
communicates with the backend over HTTP, so the backend could be replaced
with any service exposing the same two endpoints.

## Setup

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: set LLM_PROVIDER and the matching API key
```

One API key is required — OpenAI or Anthropic, matching whichever
`LLM_PROVIDER` is set in `.env`.

Start the API:

```bash
python app.py
```

The server runs on `http://localhost:5000`.

### 2. Frontend

In a separate terminal:

```bash
cd frontend
npx serve .
# or: python3 -m http.server 8000
```

Open the address printed in the terminal. The frontend expects the backend
at `http://localhost:5000`; update `API_BASE` at the top of `script.js` if
the backend runs elsewhere.

## API reference

**`POST /api/generate-questions`**
```json
{ "topic": "Frontend engineer, React", "num_questions": 5 }
```
→ `{ "questions": ["...", "...", ...] }`

**`POST /api/evaluate-answer`**
```json
{ "question": "...", "answer": "..." }
```
→
```json
{
  "score": 7,
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "feedback": "..."
}
```

## Notes

- CORS is fully open in `app.py` for local development. Restrict this before
  deploying to a public environment.
- Switching LLM providers requires only changing `LLM_PROVIDER` in `.env`
  between `openai` and `anthropic`; `llm.py` handles the rest.

## Possible extensions

- Session persistence (currently state resets on page reload)
- A summary view across all answered questions in a session
- Adaptive difficulty or follow-up questions based on answer quality
