#!/usr/bin/env bash
# Assertion PERILAKU cache edge pasca-deploy (pentest BH-05).
#
# Workflow lama hanya memeriksa header (CSP, x-cache, no-cache). Header bisa
# benar sementara cache-nya mati total - persis yang terjadi pada G-01/G-02:
# `Set-Cookie` membuat `cache.put()` jadi no-op diam-diam, semua respons tetap
# `x-cache: miss`, tapi tidak ada assertion yang gagal. Skrip ini
# menguji hasilnya: apakah request kedua benar-benar `hit`.
#
# Semua probe hanya GET/HEAD ke halaman publik yang sudah ada - tidak ada
# request yang mengubah state.
#
# Pakai: scripts/assert-live-behavior.sh <base-url> [prod|staging]
set -euo pipefail

BASE="${1:?Pakai: assert-live-behavior.sh <base-url> [prod|staging]}"
BASE="${BASE%/}"
PROFILE="${2:-prod}"

# Halaman kata yang dijamin ada (dipakai juga di 04-BUG-HUNTER.md).
LEMMA="${LEMMA:-capal}"

failures=0

fail() {
  echo "::error::$1"
  failures=$((failures + 1))
}

# x-cache dari GET tanpa body: header ke stdout, body di-/dev/null.
get_headers() {
  curl -fsS -D - -o /dev/null --max-time 30 "$BASE$1" 2>/dev/null || true
}

get_status() {
  curl -sS -o /dev/null -w '%{http_code}' --max-time 30 "$BASE$1" 2>/dev/null || echo "000"
}

xcache_of() {
  get_headers "$1" | tr -d '\r' | awk 'tolower($1) == "x-cache:" { print $2 }' | tail -1
}

assert_xcache() {
  local path="$1" expect="$2" reason="$3"
  local got
  got="$(xcache_of "$path")"
  if [ "$got" = "$expect" ]; then
    echo "ok   $path -> x-cache: $got"
  else
    fail "$path: x-cache '$got', diharapkan '$expect' ($reason)"
  fi
}

echo "== Verifikasi perilaku cache edge: $BASE (profil: $PROFILE) =="

# Staging memang 404 di /sitemap.xml (route menolak saat !isProd) dan korpus
# kata bisa berbeda dari produksi, jadi dua assertion itu khusus prod.
check_sitemap() { [ "$PROFILE" = "prod" ]; }
check_word_page() { [ "$PROFILE" = "prod" ]; }

# --- BH-08: path redirect tidak boleh melakukan lookup cache ------------------
# `/` tanpa prefix locale adalah 301 ke `/{locale}`. Dulu ditandai cacheable,
# jadi tiap request melakukan lookup dijamin kosong lalu render SSR penuh.
assert_xcache "/" "bypass" "path redirect tidak boleh di-cache (BH-08)"
assert_xcache "/words/$LEMMA" "bypass" "redirect legacy tidak boleh di-cache (BH-08)"

# --- G-01/G-02: cache harus benar-benar bekerja ------------------------------
# Request pertama mengisi entry; request kedua (build ID sama) WAJIB hit.
if check_word_page; then
  assert_xcache "/id/words/$LEMMA" "miss" "request pertama mengisi entry"
  assert_xcache "/id/words/$LEMMA" "hit" "cache HTML tidak berfungsi (G-01/G-02)"

  # --- BH-04: varian path harus berbagi satu entry ---------------------------
  # Semua varian di bawah kontennya identik. Kalau `canonicalCachePath` tidak
  # bekerja, masing-masing jadi entry terpisah dan selalu `miss`.
  assert_xcache "/id/words/$LEMMA/" "hit" "trailing slash harus berbagi entry cache"
  assert_xcache "/id//words//$LEMMA" "hit" "slash ganda harus berbagi entry cache"
  assert_xcache "/id/./words/$LEMMA" "hit" "segmen '.' harus berbagi entry cache"
fi

# Beranda per-locale juga harus ikut cache. Pakai locale non-default supaya
# entry-nya belum ada di cache lama, jadi "miss" lalu "hit" deterministik.
assert_xcache "/id-SBS" "miss" "request pertama mengisi beranda id-SBS"
assert_xcache "/id-SBS" "hit" "cache beranda per-locale tidak berfungsi"

# --- halaman huruf: cacheable, varian liar bypass -----------------------------
if check_word_page; then
  assert_xcache "/id/huruf/k" "miss" "request pertama mengisi halaman huruf"
  assert_xcache "/id/huruf/k" "hit" "cache halaman huruf tidak berfungsi"
  # Uppercase 301 ke lowercase: redirect tidak boleh melakukan lookup cache.
  assert_xcache "/id/huruf/K" "bypass" "redirect kanonik huruf tidak boleh di-cache"
  # Query cursor (halaman 2+) tidak boleh memakai entry halaman 1.
  assert_xcache "/id/huruf/k?cursor=x" "bypass" "URL ber-query tidak boleh di-cache"
fi

# --- G-02: negative cache 404 kata ------------------------------------------
MISSING="pentest-negative-cache-canary-$$"
assert_xcache "/id/words/$MISSING" "miss" "404 pertama tidak di-cache"
assert_xcache "/id/words/$MISSING" "hit" "negative cache 404 kata tidak berfungsi (G-02)"

# --- sitemap: harus 200 dan punya header cache -------------------------------
if check_sitemap; then
  SITEMAP_STATUS="$(get_status "/sitemap.xml")"
  if [ "$SITEMAP_STATUS" != "200" ]; then
    fail "/sitemap.xml: status $SITEMAP_STATUS, diharapkan 200"
  else
    echo "ok   /sitemap.xml -> 200"
  fi

  # Anak-anak sitemap index: 200 + benar-benar ter-cache di edge.
  for CHILD in "/sitemap-static.xml" "/sitemap-words/a"; do
    CHILD_STATUS="$(get_status "$CHILD")"
    if [ "$CHILD_STATUS" != "200" ]; then
      fail "$CHILD: status $CHILD_STATUS, diharapkan 200"
    else
      echo "ok   $CHILD -> 200"
    fi
  done
  assert_xcache "/sitemap-static.xml" "miss" "request pertama mengisi anak statis"
  assert_xcache "/sitemap-static.xml" "hit" "cache anak statis tidak berfungsi"
  assert_xcache "/sitemap-words/a" "miss" "request pertama mengisi anak huruf"
  assert_xcache "/sitemap-words/a" "hit" "cache anak huruf tidak berfungsi"
  # Varian liar bukan sitemap dan tidak boleh menyentuh cache.
  assert_xcache "/sitemap-words/aa" "bypass" "path sitemap invalid tidak di-cache"
else
  echo "skip /sitemap.xml (hanya aktif di profil prod)"
fi

echo
if [ "$failures" -gt 0 ]; then
  echo "== $failures assertion gagal =="
  exit 1
fi
echo "== Semua assertion perilaku cache lulus =="
