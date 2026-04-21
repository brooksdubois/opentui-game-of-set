import type { EngineCommand, EngineResponse } from "./protocol";

export interface EngineClient {
  send(command: EngineCommand): Promise<EngineResponse>;
  shutdown(): Promise<void>;
}

interface PendingRequest {
  resolve: (response: EngineResponse) => void;
  reject: (error: Error) => void;
}

export class JsonLineEngineClient implements EngineClient {
  private subprocess: any;
  private stdin: { write: (input: string) => unknown; end?: () => unknown };
  private pending: PendingRequest[] = [];
  private closed = false;

  constructor(command = ["./gradlew", "-q", "run"], cwd = "../SetKotlin") {
    this.subprocess = Bun.spawn(command, {
      cwd,
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
    });

    this.stdin = this.subprocess.stdin;
    this.readStdout();
    this.readStderr();
  }

  async send(command: EngineCommand): Promise<EngineResponse> {
    if (this.closed) {
      throw new Error("Engine subprocess is closed");
    }

    const responsePromise = new Promise<EngineResponse>((resolve, reject) => {
      this.pending.push({ resolve, reject });
    });

    await this.stdin.write(`${JSON.stringify(command)}\n`);
    return responsePromise;
  }

  async shutdown(): Promise<void> {
    if (this.closed) return;

    try {
      await this.send({ command: "shutdown" });
    } catch {
      // The process may already be gone; shutdown is best effort.
    }

    this.closed = true;
    try {
      await this.stdin.end?.();
    } catch {
      // Ignore close races during process teardown.
    }
  }

  private async readStdout(): Promise<void> {
    const reader = this.subprocess.stdout.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let newlineIndex = buffer.indexOf("\n");

        while (newlineIndex >= 0) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (line.length > 0) this.resolveLine(line);
          newlineIndex = buffer.indexOf("\n");
        }
      }
    } catch (error) {
      this.rejectAll(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.closed = true;
      this.rejectAll(new Error("Engine subprocess exited"));
    }
  }

  private resolveLine(line: string): void {
    const pending = this.pending.shift();
    if (!pending) return;

    try {
      pending.resolve(JSON.parse(line) as EngineResponse);
    } catch (error) {
      pending.reject(error instanceof Error ? error : new Error("Malformed engine response"));
    }
  }

  private async readStderr(): Promise<void> {
    const reader = this.subprocess.stderr.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        process.stderr.write(decoder.decode(value));
      }
    } catch {
      // Stderr is diagnostic only.
    }
  }

  private rejectAll(error: Error): void {
    while (this.pending.length > 0) {
      this.pending.shift()?.reject(error);
    }
  }
}

export function createKotlinEngineClient(): EngineClient {
  return new JsonLineEngineClient();
}
