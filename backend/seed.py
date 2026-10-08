from database import SessionLocal, engine, Base
from models import User, Conversation, Message

# Reset tables completely to re-seed clean data
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# 1. Seed Users (Indian Names)
u_you = User(phone_number="+1000000000", display_name="Himanshu Bansal", avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=HB", is_online=True)
u_rohan = User(phone_number="+1234567890", display_name="Rohan", avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=Rohan", is_online=True)
u_ananya = User(phone_number="+1987654321", display_name="Ananya", avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=Ananya", is_online=False)
u_priya = User(phone_number="+1555111222", display_name="Priya", avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=Priya", is_online=True)
u_rahul = User(phone_number="+1555333444", display_name="Rahul", avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=Rahul", is_online=True)
u_vikram = User(phone_number="+1555555666", display_name="Vikram", avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=Vikram", is_online=False)

db.add_all([u_you, u_rohan, u_ananya, u_priya, u_rahul, u_vikram])
db.commit()

# 2. Seed Conversations (1 Group + 5 Individual Chats)
c_group = Conversation(is_group=True, name="Dev Team Group", avatar_url="https://api.dicebear.com/7.x/identicon/svg?seed=DevTeam")
c_group.members.extend([u_you, u_rohan, u_ananya, u_rahul, u_vikram])

c_rohan = Conversation(is_group=False, name="Rohan")
c_rohan.members.extend([u_you, u_rohan])

c_ananya = Conversation(is_group=False, name="Ananya")
c_ananya.members.extend([u_you, u_ananya])

c_priya = Conversation(is_group=False, name="Priya")
c_priya.members.extend([u_you, u_priya])

c_rahul = Conversation(is_group=False, name="Rahul")
c_rahul.members.extend([u_you, u_rahul])

c_vikram = Conversation(is_group=False, name="Vikram")
c_vikram.members.extend([u_you, u_vikram])

db.add_all([c_group, c_rohan, c_ananya, c_priya, c_rahul, c_vikram])
db.commit()

# 3. Seed Messages

# Group Messages
db.add_all([
    Message(conversation_id=c_group.id, sender_id=u_rahul.id, content="Hey everyone, is the deployment complete?", status="read"),
    Message(conversation_id=c_group.id, sender_id=u_vikram.id, content="Yes, server is up and running!", status="read"),
    Message(conversation_id=c_group.id, sender_id=u_you.id, content="Testing the APIs now 👍", status="read"),
    Message(conversation_id=c_group.id, sender_id=u_ananya.id, content="Great work team!", status="read"),
])

# Direct Messages
db.add_all([
    Message(conversation_id=c_rohan.id, sender_id=u_rohan.id, content="Hey Himanshu! Are we meeting today?", status="read"),
    Message(conversation_id=c_ananya.id, sender_id=u_ananya.id, content="Please check the design PR when free.", status="read"),
    Message(conversation_id=c_priya.id, sender_id=u_priya.id, content="Hi! Did you get a chance to review the slides?", status="read"),
    Message(conversation_id=c_rahul.id, sender_id=u_rahul.id, content="Call me whenever you get time.", status="read"),
    Message(conversation_id=c_vikram.id, sender_id=u_vikram.id, content="Backend updates look clean!", status="read"),
])

db.commit()

# 4. Update last_message for sidebar display
for c in [c_group, c_rohan, c_ananya, c_priya, c_rahul, c_vikram]:
    last_msg = db.query(Message).filter(Message.conversation_id == c.id).order_by(Message.id.desc()).first()
    if last_msg:
        c.last_message = last_msg.content
        c.last_message_time = "2026-10-08T22:00:00Z"

db.commit()
db.close()

print("Database re-seeded successfully !")