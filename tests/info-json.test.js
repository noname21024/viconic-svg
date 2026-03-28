'use strict';

/**
 * Tests for assets/<collection>/info.json metadata files.
 *
 * Each collection is expected to have a well-formed info.json with:
 *   - prefix       : non-empty string, unique across all collections
 *   - info.name    : non-empty string (human-readable collection name)
 *   - info.total   : non-negative integer
 *   - info.author.name : non-empty string
 *   - info.license.title : non-empty string
 *   - info.license.spdx  : non-empty string (SPDX identifier)
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

/**
 * Read an info.json file, stripping a leading UTF-8 BOM if present, and
 * return the parsed JavaScript object.
 */
function readInfoJson(collectionDir) {
  const filePath = path.join(ASSETS_DIR, collectionDir, 'info.json');
  let raw = fs.readFileSync(filePath);
  // Strip UTF-8 BOM (EF BB BF) that is present on every file in this repo
  if (raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) {
    raw = raw.slice(3);
  }
  return JSON.parse(raw.toString('utf8'));
}

const collections = fs.readdirSync(ASSETS_DIR).sort();

// ─── Parse all info.json files once and share across test suites ─────────────
let allData;
try {
  allData = collections.map((dir) => ({ dir, data: readInfoJson(dir) }));
} catch (err) {
  allData = [];
}

// ─── Individual collection tests ─────────────────────────────────────────────
describe('info.json – individual collection validation', () => {
  test.each(collections)('%s: info.json exists', (dir) => {
    const filePath = path.join(ASSETS_DIR, dir, 'info.json');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test.each(collections)('%s: info.json is valid JSON', (dir) => {
    expect(() => readInfoJson(dir)).not.toThrow();
  });

  test.each(collections)('%s: has a non-empty prefix', (dir) => {
    const data = readInfoJson(dir);
    expect(typeof data.prefix).toBe('string');
    expect(data.prefix.trim().length).toBeGreaterThan(0);
  });

  test.each(collections)('%s: has info.name', (dir) => {
    const { info } = readInfoJson(dir);
    expect(info).toBeDefined();
    expect(typeof info.name).toBe('string');
    expect(info.name.trim().length).toBeGreaterThan(0);
  });

  test.each(collections)('%s: has a non-negative info.total', (dir) => {
    const { info } = readInfoJson(dir);
    expect(typeof info.total).toBe('number');
    expect(info.total).toBeGreaterThanOrEqual(0);
  });

  test.each(collections)('%s: has info.author.name', (dir) => {
    const { info } = readInfoJson(dir);
    expect(info.author).toBeDefined();
    expect(typeof info.author.name).toBe('string');
    expect(info.author.name.trim().length).toBeGreaterThan(0);
  });

  test.each(collections)('%s: has info.license.title', (dir) => {
    const { info } = readInfoJson(dir);
    expect(info.license).toBeDefined();
    expect(typeof info.license.title).toBe('string');
    expect(info.license.title.trim().length).toBeGreaterThan(0);
  });

  test.each(collections)('%s: has a non-empty info.license.spdx', (dir) => {
    const { info } = readInfoJson(dir);
    expect(info.license).toBeDefined();
    expect(typeof info.license.spdx).toBe('string');
    expect(info.license.spdx.trim().length).toBeGreaterThan(0);
  });

  test.each(collections)('%s: lastModified is a positive number', (dir) => {
    const data = readInfoJson(dir);
    expect(typeof data.lastModified).toBe('number');
    expect(data.lastModified).toBeGreaterThan(0);
  });
});

// ─── Cross-collection tests ───────────────────────────────────────────────────
describe('info.json – cross-collection validation', () => {
  test('every collection prefix is unique', () => {
    const seen = new Map();
    const duplicates = [];

    for (const { dir, data } of allData) {
      const prefix = data.prefix;
      if (seen.has(prefix)) {
        duplicates.push(`"${prefix}" used by both "${seen.get(prefix)}" and "${dir}"`);
      } else {
        seen.set(prefix, dir);
      }
    }

    expect(duplicates).toEqual([]);
  });

  test('prefix contains only lowercase letters, numbers, and hyphens', () => {
    const invalid = [];
    for (const { dir, data } of allData) {
      if (!/^[a-z0-9-]+$/.test(data.prefix)) {
        invalid.push(`${dir}: "${data.prefix}"`);
      }
    }
    expect(invalid).toEqual([]);
  });
});
