import { bootServer } from "@/lib/server";
import { getRecentJobEvents, subscribeJobEvents } from "@/lib/jobs/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  bootServer();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      for (const ev of getRecentJobEvents().slice(-30)) send(ev);

      const unsub = subscribeJobEvents((ev) => send(ev));
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 15000);

      const cancel = () => {
        clearInterval(heartbeat);
        unsub();
        try {
          controller.close();
        } catch {
          // ignore
        }
      };

      // @ts-expect-error attach for cancel
      controller._cancel = cancel;
    },
    cancel() {
      // handled above when possible
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
