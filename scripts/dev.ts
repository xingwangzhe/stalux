import { spawn } from "node:child_process";

const styles = spawn(process.execPath, ["scripts/build-styles.ts", "--watch"], {
    stdio: "inherit",
});
const astro = spawn("bun", ["run", "astro", "dev", ...process.argv.slice(2)], { stdio: "inherit" });
function stop() {
    styles.kill();
    astro.kill();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
astro.on("exit", (code) => {
    styles.kill();
    process.exitCode = code ?? 1;
});
