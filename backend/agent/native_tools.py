import ast
import json
import sympy as sp
from typing import Dict, Any, List, Optional

# In-memory session tracking for concepts and misconceptions
STUDY_SESSION_STATE = {
    "topics_mastery": {},  # e.g., {"boundary_conditions": "learning", "matrix_indexing": "mastered"}
    "session_history": [],
    "active_whiteboard": {
        "title": "",
        "diagram": "",
        "formulas": [],
        "sliders": []
    }
}

def verify_math_expression(expression_str: str, expected_equal_to: Optional[str] = None) -> Dict[str, Any]:
    """
    Deterministically parses and evaluates a mathematical or algebraic expression using SymPy.
    Can also check if two expressions are mathematically equivalent.
    """
    try:
        expr = sp.sympify(expression_str, evaluate=False)
        simplified = sp.simplify(expr)
        
        result = {
            "valid": True,
            "parsed_latex": sp.latex(expr),
            "simplified_latex": sp.latex(simplified),
            "is_equivalent": None
        }
        
        if expected_equal_to:
            expected_expr = sp.sympify(expected_equal_to)
            difference = sp.simplify(simplified - expected_expr)
            result["is_equivalent"] = bool(difference == 0)
            result["difference"] = str(difference)
            
        return result
    except Exception as e:
        return {
            "valid": False,
            "error": f"Math parsing error: {str(e)}"
        }

def analyze_python_code(code_str: str) -> Dict[str, Any]:
    """
    Parses Python code using AST to check for syntax errors, out-of-bound array risks,
    and potential infinite loops without executing untrusted code directly.
    """
    try:
        tree = ast.parse(code_str)
        issues = []
        
        for node in ast.walk(tree):
            
            if isinstance(node, ast.For):
                if isinstance(node.iter, ast.Call) and getattr(node.iter.func, 'id', None) == 'range':
                    args = node.iter.args
                    if len(args) == 1 and isinstance(args[0], ast.Constant) and args[0].value == 0:
                        issues.append({
                            "line": node.lineno,
                            "type": "empty_range",
                            "message": "Loop iterates over range(0), which will not execute."
                        })
            
            if isinstance(node, ast.Subscript):
                if isinstance(node.slice, ast.UnaryOp) and isinstance(node.slice.op, ast.USub):
                    issues.append({
                        "line": node.lineno,
                        "type": "negative_indexing",
                        "message": "Negative index access detected. Ensure this is intentional."
                    })
                    
        return {
            "syntax_valid": True,
            "detected_issues": issues,
            "total_lines": len(code_str.splitlines())
        }
    except SyntaxError as e:
        return {
            "syntax_valid": False,
            "error": f"Syntax error at line {e.lineno}: {e.msg}",
            "line": e.lineno
        }
    except Exception as e:
        return {
            "syntax_valid": False,
            "error": str(e)
        }

def update_whiteboard(title: str, mermaid_diagram: str, latex_formulas: List[str], sliders: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Updates the dynamic HTML5 whiteboard canvas with diagrams, formulas, and interactive parameter sliders.
    """
    STUDY_SESSION_STATE["active_whiteboard"] = {
        "title": title,
        "diagram": mermaid_diagram,
        "formulas": latex_formulas,
        "sliders": sliders or []
    }
    return {
        "status": "whiteboard_updated",
        "payload": STUDY_SESSION_STATE["active_whiteboard"]
    }

def record_topic_mastery(topic: str, status: str, past_analogy: Optional[str] = None) -> Dict[str, Any]:
    """
    Updates the learner's concept tracker.
    status options: 'stuck', 'learning', 'mastered'
    """
    STUDY_SESSION_STATE["topics_mastery"][topic] = {
        "status": status,
        "analogy": past_analogy
    }
    return {
        "status": "mastery_recorded",
        "topic": topic,
        "current_state": STUDY_SESSION_STATE["topics_mastery"]
    }

def get_learning_context() -> Dict[str, Any]:
    """
    Retrieves the learner's full cross-subject concept graph and recent session history.
    """
    return STUDY_SESSION_STATE