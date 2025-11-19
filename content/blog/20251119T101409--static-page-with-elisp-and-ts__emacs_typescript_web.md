---
title:      "static-page-with-elisp-and-ts"
date:       2025-11-19T10:14:09+08:00
tags:       ["emacs", "typescript", "web"]
identifier: "20251119T101409"
---

#### Background
After using [Pelican](https://getpelican.com), [Quarto](https://quarto.org) for my static blog, I decided to develop a more concise one.

I admit that there are tons of utilities, like Jekyll, Hexo, even some doc-oriented, like mdbook, vitepress. All of them are feature-riched. But it is too tiring to find the specific feature that I want from their so long documentation. I do not write blog frequently, so each time I'd like to record something I have to review how to use the utility. So I think that making the underlay of replacement procedure for the template and article generating simple and clear is important. I use Markdown mainly, but it would be more easier if the utility can supports [Emacs Org](https://orgmode.org) because I use Org for some agenda and personal notes.

At first, I think about writing all of them in the Emacs Lisp so that it can seamlessly work with the [Denote](https://protesilaos.com/emacs/denote) which is a notes package I used in Emacs, but soon, I found that I cannot reject countless wheels on Typescript/Javascript, so I introduced [Deno](https://deno.com).


# My Blog
General Process:  

- sass: generate css  
- generate TOC: generate TOC.json, index page and index pages of category  
- generate HTML fragment: convert `.md` `.org` into html fragments  
- apply template: fill the template with fragments and some meta parameters to generate a complete HTML  

Now, it is deployed on the Github Page in the [repo](https://github.com/drindr/drindr.github.io).
