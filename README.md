# Metafield Migration Tool

## Description

This tool enables the migration or transfer of product and variant metafields between Shopify stores. Built with Node.js, it utilizes both the Shopify Storefront and Admin APIs to ensure that metafield definitions are created and all relevant metafield data is accurately copied from the source store to the destination store.

Features:

- Metafield Definition Creation: Automatically creates metafield definitions in the destination store.
- Metafield Transfer: Seamlessly copies product and variant metafields between Shopify stores.
- Image File Handling: Metafields of type "image file" will have their images uploaded directly to the destination store and properly referenced in the metafields.
- CSV Logging: A CSV log is generated, providing a detailed record of all metafields that have been updated during the migration

### Metafield Type Support

The only supported metafield reference type is MediaImages, meaning metafields containing an image or a list of images are accepted. Other reference types are not supported. However, all non-reference metafield values and the metafield list type are supported.

## Usage

### Configuration

Fill out the .env file according to this example

```bash
SOURCE_SHOPIFY_ADMIN_KEY={OLD STORE ADMIN API KEY}
SOURCE_SHOPIFY_STOREFRONT_KEY={OLD STORE STOREFRONT KEY}
SOURCE_SHOPIFY_STOREFRONT_NAME=oldstorename
SOURCE_SHOPIFY_API_VERSION=2023-04
DESTINATION_SHOPIFY_ADMIN_KEY={NEW STORE ADMIN API KEY}
DESTINATION_SHOPIFY_STOREFRONT_NAME=newstorename
DESTINATION_SHOPIFY_API_VERSION=2023-04
```

The Product and Product Variant Metafield Identifiers will be auto generated and found in `./data/metafield-identifiers.json`.

** The suggested Shopify admin and storefront api version is 2025-07 for this script!!!! **

### Installation

Clone the repository, run npm install, and ensure you fill out the .env file following the provided example.

### Run

Create Metafield Definitions, which will also generate the necessary Metafield Identifiers for the migration process.

```bash
npm run create
```

Migrate the Metafields.

```bash
npm run migrate
```

## Logs

The Metafield Definition creation script logs any errors in progress-logs/create-metafield-definition-errors.csv.

The migration script tracks the product metafield status and saves the output in progress-logs/progress.csv in CSV format. Additionally, a console-output_migrate.txt file contains standard output logs, allowing you to view the mutations performed in the destination store via the admin API.
