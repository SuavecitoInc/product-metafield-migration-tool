import {
  flattenConnection,
  isEmpty,
  fetchAdminDestination,
  prettyPrint,
  fetchStorefrontSource,
  writeCSVColumn,
} from "./utils";
import {
  ADMIN_SET_METAFIELD_QUERY,
  ADMIN_UPLOAD_FIlES_QUERY,
  ADMIN_GET_PRODUCT_QUERY,
  STOREFRONT_PRODUCTS_LOOP_QUERY,
} from "../schema";
import { PAGE_BY } from "../lib/consts";
import { migrationConfig } from "../config";

import type {
  Product,
  ProductVariant,
  FileCreateInput,
  File,
  MetafieldsSetInput,
  Metafield,
  MediaImage,
  CSVWriterType,
} from "../lib/types";

/**
 * Recursive function that paginates by 100
 * Runs migrateMetafields() on each product
 * @param {string | null} cursor - cursor pagination object for product loop
 * @param {CSVWriterType} csvWriter - csvWriter object for logging
 */
export const startMigration = async (
  cursor: string | null = null,
  csvWriter: CSVWriterType
) => {
  try {
    const res = await fetchStorefrontSource(STOREFRONT_PRODUCTS_LOOP_QUERY, {
      pageBy: PAGE_BY,
      cursor,
      productIdentifiers: migrationConfig.metafieldIdentifiers.product,
      variantIdentifiers: migrationConfig.metafieldIdentifiers.variant,
    });

    const { data } = res;

    if (!data) throw Error("Fetch failed to return data");

    const { products } = data;
    const { hasNextPage, endCursor } = products.pageInfo;
    const flattenedProducts = flattenConnection(products);
    for (const product of flattenedProducts) {
      console.log("On product", product.handle);
      const res = await migrateMetafields(product, csvWriter);
    }
    if (hasNextPage) {
      const recursiveRes = await startMigration(endCursor, csvWriter);
    } else {
      console.log("End of migration!");
    }
  } catch (error) {
    console.error("Error on startMigration call", error);
  }
};

/**
 * Migrates a product and child variants metafield from source to destination
 * @param {string} srcProduct - source product with metafields to be copied
 * @param {CSVWriterType} csvWriter - csvWriter object for logging
 */
export const migrateMetafields = async (
  srcProduct: Product,
  csvWriter: CSVWriterType
) => {
  try {
    const res = await fetchAdminDestination(ADMIN_GET_PRODUCT_QUERY, {
      handle: srcProduct.handle,
    });
    if (!res.data) {
      console.error("Error destruturing data on response", res);
      return;
    }
    const { data } = res;
    if (!data) return;

    const dstProduct = data.productByHandle;
    if (!dstProduct || srcProduct.handle !== dstProduct.handle) {
      const csvRes = await createEmptyLog(
        csvWriter,
        srcProduct.handle,
        "No matching handle in destination store"
      );
      console.log("no matching handle");
      return;
    }

    // if handles match, copy over source metafields to destination product
    // product metafield migration
    if (srcProduct.metafields && !isEmpty(srcProduct.metafields)) {
      const productMetafields = srcProduct.metafields.filter(
        (m: Metafield | null) => m
      );
      const metafieldPayload: MetafieldsSetInput[] = await getMetafieldPayload(
        productMetafields,
        srcProduct,
        dstProduct
      );
      // upload source metafields to destination if payload created
      if (!isEmpty(metafieldPayload)) {
        // split into 25 metafields per request
        const metafieldChunks = metafieldPayload.reduce(
          (resultArray: MetafieldsSetInput[][], item, index) => {
            const chunkIndex = Math.floor(index / 25);
            if (!resultArray[chunkIndex]) {
              resultArray[chunkIndex] = []; // start a new chunk
            }
            resultArray[chunkIndex].push(item);
            return resultArray;
          },
          []
        );
        // loop through each chunk and upload
        const response = metafieldChunks.map(async (chunk) => {
          const res = await uploadMetafields(chunk);
          return res;
        });

        const chunksRes = await Promise.all(response);

        for (const res of chunksRes) {
          const log = createMetafieldLog(res);
          const csvRes = await writeCSVColumn(csvWriter, {
            handle: srcProduct.handle,
            sku: "",
            metafields: log,
            outcome:
              log === ""
                ? "No metafields uploaded"
                : "Metafields successfully uploaded",
          });
          console.log("UPLOADED PRODUCT METAFIELDS", prettyPrint(res));
        }
      }
    } else {
      const csvRes = await createEmptyLog(
        csvWriter,
        srcProduct.handle,
        "Product has no matching metafields"
      );
    }

    // variant metafield migration
    const srcVariants = flattenConnection(
      srcProduct.variants
    ) as ProductVariant[];
    const dstVariants = flattenConnection(
      dstProduct.variants
    ) as ProductVariant[];

    for (const variant of dstVariants) {
      // if source variant exists, copy metafield data
      const matchingSrcVariant = srcVariants.find(
        (el) => el.sku === variant.sku
      );
      // error purposes
      if (!matchingSrcVariant) {
        const csvRes = await createEmptyLog(
          csvWriter,
          srcProduct.handle,
          "No matching sku in destination store",
          variant.sku
        );
        continue;
      } else if (!matchingSrcVariant.metafields) {
        const csvRes = await createEmptyLog(
          csvWriter,
          srcProduct.handle,
          "Variant has no matching metafields",
          matchingSrcVariant?.sku
        );
        continue;
      }

      const variantMetafields = matchingSrcVariant.metafields.filter(
        (m: Metafield | null) => m
      );

      const metafieldPayload: MetafieldsSetInput[] = await getMetafieldPayload(
        variantMetafields,
        matchingSrcVariant,
        variant
      );

      if (isEmpty(metafieldPayload)) continue;
      // split into 25 metafields per request
      const metafieldChunks = metafieldPayload.reduce(
        (resultArray: MetafieldsSetInput[][], item, index) => {
          const chunkIndex = Math.floor(index / 25);
          if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = []; // start a new chunk
          }
          resultArray[chunkIndex].push(item);
          return resultArray;
        },
        []
      );
      // loop through each chunk and upload
      const response = metafieldChunks.map(async (chunk) => {
        const res = await uploadMetafields(chunk);
        return res;
      });

      const chunksRes = await Promise.all(response);

      for (const res of chunksRes) {
        const log = createMetafieldLog(res);
        const csvRes = await writeCSVColumn(csvWriter, {
          handle: srcProduct.handle,
          sku: "",
          metafields: log,
          outcome:
            log === ""
              ? "No metafields uploaded"
              : "Metafields successfully uploaded",
        });
        console.log("UPLOADED VARIANT METAFIELDS", prettyPrint(res));
      }
    }

    return true;
  } catch (error) {
    console.error("Error on migrateMetafields", error);
    return false;
  }
};

/**
 * Determines whether the metafield value property is a normal value, reference, or list_reference
 * @param {string} type - metafield.type property
 */
export const getMetafieldValueType = (
  type: string
): "list-reference" | "reference" | "value" => {
  if (type.includes("reference")) {
    if (type.includes("list")) return "list-reference";
    return "reference";
  }
  return "value";
};

/**
 * Returns the metafieldValueInput to be used in metafieldSet mutation
 * @param {Metafield} metafield - metafield for metafield value input
 * @param {Product | ProductVariant} owner - owner for the metafield value input (dstOwner)
 */
export const getMetafieldValueInput = async (
  metafield: Metafield,
  owner: Product | ProductVariant
) => {
  try {
    const metafieldDataType = getMetafieldValueType(metafield.type);
    if (metafieldDataType === "value") {
      return metafield.value;
    }
    // metafield is a file reference
    const metafieldImages =
      metafieldDataType === "list-reference"
        ? // @ts-ignore
          flattenConnection(metafield.references)
        : [metafield.reference];
    const filePayload = createFilePayload(metafieldImages, owner);
    const imageIds = await uploadFiles(filePayload);
    if (!imageIds || isEmpty(imageIds)) return;

    // if reference is a list, return stringified array
    // else, return single string value
    const metafieldInput =
      metafieldDataType === "list-reference"
        ? JSON.stringify(imageIds)
        : imageIds[0];

    return metafieldInput;
  } catch (error) {
    console.error("Error on getMetafieldValueInput");
    return "";
  }
};

/**
 * Creates a payload of type FileCreateInput[] for mutation
 * @param {MediaImage[]} metafieldImages - array of MediaImages
 * @param {Product | ProductVariant} owner - owner of the newly created image metafield, destination product/variant in this case
 */
export const createFilePayload = (
  metafieldImages: MediaImage[],
  owner: Product | ProductVariant
): FileCreateInput[] => {
  return metafieldImages.map((variantImage, index) => {
    const { image } = variantImage;
    return {
      alt: image.altText ?? "",
      contentType: "IMAGE",
      originalSource: image.url,
    } as FileCreateInput;
  });
};

/**
 * Uploads files to destination store
 * @param {FileCreateInput[]} metafieldPayload - payload for filesCreate mutation
 */
export const uploadFiles = async (filePayload: FileCreateInput[]) => {
  try {
    if (!isEmpty(filePayload)) {
      const res = await fetchAdminDestination(ADMIN_UPLOAD_FIlES_QUERY, {
        fileInput: filePayload,
      });
      const { files }: { files: File[] } = res.data.fileCreate;
      const { throttleStatus } = res.extensions.cost;
      if (!files) return [];
      console.log("UPLOADED FILES", files);
      return files.map((file) => file.id);
    }
  } catch (error) {
    console.error("Error on uploadFiles", error);
  }
};

/**
 * Returns the metafieldSet mutation payload for the destination product/variant
 * @param {Metafield[]} metafields - metafields to create payload for
 * @param {Product | ProductVariant} srcOwner - the source owner (where the metafield is copied from)
 * @param {Product | ProductVariant} dstOwner - the destination owner (where the metafield will be copied to)
 */
export const getMetafieldPayload = async (
  metafields: Metafield[],
  srcOwner: Product | ProductVariant,
  dstOwner: Product | ProductVariant
): Promise<MetafieldsSetInput[]> => {
  const metafieldPayload: MetafieldsSetInput[] = [];
  try {
    for (const metafield of metafields) {
      // get input for metafield
      const metafieldInput = await getMetafieldValueInput(metafield, srcOwner);
      const { key, namespace, type } = metafield;
      metafieldPayload.push({
        key,
        namespace,
        type,
        ownerId: dstOwner.id,
        value: metafieldInput as string,
      });
    }
  } catch (error) {
    console.error("Error on getMetafieldPayload", error);
  }
  return metafieldPayload;
};

/**
 * Uploads metafields to destination store
 * @param {MetafieldsSetInput[]} metafieldPayload - payload for metafieldSet mutation
 */
export const uploadMetafields = async (
  metafieldPayload: MetafieldsSetInput[]
) => {
  try {
    const res = await fetchAdminDestination(ADMIN_SET_METAFIELD_QUERY, {
      metafields: metafieldPayload,
    });
    return res;
  } catch (error) {
    console.error("Error on uploadMetafields", error);
  }
};

/**
 * Creates log object for owner metafield column
 * @param {MetafieldSetResponse} response - response when calling uploadMetafields
 */
export const createMetafieldLog = (response: {
  data: {
    metafieldsSet: {
      metafields: Metafield[];
    };
  };
}) => {
  const { data } = response;
  if (!data) {
    throw Error("data is null");
  }
  const { metafields } = data.metafieldsSet;
  const keyset = metafields.map((m) => `${m.key}.${m.namespace}`);
  return JSON.stringify(keyset);
};

/**
 * Log function used for products that dont upload metafields
 * @param {CSVWriterType} csvWriter - response when calling uploadMetafields
 * @param {string} handle - product.handle
 * @param {string} reason - outcome log you wish to write
 * @param {string?} sku - variant.sku
 */
export const createEmptyLog = async (
  csvWriter: CSVWriterType,
  handle: string,
  reason: string,
  sku: string = ""
) => {
  try {
    const csvRes = await writeCSVColumn(csvWriter, {
      handle: handle,
      sku: sku,
      metafields: "",
      outcome: reason,
    });
  } catch (error) {
    console.error("Error on createEmptyLog", error);
  }
};
