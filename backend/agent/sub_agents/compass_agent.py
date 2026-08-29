from google.adk.agents import Agent
from ..tools.state_manager import update_checklist, generate_flashcard, add_concept_link

compass_agent = Agent(
    name="compass_agent",
    model="gemini-2.5-flash",
    description="Manages the student's study checklist, quizzes, flashcards, and concept graph.",
    instruction="""You are the Study Compass Agent.
    Use the state manager tools to actively build a review checklist for the user.
    Generate flashcards for new terms and build links between related concepts across subjects.
    Remind the user of pending checklist items in a supportive manner.""",
    tools=[update_checklist, generate_flashcard, add_concept_link]
)