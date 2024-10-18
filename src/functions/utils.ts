import { migrationConfig, creationConfig } from "../config";
import fetch from "node-fetch";
import * as CSVWriter from "csv-writer";
import path from "path";
import { fileURLToPath } from "url";
import { ObjectMap } from "csv-writer/src/lib/lang/object";

import type { CSVWriterType } from "../lib";

export const fetchStorefrontSource = async (
  query: string,
  variables?: any
): Promise<any> => {
  try {
    const sourceKey = migrationConfig.apiKey.storefront;
    const sourceStorefrontName = migrationConfig.storename.storefront;
    const sourceApiVer = migrationConfig.apiVersion.storefront;
    const url = `https://${sourceStorefrontName}.myshopify.com/api/${sourceApiVer}/graphql.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": sourceKey,
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    console.error("ERROR", err);
  }
};

export const fetchAdminDestination = async (
  query: string,
  variables?: any
): Promise<any> => {
  try {
    const destinationKey = migrationConfig.apiKey.admin;
    const destinationStorefrontName = migrationConfig.storename.admin;
    const destinationApiVer = migrationConfig.apiVersion.admin;
    const url = `https://${destinationStorefrontName}.myshopify.com/admin/api/${destinationApiVer}/graphql.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": destinationKey,
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    console.error("ERROR", err);
  }
};

export const flattenConnection = (connectionArray: {
  edges?: { node: any }[];
  nodes?: any[];
}): any[] => {
  if (!connectionArray) return [];
  if (
    !Array.isArray(connectionArray.edges) &&
    !Array.isArray(connectionArray.nodes)
  ) {
    return [];
  }
  if (connectionArray.edges) {
    return connectionArray.edges.map((el) => ({ ...el.node }));
  } else if (connectionArray.nodes) {
    return connectionArray.nodes.map((el) => el);
  } else {
    return [];
  }
};

export const isEmpty = (array: any[]): boolean => {
  if (array && array.length === 0) {
    return true;
  }
  return false;
};

export const prettyPrint = (obj: {}) => {
  if (typeof obj !== "object") {
    return "please pass an object into this function, pretty print failed";
  }
  return JSON.stringify(obj, null, 2);
};

export const initializeCSV = (
  filename: string,
  header: { id: string; title: string }[]
) => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const createCSVWriter = CSVWriter.createObjectCsvWriter;
  const csvWriter = createCSVWriter({
    path: path.join(__dirname, `../../progress-logs/${filename}.csv`),
    header,
  });
  return csvWriter;
};

export const writeCSVColumn = async (
  csvWriter: CSVWriterType,
  record: ObjectMap<any>
) => {
  const csvRes = await csvWriter.writeRecords([record]);
  return csvRes;
};

export const checkMigrationConfig = () => {
  if (
    !migrationConfig.apiKey.admin ||
    !migrationConfig.apiKey.storefront ||
    !migrationConfig.storename.admin ||
    !migrationConfig.storename.storefront ||
    !migrationConfig.apiVersion.admin ||
    !migrationConfig.apiVersion.storefront
  ) {
    return false;
  }

  const productMetafields = migrationConfig.metafieldIdentifiers.product;
  console.log(
    "Product Metafield Identifiers",
    productMetafields.length,
    "found"
  );
  const variantMetafields = migrationConfig.metafieldIdentifiers.variant;
  console.log(
    "Variant Metafield Identifiers",
    variantMetafields.length,
    "found"
  );

  return true;
};

export const checkCreationConfig = () => {
  if (
    !creationConfig.source.admin.apiKey ||
    !creationConfig.source.admin.storename ||
    !creationConfig.source.admin.apiVersion ||
    !creationConfig.destination.admin.apiKey ||
    !creationConfig.destination.admin.storename ||
    !creationConfig.destination.admin.apiVersion
  ) {
    return false;
  }
  return true;
};
