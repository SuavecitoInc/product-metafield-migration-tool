/**
 * This is an example config with made up metafields, this is how config.ts object
 * should look like
 */
const config = {
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
      {
        key: "example_key",
        namespace: "example",
      },
      {
        key: "example_key2",
        namespace: "example",
      },
    ],
    variant: [
      {
        key: "example_v_key",
        namespace: "example",
      },
      {
        key: "example_v_key",
        namespace: "example",
      },
    ],
  },
};
