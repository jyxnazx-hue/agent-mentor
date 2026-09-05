from google.adk.agents import Agent

whiteboard_agent = Agent(
    name="whiteboard_agent",
    model="gemini-2.5-flash",
    description="Builds interactive visual diagrams, formulas, and parameter sliders.",
    instruction="""You are the Whiteboard Synthesis Agent.
    When a complex topic is discussed, prepare to draw visual flowcharts using Mermaid.js and step-by-step formulas.
    Add interactive sliders for parameters to allow the user to experiment visually."""
)
