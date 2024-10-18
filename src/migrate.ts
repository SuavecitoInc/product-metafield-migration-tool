/**
 * This file contains the main logic
 * Functions are defined in /functions
 */
import {
  initializeCSV,
  startMigration,
  checkMigrationConfig,
} from "./functions";

const filename = "progress";
const header = [
  { id: "handle", title: "Handle" },
  { id: "sku", title: "SKU" },
  { id: "metafields", title: "Metafields Set" },
  { id: "outcome", title: "Outcome" },
];
const csvWriter = initializeCSV(filename, header);
const isValidConfig = checkMigrationConfig();
if (isValidConfig) {
  console.log("Starting metafield migration");
  const res = await startMigration(null, csvWriter);
} else {
  console.log(
    "Invalid config! Please update your .env file to contain all fields."
  );
}
