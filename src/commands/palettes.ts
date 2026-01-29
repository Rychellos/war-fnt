import { Argv } from "yargs";
import { PALETTES } from "../index";

export const command = "palettes";
export const describe = "List all available built-in palettes";

export const builder = (y: Argv) => {
    return y;
};

export const handler = async () => {
    console.log("Available Palettes:");
    
    for (const name of Object.keys(PALETTES)) {
        console.log(`- ${name}`);
    }
};
