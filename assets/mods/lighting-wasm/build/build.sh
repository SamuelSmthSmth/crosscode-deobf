#!/usr/bin/env bash
#
# build.sh — compile the lighting kernels to WASM for CrossCode's runtime.
#
# CrossCode runs in nw.js / Chromium launched with
# `--enable-features=SharedArrayBuffer` (see repo package.json), so we build a
# REAL threading target: Emscripten pthreads (SharedArrayBuffer + Atomics). The
# heavy row loops in lighting.cpp fan out across a pthread pool; see
# src/lighting.cpp. We therefore drop `LEGACY_VM_SUPPORT` (mutually exclusive
# with threads) and produce separate outputs — dist/LightingWasm.js (glue),
# dist/LightingWasm.wasm (bytecode), plus the worker bootstrap embedded in the
# glue. SINGLE_FILE + pthreads hangs under Node, so it is NOT used here.
#
# Prerequisites
# -------------
#   Emscripten (emcc) on PATH. Install once, e.g.:
#     git clone https://github.com/emscripten-core/emsdk.git
#     cd emsdk && ./emsdk install latest && ./emsdk activate latest && source emsdk_env.sh
#
# Usage
# -----
#   ./build.sh            ->  writes dist/LightingWasm.{js,wasm}, then runs the Node test
#   ./build.sh --no-test  ->  build only
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/src/lighting.cpp"
OUT="$ROOT/dist/LightingWasm.js"
RUN_TEST=1
if [[ "${1:-}" == "--no-test" ]]; then RUN_TEST=0; fi

if ! command -v emcc >/dev/null 2>&1; then
    echo "error: 'emcc' not found on PATH." >&2
    echo "Install/activate Emscripten first (see header comment or docs/RESEARCH-7-lighting-wasm.md)." >&2
    exit 1
fi

mkdir -p "$ROOT/dist"
rm -f "$ROOT"/dist/LightingWasm.js "$ROOT"/dist/LightingWasm.wasm

# PTHREAD_POOL_SIZE pre-spawns the workers once at module load (cheap afterwards).
# lighting_set_max_threads controls the fan-out per call; -pthread implies shared
# memory. We keep ALLOW_MEMORY_GROWTH for variability in frame sizes.
em++ "$SRC" \
    -O3 \
    -pthread \
    -s PTHREAD_POOL_SIZE=4 \
    -s ENVIRONMENT="web,worker,node" \
    -s MODULARIZE=1 \
    -s EXPORT_NAME=LightingWasm \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s EXPORTED_FUNCTIONS=_lighting_init,_lighting_free,_lighting_clear,_lighting_add_radial,_lighting_apply,_lighting_set_max_threads,_lighting_get_last_parallelism,_malloc,_free \
    -s EXPORTED_RUNTIME_METHODS=cwrap,ccall,HEAPU8 \
    -o "$OUT"

echo "Built: $OUT ($(wc -c < "$OUT") bytes), $ROOT/dist/LightingWasm.wasm ($(wc -c < "$ROOT/dist/LightingWasm.wasm") bytes)"

if [[ "$RUN_TEST" == "1" ]]; then
    echo
    echo "Running Node verification harness..."
    node "$ROOT/hw/test-wasm.js"
fi