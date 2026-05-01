import fs from "node:fs";
import admin from "firebase-admin";

const credentialPath = "paem9-test-firebase-adminsdk-fbsvc-c590723d49.json";
const serviceAccount = JSON.parse(fs.readFileSync(credentialPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const rules = fs.readFileSync("firestore.rules", "utf8");

admin.securityRules().releaseFirestoreRulesetFromSource(rules)
  .then(() => {
    console.log("Rules deployed successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error deploying rules:", err);
    process.exit(1);
  });
