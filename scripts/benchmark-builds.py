"""Measure cold, warm, and single-post builds in a disposable consumer copy."""

import argparse
from datetime import date, datetime, timedelta
import json
from html.parser import HTMLParser
import os
from pathlib import Path
import re
import shutil
import statistics
import subprocess



class Homepage(HTMLParser):
    def __init__(self):
        super().__init__()
        self.summary = None
        self.styles = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "section" and values.get("aria-label") == "About this site":
            self.summary = values
        if tag == "link" and values.get("rel") == "stylesheet":
            self.styles.append(values["href"])


def verify_agent_summary(dist):
    home = (dist / "index.html").read_text()
    page = Homepage()
    page.feed(home)
    if not page.summary or "public, read-only knowledge base" not in home:
        raise RuntimeError("Homepage Agent summary is missing")
    if "hidden" in page.summary or "aria-hidden" in page.summary:
        raise RuntimeError("Homepage Agent summary must remain accessible")
    styles = "\n".join((dist / href.lstrip("/")).read_text() for href in page.styles)
    styles += "\n".join(re.findall(r"<style[^>]*>(.*?)</style>", home, re.S))
    name = re.escape(page.summary["class"])
    if not re.search(r"\." + name + r"[^}]*clip-path:inset\(50%\)[^}]*position:absolute", styles):
        raise RuntimeError("Homepage Agent summary is not visually clipped")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--rounds", type=int, default=3)
    parser.add_argument("--edit-only", action="store_true", help="Warm the original page, then measure one visible body and updated-date edit")
    parser.add_argument("--cold-only", action="store_true", help="Repeat a cold-build regression check")
    parser.add_argument("--node", type=Path, help="Pin the native Node executable for both copies")
    args = parser.parse_args()
    root = args.project.resolve()
    if (root / ".git").exists() or not (root / "stalux/posts").is_dir():
        raise SystemExit("Use a disposable physical blog copy without .git")
    args.output.mkdir(parents=True, exist_ok=True)
    environment = {**os.environ, "CODEBUDDY_SAFE_DELETE_ENABLED": "0"}
    if args.node:
        environment["PATH"] = str(args.node.resolve().parent) + os.pathsep + environment["PATH"]
    versions = {name: subprocess.check_output([name, "--version"], cwd=root, env=environment, text=True).strip() for name in ("node", "bun")}
    selection = subprocess.check_output(["bun", "-e", r"""
        const fs = require("node:fs");
        const path = require("node:path");
        for (const name of fs.readdirSync("stalux/posts").filter(name => name.endsWith(".md")).sort()) {
            const source = fs.readFileSync(path.join("stalux/posts", name), "utf8");
            const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
            if (!match) continue;
            const data = Bun.YAML.parse(match[1]);
            if (!data.draft && data.abbrlink != null) {
                console.log(JSON.stringify({ name, data, headerBytes: Buffer.byteLength(match[0]) }));
                break;
            }
        }
    """], cwd=root, env=environment, text=True)
    if not selection.strip():
        raise SystemExit("No published Markdown post found")
    selected = json.loads(selection)
    post = root / "stalux/posts" / selected["name"]
    original = post.read_bytes()
    edit_date = os.environ.get("STALUX_BENCHMARK_DATE", date.today().isoformat())
    versions.update(post=selected["name"], edit_date=edit_date)
    (args.output / "environment.json").write_text(json.dumps(versions, indent=2))
    if args.cold_only and args.edit_only:
        raise SystemExit("Choose either --cold-only or --edit-only")
    scenarios = ("prepare-edit", "single-post") if args.edit_only else (("cold",) if args.cold_only else ("cold", "warm", "single-post"))
    records = []
    try:
        for repeat in range(args.rounds):
            if not args.edit_only:
                for relative in ("dist", ".astro", "node_modules/.astro", "node_modules/.vite"):
                    shutil.rmtree(root / relative, ignore_errors=True)
            for scenario in scenarios:
                if args.edit_only and scenario == "prepare-edit" and repeat > 0:
                    continue
                if scenario == "single-post":
                    marker = f"Stalux performance benchmark revision {repeat + 1}."
                    data = {**selected["data"], "updated": (datetime.fromisoformat(edit_date) + timedelta(seconds=repeat + 1)).strftime("%Y-%m-%d %H:%M:%S")}
                    header = "---\n" + json.dumps(data, ensure_ascii=False, indent=2) + "\n---"
                    post.write_bytes(header.encode() + original[selected["headerBytes"]:] + f"\n\n{marker}\n".encode())
                label = f"{scenario}-{repeat + 1}"
                log_path = args.output / f"{label}.log"
                time_path = args.output / f"{label}.time.json"
                with log_path.open("w") as log:
                    subprocess.run(
                        ["/usr/bin/time", "-f",
                         '{"wall_s":%e,"user_s":%U,"system_s":%S,"rss_kb":%M}',
                         "-o", str(time_path.resolve()), "timeout", "--kill-after=30", "600", "bun", "run", "build"],
                        cwd=root, env=environment,
                        stdout=log, stderr=subprocess.STDOUT, check=True,
                    )
                verify_agent_summary(root / "dist")
                if scenario == "single-post":
                    rendered = root / "dist/posts" / str(selected["data"]["abbrlink"]) / "index.html"
                    if marker not in rendered.read_text():
                        raise RuntimeError("The modified article was not actually rendered")
                text = log_path.read_text()
                record = {"scenario": scenario, "round": repeat + 1, **json.loads(time_path.read_text())}
                record["restored"] = text.count("(restored)")
                match = re.search(r"HTML postprocessing ([\d.]+)ms; cache (\d+)/(\d+)", text)
                if match:
                    record.update(postprocess_ms=float(match[1]), cache_hits=int(match[2]), pages=int(match[3]))
                record["agent_summary_verified"] = True
                record["vite_stages"] = re.findall(r"\[vite\] ✓ built in ([\d.]+(?:ms|s))", text)
                indexing = re.search(r"indexed \d+ pages → .* \(([\d.]+)ms\)", text)
                if indexing:
                    record["pagefind_ms"] = float(indexing[1])
                records.append(record)
                (args.output / "results.json").write_text(json.dumps(records, indent=2))
                print(json.dumps(record), flush=True)
                if repeat == 0 and scenario == "cold":
                    shutil.copytree(root / "dist", args.output / "dist", dirs_exist_ok=True)
            post.write_bytes(original)
    finally:
        post.write_bytes(original)
    summary = {}
    for scenario in scenarios:
        values = [item for item in records if item["scenario"] == scenario]
        summary[scenario] = {
            key: {"median": statistics.median(item[key] for item in values),
                  "min": min(item[key] for item in values), "max": max(item[key] for item in values)}
            for key in ("wall_s", "user_s", "system_s", "rss_kb", "postprocess_ms", "cache_hits", "restored")
        }
    (args.output / "summary.json").write_text(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
