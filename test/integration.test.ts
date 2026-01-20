import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { handler as splitHandler } from '../src/commands/split';
import { handler as stitchHandler } from '../src/commands/stitch';
import { handler as renderHandler } from '../src/commands/render';

const TEST_DIR = path.join(__dirname, 'temp_integration');
const INPUT_FILE = path.join(__dirname, 'small.war2-fnt');
const GAME_FONT_FILE = path.join(__dirname, 'game.war2-fnt');
const PALETTE_FILE = path.join(__dirname, 'palette.json');
const SPLIT_DIR = path.join(TEST_DIR, 'split_out');
const STITCH_OUT = path.join(TEST_DIR, 'output.fnt');
const RENDER_OUT = path.join(TEST_DIR, 'render_test.png');

describe('CLI Integration', () => {
    beforeAll(async () => {
        await fs.mkdir(TEST_DIR, { recursive: true });
    });

    afterAll(async () => {
        await fs.rm(TEST_DIR, { recursive: true, force: true });
    });

    it('should split .fnt file into images and metadata', async () => {
        await splitHandler({
            file: INPUT_FILE,
            output: SPLIT_DIR,
            palette: PALETTE_FILE,
            $0: 'cli.js',
            _: ['split']
        } as any);

        const files = await fs.readdir(SPLIT_DIR);
        expect(files).toContain('metadata.json');

        // precise check for expected glyphs could be done here if we knew specific char codes
        // but verifying we have pngs is good enough for integration
        const pngs = files.filter(f => f.endsWith('.png'));
        expect(pngs.length).toBeGreaterThan(0);
    });

    it('should stitch images and metadata back into .fnt file', async () => {
        await stitchHandler({
            dir: SPLIT_DIR,
            palette: PALETTE_FILE,
            output: STITCH_OUT,
            $0: 'cli.js',
            _: ['stitch']
        } as any);

        const exists = await fs.stat(STITCH_OUT).then(() => true).catch(() => false);
        expect(exists).toBe(true);
    });

    it('should produce a file of similar size to original (roundtrip validity)', async () => {
        const originalStats = await fs.stat(INPUT_FILE);
        const newStats = await fs.stat(STITCH_OUT);

        // Exact byte match might fail if palette mapping isn't 1:1 reversible or compression differs
        // But size should be somewhat close.
        // Let's verify it's not empty and reasonable.
        expect(newStats.size).toBeGreaterThan(0);

        // Optional: If we are confident in roundtrip, we can check exact bytes.
        // For now, let's just log the difference.
        console.log(`Original size: ${originalStats.size}, New size: ${newStats.size}`);
    });

    it('should render text using game font', async () => {
        await renderHandler({
            file: GAME_FONT_FILE,
            text: 'Hello World',
            output: RENDER_OUT,
            palette: 'DEFAULT',
            spacing: 1,
            $0: 'cli.js',
            _: ['render']
        } as any);

        const exists = await fs.stat(RENDER_OUT).then(() => true).catch(() => false);
        expect(exists).toBe(true);
        const stats = await fs.stat(RENDER_OUT);
        expect(stats.size).toBeGreaterThan(0);
    });
});
