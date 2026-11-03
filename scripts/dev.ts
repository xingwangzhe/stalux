export {};

const styles = Bun.spawn([process.execPath, "scripts/build-styles.ts", "--watch"], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
});
const astro = Bun.spawn([process.execPath, "x", "--bun", "astro", "dev", ...Bun.argv.slice(2)], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
});
function stop() {
    styles.kill();
    astro.kill();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
const code = await astro.exited;
styles.kill();
process.exitCode = code ?? 1;
