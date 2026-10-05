# Appwrite Cloud setup

The app reads its Appwrite configuration from `.env` (see `.env.example`) and refuses
to start if any variable is missing (`src/appwrite/client.ts`).

## 1. Project and platform

1. Create a project at https://cloud.appwrite.io. Copy the **Project ID** and the
   **API endpoint** (region-specific, `https://<REGION>.cloud.appwrite.io/v1`) into `.env`.
2. *Overview → Add platform → Web*. Hostname: `localhost`.
   This one entry covers both `npm run dev` (http://localhost:5173) and the Android app,
   whose WebView origin is pinned to `https://localhost` in `cordova/config.xml`
   (`Scheme` / `Hostname` preferences).
3. *Auth → Settings*: make sure **Email/Password** is enabled.
4. Linux desktop (.deb) build: Electron serves the app from `app://localhost`
   (`<platform name="electron">` in `cordova/config.xml`; `https` is a reserved scheme there).
   Whether Appwrite accepts this origin under the `localhost` Web platform is **not verified**;
   if login fails on Linux with an origin/CORS error, this is the cause.

## 2. Database and tables

Create a database (e.g. ID `chat`) → `VITE_APPWRITE_DATABASE_ID`.

### Table `messages` → `VITE_APPWRITE_MESSAGES_TABLE_ID`

| Column     | Type   | Size | Required |
|------------|--------|------|----------|
| `body`     | string | 2000 | yes      |
| `userId`   | string | 36   | yes      |
| `userName` | string | 64   | yes      |

- Index: none needed; the app sorts by the built-in `$createdAt`.
- *Settings → Permissions*: **Create** for role `Users` (any logged-in user). Nothing else.
- *Settings → Row security*: **enabled**. Each row is created with
  read = `users`, update/delete = the author only (`src/appwrite/messagesRepository.ts`).

### Table `presence` → `VITE_APPWRITE_PRESENCE_TABLE_ID`

One row per user; the row ID **is** the user ID.

| Column        | Type     | Size | Required |
|---------------|----------|------|----------|
| `userName`    | string   | 64   | yes      |
| `lastSeen`    | datetime | –    | yes      |
| `typingUntil` | datetime | –    | no       |

- *Settings → Permissions*: **Create** for role `Users`.
- *Settings → Row security*: **enabled**. Each row gets read = `users`,
  update = that user only (`src/appwrite/presenceRepository.ts`).

## 3. How realtime, online and typing work

- New messages arrive via Appwrite Realtime on the `messages` table; the list is reloaded
  whenever the app becomes visible again, because the socket drops in the background.
- Every 20 s the app upserts the user's presence row (`lastSeen`). A user is shown online
  while `lastSeen` is less than 45 s old (`src/chat/presenceRules.ts`).
- While typing, the app sets `typingUntil` = now + 3 s, at most once every 2 s.

## 4. Personal data and erasure

Names, emails and messages are stored only in Appwrite; the app logs nothing.
To erase a user completely, in the Appwrite console:

1. *Auth → Users* → delete the user.
2. `presence` table → delete the row whose ID is that user ID.
3. `messages` table → filter `userId` = that user ID → delete those rows.

## 5. CI builds (GitHub Actions)

`.github/workflows/build.yml` runs on every push to `main`:

1. `check` — fails if an Appwrite secret is missing, then runs lint and unit tests.
2. `android` — debug APK, downloadable as artifact `hypbridchat-android-debug`.
3. `linux-deb` — `.deb` via cordova-electron, artifact `hypbridchat-linux-deb`.

Add these under *GitHub repo → Settings → Secrets and variables → Actions → New repository secret*
(same values as your local `.env`):

| Secret | Value |
|---|---|
| `VITE_APPWRITE_ENDPOINT` | `https://<REGION>.cloud.appwrite.io/v1` |
| `VITE_APPWRITE_PROJECT_ID` | Appwrite project ID |
| `VITE_APPWRITE_DATABASE_ID` | database ID |
| `VITE_APPWRITE_MESSAGES_TABLE_ID` | messages table ID |
| `VITE_APPWRITE_PRESENCE_TABLE_ID` | presence table ID |

These values end up inside the built app, so they are not truly secret; storing them as
secrets only keeps them out of the repository.
