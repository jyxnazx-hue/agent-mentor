from typing import Dict, Any

# In-memory store for the session's state
_SESSION_STATE = {
    "compass_checklist": [],
    "flashcards": [],
    "concept_graph": []
}

def update_checklist(topic: str, action: str, status: str = "pending") -> Dict[str, Any]:
    """Adds or updates a review item in the student's Study Compass checklist."""
    item = {"topic": topic, "action": action, "status": status}
    _SESSION_STATE["compass_checklist"].append(item)
    return {
        "status": "success", 
        "message": f"Added '{action}' to the checklist.",
        "checklist_total": len(_SESSION_STATE["compass_checklist"])
    }

def generate_flashcard(subject: str, term: str, definition: str) -> Dict[str, Any]:
    """Creates a formula or concept flashcard automatically in the background."""
    card = {"subject": subject, "term": term, "definition": definition}
    _SESSION_STATE["flashcards"].append(card)
    return {"status": "success", "total_cards": len(_SESSION_STATE["flashcards"])}

def add_concept_link(source_topic: str, target_topic: str, analogy: str) -> Dict[str, Any]:
    """Creates a link in the interactive cross-subject brain map."""
    link = {"source": source_topic, "target": target_topic, "analogy": analogy}
    _SESSION_STATE["concept_graph"].append(link)
    return {"status": "success", "message": f"Linked {source_topic} to {target_topic}"}

def get_compass_state() -> Dict[str, Any]:
    """Retrieves the full state of the Study Compass for the React frontend to render."""
    return _SESSION_STATE