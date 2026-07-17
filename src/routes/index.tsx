import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZONIX — Secure Session Sharing Browser for Logistics" },
      {
        name: "description",
        content:
          "ZONIX is the secure, anti-detect, multi-tenant session sharing browser built for dispatchers and freight teams. Sync sessions, isolate proxies, defeat fingerprinting.",
      },
      { property: "og:title", content: "ZONIX — Session OS for Dispatch" },
      {
        property: "og:description",
        content:
          "Sync sessions. Secure tunnels. Empower your dispatch. Built for Windows 10/11.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    window.location.replace("/zonix.html");
  }, []);
  return (
    <div style={{ minHeight: "100vh", background: "#0b0f19" }}>
      <iframe
        src="/zonix.html"
        title="ZONIX"
        style={{ border: 0, width: "100vw", height: "100vh", display: "block" }}
      />
    </div>
  );
}
