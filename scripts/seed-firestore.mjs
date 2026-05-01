import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// One-time seeding script for Firestore using Firebase Admin SDK.
// This is intentionally NOT used by the web app (GitHub Pages) and runs locally.
//
// Usage:
// 1) Download a service account key JSON (Firebase Console > Project settings > Service accounts).
// 2) Set env var GOOGLE_APPLICATION_CREDENTIALS to that JSON path.
// 3) Install dependency: npm i firebase-admin
// 4) Run: node scripts/seed-firestore.mjs

const seedPath = path.resolve("data/firestore-seed.json");
if (!fs.existsSync(seedPath)) {
  console.error(`Seed file not found: ${seedPath}`);
  process.exit(1);
}

const credentialPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  ["serviceAccountKey.json", "service-account.json"]
    .map((fileName) => path.resolve(fileName))
    .find((candidate) => fs.existsSync(candidate)) ||
  fs
    .readdirSync(process.cwd())
    .find((fileName) => /firebase-adminsdk.*\.json$/i.test(fileName));

let firebaseConfig = {};
try {
  const configModule = await import("../firebase-config.js");
  firebaseConfig = configModule.firebaseConfig ?? {};
} catch {
  // Optional: the admin script can still run when GOOGLE_CLOUD_PROJECT is set.
}

const raw = fs.readFileSync(seedPath, "utf8");
const parsed = JSON.parse(raw);

const { metadata = {}, sessions } = parsed;
if (!Array.isArray(sessions) || sessions.length === 0) {
  console.error("No sessions found in seed json.");
  process.exit(1);
}

let adminModule;
try {
  adminModule = await import("firebase-admin");
} catch (error) {
  console.error(
    "Missing dependency firebase-admin. Install with: npm i firebase-admin",
  );
  process.exit(1);
}

const admin = adminModule.default ?? adminModule;

if (!admin?.apps) {
  console.error("firebase-admin import failed: admin.apps not found.");
  process.exit(1);
}

if (admin.apps.length === 0) {
  const credential = credentialPath
    ? admin.credential.cert(JSON.parse(fs.readFileSync(credentialPath, "utf8")))
    : admin.credential.applicationDefault();

  admin.initializeApp({
    credential,
    projectId: firebaseConfig.projectId,
  });
}

const db = admin.firestore();

async function upsertDoc(docRef, data) {
  await docRef.set(data, { merge: true });
}

async function run() {
  console.log(`Seeding from ${seedPath}`);
  console.log(
    credentialPath
      ? `Using credentials: ${credentialPath}`
      : "Using application default credentials",
  );
  console.log(`Sessions: ${sessions.length}`);

  if (Object.keys(metadata).length > 0) {
    await upsertDoc(db.collection("metadata").doc("content"), metadata);
  }

  for (const session of sessions) {
    const { id: sessionId, courses = [], ...sessionData } = session;
    if (!sessionId) throw new Error("Session missing id");

    const sessionRef = db.collection("sessions").doc(sessionId);
    await upsertDoc(sessionRef, sessionData);

    for (const course of courses) {
      const { id: courseId, questions = [], ...courseData } = course;
      if (!courseId) throw new Error(`Course missing id (session=${sessionId})`);

      const courseRef = sessionRef.collection("courses").doc(courseId);
      await upsertDoc(courseRef, courseData);

      for (const question of questions) {
        const { id: questionId, ...questionData } = question;
        if (!questionId)
          throw new Error(`Question missing id (course=${courseId})`);

        const questionRef = courseRef.collection("questions").doc(questionId);
        await upsertDoc(questionRef, questionData);
      }
    }
  }

  console.log("Done.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
