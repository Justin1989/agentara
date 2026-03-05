# Sessioning Design

Session unifies different AgentRunner implementations. SessionManager creates or resumes sessions and maintains session persistence. SessionWriter persists messages (logging + file) and is wired by SessionManager.

---

## Session & AgentRunner

### AgentRunner

Wrapper around the underlying agent. Callers do not use it directly; Session uses it internally.

- **Interface**: `stream(message, options?)` → `AsyncIterableIterator<AssistantMessage | SystemMessage>`
- **AgentRunOptions**: `{ isNewSession: boolean, cwd: string }`
- **type**: Readonly string (e.g. `"claude-code"`)

No `run()` at this layer — it is implemented at Session level.

### Session

Unifies different AgentRunner implementations. Callers use Session, not AgentRunner.

- **run(userMessage)**: Streams until completion, returns the last assistant message
- **stream(userMessage)**: Exposes streaming output

Session abstracts which AgentRunner is used; implementation can be swapped without changing caller code. On each message (user input and assistant/tool/system output), Session emits `"message"` events. SessionManager subscribes to these events and delegates to writers — Session itself has no logger or writer.

---

## SessionManager

Creates or resumes Session instances. Maintains session existence via files. No concurrency, no caching.

### Dependencies

- `config.paths.resolveSessionFilePath(session_id)` → `$AGENTARA_HOME/sessions/{session_id}.jsonl`
- Session exists iff the file exists

### API

| Method | Description |
|--------|-------------|
| `existsSession(sessionId)` | Returns whether the session file exists. |
| `resolveSession(sessionId, options?)` | Creates if file missing, resumes if exists. Returns `Session`. |
| `createSession(sessionId?, options?)` | Creates new session (throws if already exists). |
| `resumeSession(sessionId, options?)` | Resumes existing session (throws if not found). |

### SessionResolveOptions

Supply `agentType` and `cwd` for Session construction. Defaults from config (`config.agents.default.type`, `config.paths.home`).

### Lifecycle

- **No storage of Session**: SessionManager does not retain Session or writer references; callback captures `sessionId` and writer only. Session can be GC'd when caller drops it.
- **Writer wiring**: On `createSession` / `resumeSession`, calls `_attachWriter(session, sessionId)` — subscribes `session.on("message", ...)` and delegates to writers.
- **Per-session**: SessionLogWriter, SessionFileWriter.
- **Shared**: One SessionDiaryFileWriter instance for all sessions (cross-session diary file).

### Error Handling

- `createSession` on existing file → `SessionAlreadyExistsError`
- `resumeSession` on missing file → `SessionNotFoundError`
- Strict: throw on invalid states, no graceful fallback.

### Concurrency

**Must not** allow concurrent operations on the same session. Single-writer / single-session lifecycle (callers must ensure).

---

## SessionWriter (brief)

SessionWriter persists session messages. Session does not depend on it; SessionManager subscribes to Session events and delegates to writers.

- **SessionWriter interface**: `write(message)` — accepts user/assistant/system messages.
- **SessionLogWriter**: Pino logging per session.
- **SessionFileWriter**: Append to session `.jsonl` file per session.
- **SessionDiaryFileWriter**: Append to daily diary `.md` file; cross-session, single shared instance, internal queue for sequential writes.

File layout: `writers/session-writer.ts`, `session-log-writer.ts`, `session-file-writer.ts`, `session-diary-file-writer.ts`, `session-file-writer-utils.ts`.

---

## File Layout

```
src/kernel/sessioning/
├── session.ts
├── session-manager.ts
├── writers/
│   ├── session-writer.ts
│   ├── session-file-writer-utils.ts
│   ├── session-log-writer.ts
│   ├── session-file-writer.ts
│   ├── session-diary-file-writer.ts
│   └── index.ts
```
