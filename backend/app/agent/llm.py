"""
Thin wrapper around the chat model so the rest of the agent code never
imports a provider SDK directly. The product spec calls for Gemini 2.5 Pro;
LangChain's chat-model interface is uniform enough that swapping providers
later (or supporting several, per Phase 8's multi-cloud ambitions) is a
one-line change here rather than a rewrite of the graph.
"""
from app.config import settings


def get_chat_model():
    from langchain_google_genai import ChatGoogleGenerativeAI

    if not settings.google_api_key:
        raise RuntimeError(
            "GOOGLE_API_KEY is not set. Add it to backend/.env to enable the "
            "planner -- see README.md for where to get a key."
        )

    return ChatGoogleGenerativeAI(
        model=settings.llm_model,
        google_api_key=settings.google_api_key,
        temperature=0.1,
    )
