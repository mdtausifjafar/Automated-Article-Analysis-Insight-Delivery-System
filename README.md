# Automated Article Analysis & Insight Delivery System

A fully automated AI workflow system that connects a responsive frontend web UI to a FastAPI gateway and an n8n automation engine. By simply providing an email address and an article URL, the system scrapes the content, summarizes it using Groq AI, extracts key actionable insights, logs the execution details in Google Sheets, and sends a beautifully formatted HTML report directly to your Gmail inbox.

This project demonstrates the powerful combination of lightweight frontend interfaces, modern asynchronous Python APIs, and low-code/no-code workflow automation tools (n8n) to deliver a seamless end-to-end user experience.

---

## Project Overview

In today's fast-paced digital world, consuming long-form content efficiently is a challenge. This system solves that problem by orchestrating a sequence of specialized tools:

1. **User Request:** A clean, responsive web interface accepts the user's email and an article link.
2. **API Processing:** A FastAPI backend validates the inputs, generates a unique tracking session ID, and triggers the n8n automation engine.
3. **AI Automation Workflow (n8n):**
   - **Scrapes** the article using Firecrawl, converting raw web pages into clean markdown.
   - **Summarizes** the markdown into a concise 3-5 sentence paragraph using Groq AI (`llama-3.3-70b-versatile`).
   - **Extracts** 3-5 actionable, high-value key insights using Groq AI.
   - **Logs** the session, article URL, summary, insights, and timestamp to Google Sheets.
   - **Dispatches** a styled responsive HTML email to the user.

---

## Video Demo

Click below for the short demonstration on how the frontend UI, backend, Google Sheets log, and Gmail notification work together seamlessly:

[Download Demo Video of Automated Article Analysis & Insight Delivery System.mp4](readme-media/Demo%20Video%20of%20Automated%20Article%20Analysis%20&%20Insight%20Delivery%20System.mp4?raw=true)

---

## Frontend Architecture & Views

The frontend is built entirely using vanilla web technologies (**HTML5, Vanilla CSS3, and Modern JavaScript**). It is designed to be lightweight, compile-free, fast, and features a modern responsive layout.

### Desktop View

A clean and spacious desktop interface optimized for seamless article submission and AI-powered content analysis:

![Article AI - Desktop View](readme-media/Article%20AI%20(Desktop%20View).png)

### Mobile View

A responsive mobile-friendly interface designed for smooth article input and quick AI insights on smaller screens:

![Article AI - Mobile View](readme-media/Article%20AI%20(Mobile%20View).png)

### Analysis Completed View

When the user submits email address and article URL, a full-screen loading spinner overlay handles the API wait state. Once FastAPI confirms the workflow has successfully accepted the request, the interface transitions to a success card displaying the unique session ID, article URL, email address and dynamic progress indicators:

![Article AI - Analysis Completed View](readme-media/Article%20AI%20(Analysis%20Completed%20View).png)

### Frontend Highlights

- **CSS Variables & Custom Tokens:** Structured styling rules for colors, font weights, animations, and transitions.
- **Client-side Form Validation:** Pre-verifies email structure using custom regex and validates the URL format before sending a request to the backend.
- **State Management:** Swaps views dynamically using HTML `hidden` attributes and updates text nodes based on API responses.

---

## Backend Architecture

The backend coordinates communication between the client's browser and the n8n automation server. It is split into two primary layers:

### 1. FastAPI Gateway (`backend/main.py`)

- **Input Validation:** Leverages Pydantic schemas (`BaseModel`, `EmailStr`, `HttpUrl`) to enforce data integrity.
- **Security:** Loads all settings dynamically from a local `.env` configuration file using `python-dotenv`.
- **Asynchronous Execution:** Built using Python's `asyncio` and `httpx` to trigger n8n webhooks non-blockingly, keeping server resources lightweight.
- **CORS Configuration:** Configured to secure communication and allow specified client domains (default is wildcards for testing).

### 2. n8n Automation Engine (`n8n/Article Analysis Workflow.json`)

The visual automation server orchestrates the execution flow. It reads API secrets from the container's environment and executes the following nodes in order:

![n8n Workflow Schema](readme-media/Article%20Analysis%20-%20n8n%20Workflow.png)

* **Webhook Trigger:** Exposes a POST webhook endpoint `/webhook/article-analysis` to receive the payload from FastAPI.
* **Firecrawl Scrape:** Integrates with Firecrawl API to extract full article text from the web, cleaning up HTML boilerplate into readable markdown.
* **Groq Summarize:** Invokes the Llama 3.3 70B Versatile model via Groq's high-performance endpoint to output a 3-5 sentence summary.
* **Groq Insights:** Invokes Groq to generate a clean, numbered list of actionable takeaways from the parsed markdown.
* **Merge Data:** Combines the scraper metadata, AI outputs, and user session values.
* **Google Sheets:** Connects via OAuth2 to append a new row of log details into a target sheet.
* **Send Email:** Connects via Gmail OAuth2 to construct and dispatch a beautiful responsive HTML layout to the recipient's inbox.
* **Webhook Response:** Returns the article title and confirmation data back to the FastAPI gateway.

---

## Results & Logs

Once the workflow executes successfully, the outputs are delivered in two ways:

### Email Delivery

The user receives an email containing a clean, responsive HTML layout. The email subject includes the article title, and the email body contains the session ID, article URL, submission timestamp, and structured sections for the summary and key insights.

![Gmail View](readme-media/Gmail%20View%20(Article%20AI%20Analysis).png)

### Google Sheets Database Logging

All completed analysis runs are appended in real-time to a centralized spreadsheet:

![Google Sheets View](readme-media/Google%20Sheets%20View%20(Automated%20Article%20Analysis%20&%20Insight%20Delivery%20Sheet).png)

> [!Note]
> **Pre-formatted Spreadsheet Template:**
> I have attached **[Automated Article Analysis & Insight Delivery Sheet.xlsx](Automated%20Article%20Analysis%20&%20Insight%20Delivery%20Sheet.xlsx?raw=true)** directly to the root of this repository! You can upload this file to your Google Drive and convert it to a Google Sheet to skip manually formatting your columns.

---

## Project Structure

```
Automated Article Analysis & Insight Delivery System/
│
├── readme-media/        # Media assets for the README (images & demo video)
│   ├── Article AI (Analysis Completed View).png
│   ├── Article AI (Desktop View).png
│   ├── Article AI (Mobile View).png
│   ├── Article Analysis - n8n Workflow.png
│   ├── Demo Video of Automated Article Analysis & Insight Delivery System.mp4
│   ├── Gmail View (Article AI Analysis).png
│   └── Google Sheets View (Automated Article Analysis & Insight Delivery Sheet).png
│
├── frontend/            # Client interface files
│   ├── index.html       # Structuring & elements
│   ├── style.css        # Layout & modern dark-theme rules
│   └── app.js           # Input validations, loader state, API fetch
│
├── backend/             # Python FastAPI backend gateway
│   ├── main.py          # FastAPI application & environment variables loader
│   ├── requirements.txt # Backend python dependencies list
│   └── venv/            # Python virtual environment (ignored by Git)
│
├── n8n/                 # Automation workflow configuration
│   └── Article Analysis Workflow.json # Import this file into n8n
│
├── .gitignore           # File rules for ignoring sensitive files (.env, caches)
├── .env                 # Local secrets configurations (ignored by Git)
├── docker-compose.yml   # Spins up the local n8n instance using Docker
├── LICENSE              # Proprietary license document
└── Automated Article Analysis & Insight Delivery Sheet.xlsx # Pre-configured Excel sheet template
```

---

## Installation & Setup Guide

Follow these steps to run the complete system on your local machine.

### Step 0 - Configure Environment Variables

Create a file named `.env` in the root directory of this project. Add the following variables to store your API keys and target Google Sheet ID:

```ini
# API Keys for n8n integrations
FIRECRAWL_API_KEY=your_firecrawl_api_key
GROQ_API_KEY=your_groq_api_key
GOOGLE_SHEET_ID=your_google_sheet_id

# Backend settings
N8N_WEBHOOK_URL=http://localhost:5678/webhook/article-analysis
ALLOWED_ORIGINS=*
```

*Note: The `.env` file is excluded from version control by `.gitignore` to keep your credentials safe.*

### Step 1 - Start n8n with Docker

Make sure Docker Desktop is running, then open your terminal in the project root and run:

```bash
docker compose up -d
```

n8n will boot up and be accessible in your web browser at **http://localhost:5678**. Follow the instructions to create your initial owner account.

### Step 2 - Import the n8n Workflow

1. In n8n, click **Workflows** in the left sidebar.
2. Select **Import from file** in the options menu.
3. Choose the [Article Analysis Workflow.json](n8n/Article%20Analysis%20Workflow.json) file.
4. The workflow will populate with all nodes pre-configured.

### Step 3 - Set Up Google Sheets Credential in n8n

1. In n8n, go to **Credentials** and click **Add Credential**.
2. Select **Google Sheets OAuth2** and complete the OAuth login flow to connect your Google account.
3. The imported workflow is preconfigured to load the Google Sheet ID dynamically from the environment (`GOOGLE_SHEET_ID` in your `.env` file). No manual configuration inside the node is required!

*To locate your Sheet ID:* Open your sheet in the browser. The URL contains:
`https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit`

### Step 4 - Set Up Gmail Credential in n8n

1. In n8n, go to **Credentials > Add Credential**.
2. Select **Gmail OAuth2** and sign in to connect your Gmail account.
3. Click the **Send Email** node in the workflow and ensure it uses this newly authorized credential.

### Step 5 - Activate the Workflow

1. In the top-right corner of the n8n workflow workspace, switch the toggle from **Inactive** to **Active**.
2. The endpoint `http://localhost:5678/webhook/article-analysis` is now ready to process requests.

### Step 6 - Run the FastAPI Backend

1. Open a new terminal window and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS / Linux
   python -m venv venv
   source venv/bin/activate
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
5. You can verify it is active by navigating to **http://localhost:8000** in your browser. You will see:
   `{"status": "running", "service": "Article Analysis API"}`

### Step 7 - Launch the Frontend

The frontend consists of static files and does not require a compilation step.

Simply double-click `frontend/index.html` to open it in your preferred browser.

---

## API Reference

### POST `/analyze`

Invoked by the frontend Javascript client.

**Request Body:**

```json
{
  "email": "user@example.com",
  "article_url": "https://example.com/sample-article"
}
```

**Success Response (200 OK):**

```json
{
  "session_id": "452b489a-ecf0-46da-bc43-2de370fbe776",
  "message": "Your article is being analyzed. Check your email shortly for results.",
  "status": "processing",
  "title": "Sample Article Title"
}
```

**Error Response (503 Service Unavailable):**

```json
{
  "detail": "Could not reach the workflow engine. Make sure n8n is running."
}
```

---

## Troubleshooting

- **CORS Errors in Browser Console:**
  Ensure the `ALLOWED_ORIGINS` environment variable in your `.env` matches the port your frontend is served on (e.g., `http://127.0.0.1:5500` or `*` for testing).
- **FastAPI returns 502/503 Error:**
  Verify that the docker container for n8n is active (`docker compose ps`) and the workflow toggle in n8n is set to **Active**.
- **n8n runs successfully but no email is received:**
  Check the n8n execution history (clock icon on the left panel) and confirm that the Send Email (Gmail) node is not showing an authorization error.
- **Firecrawl scraping failure:**
  Some websites utilize anti-scraping protections. Test the system using popular blogs or standard news platforms (e.g., TechCrunch, BBC, Medium).

---

## Author

* **Md. Tausif Jafar**
* **Email:** [mdtausifjafar@gmail.com](mailto:mdtausifjafar@gmail.com)
