import { writeFileSync, existsSync } from "node:fs";
if (!existsSync("dist/index.html")) {
  writeFileSync("dist/index.html", '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/ar/"><link rel="canonical" href="/ar/"><title>Reach Agency</title><script>location.replace("/ar/"+location.hash)</script></head><body></body></html>');
}
