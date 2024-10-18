import fs from "fs";
import path from "path";
import "dotenv/config";
import fetch from "node-fetch";
import { fileURLToPath } from "url";
import { creationConfig as config } from "../config";
import {
  ADMIN_CREATE_METAFIELD_DEFINITION_QUERY,
  ADMIN_GET_METAFIELD_DEFINITIONS_QUERY,
} from "../schema";
import { initializeCSV, writeCSVColumn } from "../functions";
import type {
  MetafieldDefinition,
  MetafieldDefinitionsResponse,
  MetafieldDefinitionCreateResponse,
} from "../lib/types/shopify";

type ShopifyResponse<T> = {
  data: T;
  errors?: any;
};

type StoreConfig = {
  admin: {
    apiKey: string;
    storename: string;
    apiVersion: string;
  };
};

const filename = "create-metafield-definition-errors";
const header = [
  { id: "namespace", title: "Namespace" },
  { id: "key", title: "Key" },
  { id: "error", title: "Error" },
];
const csvWriter = initializeCSV(filename, header);

export const fetchAdmin = async <T>(
  storeConfig: StoreConfig,
  query: string,
  variables?: any
) => {
  try {
    const destinationKey = storeConfig.admin.apiKey as string;
    const destinationStorefrontName = storeConfig.admin.storename;
    const destinationApiVer = storeConfig.admin.apiVersion;
    const url = `https://${destinationStorefrontName}.myshopify.com/admin/api/${destinationApiVer}/graphql.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": destinationKey,
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = (await res.json()) as ShopifyResponse<T>;
    return json;
  } catch (err: any) {
    console.error("ERROR", err);
    return { data: null };
  }
};

export async function getMetafieldDefinitions(
  type: "PRODUCT" | "PRODUCTVARIANT",
  namespace: string
) {
  console.log("Getting metafields for", type, "in namespace", namespace);
  const res = await fetchAdmin<MetafieldDefinitionsResponse>(
    config.source,
    ADMIN_GET_METAFIELD_DEFINITIONS_QUERY,
    {
      ownerType: type,
      namespace: namespace,
    }
  );
  if (!res.data) {
    console.error("No data found in response.");
    return [];
  }

  const { data } = res;

  const metafields = data.metafieldDefinitions.edges;

  console.log(type, " Metafields found in source store.", metafields.length);

  return metafields;
}

export async function createMetafieldDefinition(
  definition: MetafieldDefinition
) {
  const def = {
    ...definition,
  };
  // create metafield definition
  const res = await fetchAdmin<MetafieldDefinitionCreateResponse>(
    config.destination,
    ADMIN_CREATE_METAFIELD_DEFINITION_QUERY,
    {
      definition: def,
    }
  );

  if (!res.data) {
    console.error("No data found in response.");
    return;
  }

  const { data } = res;

  const createdDefinition = data.metafieldDefinitionCreate.createdDefinition;
  console.log("Created definition", createdDefinition);
  if (!createdDefinition) {
    console.error("No definition created.");
    const error = res.data.metafieldDefinitionCreate.userErrors[0].message;
    if (error) {
      console.error("Error", error);
    }
    writeCSVColumn(csvWriter, {
      namespace: definition.namespace,
      key: definition.key,
      error: error || "No definition created",
    });
    return false;
  }

  return true;
}

export function exportMetafieldDefConfig(
  productMD: { definition: MetafieldDefinition }[],
  variantMD: { definition: MetafieldDefinition }[]
) {
  const metafields = {
    product: productMD.map((md) => ({
      namespace: md.definition.namespace,
      key: md.definition.key,
    })),
    variant: variantMD.map((md) => ({
      namespace: md.definition.namespace,
      key: md.definition.key,
    })),
  };

  const jsonData = JSON.stringify(metafields, null, 2);
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const filePath = path.join(
    __dirname,
    "../../data/metafield-identifiers.json"
  );
  fs.writeFile(filePath, jsonData, (err) => {
    if (err) {
      console.error("Error writing JSON file:", err);
    } else {
      console.log("JSON data written to file successfully.");
    }
  });
}
