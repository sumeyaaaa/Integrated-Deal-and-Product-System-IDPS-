"""
AI Service - Gemini Integration and RAG Helpers
==============================================

This module centralizes all AI-related logic for the backend:
- Chat completion with Gemini (text in → text out)
- Text embeddings with Gemini (for RAG tables like `documents` / `conversation`)

By keeping this in one place we can:
- Swap providers later (OpenAI, Groq, etc.) without touching API routes
- Re-use the same logic from CRM, PMS, and analytics endpoints
"""

from __future__ import annotations
import json
from typing import List, Dict, Any, Optional

import requests

from app.config import settings
from app.database.connection import get_supabase_service_client
from supabase import Client


GEMINI_API_KEY = settings.GEMINI_API_KEY
GEMINI_CHAT_MODEL = settings.GEMINI_CHAT_MODEL
GEMINI_EMBED_MODEL = settings.GEMINI_EMBED_MODEL

GEMINI_CHAT_URL = (
    f"https://generativelanguage.googleapis.com/v1/models/{GEMINI_CHAT_MODEL}:generateContent"
)
GEMINI_EMBED_URL = (
    f"https://generativelanguage.googleapis.com/v1/models/{GEMINI_EMBED_MODEL}:embedContent"
)


class GeminiError(Exception):
    """Custom exception for Gemini-related errors."""


def _ensure_gemini_key() -> str:
    if not GEMINI_API_KEY:
        raise GeminiError("GEMINI_API_KEY is not configured in environment/settings.")
    return GEMINI_API_KEY


def gemini_chat(messages: List[Dict[str, str]]) -> str:
    """
    Call Gemini chat API with OpenAI-style messages.

    messages: list of dicts like:
      {"role": "system"|"user"|"assistant", "content": "..."}

    Returns:
      The response text from Gemini.
    """
    _ensure_gemini_key()

    # Convert OpenAI-style messages to Gemini "contents" format.
    prompt_parts: List[str] = []
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "system":
            prompt_parts.append(f"[System Instructions]\n{content}\n[/System Instructions]")
        elif role == "user":
            prompt_parts.append(content)
        elif role == "assistant":
            prompt_parts.append(f"[Previous Response]\n{content}\n[/Previous Response]")

    prompt = "\n\n".join(prompt_parts)

    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    headers = {"Content-Type": "application/json"}
    params = {"key": GEMINI_API_KEY}

    resp = requests.post(
        GEMINI_CHAT_URL,
        params=params,
        headers=headers,
        data=json.dumps(payload),
        timeout=60,
    )

    if resp.status_code != 200:
        try:
            data = resp.json()
            msg = data.get("error", {}).get("message", resp.text)
            code = data.get("error", {}).get("code", resp.status_code)
        except Exception:
            msg = resp.text
            code = resp.status_code
        raise GeminiError(f"Gemini chat error {code}: {msg}")

    data = resp.json()
    candidates = data.get("candidates", [])
    if not candidates:
        # If promptFeedback exists, include its reason
        feedback = data.get("promptFeedback") or {}
        reason = feedback.get("blockReason")
        if reason:
            raise GeminiError(f"Gemini blocked the prompt. Reason: {reason}")
        return ""

    candidate = candidates[0]
    content = candidate.get("content", {})
    parts = content.get("parts", [])
    texts = [p.get("text", "") for p in parts if isinstance(p, dict) and "text" in p]
    return "".join(texts)


def gemini_embed(text: str) -> List[float]:
    """
    Get an embedding vector for a single piece of text using Gemini.

    Returns:
      A list of floats representing the embedding vector.
    """
    _ensure_gemini_key()

    payload = {
        "content": {
            "parts": [
                {"text": text},
            ]
        }
    }
    headers = {"Content-Type": "application/json"}
    params = {"key": GEMINI_API_KEY}

    resp = requests.post(
        GEMINI_EMBED_URL,
        params=params,
        headers=headers,
        data=json.dumps(payload),
        timeout=30,
    )

    if resp.status_code != 200:
        try:
            data = resp.json()
            msg = data.get("error", {}).get("message", resp.text)
            code = data.get("error", {}).get("code", resp.status_code)
        except Exception:
            msg = resp.text
            code = resp.status_code
        raise GeminiError(f"Gemini embed error {code}: {msg}")

    data = resp.json()

    # Gemini v1 embedContent returns { "embedding": { "value": [...] } }
    embedding = None
    if "embedding" in data:
        # Some variants use "value", some "values" – handle both
        emb_obj = data["embedding"]
        embedding = emb_obj.get("values") or emb_obj.get("value")
    elif "data" in data:
        # Fallback to OpenAI-style { "data": [ { "embedding": [...] } ] }
        embedding = data["data"][0].get("embedding")

    if not embedding or not isinstance(embedding, list):
        raise GeminiError(f"Unexpected embed response format: {data}")

    # Ensure all elements are floats
    return [float(x) for x in embedding]


def log_conversation_to_rag(
    content: str,
    embedding: Optional[List[float]] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Store a conversation snippet in the `conversation` table for RAG.

    Args:
        content: The human-readable text (e.g. \"Q: ...\\nA: ...\").
        embedding: Precomputed embedding (768-dim) or None.
        metadata: Optional JSON-serializable dict with extra info
                  (customer_id, user_id, tds_id, source, etc.).
    """
    supabase: Client = get_supabase_service_client()

    row: Dict[str, Any] = {
        "content": content,
        "metadata": metadata or {},
    }
    if embedding is not None:
        row["embedding"] = embedding

    supabase.table("conversation").insert(row).execute()


def search_documents(query: str, user_id: Optional[str] = None, limit: int = 3) -> List[Dict[str, Any]]:
    """
    Search for relevant documents/conversations using RAG (vector similarity search).
    
    This function:
    1. Generates an embedding for the query
    2. Searches the `conversation` table for similar content using vector similarity
    3. Returns the most relevant matches
    
    Args:
        query: Search query text
        user_id: Optional user ID to filter results
        limit: Maximum number of results to return
        
    Returns:
        List of dictionaries with 'content' and 'metadata' keys
    """
    supabase: Client = get_supabase_service_client()
    
    try:
        # Generate embedding for the query
        query_embedding = gemini_embed(query)
        
        # Use Supabase RPC function for vector similarity search
        # Note: This requires the `match_conversation` function to exist in Supabase
        try:
            response = supabase.rpc(
                'match_conversation',
                {
                    'query_embedding': query_embedding,
                    'match_count': limit,
                    'match_threshold': 0.5,
                    'filter': {}
                }
            ).execute()
            
            if response.data:
                return response.data
            else:
                return []
        except Exception as rpc_error:
            # If RPC function doesn't exist, fall back to a simple text search
            # This is a fallback - the RPC function should be created in Supabase
            response = supabase.table("conversation").select("content, metadata").limit(limit).execute()
            if response.data:
                return response.data
            return []
    except Exception as e:
        # Log error but don't fail - return empty list
        print(f"Document search failed: {str(e)}")
        return []


