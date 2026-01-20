#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as unpackCmd from "./commands/unpack";
import * as packCmd from "./commands/pack";
import * as splitCmd from "./commands/split";
import * as stitchCmd from "./commands/stitch";
import * as infoCmd from "./commands/info";
import * as renderCmd from "./commands/render";
import * as palettesCmd from "./commands/palettes";

/**
 * CLI for war2-fnt
 */
yargs(hideBin(process.argv))
    .command(unpackCmd as any)
    .command(packCmd as any)
    .command(splitCmd as any)
    .command(stitchCmd as any)
    .command(infoCmd as any)
    .command(renderCmd as any)
    .command(palettesCmd as any)
    .demandCommand()
    .help()
    .parse();
