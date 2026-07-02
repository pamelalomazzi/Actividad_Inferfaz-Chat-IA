import { access, readFile, rm } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const lockPath = path.join(process.cwd(), ".next", "dev", "lock");

async function removeLockIfPresent() {
  try {
    await rm(lockPath, { force: true });
  } catch {
    // Ignore cleanup errors for stale lock removal.
  }
}

async function killLockedServer() {
  try {
    await access(lockPath, constants.F_OK);
  } catch {
    return;
  }

  try {
    const raw = await readFile(lockPath, "utf8");
    const lock = JSON.parse(raw);
    if (typeof lock.pid === "number") {
      process.kill(lock.pid, "SIGTERM");
    }
  } catch (error) {
    const maybeError = error;
    if (maybeError.code !== "ESRCH") {
      console.warn("No se pudo finalizar la instancia de Next registrada en .next/dev/lock.");
    }
  }

  await removeLockIfPresent();
}

function freePort3000() {
  try {
    execFileSync("fuser", ["-k", "3000/tcp"], { stdio: "ignore" });
  } catch {
    // Ignore when the port is already free or fuser returns a non-zero code.
  }
}

await killLockedServer();
freePort3000();