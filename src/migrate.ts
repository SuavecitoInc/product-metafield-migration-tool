import {
  initializeCSV,
  startMigration,
  checkMigrationConfig,
} from "./functions";

async function runMetafieldMigration() {
  const isValidConfig = checkMigrationConfig();
  if (!isValidConfig) {
    console.log(
      "Invalid config! Please update your .env file to contain all fields."
    );
    return;
  }

  const filename = "progress";
  const header = [
    { id: "handle", title: "Handle" },
    { id: "sku", title: "SKU" },
    { id: "metafields", title: "Metafields Set" },
    { id: "outcome", title: "Outcome" },
  ];
  const csvWriter = initializeCSV(filename, header);

  await startMigration(null, csvWriter);
}

runMetafieldMigration();
