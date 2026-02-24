#!/usr/bin/env node
/**
 * Verify OPENAI_API_KEY in front-desk/.env.local.
 * Usage: node scripts/test/verify-openai-key.js
 * Exits 0 if key is valid, 1 otherwise.
 */

const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "../../front-desk/.env.local");
if (!fs.existsSync(envPath)) {
  console.error("Missing front-desk/.env.local. Copy from .env.example and add OPENAI_API_KEY.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf8");
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
});

const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.error("OPENAI_API_KEY not set in front-desk/.env.local.");
  process.exit(1);
}

fetch("https://api.openai.com/v1/models", {
  headers: { Authorization: `Bearer ${key}` },
})
  .then((r) => {
    if (r.status === 401) {
      throw new Error("Invalid API key (401 Unauthorized).");
    }
    if (!r.ok) {
      throw new Error(`${r.status} ${r.statusText}`);
    }
    return r.json();
  })
  .then((data) => {
    const count = data.data?.length ?? 0;
    console.log("OK: OPENAI_API_KEY is valid. Models visible:", count);
  })
  .catch((err) => {
    console.error("Key check failed:", err.message);
    process.exit(1);
  });
