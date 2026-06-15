import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { list } from "@vercel/blob";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = "./downloads";
const JSONL_PATH = path.join(OUTPUT_DIR, "all_chats.jsonl");

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  const { blobs } = await list();

  // Reinicia el archivo consolidado cada vez que corrés el script
  fs.writeFileSync(JSONL_PATH, "", "utf8");

  for (const blob of blobs) {
    console.log("Downloading:", blob.pathname);

    const res = await fetch(blob.url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
      }
    });

    const data = await res.text();

    // Si por algún motivo falla la descarga, no lo mete al consolidado
    if (!res.ok) {
      console.log("Error downloading:", blob.pathname, data);
      continue;
    }

    // Guarda archivo individual
    const filePath = path.join(
      OUTPUT_DIR,
      blob.pathname.replace(/\//g, "_")
    );

    fs.writeFileSync(filePath, data, "utf8");

    // Agrega una línea al JSONL
    try {
      const obj = JSON.parse(data);
      fs.appendFileSync(
        JSONL_PATH,
        JSON.stringify(obj) + "\n",
        "utf8"
      );
    } catch (e) {
      console.log("Invalid JSON skipped:", blob.pathname);
    }
  }

  console.log("Done.");
  console.log("Consolidated file:", JSONL_PATH);
}

main();