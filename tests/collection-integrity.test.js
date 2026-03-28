'use strict';

/**
 * Tests for the physical structure of each icon collection folder.
 *
 * Every collection under assets/ must:
 *   1. Contain a readable info.json
 *   2. Contain a non-empty svg/ sub-directory when info.total > 0
 *   3. Have info.total match the actual number of *.svg files on disk
 *   4. Contain only *.svg files inside the svg/ directory
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

function readInfoJson(collectionDir) {
  const filePath = path.join(ASSETS_DIR, collectionDir, 'info.json');
  let raw = fs.readFileSync(filePath);
  if (raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) {
    raw = raw.slice(3);
  }
  return JSON.parse(raw.toString('utf8'));
}

function getSvgFiles(collectionDir) {
  const svgDir = path.join(ASSETS_DIR, collectionDir, 'svg');
  if (!fs.existsSync(svgDir)) return null;
  return fs.readdirSync(svgDir);
}

const collections = fs.readdirSync(ASSETS_DIR).sort();

// ─── Structure tests ──────────────────────────────────────────────────────────
describe('collection structure', () => {
  test.each(collections)('%s: info.json is present and readable', (dir) => {
    const filePath = path.join(ASSETS_DIR, dir, 'info.json');
    expect(fs.existsSync(filePath)).toBe(true);
    expect(() => readInfoJson(dir)).not.toThrow();
  });

  test.each(collections)(
    '%s: svg/ directory exists when info.total > 0',
    (dir) => {
      const { info } = readInfoJson(dir);
      const svgDir = path.join(ASSETS_DIR, dir, 'svg');
      if (info.total > 0) {
        expect(fs.existsSync(svgDir)).toBe(true);
      }
    }
  );

  test.each(collections)(
    '%s: svg/ directory contains only .svg files',
    (dir) => {
      const files = getSvgFiles(dir);
      if (!files) return; // collection with no svg/ is allowed when total === 0

      const nonSvg = files.filter((f) => !f.toLowerCase().endsWith('.svg'));
      expect(nonSvg).toEqual([]);
    }
  );

  test.each(collections)(
    '%s: actual SVG file count matches info.total',
    (dir) => {
      const { info } = readInfoJson(dir);
      const files = getSvgFiles(dir);
      const actualCount = files
        ? files.filter((f) => f.toLowerCase().endsWith('.svg')).length
        : 0;
      expect(actualCount).toBe(info.total);
    }
  );

  test.each(collections)(
    '%s: all SVG filenames are lowercase with no spaces',
    (dir) => {
      const files = getSvgFiles(dir);
      if (!files) return;

      const invalid = files.filter(
        (f) => f !== f.toLowerCase() || /\s/.test(f)
      );
      expect(invalid).toEqual([]);
    }
  );
});
