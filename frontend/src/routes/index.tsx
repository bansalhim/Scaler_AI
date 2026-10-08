import { createFileRoute } from "@tanstack/react-router";
import SignalApp from "@/components/signal/SignalApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Signal — Private Messenger" },
      { name: "description", content: "A dark-mode Signal messenger experience with private chats, groups and settings." },
      { property: "og:title", content: "Signal — Private Messenger" },
      { property: "og:description", content: "Private chats, groups and end-to-end encrypted style messaging." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignalApp,
});
