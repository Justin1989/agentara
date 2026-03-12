import { describe, expect, test } from "bun:test";

import {
  InboundMessageTaskPayload,
  ScheduledTaskPayload,
  Task,
  TaskPayload,
  TaskSchedule,
  TaskStatus,
} from "@/shared";

const userMessage = {
  id: "msg-1",
  session_id: "sess-1",
  role: "user" as const,
  content: [{ type: "text" as const, text: "hello" }],
};

describe("TaskStatus", () => {
  test("accepts valid statuses", () => {
    const statuses = ["pending", "running", "completed", "failed"] as const;
    for (const status of statuses) {
      expect(TaskStatus.parse(status)).toBe(status);
    }
  });

  test("rejects invalid status", () => {
    expect(() => TaskStatus.parse("cancelled")).toThrow();
  });
});

describe("InboundMessageTaskPayload", () => {
  test("parses valid payload", () => {
    const input = { type: "inbound_message", message: userMessage };
    const result = InboundMessageTaskPayload.parse(input);
    expect(result.type).toBe("inbound_message");
    expect(result.message.role).toBe("user");
  });

  test("rejects missing message", () => {
    expect(() =>
      InboundMessageTaskPayload.parse({ type: "inbound_message" }),
    ).toThrow();
  });
});

describe("ScheduledTaskPayload", () => {
  test("parses valid payload", () => {
    const input = {
      type: "scheduled_task",
      instruction: "summarize news",
    };
    const result = ScheduledTaskPayload.parse(input);
    expect(result.type).toBe("scheduled_task");
    expect(result.instruction).toBe("summarize news");
  });

  test("rejects missing instruction", () => {
    expect(() =>
      ScheduledTaskPayload.parse({ type: "scheduled_task" }),
    ).toThrow();
  });
});

describe("TaskSchedule", () => {
  test("parses schedule with pattern", () => {
    const result = TaskSchedule.parse({ pattern: "0 9 * * *" });
    expect(result.pattern).toBe("0 9 * * *");
  });

  test("parses schedule with every", () => {
    const result = TaskSchedule.parse({ every: 60000 });
    expect(result.every).toBe(60000);
  });

  test("parses schedule with all fields", () => {
    const result = TaskSchedule.parse({
      pattern: "0 9 * * *",
      every: 60000,
      limit: 10,
      immediately: true,
    });
    expect(result.pattern).toBe("0 9 * * *");
    expect(result.every).toBe(60000);
    expect(result.limit).toBe(10);
    expect(result.immediately).toBe(true);
  });

  test("parses schedule with at (one-shot)", () => {
    const future = Date.now() + 60000;
    const result = TaskSchedule.parse({ at: future });
    expect(result.at).toBe(future);
  });

  test("parses schedule with delay (one-shot)", () => {
    const result = TaskSchedule.parse({ delay: 60000 });
    expect(result.delay).toBe(60000);
  });

  test("rejects schedule with both at and delay", () => {
    const future = Date.now() + 60000;
    expect(() =>
      TaskSchedule.parse({ at: future, delay: 30000 }),
    ).toThrow();
  });

  test("rejects schedule with both delay and pattern", () => {
    expect(() =>
      TaskSchedule.parse({ delay: 60000, pattern: "0 9 * * *" }),
    ).toThrow();
  });

  test("rejects schedule with both at and pattern", () => {
    const future = Date.now() + 60000;
    expect(() =>
      TaskSchedule.parse({ at: future, pattern: "0 9 * * *" }),
    ).toThrow();
  });

  test("rejects schedule with both at and every", () => {
    const future = Date.now() + 60000;
    expect(() => TaskSchedule.parse({ at: future, every: 60000 })).toThrow();
  });

  test("rejects schedule without pattern, every, or at", () => {
    expect(() => TaskSchedule.parse({ limit: 5 })).toThrow();
    expect(() => TaskSchedule.parse({})).toThrow();
  });
});

describe("TaskPayload (discriminated union)", () => {
  test("parses inbound_message variant", () => {
    const input = { type: "inbound_message", message: userMessage };
    const result = TaskPayload.parse(input);
    expect(result.type).toBe("inbound_message");
  });

  test("parses scheduled_task variant", () => {
    const input = {
      type: "scheduled_task",
      instruction: "run",
    };
    const result = TaskPayload.parse(input);
    expect(result.type).toBe("scheduled_task");
  });

  test("rejects unknown type", () => {
    expect(() => TaskPayload.parse({ type: "webhook" })).toThrow();
  });
});

describe("Task", () => {
  const now = Date.now();

  test("parses valid task", () => {
    const input = {
      id: "task-1",
      session_id: "sess-1",
      type: "inbound_message",
      status: "pending",
      payload: { type: "inbound_message", message: userMessage },
      created_at: now,
      updated_at: now,
    };
    const result = Task.parse(input);
    expect(result.id).toBe("task-1");
    expect(result.status).toBe("pending");
  });

  test("rejects invalid status in task", () => {
    const input = {
      id: "task-1",
      session_id: "sess-1",
      type: "inbound_message",
      status: "cancelled",
      payload: { type: "inbound_message", message: userMessage },
      created_at: now,
      updated_at: now,
    };
    expect(() => Task.parse(input)).toThrow();
  });

  test("rejects missing required fields", () => {
    expect(() => Task.parse({ id: "task-1" })).toThrow();
  });
});
