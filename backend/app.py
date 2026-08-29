import os
import json
import asyncio
import base64
import traceback
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types

app = FastAPI(title="AgentMentor Live Gateway")

# Enable CORS for frontend development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize GenAI Client
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "agent-507012")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

client = genai.Client(
    vertexai=True,
    project=PROJECT_ID,
    location=LOCATION,
    http_options={"api_version": "v1"}
)

MODEL_ID = "gemini-2.0-flash-exp"

SYSTEM_INSTRUCTION = """
You are AgentMentor, an expert multimodal co-pilot and tutor for university-level Calculus, High-Performance Computing (HPC), and Computational Physics.

Your core behaviors:
1. Socratic Guidance: Never dump immediate full solutions. Walk through problems step-by-step.
2. Multimodal Vision: You receive 1 FPS snapshots of the student's canvas. When verifying handwritten math or diagrams, identify specific coordinate regions where relevant concepts or mistakes occur.
3. Proactive Tool Usage:
   - Use `calculate_screen_coordinates` to place bounding boxes [ymin, xmin, ymax, xmax] (scale 0-1000) around specific formula steps or diagram regions.
   - Use `update_checklist` whenever a student needs to review or practice a sub-topic.
   - Use `generate_flashcard` when key theorems, formulas, or definitions are established.
   - Use `trigger_whiteboard_write` to programmatically draw derivations or graphs on the user's canvas.
"""

# Tool Declarations
tool_calculate_coordinates = types.FunctionDeclaration(
    name="calculate_screen_coordinates",
    description="Highlights a specific region on the canvas using normalized coordinates (0-1000).",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "box_2d": {
                "type": types.Type.ARRAY,
                "items": types.Schema(type=types.Type.INTEGER),
                "description": "[ymin, xmin, ymax, xmax] normalized bounding box coordinates."
            },
            "label": {
                "type": types.Type.STRING,
                "description": "Short explanation for what is highlighted."
            }
        },
        required=["box_2d"]
    )
)

tool_update_checklist = types.FunctionDeclaration(
    name="update_checklist",
    description="Adds a study or review action item to the student's Study Compass checklist.",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "topic": {"type": types.Type.STRING, "description": "Subject or concept topic."},
            "action": {"type": types.Type.STRING, "description": "Specific action the student needs to take."},
            "status": {"type": types.Type.STRING, "enum": ["pending", "completed"]}
        },
        required=["topic", "action"]
    )
)

tool_generate_flashcard = types.FunctionDeclaration(
    name="generate_flashcard",
    description="Extracts and saves a key definition, formula, or theorem card.",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "term": {"type": types.Type.STRING, "description": "Name of the concept, theorem, or term."},
            "definition": {"type": types.Type.STRING, "description": "Clear and concise mathematical definition or formula."},
            "subject": {"type": types.Type.STRING, "description": "Subject name, e.g. Calculus III or HPC."}
        },
        required=["term", "definition"]
    )
)

tool_trigger_whiteboard = types.FunctionDeclaration(
    name="trigger_whiteboard_write",
    description="Programmatically writes step-by-step derivations or annotations directly on the canvas.",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "steps": {
                "type": types.Type.ARRAY,
                "items": types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "type": {"type": types.Type.STRING, "enum": ["text", "line"]},
                        "text": {"type": types.Type.STRING},
                        "x": {"type": types.Type.INTEGER},
                        "y": {"type": types.Type.INTEGER}
                    }
                ),
                "description": "Ordered drawing commands to execute sequentially."
            }
        },
        required=["steps"]
    )
)

TOOLS = [types.Tool(function_declarations=[
    tool_calculate_coordinates,
    tool_update_checklist,
    tool_generate_flashcard,
    tool_trigger_whiteboard
])]


@app.get("/")
def read_root():
    return {"status": "AgentMentor Live Gateway Operational"}


@app.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected to Live Session.")

    config = types.LiveConnectConfig(
        response_modalities=[types.LiveModality.AUDIO],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Aoede")
            )
        ),
        system_instruction=types.Content(
            parts=[types.Part.from_text(text=SYSTEM_INSTRUCTION)]
        ),
        tools=TOOLS
    )

    try:
        async with client.aio.live.connect(model=MODEL_ID, config=config) as session:
            
            async def receive_from_client():
                """Reads audio frames, canvas snapshots, and text messages from the React app."""
                try:
                    while True:
                        raw_data = await websocket.receive_text()
                        payload = json.loads(raw_data)
                        msg_type = payload.get("type")

                        if msg_type == "audio":
                            pcm_bytes = base64.b64decode(payload["data"])
                            await session.send(
                                input=types.LiveClientRealtimeInput(
                                    media_chunks=[
                                        types.Blob(data=pcm_bytes, mime_type="audio/pcm;rate=16000")
                                    ]
                                )
                            )
                        elif msg_type == "image":
                            img_bytes = base64.b64decode(payload["data"])
                            await session.send(
                                input=types.LiveClientRealtimeInput(
                                    media_chunks=[
                                        types.Blob(data=img_bytes, mime_type="image/jpeg")
                                    ]
                                )
                            )
                        elif msg_type == "text":
                            await session.send(
                                input=types.Content(
                                    parts=[types.Part.from_text(text=payload["text"])]
                                ),
                                end_of_turn=True
                            )
                except WebSocketDisconnect:
                    print("Client disconnected from input stream.")
                except Exception as e:
                    print(f"Error reading client data: {e}")

            async def send_to_client():
                """Streams Gemini Live audio responses and tool executions back to the client."""
                try:
                    async for response in session.receive():
                        server_content = response.server_content
                        if server_content is not None:
                            model_turn = server_content.model_turn
                            if model_turn is not None:
                                for part in model_turn.parts:
                                    # Forward raw audio chunks
                                    if part.inline_data:
                                        audio_b64 = base64.b64encode(part.inline_data.data).decode("utf-8")
                                        await websocket.send_text(json.dumps({
                                            "type": "audio",
                                            "data": audio_b64
                                        }))

                        # Forward tool call requests
                        tool_call = response.tool_call
                        if tool_call is not None:
                            for func_call in tool_call.function_calls:
                                print(f"Executing tool: {func_call.name} with args: {func_call.args}")
                                await websocket.send_text(json.dumps({
                                    "type": "tool_call",
                                    "function": func_call.name,
                                    "args": func_call.args
                                }))
                                # Send confirmation response back to model
                                await session.send(
                                    input=types.LiveClientToolResponse(
                                        function_responses=[
                                            types.FunctionResponse(
                                                name=func_call.name,
                                                id=func_call.id,
                                                response={"status": "success", "executed_on_canvas": True}
                                            )
                                        ]
                                    )
                                )
                except Exception as e:
                    print(f"Error sending to client: {e}")
                    traceback.print_exc()

            await asyncio.gather(receive_from_client(), send_to_client())

    except Exception as e:
        print(f"Session error: {e}")
        traceback.print_exc()
    finally:
        print("Live Session closed.")