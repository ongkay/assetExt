import { spawn } from "node:child_process";

const childProcesses = [
  spawn("pnpm", ["dev:ext-1"], { stdio: "inherit", shell: true }),
  spawn("pnpm", ["dev:ext-2"], { stdio: "inherit", shell: true }),
];

let shuttingDown = false;

function stopChildProcesses() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const childProcess of childProcesses) {
    if (!childProcess.killed) {
      childProcess.kill("SIGTERM");
    }
  }
}

for (const childProcess of childProcesses) {
  childProcess.on("exit", (code) => {
    stopChildProcesses();
    process.exit(code ?? 0);
  });
}

process.on("SIGINT", stopChildProcesses);
process.on("SIGTERM", stopChildProcesses);
