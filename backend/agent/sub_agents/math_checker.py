from google.adk.agents import Agent
from ..tools.math_tools import verify_math_step, calculate_screen_coordinates

math_checker_agent = Agent(
    name="math_checker_agent",
    model="gemini-2.5-flash",
    description="Validates mathematical equations and identifies errors on screen.",
    instruction="""You are the Math Step Checker. 
    Use the verify_math_step tool to validate equations.
    If an error is found, use calculate_screen_coordinates to find its location.
    Do not provide the direct solution. Ask a guiding question to help the user identify the mistake.""",
    tools=[verify_math_step, calculate_screen_coordinates]
)
