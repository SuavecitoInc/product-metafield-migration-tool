import "dotenv/config";
import path from "path";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import type { MigrationConfig } from "./lib";

// reads the metafield identifiers from a JSON file,
// if the file is not found, it will return an empty array for both product and variant
const readJSON = async (filename: string) => {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const data = await readFile(path.join(__dirname, `../data/${filename}`));
    if (!data) {
      throw new Error(`File ${filename} not found`);
    }
    return JSON.parse(data.toString());
  } catch (err: any) {
    console.error(err.message);
    return {
      product: [],
      variant: [],
    };
  }
};

const data = await readJSON("metafield-identifiers.json");

export const migrationConfig: MigrationConfig = {
  apiKey: {
    storefront: process.env.SOURCE_SHOPIFY_STOREFRONT_KEY,
    admin: process.env.DESTINATION_SHOPIFY_ADMIN_KEY,
  },
  storename: {
    storefront: process.env.SOURCE_SHOPIFY_STOREFRONT_NAME,
    admin: process.env.DESTINATION_SHOPIFY_STOREFRONT_NAME,
  },
  apiVersion: {
    storefront: process.env.DESTINATION_SHOPIFY_API_VERSION,
    admin: process.env.DESTINATION_SHOPIFY_API_VERSION,
  },
  metafieldIdentifiers: {
    product: [
      // {
      //   key: "example_key",
      //   namespace: "example",
      // },
      ...data.product,
    ],
    variant: [
      // {
      //   key: "example_key2",
      //   namespace: "example",
      // },
      ...data.variant,
    ],
  },
};

export const creationConfig = {
  source: {
    admin: {
      apiKey: process.env.SOURCE_SHOPIFY_ADMIN_KEY as string,
      storename: process.env.SOURCE_SHOPIFY_STOREFRONT_NAME as string,
      apiVersion:
        (process.env.SOURCE_SHOPIFY_API_VERSION as string) || "2025-07",
    },
  },
  destination: {
    admin: {
      apiKey: process.env.DESTINATION_SHOPIFY_ADMIN_KEY as string,
      storename: process.env.DESTINATION_SHOPIFY_STOREFRONT_NAME as string,
      apiVersion:
        (process.env.DESTINATION_SHOPIFY_API_VERSION as string) || "2025-07",
    },
  },
};
