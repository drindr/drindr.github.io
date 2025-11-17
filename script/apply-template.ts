#!/usr/bin/env -S deno --allow-read --allow-write
import * as path from "jsr:@std/path";
import * as toml from "jsr:@std/toml";
import * as fs from "jsr:@std/fs"
import Mustache from "npm:mustache"

function ws_dir(): string {
  const script_dir = path.resolve(path.dirname(path.fromFileUrl(import.meta.url)));
  return path.dirname(script_dir)
}

async function readGlobalMeta(): Object {
  const ws_dir_path = ws_dir();
  const global_meta_path = `${ws_dir_path}/meta.toml`;
  const text = await Deno.readTextFile(global_meta_path);
  return toml.parse(text);
}

async function applyTemplate() {
  const ws_dir_path = ws_dir();
  const global_meta = await readGlobalMeta();
  const source_path = Deno.args[0];
  const target_path = Deno.args[1];
  const relative_path = Deno.args[2];
  const relative_root = "../".repeat(relative_path.split("/").length - 2);
  const html_path = `${source_path}.html`;
  const meta_path = `${source_path}.json`;
  const template_text = await Deno.readTextFile(`${ws_dir_path}/layout/base.html`);

  const meta_mod = await import(meta_path, {
    with: { type: "json" },
  });

  let page_meta = meta_mod.default;
  page_meta.relative_root = relative_root;

  const view = {
    site: global_meta,
    page: page_meta,
    content: await Deno.readTextFile(html_path)
  }
  const output = Mustache.render(template_text, view);
  const target_dir = path.dirname(target_path);
  if (! await fs.exists(target_dir)) {
    await Deno.mkdir(target_dir, {recursive: true});
  }
  console.log(output);
  await Deno.writeTextFile(target_path, output);
}

if (import.meta.main) {
  applyTemplate();
}
