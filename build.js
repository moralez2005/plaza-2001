// Junta os arquivos de src/ numa página só (index.html), do jeito que o jogo roda.
// Uso: node build.js
const fs = require("fs");
const path = require("path");
const src = (f) => fs.readFileSync(path.join(__dirname, "src", f), "utf8");
const parts = [
  ["ENGINE", "engine2.js"], ["ART", "art.js"], ["CHARS", "chars.js"], ["CITY", "city.js"], ["LEVEL", "level.js"],
  ["MUSIC", "music.js"], ["RADIO", "radio.js"], ["INSIDE", "inside.js"], ["GAME", "game.js"], ["DISC", "discman.js"],
];
let html = src("page.html");
for (const [tag] of parts) if (!html.includes(`<script>/*${tag}*/</script>`)) throw new Error("faltou o marcador " + tag + " no page.html");
for (const [tag, file] of parts) html = html.replace(`<script>/*${tag}*/</script>`, () => "<script>" + src(file) + "</script>");
fs.writeFileSync(path.join(__dirname, "index.html"), html);
console.log("index.html pronto (" + Math.round(html.length / 1024) + " KB)");
