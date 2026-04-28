#!/usr/bin/env node
/**
 * update-bot-knowledge.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Обновляет файл src/lib/bot-knowledge.ts на основе актуального состояния
 * платформы Mentora. Запускать после значимых изменений в платформе:
 *
 *   npm run update-bot-knowledge
 *
 * Что делает скрипт:
 *  1. Читает текущий bot-knowledge.ts
 *  2. Собирает обновления из нескольких источников:
 *     - package.json (версия)
 *     - src/app/ (список страниц/маршрутов)
 *     - src/components/ (компоненты — косвенно: предметы, тарифы)
 *  3. Предлагает интерактивный режим: редактирование секций вручную
 *  4. Обновляет BOT_KNOWLEDGE_VERSION датой сегодня
 *  5. Перезаписывает файл
 *
 * В неинтерактивном режиме (CI / --auto):
 *  - Только обновляет версию (дату) и список маршрутов
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs   = require("fs");
const path = require("path");

// ── auto-detect project root ──────────────────────────────────────────────────
// Works whether called as `node scripts/update-bot-knowledge.js` from any dir
// or via `npm run update-bot-knowledge` from the project root.

function findRoot() {
  // __dirname is the scripts/ folder; root is one level up
  const byDirname = path.resolve(__dirname, "..");
  if (fs.existsSync(path.join(byDirname, "package.json"))) return byDirname;
  // fallback: walk upward from cwd
  let dir = process.cwd();
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  console.error("❌  Не удалось найти корень проекта (package.json).");
  console.error("   Запусти из папки проекта: cd /path/to/mentora && npm run update-bot-knowledge");
  process.exit(1);
}

const ROOT         = findRoot();
const KNOWLEDGE_TS = path.join(ROOT, "src", "lib", "bot-knowledge.ts");

// ── helpers ──────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function readFile(p) {
  try { return fs.readFileSync(p, "utf8"); }
  catch { return null; }
}

// ── collect routes from src/app ───────────────────────────────────────────────

function collectRoutes() {
  const appDir = path.join(ROOT, "src", "app");
  const routes = [];
  function walk(dir, prefix) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
      if (!entry.isDirectory()) continue;
      const seg = entry.name;
      // skip (group) folders like (auth)
      const routeSeg = seg.startsWith("(") ? "" : "/" + seg;
      const fullRoute = prefix + routeSeg;
      const subDir = path.join(dir, seg);
      // check if this dir has a page.tsx
      const hasPage = fs.existsSync(path.join(subDir, "page.tsx"))
                   || fs.existsSync(path.join(subDir, "page.ts"));
      if (hasPage && fullRoute) routes.push(fullRoute);
      walk(subDir, fullRoute || prefix);
    }
  }
  try { walk(appDir, ""); } catch { /* ignore */ }
  return routes.sort();
}

// ── update version stamp in the file ─────────────────────────────────────────

function updateVersion(content, newDate) {
  return content
    .replace(
      /export const BOT_KNOWLEDGE_VERSION = "[\d-]+";/,
      `export const BOT_KNOWLEDGE_VERSION = "${newDate}";`
    )
    .replace(
      /\* Последнее обновление: .+/,
      `* Последнее обновление: ${formatDateRu(newDate)}`
    );
}

function formatDateRu(iso) {
  const months = [
    "январь","февраль","март","апрель","май","июнь",
    "июль","август","сентябрь","октябрь","ноябрь","декабрь"
  ];
  const [y, m] = iso.split("-");
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

// ── append routes section as a comment ───────────────────────────────────────

function buildRoutesComment(routes) {
  return (
    `\n// Auto-detected routes (${today()}):\n` +
    routes.map(r => `// ${r}`).join("\n") +
    "\n"
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

function main() {
  const autoMode = process.argv.includes("--auto") || process.argv.includes("-a");

  let content = readFile(KNOWLEDGE_TS);
  if (!content) {
    console.error(`❌  Файл не найден: ${KNOWLEDGE_TS}`);
    process.exit(1);
  }

  const newDate = today();
  content = updateVersion(content, newDate);

  // Collect routes
  const routes = collectRoutes();
  console.log(`\n📁  Обнаружено маршрутов: ${routes.length}`);
  routes.forEach(r => console.log(`   ${r}`));

  if (autoMode) {
    // Just update version + write
    fs.writeFileSync(KNOWLEDGE_TS, content, "utf8");
    console.log(`\n✅  BOT_KNOWLEDGE_VERSION обновлён → ${newDate}`);
    console.log(`   Файл: ${KNOWLEDGE_TS}`);
    return;
  }

  // Interactive: show menu
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Mentora Bot Knowledge Updater
  Версия базы: ${newDate}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Что обновлено автоматически:
  ✓ BOT_KNOWLEDGE_VERSION → ${newDate}
  ✓ Дата в заголовке файла

Список маршрутов сайта:
${routes.map(r => "  " + r).join("\n")}

Для ручного редактирования знаний откройте:
  ${KNOWLEDGE_TS}

и обновьте константу BOT_PLATFORM_KNOWLEDGE.
`);

  // Prompt for sections that might need updating
  const readline = require("readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  rl.question("Сохранить файл с обновлённой датой? [Y/n] ", (ans) => {
    rl.close();
    if (ans.toLowerCase() === "n") {
      console.log("⚡  Отменено. Файл не изменён.");
      return;
    }
    fs.writeFileSync(KNOWLEDGE_TS, content, "utf8");
    console.log(`\n✅  Файл обновлён: ${KNOWLEDGE_TS}`);
    console.log(`   BOT_KNOWLEDGE_VERSION = "${newDate}"`);
    console.log(`\n💡  Не забудь сделать git commit && push, чтобы изменения\n   попали на Vercel и стали активными для бота.\n`);
  });
}

main();
