export declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SOURCE_SHOPIFY_STOREFRONT_KEY: string;
      SOURCE_SHOPIFY_STOREFRONT_NAME: string;
      SOURCE_SHOPIFY_API_VERSION: string;
      DESTINATION_SHOPIFY_ADMIN_KEY: string;
      DESTINATION_SHOPIFY_STOREFRONT_NAME: string;
      DESTINATION_SHOPIFY_API_VERSION: string;
    }
  }
}
