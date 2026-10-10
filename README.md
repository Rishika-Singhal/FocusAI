FocusAI — AI-Powered Context-Aware Study Assistant

FocusAI is an AI-powered study assistant that helps students stay focused by evaluating online content against their study topics and learning objectives.

Using semantic similarity and selective large language model evaluation, FocusAI classifies online content as Relevant, Partially Relevant, or Distracting. It combines a Python backend, a React and TypeScript frontend, and a Chrome extension to help students make more intentional decisions about the content they consume online.

Features

* Context-Aware Content Analysis: Evaluates online content against a student’s current study topic and learning objectives.
* Semantic Similarity: Uses Sentence Transformers to compare content with the user’s learning context.
* AI-Assisted Evaluation: Integrates Google Gemini to provide additional contextual evaluation when needed.
* Three-Level Classification: Categorizes content as Relevant, Partially Relevant, or Distracting.
* Adaptive Scoring: Combines semantic similarity and contextual evaluation to determine content relevance.
* Chrome Extension: Connects the study assistant with supported browsing experiences.
* YouTube and Netflix Support: Designed to evaluate content on supported pages from these platforms.
* FastAPI Backend: Provides the backend services responsible for relevance analysis.
* React and TypeScript Frontend: Provides the user interface for interacting with the study assistant.

How It Works

FocusAI uses a semantic-analysis pipeline to determine how closely online content aligns with a student’s learning objectives.

1. Define the learning context: The student specifies a study topic or learning objective.
2. Analyze online content: FocusAI extracts or receives the available content from a supported page.
3. Calculate semantic similarity: Sentence Transformers generates embeddings that help measure the relationship between the content and the learning context.
4. Evaluate ambiguous content: Google Gemini can provide an additional contextual assessment when the initial result requires further evaluation.
5. Classify the content: The system uses its relevance-scoring mechanism to categorize content as Relevant, Partially Relevant, or Distracting.
6. Present the result: The frontend and browser extension make the analysis available to the student.

The system uses semantic similarity as its primary signal and invokes the language model selectively rather than relying on an LLM for every classification.

Architecture

FocusAI consists of three main components.

Component	Technology	Responsibility
Backend	Python, FastAPI	Content analysis, relevance scoring, and AI integration
Frontend	React, TypeScript, Vite	User interface and interaction
Browser Extension	Chrome Extensions API	Browser integration and supported-page analysis

AI and Relevance Engine

The relevance engine uses:

* Sentence Transformers: sentence-transformers/all-MiniLM-L6-v2
* Google Gemini API: Additional contextual evaluation for selected cases
* Adaptive scoring: Combines semantic similarity with language-model evaluation when appropriate

The backend supports configurable relevance thresholds and exposes an engine-information endpoint at /api/relevance/engine.

Technology Stack

Languages

* Python
* TypeScript
* JavaScript

Backend

* FastAPI
* Uvicorn

Frontend

* React
* TypeScript
* Vite

AI and Machine Learning

* Sentence Transformers
* all-MiniLM-L6-v2
* Google Gemini API

Browser Integration

* Chrome Extension APIs

Testing and Development

* pytest
* Python uv
* Git and GitHub

Project Structure

FocusAI/
├── backend/
│   ├── app/
│   │   └── ai/
│   │       └── llm.py
│   ├── scripts/
│   │   └── eval_relevance.py
│   ├── main.py
│   └── ...
├── frontend/
│   └── ...
├── extension/
│   └── ...
├── extension-tests/
│   └── ...
├── .gitignore
└── README.md

The tree highlights important project components; individual files may differ as the project evolves.

Getting Started

Prerequisites

Install the following before running FocusAI:

* Python
* uv
* Node.js and npm
* Google Gemini API credentials if you want to use Gemini evaluation
* Google Chrome to load the browser extension

1. Clone the Repository

git clone https://github.com/pawariarushil/FocusAI.git
cd FocusAI

2. Set Up the Backend

Navigate to the backend directory:

cd backend

Install the Python dependencies:

uv sync

For the machine-learning dependencies required by the Sentence Transformers backend, run:

uv sync --extra ml

Create a local .env file using the environment-variable names supported by your backend configuration.

For example:

LLM_PROVIDER=gemini
LLM_MODEL=gemini-3.5-flash-lite
LLM_API_KEY=your_gemini_api_key

The model name above is an example configuration. Use a model currently available to your Google Gemini API account and supported by your implementation.

Depending on your configuration, the backend may also support:

LLM_API_URL=
LLM_TIMEOUT_SECONDS=

Consult the backend configuration and any provided environment example for the supported defaults and required values. Do not commit your .env file or API keys to GitHub.

Start the backend development server:

uv run uvicorn main:app --reload

The server will print its local address when it starts. Keep this terminal running while using the frontend or extension.

3. Set Up the Frontend

Open a second terminal from the repository root:

cd frontend
npm install
npm run dev

Open the local address printed by Vite in your browser.

If the frontend uses a configurable backend URL, set it to the address of your running FastAPI server using the environment-variable name expected by the frontend.

4. Load the Chrome Extension

1. Open Google Chrome.
2. Navigate to chrome://extensions/.
3. Enable Developer mode.
4. Select Load unpacked.
5. Choose the project’s extension/ directory if it contains the extension’s manifest.json.
6. Pin the extension to the browser toolbar if desired.
7. Start the backend and frontend, then configure the extension according to its interface.

If the extension requires a build step, complete that step first and load the generated directory containing manifest.json.

Testing

Run Backend Tests

From the backend/ directory:

uv run pytest -q

This runs the backend’s pytest test suite.

Evaluate Relevance Classification

To run the relevance evaluation script:

uv run python scripts/eval_relevance.py

The evaluation script checks classification behavior against the examples defined by the project.

Inspect the Relevance Engine Configuration

With the backend running, request:

GET /api/relevance/engine

This endpoint reports information about the configured relevance engine, including its embedding backend, LLM configuration, and scoring thresholds.

Configuration and Security

* Keep API keys in local environment files or an appropriate secrets manager.
* Never commit .env files, API credentials, or other secrets.
* Use .env.example to document configuration variables without including real credentials.
* Ensure the frontend and Chrome extension communicate with the correct backend address.
* Review browser-extension permissions and grant only the permissions required by the implementation.

Current Scope

FocusAI is a study-focused content relevance assistant. Its classification reflects how closely content aligns with a specified learning context; it does not establish whether content is factually correct or whether a student is actually learning.

Platform compatibility depends on the content available to the extension and the implementation of each supported page integration.

Future Improvements

Potential areas for further development include:

* More comprehensive relevance-evaluation datasets
* Improved handling of short, ambiguous, and mixed-topic content
* Additional supported learning platforms
* More detailed explanations for classification decisions
* Improved automated testing of browser-extension behavior
* Performance and usability improvements

Author

Rushil Pawaria

* GitHub: @pawariarushil
* LinkedIn: Rushil Pawaria

⸻

FocusAI — helping students align their online browsing with their learning goals.
