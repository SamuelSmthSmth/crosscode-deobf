# License

This repository mixes two kinds of material with different terms. Read both
before redistributing anything.

---

## 1. Original tooling (scripts and this documentation)

All scripts written for this project (`build-symbol-map.js`,
`extract-module.js`, `extract-modules.js`, `analyze-engine.js`,
`deobf/lookup-name.js`, `deobf/verify-lcs.js`, `deobf/verify-chunks.js`, and
the Markdown documentation) are provided under the MIT license:

```
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Third-party tooling vendored in this repo keeps its own licenses:
- `deobf/decrossfuscator/` — CC0 (by 20kdc)
- `ccloader/` — MIT (by the CCLoader contributors)
- `assets/mods/simplify/` — MIT (by the Simplify contributors)

---

## 2. Deobfuscated reference material (`deobf/clean/`, `deobf/extract/`,
`deobf/reference/`, `symbol-map.json`, `ENGINE-NOTES.md`,
`deobf/RENDERING-2.5D-NOTES.md`, `engine-tree.txt`)

This material is **derived from the CrossCode game engine**, which is the
intellectual property of **Radical Fish Games**. It is provided **for personal
study, modding interoperability, and educational purposes only**:

- You may read it, use it to understand the engine, and use it to build mods
  for CrossCode.
- You may not redistribute the raw extracted or cleaned game code
  (`deobf/clean/`, `deobf/extract/`, `deobf/reference/`) in a way that
  competes with or substitutes for the game itself.
- The cleaned code is **documentation, not a license to copy game logic** into
  other projects wholesale.

The deobfuscation names and the symbol map are facts about the game's compiled
artifacts produced through interoperability research; the underlying game code
and its copyright remain with Radical Fish Games.

**CrossCode © Radical Fish Games.** This project is not affiliated with or
endorsed by Radical Fish Games or Deck13.

---

*If you plan to publish or redistribute this repository, review the current
terms yourself — this file is not legal advice.*
