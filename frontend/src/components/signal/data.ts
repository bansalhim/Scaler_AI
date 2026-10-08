export type Receipt = "sent" | "delivered" | "read";
export type Message = { id: string; from: string; text: string; ts: number; receipt?: Receipt };
export type Contact = { id: string; name: string; color: string; online: boolean; replies: string[] };
export type Chat = { id: string; name: string; isGroup: boolean; members: string[]; color: string; emoji?: string | undefined; messages: Message[]; unread: number };

export const ME = "me";
const H = 3600_000;
const now = Date.now();
const today = (h: number, m: number) => { const d = new Date(); d.setHours(h, m, 0, 0); return Math.min(d.getTime(), now - 60_000); };
const yest = (h: number, m: number) => today(h, m) - 24 * H;

export const CONTACTS: Contact[] = [
  { id: "ed", name: "Edward Snowden", color: "#c2410c", online: true, replies: ["Assume everything is being logged. Except here.", "Good. Keep your keys rotated.", "Privacy isn't about hiding, it's about protecting."] },
  { id: "moxie", name: "Moxie Marlinspike", color: "#0f766e", online: false, replies: ["Ratchet's turning fine 🙂", "Ship it, we can iterate.", "Going sailing, back tomorrow."] },
  { id: "sarah", name: "Sarah Connor", color: "#7c2d12", online: true, replies: ["No fate but what we make.", "Stay off the grid tonight.", "Got it. Moving out at dawn."] },
  { id: "meredith", name: "Meredith Whittaker", color: "#1d4ed8", online: false, replies: ["Love this. Let's discuss Monday.", "Agreed — privacy by default."] },
  { id: "trevor", name: "Trevor Perrin", color: "#4d7c0f", online: true, replies: ["The double ratchet handles that.", "Check the X3DH spec section 3."] },
];

export const SEED: Chat[] = [
  { id: "c-ed", name: "Edward Snowden", isGroup: false, members: ["ed"], color: "#c2410c", unread: 2, messages: [
    { id: "1", from: "ed", text: "Did you verify my safety number?", ts: yest(21, 4) },
    { id: "2", from: ME, text: "Yes, scanned it in person last week.", ts: yest(21, 10), receipt: "read" },
    { id: "3", from: "ed", text: "Perfect. Disappearing messages on?", ts: today(9, 41) },
    { id: "4", from: "ed", text: "Set it to 1 week, just in case.", ts: today(9, 42) },
  ]},
  { id: "c-dev", name: "Signal Core Devs", isGroup: true, members: ["moxie", "trevor", "meredith"], color: "#2c6bed", emoji: "🛰️", unread: 5, messages: [
    { id: "1", from: "trevor", text: "New PQXDH build is on staging.", ts: yest(16, 20) },
    { id: "2", from: "meredith", text: "Great work everyone 👏", ts: yest(16, 45) },
    { id: "3", from: ME, text: "Running the test suite now.", ts: today(8, 2), receipt: "read" },
    { id: "4", from: "moxie", text: "Anything flaky?", ts: today(8, 15) },
    { id: "5", from: ME, text: "All green so far ✅", ts: today(8, 30), receipt: "read" },
    { id: "6", from: "trevor", text: "Merging after lunch then.", ts: today(10, 12) },
  ]},
  { id: "c-moxie", name: "Moxie Marlinspike", isGroup: false, members: ["moxie"], color: "#0f766e", unread: 0, messages: [
    { id: "1", from: "moxie", text: "Want to go sailing this weekend?", ts: yest(11, 0) },
    { id: "2", from: ME, text: "Absolutely. Saturday morning?", ts: yest(11, 5), receipt: "read" },
    { id: "3", from: "moxie", text: "Works. Bring sunscreen.", ts: yest(11, 7) },
    { id: "4", from: ME, text: "See you at the dock ⛵", ts: today(7, 30), receipt: "delivered" },
  ]},
  { id: "c-sarah", name: "Sarah Connor", isGroup: false, members: ["sarah"], color: "#7c2d12", unread: 1, messages: [
    { id: "1", from: ME, text: "Are you safe?", ts: yest(23, 50), receipt: "read" },
    { id: "2", from: "sarah", text: "For now. They're getting closer.", ts: today(6, 15) },
  ]},
];
