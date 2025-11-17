#!/usr/bin/env -S deno --allow-read --allow-write

import { walk } from "jsr:@std/fs/walk"
import path from "node:path"

function entryFromFile(content_path: string, file: Object) {
  const relative_path = path.relative(content_path, file.path);
  const filename = path.parse(file.name);
  const date_name_tags = filename.name.split(/(__|--)/, 5);
  const date = date_name_tags[0].split("T", 2);
  const date_str = [date[0].slice(0, 4), date[0].slice(4, 6), date[0].slice(6, 8)].join("-");
  const time_str = [date[1].slice(0,2), date[1].slice(2, 4), date[1].slice(4, 6)].join(":");
  return {
    path: relative_path,
    name: date_name_tags[2],
    date: new Date(`${date_str}T${time_str}`),
    tags: date_name_tags[4].split("_")
  };
}

async function generateTOC() {
  const available_ext = [".md", ".org"];
  const content_path = Deno.args[0];
  const meta_out_path = Deno.args[1];
  let entries = [];
  for await (const dir_entry of Deno.readDir(content_path)) {
    if(! dir_entry.isDirectory) {
      continue;
    }
    let articles = [];

    for await (const file_entry of walk(path.join(content_path, dir_entry.name))) {
      if(file_entry.isDirectory || file_entry.path.includes("/static/") || !available_ext.includes(path.extname(file_entry.path))) {
        continue;
      }
      articles.push(entryFromFile(content_path, file_entry));
    }
    entries.push({[dir_entry.name]: articles});
  }
  console.log(entries);
  Deno.writeTextFile(meta_out_path, JSON.stringify(entries));
}

if (import.meta.main) {
  generateTOC()
}
