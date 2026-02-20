// server/src/seed/seedTests.js
const dotenv = require("dotenv");
dotenv.config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Test = require("../models/Test");

const SAMPLE_DIR = path.join(__dirname, "sampleTests");

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function normalizeTemplate(tpl) {
  if (!tpl?.metadata?.id) throw new Error("Template missing metadata.id");

  return {
    metadata: tpl.metadata,
    config: tpl.config || {},
    sections: tpl.sections || [],
    isActive: tpl.isActive !== false
  };
}

async function upsertByTemplateId(doc) {
  const templateId = doc.metadata.id;

  return Test.findOneAndUpdate(
    { "metadata.id": templateId },
    { $set: doc },
    { upsert: true, new: true }
  );
}

function listBundleFiles() {
  if (!fs.existsSync(SAMPLE_DIR)) return [];
  return fs
    .readdirSync(SAMPLE_DIR)
    .filter((f) => f.endsWith(".bundle.json"))
    .map((f) => path.join(SAMPLE_DIR, f));
}

async function main() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error("[seedTests] Missing MONGO_URI in .env");
    process.exit(1);
  }

  const bundles = listBundleFiles();
  if (bundles.length === 0) {
    console.error(`[seedTests] No *.bundle.json found in ${SAMPLE_DIR}`);
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI, { autoIndex: true });
  console.log("[seedTests] Connected to MongoDB");

  let total = 0;

  for (const bundlePath of bundles) {
    const bundleName = path.basename(bundlePath);
    const bundle = readJson(bundlePath);

    const tests = Array.isArray(bundle.tests) ? bundle.tests : [];
    console.log(`[seedTests] Loading bundle: ${bundleName} (${tests.length} tests)`);

    for (const tpl of tests) {
      const doc = normalizeTemplate(tpl);
      const saved = await upsertByTemplateId(doc);
      total += 1;
      console.log(`  - upserted: ${saved.metadata.id} | ${saved.metadata.title}`);
    }
  }

  await mongoose.disconnect();
  console.log(`[seedTests] Done. Upserted ${total} tests from ${bundles.length} bundles.`);
}

main().catch((e) => {
  console.error("[seedTests] Fatal:", e);
  process.exit(1);
});
