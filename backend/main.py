"""
FastAPI backend for the Article Analysis system.

What this does:
- Accepts the user's email and article URL from the frontend
- Generates a unique session ID for tracking
- Sends all three fields to the n8n webhook to kick off the AI workflow
- Returns a status so the frontend knows the request was received
"""

import uuid
import httpx
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from pydantic import BaseModel, EmailStr, HttpUrl

# Load environment variables
load_dotenv()


# Set up basic logging so we can see what is happening in the terminal
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Article Analysis API",
    description="Receives user input and forwards it to the n8n workflow",
    version="1.0.0",
)

# Allow the frontend (running on a different port) to call this API
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# The n8n webhook URL - this is what n8n gives you when you set up a Webhook node
# Replace this with your actual webhook URL after importing the n8n workflow
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "http://localhost:5678/webhook/article-analysis")



# This defines what data the frontend must send us
class AnalysisRequest(BaseModel):
    email: EmailStr
    article_url: HttpUrl


# This is the shape of what we send back to the frontend
class AnalysisResponse(BaseModel):
    session_id: str
    message: str
    status: str
    title: str = ""


@app.get("/")
async def root():
    """Health check endpoint so you can verify the server is running."""
    return {"status": "running", "service": "Article Analysis API"}


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_article(request: AnalysisRequest):
    """
    Main endpoint that the frontend calls.

    Steps:
    1. Generate a unique session ID
    2. Build the payload for n8n
    3. POST the payload to the n8n webhook
    4. Return the session ID to the frontend
    """

    # Generate a unique ID for this analysis session
    session_id = str(uuid.uuid4())

    # Build the payload that n8n will receive
    payload = {
        "email": str(request.email),
        "article_url": str(request.article_url),
        "session_id": session_id,
    }

    logger.info(f"Starting analysis - session: {session_id}, email: {request.email}")

    # Forward the payload to n8n using an async HTTP client
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(N8N_WEBHOOK_URL, json=payload)
            response.raise_for_status()
            logger.info(f"n8n accepted the request for session: {session_id}")
    except httpx.TimeoutException:
        logger.error(f"n8n timed out for session: {session_id}")
        raise HTTPException(
            status_code=504,
            detail="The workflow engine timed out. Please try again.",
        )
    except httpx.HTTPStatusError as e:
        logger.error(f"n8n returned an error: {e.response.status_code}")
        raise HTTPException(
            status_code=502,
            detail=f"Workflow engine returned an error: {e.response.status_code}",
        )
    except httpx.RequestError as e:
        logger.error(f"Could not reach n8n: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Could not reach the workflow engine. Make sure n8n is running.",
        )

    try:
        n8n_data = response.json()
        title = n8n_data.get("title", "")
    except Exception as e:
        logger.error(f"Failed to parse JSON response from n8n: {str(e)}. Response content: {response.text}")
        raise HTTPException(
            status_code=502,
            detail="The workflow completed but n8n returned an empty or invalid response. Please check your n8n workflow execution logs.",
        )

    return AnalysisResponse(
        session_id=session_id,
        message="Your article is being analyzed. Check your email shortly for results.",
        status="processing",
        title=title,
    )
