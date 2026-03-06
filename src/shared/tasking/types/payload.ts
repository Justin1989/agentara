import { z } from "zod";

import { UserMessage } from "../../messaging";

/**
 * Payload for an inbound user message task.
 */
export const InboundMessageTaskPayload = z.object({
  type: z.literal("inbound_message"),
  message: UserMessage,
});
export interface InboundMessageTaskPayload extends z.infer<
  typeof InboundMessageTaskPayload
> {}

/**
 * Payload for a cron-scheduled instruction task.
 */
export const CronjobTaskPayload = z.object({
  type: z.literal("cronjob"),
  /** The instruction string sent to the agent. */
  instruction: z.string(),
  /** Cron expression, e.g. "0 3 * * *". */
  cron_pattern: z.string(),
});
export interface CronjobTaskPayload extends z.infer<
  typeof CronjobTaskPayload
> {}

/**
 * Discriminated union of all supported task payloads.
 */
export const TaskPayload = z.discriminatedUnion("type", [
  InboundMessageTaskPayload,
  CronjobTaskPayload,
]);
export type TaskPayload = InboundMessageTaskPayload | CronjobTaskPayload;
