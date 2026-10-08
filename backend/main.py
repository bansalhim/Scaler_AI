import os
import asyncio
import random
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from database import SessionLocal, engine, Base
from models import Message, Conversation, User

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Create uploads folder if missing
os.makedirs("uploads", exist_ok=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images statically
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, conversation_id: int):
        await websocket.accept()
        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = []
        self.active_connections[conversation_id].append(websocket)

    def disconnect(self, websocket: WebSocket, conversation_id: int):
        if conversation_id in self.active_connections:
            self.active_connections[conversation_id].remove(websocket)

    async def broadcast(self, message: dict, conversation_id: int):
        if conversation_id in self.active_connections:
            for connection in self.active_connections[conversation_id]:
                await connection.send_json(message)

manager = ConnectionManager()

AUTO_REPLIES = [
    "Hey! I am doing great, how about you?",
    "Got it! Thanks for letting me know.",
    "Sounds good! Let's connect on this later.",
    "Hey! I am checking this right now.",
    "Awesome, thanks for the update! 👍",
    "Sure thing! I will review and reply back soon."
]

# --- FILE UPLOAD ENDPOINT ---

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename.replace(" ", "_")
    file_path = f"uploads/{filename}"
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    return {"url": f"http://localhost:8000/uploads/{filename}"}

# --- REST ENDPOINTS ---

@app.get("/api/conversations")
def get_conversations(db: Session = Depends(get_db)):
    conversations = db.query(Conversation).all()
    result = []
    for c in conversations:
        last_msg = (
            db.query(Message)
            .filter(Message.conversation_id == c.id)
            .order_by(Message.id.desc())
            .first()
        )
        
        result.append({
            "id": c.id,
            "name": getattr(c, "name", None),
            "is_group": getattr(c, "is_group", False),
            "last_message": last_msg.content if last_msg else "",
            "last_message_time": (
                last_msg.created_at.isoformat() 
                if last_msg and hasattr(last_msg, "created_at") and last_msg.created_at 
                else ""
            ),
            "members": [
                {
                    "id": m.id,
                    "display_name": m.display_name,
                    "is_online": getattr(m, "is_online", False)
                } for m in getattr(c, "members", [])
            ]
        })
    return result

@app.get("/api/conversations/{conversation_id}/messages")
def get_messages(conversation_id: int, db: Session = Depends(get_db)):
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.id.asc())
        .all()
    )
    result = []
    for m in messages:
        sender = db.query(User).filter(User.id == m.sender_id).first() if hasattr(m, "sender_id") else None
        created_at_str = m.created_at.isoformat() if hasattr(m, "created_at") and m.created_at else None
        
        result.append({
            "id": m.id,
            "conversation_id": m.conversation_id,
            "sender_id": getattr(m, "sender_id", 1),
            "sender_name": getattr(sender, "display_name", "User"),
            "content": getattr(m, "content", ""),
            "status": getattr(m, "status", "read"),
            "created_at": created_at_str
        })
    return result

@app.post("/api/messages")
def create_message(payload: dict, db: Session = Depends(get_db)):
    conversation_id = payload.get("conversation_id")
    sender_id = payload.get("sender_id", 1)
    content = payload.get("content", "")

    if not conversation_id or not content:
        raise HTTPException(status_code=400, detail="Missing conversation_id or content")

    new_msg = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content,
        status="read"
    )
    db.add(new_msg)
    
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conv and hasattr(conv, "last_message"):
        setattr(conv, "last_message", "[Image]" if content.startswith("[IMAGE]:") else content)

    db.commit()
    db.refresh(new_msg)

    created_at_str = new_msg.created_at.isoformat() if hasattr(new_msg, "created_at") and new_msg.created_at else None

    return {
        "id": new_msg.id,
        "conversation_id": new_msg.conversation_id,
        "sender_id": new_msg.sender_id,
        "content": new_msg.content,
        "status": new_msg.status,
        "created_at": created_at_str
    }

# --- WEBSOCKET ENDPOINT ---

@app.websocket("/ws/chat/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: int):
    await manager.connect(websocket, conversation_id)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.broadcast(data, conversation_id)

            if data.get("sender_id") == 1:
                await asyncio.sleep(2)
                reply_text = random.choice(AUTO_REPLIES)

                db = SessionLocal()
                
                conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
                contact_member = None
                if conv and hasattr(conv, "members"):
                    contact_member = next((m for m in conv.members if m.id != 1), None)
                
                reply_sender_id = contact_member.id if contact_member else 2
                reply_sender_name = contact_member.display_name if contact_member else "Rohan"

                new_msg = Message(
                    conversation_id=conversation_id,
                    sender_id=reply_sender_id,
                    content=reply_text,
                    status="read"
                )
                db.add(new_msg)

                if conv and hasattr(conv, "last_message"):
                    setattr(conv, "last_message", reply_text)

                db.commit()
                db.refresh(new_msg)

                created_at_str = new_msg.created_at.isoformat() if hasattr(new_msg, "created_at") and new_msg.created_at else None

                reply_payload = {
                    "id": new_msg.id,
                    "conversation_id": conversation_id,
                    "sender_id": new_msg.sender_id,
                    "sender_name": reply_sender_name,
                    "content": new_msg.content,
                    "status": new_msg.status,
                    "created_at": created_at_str
                }
                db.close()

                await manager.broadcast(reply_payload, conversation_id)

    except WebSocketDisconnect:
        manager.disconnect(websocket, conversation_id)