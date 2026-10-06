// Dev server wrapper.
//
// Runs `next dev` and forwards its output, dropping only the harmless macOS
// malloc diagnostic ("MallocStackLogging: can't turn off malloc stack
// logging because it was not enabled.") that native toolchain processes
// (e.g. the SWC/Turbopack PostCSS worker) may print to stderr on macOS.
import { spawn } from "node:child_process"
import { createRequire } from "node:module"
import path from "node:path"

const require = createRequire(import.meta.url)
const nextDir = path.dirname(require.resolve("next/package.json"))
const nextBin = path.join(nextDir, "dist", "bin", "next")

const ignored = /MallocStackLogging/

const child = spawn(
  process.execPath,
  [nextBin, "dev", ...process.argv.slice(2)],
  {
    stdio: ["inherit", "inherit", "pipe"],
  }
)

child.stderr.setEncoding("utf8")

let pending = ""
child.stderr.on("data", (chunk) => {
  pending += chunk
  const lines = pending.split("\n")
  pending = lines.pop() ?? ""
  for (const line of lines) {
    if (!ignored.test(line)) process.stderr.write(`${line}\n`)
  }
})

child.stderr.on("end", () => {
  if (pending.length > 0 && !ignored.test(pending))
    process.stderr.write(pending)
})

child.on("error", (error) => {
  process.stderr.write(`dev: failed to start next: ${error.message}\n`)
  process.exit(1)
})

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal))
}

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
  } else {
    process.exit(code ?? 0)
  }
})
