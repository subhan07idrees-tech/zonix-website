import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Accept Invitation — ZONIX Session OS" },
    ],
  }),
  component: Join,
});

function Join() {
  return (
    <div style={{ minHeight: "100vh", background: "#0b0f19" }}>
      <iframe
        src="/join.html"
        title="Accept Invitation"
        style={{ border: 0, width: "100vw", height: "100vh", display: "block" }}
      />
    </div>
  );
}
