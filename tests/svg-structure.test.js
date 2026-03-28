'use strict';

/**
 * Tests for the content and structure of individual SVG files.
 *
 * For every collection (one Jest test case per collection) this suite checks:
 *   1. No SVG file is empty (0 bytes)
 *   2. Every SVG file is valid, well-formed XML
 *   3. The root element is <svg> with the correct SVG namespace
 *   4. The root element declares a viewBox attribute
 */

const fs = require('fs');
const path = require('path');
// Node's built-in stream-based XML parser (expat-style, synchronous via the
// DOMParser-like approach). We use the lightweight fast-xml-parser to validate
// structure without pulling in large native addons.
const { XMLParser } = require('fast-xml-parser');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
});

function readInfoJson(collectionDir) {
  const filePath = path.join(ASSETS_DIR, collectionDir, 'info.json');
  let raw = fs.readFileSync(filePath);
  if (raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) {
    raw = raw.slice(3);
  }
  return JSON.parse(raw.toString('utf8'));
}

/** Returns the list of *.svg file paths for a collection, or [] if none. */
function getSvgPaths(collectionDir) {
  const svgDir = path.join(ASSETS_DIR, collectionDir, 'svg');
  if (!fs.existsSync(svgDir)) return [];
  return fs
    .readdirSync(svgDir)
    .filter((f) => f.toLowerCase().endsWith('.svg'))
    .map((f) => path.join(svgDir, f));
}

const collections = fs.readdirSync(ASSETS_DIR).sort();

// ─── Per-collection SVG content tests ────────────────────────────────────────
describe('SVG file content', () => {
  test.each(collections)('%s: no SVG file is empty', (dir) => {
    const paths = getSvgPaths(dir);
    const empty = paths.filter((p) => fs.statSync(p).size === 0);
    expect(empty).toEqual([]);
  });

  test.each(collections)('%s: all SVG files are valid XML', (dir) => {
    const paths = getSvgPaths(dir);
    const invalid = [];

    for (const p of paths) {
      const content = fs.readFileSync(p, 'utf8');
      try {
        parser.parse(content);
      } catch (e) {
        invalid.push(`${path.basename(p)}: ${e.message}`);
      }
    }

    expect(invalid).toEqual([]);
  });

  test.each(collections)(
    '%s: all SVG files declare the SVG namespace',
    (dir) => {
      const paths = getSvgPaths(dir);
      const missing = [];

      for (const p of paths) {
        const content = fs.readFileSync(p, 'utf8');
        try {
          const parsed = parser.parse(content);
          const xmlns = parsed?.svg?.['@_xmlns'];
          if (!xmlns) {
            missing.push(path.basename(p));
          }
        } catch (_e) {
          // parse errors are caught in the "valid XML" test above
        }
      }

      expect(missing).toEqual([]);
    }
  );

  test.each(collections)(
    '%s: all SVG files have a viewBox attribute',
    (dir) => {
      const paths = getSvgPaths(dir);
      const missing = [];

      for (const p of paths) {
        const content = fs.readFileSync(p, 'utf8');
        try {
          const parsed = parser.parse(content);
          const viewBox = parsed?.svg?.['@_viewBox'];
          if (!viewBox) {
            missing.push(path.basename(p));
          }
        } catch (_e) {
          // parse errors are caught in the "valid XML" test above
        }
      }

      expect(missing).toEqual([]);
    }
  );

  test.each(collections)(
    '%s: SVG root element is <svg>',
    (dir) => {
      const paths = getSvgPaths(dir);
      const invalid = [];

      for (const p of paths) {
        const content = fs.readFileSync(p, 'utf8');
        try {
          const parsed = parser.parse(content);
          // fast-xml-parser strips the namespace prefix; look for 'svg' key
          if (!Object.prototype.hasOwnProperty.call(parsed, 'svg')) {
            invalid.push(path.basename(p));
          }
        } catch (_e) {
          // parse errors are caught in the "valid XML" test above
        }
      }

      expect(invalid).toEqual([]);
    }
  );
});
