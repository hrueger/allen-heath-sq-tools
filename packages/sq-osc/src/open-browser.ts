import { exec } from "node:child_process";

export function openBrowser(url: string): void {
  const platform = Deno.build.os;
  let cmd: string;
  if (platform === "darwin") {
    cmd = `open "${url}"`;
  } else if (platform === "windows") {
    cmd = `start "" "${url}"`;
  } else {
    cmd = `xdg-open "${url}"`;
  }
  exec(cmd, (err) => {
    if (err) console.error("[browser] could not open browser:", err.message);
  });
}
