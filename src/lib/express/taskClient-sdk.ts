// client-sdk/task-client.ts
// Copy this file into your Next.js project at ~/lib/task-client.ts
//
// Next.js is now a THIN CLIENT — it only enqueues jobs and polls for results.
// All agent/pipeline/DB logic runs on the Express task server.

import { EXPRESS_SERVER_URL } from "../common";

const TASK_SERVER_URL = (EXPRESS_SERVER_URL).replace(/\/$/, "");
const JSON_HEADERS = { "Content-Type": "application/json" };

export type JobType = "agent_run" | "create_pins" | "generic";
export type JobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export interface PollResult {
    jobId: string;
    status: JobStatus;
    result: unknown;
    error?: string;
    progress: number;
}

export const taskClient = {
    /** Enqueue a job — returns { jobId } immediately (no waiting). */
    async enqueue(
        type: JobType,
        creatorId: string,
        payload: Record<string, unknown>,
        maxAttempts = 3,
    ): Promise<{ jobId: string }> {
        const res = await fetch(`${TASK_SERVER_URL}/jobs/enqueue`, {
            method: "POST",
            headers: JSON_HEADERS,
            body: JSON.stringify({ type, creatorId, payload, maxAttempts }),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Task server error (${res.status}): ${text.slice(0, 200)}`);
        }
        return res.json() as Promise<{ jobId: string }>;
    },

    /** Poll once — compatible with your existing pollJobResult tRPC shape. */
    async poll(jobId: string): Promise<PollResult> {
        const res = await fetch(`${TASK_SERVER_URL}/jobs/${jobId}`, {
            headers: JSON_HEADERS,
        });
        if (res.status === 404) throw new Error("Job not found");
        if (!res.ok) throw new Error(`Poll error: ${res.status}`);
        return res.json() as Promise<PollResult>;
    },

    /** Cancel a job. */
    async cancel(jobId: string): Promise<void> {
        await fetch(`${TASK_SERVER_URL}/jobs/${jobId}/cancel`, {
            method: "POST",
            headers: JSON_HEADERS,
        });
    },
};