import os
import json
import asyncio
import base64
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types

app = FastAPI(title="AgentMentor Live Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "agent-507012")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

client = genai.Client(
    vertexai=True,
    project=PROJECT_ID,
    location=LOCATION
)

tools = [
    {
        "function_declarations": [
            {
                "name": "calculate_screen_coordinates",
                "description": "Calculates and highlights a 2D bounding box on the user's canvas to spotlight an equation or step.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "ymin": {"type": "NUMBER", "description": "Top normalized (0-1000)"},
                        "xmin": {"type": "NUMBER", "description": "Left normalized (0-1000)"},
                        "ymax": {"type": "NUMBER", "description": "Bottom normalized (0-1000)"},
                        "xmax": {"type": "NUMBER", "description": "Right normalized (0-1000)"},
                        "label": {"type": "STRING", "description": "Spotlight label"}
                    },
                    "required": ["ymin", "xmin", "ymax", "xmax", "label"]
                }
            },
            {
                "name": "generate_flashcard",
                "description": "Generates a structured active-recall study flashcard.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "topic": {"type": "STRING", "description": "Subject or unit title"},
                        "question": {"type": "STRING", "description": "Prompt or theorem name"},
                        "answer": {"type": "STRING", "description": "Mathematical explanation"}
                    },
                    "required": ["topic", "question", "answer"]
                }
            },
            {
                "name": "update_checklist",
                "description": "Adds or updates an item in the student's study mastery checklist.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "item": {"type": "STRING", "description": "Task description"},
                        "status": {"type": "STRING", "enum": ["pending", "completed"]}
                    },
                    "required": ["item", "status"]
                }
            },
            {
                "name": "synthesize_notes",
                "description": "Summarizes canvas work into structured Markdown notes.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "title": {"type": "STRING", "description": "Note title"},
                        "markdown_content": {"type": "STRING", "description": "Markdown body"}
                    },
                    "required": ["title", "markdown_content"]
                }
            }
        ]
    }
]

SYSTEM_INSTRUCTION = """
You are AgentMentor, an expert multimodal academic tutor.
You observe the user's canvas in real-time.
- Analyze equations and call calculate_screen_coordinates to visually highlight relevant areas.
- Call generate_flashcard, update_checklist, or synthesize_notes when key milestones or formulas are discussed.
- Keep spoken and written responses concise and supportive.
"""

@app.get("/")
async def root():
    return {"status": "AgentMentor Live Gateway Operational"}

@app.websocket("/ws/live")
async def live_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Frontend connected to live gateway.")

    live_config = {
        "response_modalities": ["AUDIO"],
        "speech_config": {
            "voice_config": {
                "prebuilt_voice_config": {
                    "voice_name": "Puck"
                }
            }
        },
        "system_instruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
        "tools": tools
    }

    try:
        async with client.aio.live.connect(model="gemini-2.0-flash-exp", config=live_config) as session:
            print("Connected to Gemini Live session.")

            async def receive_from_client():
                try:
                    while True:
                        msg_raw = await websocket.receive_text()
                        data = json.loads(msg_raw)
                        msg_type = data.get("type")

                        if msg_type == "audio":
                            audio_bytes = base64.b64decode(data.get("data", ""))
                            await session.send(input={"data": audio_bytes, "mime_type": "audio/pcm;rate=16000"}, end_of_turn=False)

                        elif msg_type == "canvas_frame":
                            image_bytes = base64.b64decode(data.get("data", ""))
                            await session.send(input={"data": image_bytes, "mime_type": "image/jpeg"}, end_of_turn=False)

                        elif msg_type == "text":
                            await session.send(input=data.get("text", ""), end_of_turn=True)

                        elif msg_type == "ping":
                            await websocket.send_text(json.dumps({"type": "pong"}))

                except WebSocketDisconnect:
                    print("Client disconnected.")
                except Exception as e:
                    print(f"Receive error: {e}")

            async def send_to_client():
                try:
                    async for response in session.receive():
                        server_content = response.server_content
                        if server_content is not None and server_content.model_turn is not None:
                            for part in server_content.model_turn.parts:
                                if part.inline_data is not None:
                                    b64_audio = base64.b64encode(part.inline_data.data).decode("utf-8")
                                    await websocket.send_text(json.dumps({
                                        "type": "audio",
                                        "data": b64_audio
                                    }))
                                if part.text:
                                    await websocket.send_text(json.dumps({
                                        "type": "text",
                                        "data": part.text
                                    }))

                        if response.tool_call is not None:
                            for call in response.tool_call.function_calls:
                                print(f"Agent tool executed: {call.name} -> {call.args}")
                                await websocket.send_text(json.dumps({
                                    "type": "tool_call",
                                    "function": call.name,
                                    "args": call.args
                                }))
                                await session.send(
                                    input=types.LiveClientToolResponse(
                                        function_responses=[
                                            types.FunctionResponse(
                                                name=call.name,
                                                id=call.id,
                                                response={"status": "success"}
                                            )
                                        ]
                                    )
                                )

                except Exception as e:
                    print(f"Send error: {e}")

            await asyncio.gather(receive_from_client(), send_to_client())

    except WebSocketDisconnect:
        print("WebSocket disconnected.")
    except Exception as err:
        print(f"Live Gateway session error: {err}")