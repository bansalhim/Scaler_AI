import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Settings,
  SquarePen,
  Video,
  Phone,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  Lock,
  Check,
  CheckCheck,
  X,
  Plus,
} from "lucide-react";

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

const API_BASE = "https://scaler-ai-ffqo.onrender.com/api";
const WS_BASE = "wss://scaler-ai-ffqo.onrender.com/ws/chat";

async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch(`${API_BASE}/conversations`);
  if (!res.ok) throw new Error("Failed to fetch conversations");
  return res.json();
}

async function fetchMessages(conversationId: number): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`);
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

async function postMessage(
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

const CURRENT_USER_ID = 1;

const EMOJI_LIST = ["👍", "❤️", "😊", "🔥", "🎉", "🚀", "🙌", "💯", "✨", "😂", "👏", "⚡"];

export const SignalApp: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [emojiOpen, setEmojiOpen] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  
  // Modals
  const [newChatModal, setNewChatModal] = useState<boolean>(false);
  const [newContactName, setNewContactName] = useState<string>("");

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load conversations on startup
  useEffect(() => {
    fetchConversations()
      .then((data: Conversation[]) => {
        setConversations(data);
        const firstConversation = data[0];
        if (data.length > 0 && activeId === null && firstConversation) {
          setActiveId(firstConversation.id);
        }
      })
      .catch((err: unknown) => console.error("Error loading conversations:", err));
  }, []);

  // Sync messages & WebSockets on switching conversations
  useEffect(() => {
    if (activeId === null) return;

    fetchMessages(activeId)
      .then((data: Message[]) => setMessages(data))
      .catch((err: unknown) => console.error("Error loading messages:", err));

    if (socketRef.current) {
      socketRef.current.close();
    }

    const wsUrl = `${WS_BASE}/${activeId}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event: MessageEvent) => {
      try {
        const incomingMsg: Message = JSON.parse(event.data);
        if (incomingMsg.conversation_id === activeId) {
          setMessages((prev: Message[]) => {
            if (prev.some((m: Message) => m.id === incomingMsg.id)) return prev;
            return [...prev, incomingMsg];
          });
          setIsTyping(false);
        }
      } catch (e: unknown) {
        console.error("Error parsing WebSocket event:", e);
      }
    };

    socketRef.current = ws;

    return () => {
      ws.close();
    };
  }, [activeId]);

  // Smooth scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const activeConv = conversations.find((c: Conversation) => c.id === activeId);

  const filteredConvs = conversations.filter((c: Conversation) =>
    (c.name || "Chat").toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (isoString?: string): string => {
    if (!isoString) {
      return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Just now";
    }
  };

  const handleSend = async (): Promise<void> => {
    const text = draft.trim();
    if (!text || activeId === null) return;

    setDraft("");
    setEmojiOpen(false);

    try {
      const newMsg: Message = await postMessage(activeId, CURRENT_USER_ID, text);

      setMessages((prev: Message[]) => {
        if (prev.some((m: Message) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(newMsg));
      }

      setIsTyping(true);

      setConversations((prev: Conversation[]) =>
        prev.map((c: Conversation) =>
          c.id === activeId ? { ...c, last_message: text } : c
        )
      );
    } catch (err: unknown) {
      console.error("Failed to send message:", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeId === null) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      const newMsg: Message = await postMessage(activeId, CURRENT_USER_ID, `[IMAGE]:${data.url}`);

      setMessages((prev: Message[]) => {
        if (prev.some((m: Message) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(newMsg));
      }

      setIsTyping(true);

      setConversations((prev: Conversation[]) =>
        prev.map((c: Conversation) =>
          c.id === activeId ? { ...c, last_message: "[Image]" } : c
        )
      );
    } catch (err: unknown) {
      console.error("Image upload failed:", err);
    }
  };

  const createNewChat = () => {
    if (!newContactName.trim()) return;
    const newConv: Conversation = {
      id: Date.now(),
      name: newContactName,
      is_group: false,
      last_message: "Chat initialized",
      last_message_time: new Date().toISOString(),
      members: [
        { id: 1, display_name: "Himanshu Bansal", is_online: true },
        { id: Date.now(), display_name: newContactName, is_online: true },
      ],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
    setNewContactName("");
    setNewChatModal(false);
  };

  return (
    <div className="flex h-screen bg-[#121316] text-gray-100 font-sans overflow-hidden select-none relative">
      {/* LEFT SIDEBAR */}
      <div className="w-80 flex flex-col border-r border-[#22242a] bg-[#16171c]">
        {/* Header */}
        <div className="p-3 flex items-center justify-between border-b border-[#22242a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-semibold text-sm text-white">
              HB
            </div>
            <span className="font-bold text-lg tracking-wide">Signal</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <button
              onClick={() => setNewChatModal(true)}
              className="p-2 hover:bg-[#22242a] rounded-full transition"
              title="New Chat"
            >
              <SquarePen size={18} />
            </button>
            <button className="p-2 hover:bg-[#22242a] rounded-full transition">
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="w-full bg-[#22242a] text-sm text-gray-200 placeholder-gray-500 pl-9 pr-3 py-2 rounded-full focus:outline-none"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConvs.map((conv: Conversation) => {
            const isActive = conv.id === activeId;
            const initials = (conv.name || "Chat")
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase();

            return (
              <div
                key={conv.id}
                onClick={() => setActiveId(conv.id)}
                className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition ${
                  isActive ? "bg-[#22242a]" : "hover:bg-[#1b1c22]"
                }`}
              >
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white">
                    {initials}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#16171c] rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className="font-medium text-sm truncate text-gray-100">
                      {conv.name || "Chat"}
                    </h4>
                    <span className="text-xs text-gray-500">Today</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {conv.last_message || "No messages yet"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col bg-[#121316]">
        {activeConv ? (
          <>
            {/* Top Bar */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-[#22242a] bg-[#16171c]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white">
                  {(activeConv.name || "C")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-100">
                    {activeConv.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {isTyping
                      ? "typing..."
                      : activeConv.is_group
                      ? `${activeConv.members?.length || 5} members`
                      : "Signal Encrypted"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-400">
                <button className="p-2 hover:bg-[#22242a] rounded-full transition">
                  <Video size={18} />
                </button>
                <button className="p-2 hover:bg-[#22242a] rounded-full transition">
                  <Phone size={18} />
                </button>
                <button className="p-2 hover:bg-[#22242a] rounded-full transition">
                  <Search size={18} />
                </button>
                <button className="p-2 hover:bg-[#22242a] rounded-full transition">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
              <div className="flex justify-center my-2">
                <div className="bg-[#1b1c22] border border-[#262830] px-4 py-2 rounded-lg text-xs text-gray-400 flex items-center gap-2 max-w-md text-center">
                  <Lock size={12} className="shrink-0" />
                  <span>
                    Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen.
                  </span>
                </div>
              </div>

              <div className="flex justify-center my-1">
                <span className="bg-[#1b1c22] text-gray-400 text-[11px] px-3 py-1 rounded-full">
                  Today
                </span>
              </div>

              {messages.map((msg: Message) => {
                const isMe = msg.sender_id === CURRENT_USER_ID;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isMe ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md px-3.5 py-2 rounded-2xl text-sm shadow-sm ${
                        isMe
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-[#22242a] text-gray-100 rounded-tl-none"
                      }`}
                    >
                      {!isMe && activeConv.is_group && (
                        <span className="block text-[11px] font-bold text-blue-400 mb-0.5">
                          {msg.sender_name || "Member"}
                        </span>
                      )}

                      {/* Render Image or Text */}
                      {msg.content.startsWith("[IMAGE]:") ? (
                        <img
                          src={msg.content.replace("[IMAGE]:", "")}
                          alt="Attachment"
                          className="rounded-lg max-h-60 max-w-xs object-cover my-1"
                        />
                      ) : (
                        <p className="whitespace-pre-wrap wrap-break-word">{msg.content}</p>
                      )}

                      <div
                        className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                          isMe ? "text-blue-200" : "text-gray-400"
                        }`}
                      >
                        <Lock size={10} />
                        <span>{formatTime(msg.created_at)}</span>
                        {isMe && (
                          msg.status === "sent" ? (
                            <Check size={12} />
                          ) : (
                            <CheckCheck size={12} className="text-blue-200" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing Bubble */}
              {isTyping && (
                <div className="flex items-start">
                  <div className="bg-[#22242a] text-gray-400 px-4 py-2 rounded-2xl rounded-tl-none text-xs flex items-center gap-1 animate-pulse">
                    <span>{activeConv.name} is typing</span>
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce delay-100">.</span>
                    <span className="animate-bounce delay-200">.</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Emoji Picker Window */}
            {emojiOpen && (
              <div className="bg-[#1b1c22] border border-[#22242a] p-3 mx-4 rounded-xl flex items-center gap-2 flex-wrap">
                {EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setDraft((prev) => prev + emoji);
                      setEmojiOpen(false);
                    }}
                    className="p-2 hover:bg-[#22242a] rounded-lg text-lg transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 bg-[#16171c] border-t border-[#22242a] flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:bg-[#22242a] rounded-full transition"
                title="Attach Image"
              >
                <Paperclip size={18} />
              </button>
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  placeholder="Signal message"
                  value={draft}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="w-full bg-[#22242a] text-sm text-gray-100 placeholder-gray-500 pl-4 pr-10 py-2.5 rounded-full focus:outline-none"
                />
                <button
                  onClick={() => setEmojiOpen(!emojiOpen)}
                  className="absolute right-3 text-gray-400 hover:text-gray-200 transition"
                >
                  <Smile size={18} />
                </button>
              </div>
              <button
                onClick={handleSend}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition"
              >
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            Select a chat to start messaging
          </div>
        )}
      </div>

      {/* NEW CHAT MODAL */}
      {newChatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#16171c] border border-[#22242a] rounded-2xl p-5 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus size={18} className="text-blue-500" /> Start New Direct Message
              </h3>
              <button
                onClick={() => setNewChatModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <input
              type="text"
              placeholder="Enter contact name (e.g. Sanya)"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              className="w-full bg-[#22242a] text-sm text-gray-100 placeholder-gray-500 px-4 py-2.5 rounded-xl border border-[#333640] focus:outline-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setNewChatModal(false)}
                className="px-4 py-2 text-xs text-gray-400 hover:bg-[#22242a] rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={createNewChat}
                className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition"
              >
                Create Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignalApp;