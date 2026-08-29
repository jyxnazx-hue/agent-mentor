from typing import Dict, Any

# Simulated vector database for uploaded materials
_VECTOR_STORE = []

def index_multimedia_content(title: str, content_type: str, content_data: str) -> Dict[str, Any]:
    """
    Simulates vectorizing and indexing uploaded PDFs, notes, or video transcripts.
    content_type can be 'pdf', 'handwritten_note', or 'video_transcript'.
    """
    doc = {
        "title": title,
        "type": content_type,
        "summary": content_data[:150] + "..." 
    }
    _VECTOR_STORE.append(doc)
    return {"status": "success", "message": f"Indexed {content_type} '{title}' successfully."}

def search_multimedia_context(query: str) -> Dict[str, Any]:
    """
    Simulates a vector search to find relevant context from uploaded materials.
    """
    if not _VECTOR_STORE:
        return {"status": "empty", "message": "No materials uploaded yet."}
    
    # Mock search hit returning the most recent uploaded document
    best_match = _VECTOR_STORE[-1]
    return {
        "status": "success", 
        "results": [
            {
                "source": best_match["title"], 
                "snippet": f"Found relevant explanation for '{query}' in the uploaded material.",
                "type": best_match["type"]
            }
        ]
    }