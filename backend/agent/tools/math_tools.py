import sympy as sp
from typing import Dict, Any, Optional

def verify_math_step(expression: str, target: Optional[str] = None) -> Dict[str, Any]:
    """
    Deterministically validates mathematical expressions. 
    If a target is provided, it checks if the two expressions are mathematically equivalent.
    """
    try:
        parsed = sp.sympify(expression, evaluate=False)
        simplified = sp.simplify(parsed)
        is_equivalent = None
        
        if target:
            is_equivalent = bool(sp.simplify(simplified - sp.sympify(target)) == 0)
            
        return {
            "valid": True,
            "simplified_expression": str(simplified),
            "is_equivalent": is_equivalent
        }
    except Exception as e:
        return {"valid": False, "error": f"Parse error: {str(e)}"}

def calculate_screen_coordinates(error_line_number: int, total_lines: int) -> Dict[str, Any]:
    """
    Calculates normalized bounding box coordinates for the frontend SVG overlay.
    Outputs coordinates in the [ymin, xmin, ymax, xmax] format (0 to 1000 scale).
    """
    # Simulated coordinate mapping based on line position
    y_unit = 1000 // max(total_lines, 1)
    ymin = (error_line_number - 1) * y_unit
    ymax = error_line_number * y_unit
    
    return {
        "box_2d": [ymin, 50, ymax, 950] 
    }