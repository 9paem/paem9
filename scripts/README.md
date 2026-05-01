# Firestore Seeding (One-Time)

The web app is deployed on GitHub Pages and must **not** have admin credentials. Also, Firestore rules block writes to `sessions/courses/questions` from clients for safety.

To load initial sessions/courses/questions into Firestore, use the local seeding script:

1. Firebase Console > Project settings > Service accounts > Generate new private key
2. Set env var:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/serviceAccountKey.json"
```

3. From project root:

```bash
npm i firebase-admin
node scripts/seed-firestore.mjs
```

Seed source: `data/firestore-seed.json`

