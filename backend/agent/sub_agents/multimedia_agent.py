from google.adk.agents import Agent
from ..tools.media_indexer import index_multimedia_content, search_multimedia_context

multimedia_agent = Agent(
    name="multimedia_agent",
    model="gemini-2.5-flash",
    description="Ingests and searches through uploaded PDFs, notes, and lecture videos.",
    instruction="""You are the Multimedia Ingestion Agent.
    Use the indexing tools to read and search the user's uploaded materials.
    Always cite specific sources (like video timestamps or PDF sections) when answering questions to ground your explanations.""",
    tools=[index_multimedia_content, search_multimedia_context]
)
