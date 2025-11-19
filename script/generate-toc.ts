#!/usr/bin/env -S deno --allow-read --allow-write

import { walk } from "jsr:@std/fs/walk"
import path from "node:path"
import { applyTemplate, ws_dir } from "./apply-template.ts"
import Mustache from "npm:mustache"

function entryFromFile(content_path: string, file: Object) {
  const relative_path = path.relative(content_path, file.path);
  const filename = path.parse(file.name);
  const date_name_tags = filename.name.split(/(__|--)/, 5);
  const date = date_name_tags[0].split("T", 2);
  const date_str = [date[0].slice(0, 4), date[0].slice(4, 6), date[0].slice(6, 8)].join("-");
  const time_str = [date[1].slice(0,2), date[1].slice(2, 4), date[1].slice(4, 6)].join(":");
  const dir_name = path.dirname(relative_path);
  const ext_name = path.extname(relative_path);
  const base_name = path.basename(relative_path, ext_name);
  return {
    original_path: relative_path,
    built_path: path.join(dir_name, base_name) + ".html",
    path: path.join(dir_name, date_name_tags[2]) + ".html",
    name: date_name_tags[2],
    date: new Date(`${date_str}T${time_str}`),
    tags: date_name_tags[4].split("_")
  };
}

async function generateCategoryIndex(category_name: string, articles: [], toc: Object, out_path: string) {
  const template_text = "<ul>{{ #articles }}<li><a href=\"./content/{{path}}\">{{name}}</a></li>{{ /articles }}</ul>";
  const html_content = Mustache.render(template_text, {articles: articles});
  for (var category of toc) {
    if (category.name === category_name) {
      category.current = true;
    }
  }
  const output = await applyTemplate(html_content, {title: category_name, page: {relative_path: "./"}}, toc);
  const file_name = path.join(out_path, category_name) + ".html";
  await Deno.writeTextFile(file_name, output);
}

async function generateIndex(out_path: string, toc: Object) {
  const index_html = await Deno.readTextFile(path.join(ws_dir(), "layout/index.html"));
  const output = await applyTemplate(index_html, {page: {relative_path: "./"}}, toc);
  await Deno.writeTextFile(path.join(out_path, "index.html"), output);
}

async function generateTOC() {
  const available_ext = [".md", ".org"];
  const content_path = Deno.args[0];
  const meta_out_path = Deno.args[1];
  const out_path = Deno.args[2];
  let entries = [];
  for await (const dir_entry of Deno.readDir(content_path)) {
    if(! dir_entry.isDirectory) {
      continue;
    }
    let articles = [];

    for await (const file_entry of walk(path.join(content_path, dir_entry.name))) {
      if(file_entry.isDirectory ||
        file_entry.path.includes("/static/") ||
        !available_ext.includes(path.extname(file_entry.path))) {
        continue;
      }
      articles.push(entryFromFile(content_path, file_entry));
    }
    entries.push({
      name: dir_entry.name,
      articles: articles});
  }
  const entries_json = JSON.stringify(entries);
  for (const category of entries) {
    await generateCategoryIndex(category.name, category.articles, JSON.parse(entries_json), out_path);
  }
  await generateIndex(out_path, entries);
  Deno.writeTextFile(meta_out_path, entries_json);
}

if (import.meta.main) {
  generateTOC()
}
