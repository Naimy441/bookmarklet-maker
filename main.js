import { readFileSync, writeFileSync } from "fs";
import { minify } from "terser";

const inputFile = process.argv[2];

if (!inputFile) {
  console.error("Usage: node main input_file_name");
  process.exit(1);
}

async function run() {
  try {
    const code = readFileSync("src/" + inputFile + ".js", "utf8");

    // Minify with your settings
    const result = await minify(code, {
      compress: {},
      mangle: {},
      output: {
        beautify: false,
        wrap_iife: true
      }
    });

    if (!result.code) throw new Error("Terser failed to produce output");

    // Strip leading "!" if present
    let js = result.code.replace(/^!/, "");

    // Prepend bookmarklet prefix
    const bookmarklet = "javascript:" + js;

    writeFileSync("out/" + inputFile + ".txt", bookmarklet, "utf8");
    console.log(`✅ Bookmarklet saved to out/${inputFile}.txt`);
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

run();