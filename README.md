# Metafield Migration Tool

## Description

This tool enables the migration or transfer of product and variant metafields between Shopify stores. Built with Node.js, it utilizes both the Shopify Storefront and Admin APIs to ensure that metafield definitions are created and all relevant metafield data is accurately copied from the source store to the destination store.

Features:

- Metafield Definition Creation: Automatically creates metafield definitions in the destination store.
- Metafield Transfer: Seamlessly copies product and variant metafields between Shopify stores.
- Image File Handling: Metafields of type "image file" will have their images uploaded directly to the destination store and properly referenced in the metafields.
- CSV Logging: A CSV log is generated, providing a detailed record of all metafields that have been updated during the migration

### Metafield Type Support

The only metafield reference supported is of type MediaImages. So a Metafield that holds an image or a list of images is supported. Any other reference type is not supported. All other Metafield values that aren't references are supported. The Metafield list type is also supported.

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

** The suggested Shopify admin and storefront api version is 2024-04 for this script!!!! **

### Installation

Clone the repo, run npm install, and make sure to fill out the .env according to the example and config with the Metafields you want to copy over to your new store.

### Run

Create Metafield Definitions. This will also generate the Metafield Identifiers required for the migration.

```bash
npm run create
```

Migrate the Metafields.

```bash
npm run migrate
```

## Logs

The Metafield Definition creation script will output any errors to `progress-logs/create-metafield-definition-errors.csv`.

The migration script will run and output the product metafield status in progress-logs/progress.csv in CSV format. There is a console-output_migrate.txt with standard output logs.
This way you can see the mutations called in the destination store via the admin api.
