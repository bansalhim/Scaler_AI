export interface Member {
  id: number;
  display_name: string;
  is_online: boolean;
}

export interface Conversation {
  id: number;
  name: string | null;
  is_group: boolean;
  last_message: string;
  last_message_time: string;
  members: Member[];
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name?: string;
  content: string;
  status: string;
  created_at?: string;
}

const API_BASE = "http://localhost:8000/api";

export async function getConversations(): Promise<Conversation[]> {
  const res = await fetch(`${API_BASE}/conversations`);
  if (!res.ok) throw new Error("Failed to fetch conversations");
  return res.json();
}

export async function getMessages(conversationId: number): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`);
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

export async function sendMessage(
  conversationId: number,
  senderId: number,
  content: string
): Promise<Message> {
  const res = await fetch(`${API_BASE}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
    }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}