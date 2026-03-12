import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { kernel } from "@/kernel";
import { InboundMessageTaskPayload } from "@/shared";

/**
 * Task-related route group.
 */
export const taskRoutes = new Hono()
  .get("/", (c) => {
    const tasks = kernel.taskDispatcher.queryTasks();
    return c.json(tasks);
  })
  .post(
    "/dispatch",
    zValidator("json", InboundMessageTaskPayload),
    async (c) => {
      const body = await c.req.json().catch(() => null);
      const parsed = InboundMessageTaskPayload.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.flatten() }, 400);
      }
      const jobId = await kernel.taskDispatcher.dispatch(
        parsed.data.message.session_id,
        parsed.data,
      );
      return c.json({ job_id: jobId });
    },
  );
