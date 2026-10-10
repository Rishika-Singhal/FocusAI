::: {align="center"}
# FocusAI

### Study with intention. Browse with focus.

**An AI-powered, context-aware learning assistant that evaluates online
content against your current study goals.**

```{=html}
<p>
```
`<img src="https://img.shields.io/badge/AI-Context--Aware-7C3AED?style=for-the-badge" alt="Context-aware AI">`{=html}
`<img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">`{=html}
`<img src="https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="React and TypeScript">`{=html}
`<img src="https://img.shields.io/badge/Browser-Chrome%20Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Chrome extension">`{=html}
```{=html}
</p>
```
```{=html}
<p>
```
`<a href="#-the-idea">`{=html}The Idea`</a>`{=html}  • 
`<a href="#-features">`{=html}Features`</a>`{=html}  • 
`<a href="#-how-it-works">`{=html}How It Works`</a>`{=html}  • 
`<a href="#-getting-started">`{=html}Getting Started`</a>`{=html}  • 
`<a href="#-project-structure">`{=html}Structure`</a>`{=html}
```{=html}
</p>
```
:::

------------------------------------------------------------------------

## 🎯 The Idea

When studying online, useful material and distractions often live on the
same websites. A traditional blocklist cannot tell the difference
between a lecture that supports your assignment and an unrelated video
on the same platform.

**FocusAI takes your study context into account.** It evaluates the
content you are viewing against your topic, assignment, or learning
objectives and categorizes it as:

```{=html}
<table>
```
```{=html}
<tr>
```
```{=html}
<td align="center" width="33%">
```
```{=html}
<h3>
```
🟢 Relevant
```{=html}
</h3>
```
```{=html}
<p>
```
Content that supports your current learning goal.
```{=html}
</p>
```
```{=html}
</td>
```
```{=html}
<td align="center" width="33%">
```
```{=html}
<h3>
```
🟡 Partially Relevant
```{=html}
</h3>
```
```{=html}
<p>
```
Content that may be useful but is not fully aligned.
```{=html}
</p>
```
```{=html}
</td>
```
```{=html}
<td align="center" width="33%">
```
```{=html}
<h3>
```
🔴 Distracting
```{=html}
</h3>
```
```{=html}
<p>
```
Content that is unrelated to your current study context.
```{=html}
</p>
```
```{=html}
</td>
```
```{=html}
</tr>
```
```{=html}
</table>
```
The goal is not to block entire websites. It is to make content
decisions based on **what you are trying to learn right now**.

## ✨ Features

```{=html}
<table>
```
```{=html}
<tr>
```
```{=html}
<td width="50%">
```
```{=html}
<h3>
```
🎯 Study Context
```{=html}
</h3>
```
Define a study topic and learning objectives so content can be evaluated
against your current goal.
```{=html}
</td>
```
```{=html}
<td width="50%">
```
```{=html}
<h3>
```
🧠 Semantic Relevance
```{=html}
</h3>
```
Uses text embeddings to estimate how closely page content matches your
study context.
```{=html}
</td>
```
```{=html}
</tr>
```
```{=html}
<tr>
```
```{=html}
<td>
```
```{=html}
<h3>
```
🤖 Contextual AI Evaluation
```{=html}
</h3>
```
Uses Google Gemini selectively when the initial relevance signal is
ambiguous or the available content needs additional reasoning.
```{=html}
</td>
```
```{=html}
<td>
```
```{=html}
<h3>
```
🧭 Three-Way Classification
```{=html}
</h3>
```
Separates relevant, partially relevant, and distracting content instead
of relying only on website-level blocklists.
```{=html}
</td>
```
```{=html}
</tr>
```
```{=html}
<tr>
```
```{=html}
<td>
```
```{=html}
<h3>
```
🌐 Browser Integration
```{=html}
</h3>
```
A Chrome extension connects the browsing experience to the
content-analysis backend.
```{=html}
</td>
```
```{=html}
<td>
```
```{=html}
<h3>
```
📺 Supported Content Sources
```{=html}
</h3>
```
Includes integrations for platforms such as YouTube and Netflix.
```{=html}
</td>
```
```{=html}
</tr>
```
```{=html}
</table>
```
## 🧠 How It Works

``` text
┌──────────────────────────┐
│  1. Set a study context  │
│  Topic + learning goals  │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│  2. Capture page content │
│  Chrome extension        │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│  3. Analyze relevance    │
│  Text embeddings         │
│  + adaptive scoring      │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│  4. Resolve ambiguity    │
│  Gemini evaluation       │
│  when needed             │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│  5. Return classification│
│  Relevant                │
│  Partially relevant      │
│  Distracting             │
└──────────────────────────┘
```

### Relevance engine

FocusAI combines two kinds of signals:

1.  **Semantic similarity:** the
    `sentence-transformers/all-MiniLM-L6-v2` model creates text
    embeddings used to compare the study context with page content.
2.  **Contextual reasoning:** Google Gemini can be used selectively for
    ambiguous cases rather than being required for every classification.

The signals are combined through the project's relevance-scoring logic
to produce a classification. This design aims to balance efficient
similarity checks with deeper evaluation when needed.

## 🧰 Tech Stack

  Layer                   Technology
  ----------------------- ----------------------------------------------
  Frontend                React, TypeScript, Vite
  Backend API             Python, FastAPI, Uvicorn
  Semantic analysis       Sentence Transformers --- `all-MiniLM-L6-v2`
  Contextual evaluation   Google Gemini API
  Browser integration     Chrome Extension
  Development tools       Git, GitHub, VS Code

## 🏗️ Project Structure

``` text
FocusAI/
├── backend/             # FastAPI API and relevance-analysis logic
├── frontend/            # React + TypeScript user interface
├── extension/           # Chrome extension
├── extension-tests/     # Extension-related tests
├── .gitignore
└── README.md
```

> The exact files inside each directory may evolve as the project
> develops.

## 🚀 Getting Started

### Prerequisites

Install the following before running the project:

-   Python and `uv` for the backend environment
-   Node.js and npm for the frontend
-   Google Chrome to load the browser extension
-   A Google Gemini API key if contextual evaluation is enabled

### 1. Clone the repository

``` bash
git clone https://github.com/pawariarushil/FocusAI.git
cd FocusAI
```

### 2. Start the backend

``` bash
cd backend
uv sync
```

Configure the environment variables required by your backend in a local
`.env` file. Keep API keys private and never commit them to GitHub.

Then start the API:

``` bash
uv run uvicorn main:app --reload
```

If your backend entry point or dependency groups change, use the
commands documented in the current `backend/pyproject.toml`.

When the server is running, FastAPI's interactive API documentation is
typically available at:

-   `http://127.0.0.1:8000/docs`

### 3. Start the frontend

Open a second terminal from the project root:

``` bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal. The default
development URL is commonly `http://localhost:5173`.

### 4. Load the Chrome extension

1.  Open Chrome and visit `chrome://extensions`.
2.  Enable **Developer mode**.
3.  Select **Load unpacked**.
4.  Choose the project's `extension/` directory.
5.  Follow the extension's configured backend URL and any setup
    instructions in its own files.

Make sure the backend is running and that the extension is configured to
reach the correct local API address.

## ⚙️ Configuration & Security

-   Keep local `.env` files out of version control.
-   Use an example environment file to document required variable names
    without including real secrets.
-   Store API keys in environment variables; never hard-code them into
    frontend code or commit them.
-   Configure the backend's allowed origins for the frontend address you
    actually use.
-   Do not assume the extension can reach a deployed backend until its
    API URL and permissions have been configured.

**Important:** environment-variable names depend on the current backend
implementation. Check the backend's `.env.example` or configuration code
before adding variables; do not copy secret values into this README.

## 🧪 Testing & Verification

Before considering a change complete, verify the parts affected by it:

-   **Backend:** start the FastAPI server and exercise the relevant
    endpoints.
-   **Frontend:** run the development server and verify that API
    requests succeed.
-   **Extension:** load it unpacked in Chrome and test the pages and
    actions it supports.
-   **Relevance engine:** test relevant, partially relevant, and
    distracting examples against different study contexts.
-   **Secrets:** confirm `.env` files and API keys are not staged for a
    commit.

The exact test commands depend on the scripts and test configuration
currently present in the repository.

## 🛣️ Roadmap

Potential areas for continued development include:

-   Improving explanations for content classifications.
-   Evaluating classification quality with a labeled test set.
-   Expanding supported page types and extraction strategies.
-   Improving extension feedback and user controls.
-   Adding privacy-conscious study activity insights.
-   Improving automated integration tests across the frontend, backend,
    and extension.

These are development directions, not claims that every item is already
implemented.

## 💡 Why FocusAI?

FocusAI explores a practical question: **can a learning tool judge
content by its relevance to a learner's current goal instead of judging
it only by the website it appears on?**

By combining a browser extension, a semantic relevance engine, and
selective contextual reasoning, the project brings together full-stack
development, API design, browser integration, and applied NLP.

------------------------------------------------------------------------

::: {align="center"}
### FocusAI

**Stay on topic. Learn with purpose.**

Built as a context-aware learning assistant.
:::
