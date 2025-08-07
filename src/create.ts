import "dotenv/config";
import {
  getMetafieldDefinitions,
  exportMetafieldDefConfig,
  createMetafieldDefinition,
} from "./functions";
import { checkCreationConfig } from "./functions/utils";

async function runCreateMetafieldDefinitions() {
  const isValidConfig = checkCreationConfig();

  if (!isValidConfig) {
    console.log(
      "Invalid config! Please update your .env file to contain all fields."
    );
    return;
  }

  console.log("Starting metafield creation.");
  console.log("Getting metafields from source store.");
  // get metafield definitions
  const productMetafields = await getMetafieldDefinitions(
    "PRODUCT",
    "suavecito"
  );
  const variantMetafields = await getMetafieldDefinitions(
    "PRODUCTVARIANT",
    "suavecito"
  );

  // creates the metafield identifiers to be used in the migration script
  exportMetafieldDefConfig(productMetafields, variantMetafields);

  if (productMetafields) {
    const productMetafieldPromises = productMetafields.map((metafield) =>
      createMetafieldDefinition({
        ...metafield.definition,
        type: metafield.definition.type.name,
      })
    );
    const createdProductMetafieldDefs = await Promise.all(
      productMetafieldPromises
    );
    console.log(
      "Created product metafields",
      createdProductMetafieldDefs.filter((val) => val).length
    );
  }

  if (variantMetafields) {
    const variantMetafieldPromises = variantMetafields.map((metafield) =>
      createMetafieldDefinition({
        ...metafield.definition,
        type: metafield.definition.type.name,
      })
    );
    const createdVariantMetafieldDefs = await Promise.all(
      variantMetafieldPromises
    );
    console.log(
      "Created variant metafields",
      createdVariantMetafieldDefs.filter((val) => val).length
    );
  }
}

runCreateMetafieldDefinitions();
