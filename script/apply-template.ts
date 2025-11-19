#!/usr/bin/env -S deno --allow-read --allow-write
import * as path from "jsr:@std/path";
import * as toml from "jsr:@std/toml";
import * as fs from "jsr:@std/fs"
import Mustache from "npm:mustache"

export function ws_dir(): string {
  const script_dir = path.resolve(path.dirname(path.fromFileUrl(import.meta.url)));
  return path.dirname(script_dir)
}

async function readGlobalMeta(): Object {
  const ws_dir_path = ws_dir();
  const global_meta_path = `${ws_dir_path}/meta.toml`;
  const text = await Deno.readTextFile(global_meta_path);
  return toml.parse(text);
}

export async function applyTemplate(html_content: string, page_meta: Object, toc: Object): string {
  const ws_dir_path = ws_dir();
  let global_meta = await readGlobalMeta();
  global_meta.toc = toc;
  
  const template_text = await Deno.readTextFile(`${ws_dir_path}/layout/base.html`);

  const view = {
    site: global_meta,
    page: page_meta,
    content: html_content
  }
  return Mustache.render(template_text, view);
}

if (import.meta.main) {
  const html_path = Deno.args[0];
  const meta_path = Deno.args[1];
  const toc_path = Deno.args[2];
  const target_path = Deno.args[3];
  const relative_path = Deno.args[4];
  
  const meta_mod = await import(meta_path, {
    with: { type: "json" },
  });
  const toc_mod = await import(toc_path, {
    with: { type: "json" },
  });
  let meta = meta_mod.default;
  meta.relative_root = "../".repeat(relative_path.split("/").length);

  const output = await applyTemplate(await Deno.readTextFile(html_path),
    meta_mod.default, toc_mod.default);
  const target_dir = path.dirname(target_path);
  if (! await fs.exists(target_dir)) {
    await Deno.mkdir(target_dir, {recursive: true});
  }
  
  await Deno.writeTextFile(target_path, output);
}
