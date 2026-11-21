# Otao for iPhone

The phone app, built with Expo (React Native). The Otao website in the folder above is its
backend: the app talks to `/api/app/*` with its own sign-in token.

## What's in it

- Sign in with Apple, Google or Microsoft. Otao is invite-only: household members listed in
  `APP_ALLOWED_EMAILS` get in directly, everyone else needs an invite code from someone inside.
- Home (today's plan, or ideas when nothing is planned; a "just recipes" mode), your recipes, liked and
  collections.
- Feed: one recipe per screen with the Otao score, like, save to collection and share.
- Recipe pages with the Otao score, nutrition and all vitamins and minerals, ingredients with
  "at home" dots, steps, and Send to Bring.
- What's at home: type what you have, see what you can cook.
- Our plan: today, tomorrow, week and month, shared with the household, who cooks, "Fill the gaps
  for me", and a shopping list that goes to Bring.
- You: shared planner, food preferences, invites, how you use Otao, privacy, sign out, delete account.

## One-time setup

### 1. Accounts

- Apple Developer Program (developer.apple.com/programs, 99 USD per year).
- A free Expo account (expo.dev). Expo builds the app in the cloud, so no Mac is needed.

### 2. Sign in with Apple

1. developer.apple.com → Certificates, Identifiers & Profiles → Identifiers → add an App ID with the
   bundle id `app.otao.ios` (or your own) and tick **Sign In with Apple**.
2. In Vercel set `APPLE_BUNDLE_IDS=app.otao.ios`.

### 3. Google

1. console.cloud.google.com → APIs & Services → OAuth consent screen: app name Otao, your email,
   scopes `openid`, `email`, `profile`. Publish it.
2. Credentials → Create OAuth client ID → **iOS**, bundle id `app.otao.ios`.
3. Put the client id in `eas.json` as `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, and in Vercel as
   `GOOGLE_CLIENT_IDS`.

### 4. Microsoft

1. entra.microsoft.com → App registrations → New registration: name Otao, "Accounts in any
   organizational directory and personal Microsoft accounts".
2. Authentication → Add a platform → **Mobile and desktop applications** → custom redirect URI
   `otao://auth`.
3. Put the Application (client) id in `eas.json` as `EXPO_PUBLIC_MICROSOFT_CLIENT_ID`, and in Vercel
   as `MICROSOFT_CLIENT_ID`.

### 5. Backend settings (Vercel → Settings → Environment Variables)

| Variable | Example |
| --- | --- |
| `APPLE_BUNDLE_IDS` | `app.otao.ios` |
| `GOOGLE_CLIENT_IDS` | `123-abc.apps.googleusercontent.com` |
| `MICROSOFT_CLIENT_ID` | `0f1e…` |
| `APP_ALLOWED_EMAILS` | `you@example.com=Roger,partner@example.com=Gabriela` |
| `APP_REVIEW_CODE` | a long random code, for App Review only |

The names after `=` must match the people already in Otao, so your existing recipes stay yours.
Redeploy after changing them. The database migration runs on deploy.

### 6. Build and submit

```bash
cd mobile
npm install
npx eas-cli@latest login
npx eas-cli@latest init            # links the project to your Expo account
# set EXPO_PUBLIC_API_URL in eas.json to your Otao website, e.g. https://otao.example.com
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios
```

EAS asks for your Apple ID once and creates the certificates itself. After the upload, the build
shows up in App Store Connect → TestFlight within about 15 minutes; install it on your phone with the
TestFlight app before sending it to review.

### 7. App Store listing

- Privacy policy URL: `https://<your-otao-domain>/privacy`.
- App Privacy: "Contact info → email address" and "User content", used for app functionality, linked
  to the user, not used for tracking.
- App Review notes: "Otao is invite-only. On the sign-in screen, press and hold the picture at the
  top for two seconds, then enter the review code: <APP_REVIEW_CODE>." Apple also accepts this as the
  demo account.
- Screenshots: 6.9" iPhone, at least three (Home, Feed, Recipe, Plan).

## Developing

```bash
cp .env.example .env   # EXPO_PUBLIC_API_URL=http://<your computer's IP>:3000
npm install
npx expo start         # then press i for the iOS simulator, or scan the QR code
```

Sign in with Apple and the Google/Microsoft redirects need a development build
(`npx eas-cli@latest build --profile development`), not Expo Go.

Checks: `npm run typecheck` and `npx expo lint`.
