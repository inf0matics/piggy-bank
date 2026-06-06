# Piggy Bank

[![Version](https://img.shields.io/github/package-json/v/thespielplatz/piggy-bank?color=F7941E)](https://github.com/thespielplatz/piggy-bank/)
[![License](https://img.shields.io/github/license/thespielplatz/piggy-bank?color=F7941E)](https://github.com/thespielplatz/piggy-bank/blob/main/LICENSE)
[![Stars](https://img.shields.io/github/stars/thespielplatz/piggy-bank.svg?style=flat&color=F7941E)](https://github.com/thespielplatz/piggy-bank/stargazers)

A small piggy bank for pre-coiners, managed by their custodian.

| **Homepage** | **Piggy Bank** | **Payment** |
| --- | --- | --- |
| <img src="docs/img/homepage.png" alt="Homepage" height="250px"> | <img src="docs/img/piggy.png" alt="Piggy Bank" height="250px"> | <img src="docs/img/lnurlp.png" alt="Payment" height="250px"> |

## Features

- **View Satoshis Balance**: Displays the amount of sats in an LNBits account, accessible via a PIN code.
- **LNURLp Integration**: Displays the first LNURL-pay link from the LNBits API, if available.
- **LN Address Display**: Optionally shows the LN address, if configured.
- **Payment Notifications**: Sends notifications upon payment receipt.
- **Automatic LNURL Recognition**: Reads and displays LNURL-pay extension links if configured.
- **Dynamic Buttons**: Displays an `@ Address` button if a username is set in the extension.
- **Popup Closure**: Automatically closes LNURL popups upon payment receipt.
- **Print**: Print a user's dashboard to hand out as a give-away QR code.
- **Admin Area**: Custodian admin panel at `/admin`, protected by Logto login.

## Roadmap

- **Hardware Connectivity**: Integrate with a piggy bank hardware.

## Configuration

Users are stored in a **SQLite database**. Each user has:

- `id` — a unique, random string
- `name` — display name
- `accessKey` — the PIN entered on the keypad
- `lnbits.url` + `lnbits.invoiceKey` — their LNBits instance and read-only invoice key

The database file location is set with the `DATABASE_PATH` environment variable
(default: `data/piggy-bank.db`). In Docker, point it at a mounted volume so the
data persists across restarts:

```yaml
services:
  piggybank:
    image: your-image
    environment:
      DATABASE_PATH: /data/piggy-bank.db
    volumes:
      - piggybank-data:/data

volumes:
  piggybank-data:
```

### Migrating from `config.json`

Earlier versions read users from a `config.json` file. To import an existing
config into the database, run the one-time migration script:

```bash
CONFIG_PATH=config.json DATABASE_PATH=data/piggy-bank.db npm run migrate:config
```

It reads the `users` array from `CONFIG_PATH` and upserts each into the DB at
`DATABASE_PATH` (idempotent — safe to re-run). The expected `config.json` shape:

```json
{
  "users": [
    {
      "id": "justARandomString",
      "name": "John Doe",
      "accessKey": "338",
      "lnbits": {
        "url": "https://your.lnbits.com",
        "invoiceKey": "6843498d6bbd4452b5853f7abdc3dac9"
      }
    }
  ]
}
```

Inside Docker, run it against the mounted volume before (or alongside) starting
the app, e.g. `docker compose run --rm piggybank npm run migrate:config`.

## Give away

- Go to the user's piggy bank
- Print the page

## Admin / Logto setup

The admin area lives at `/admin`. The landing page there is public; every other
`/admin/**` route requires a [Logto](https://logto.io) session.

### 1. Register the app in Logto

In the Logto Console, register a **Traditional Web App** and set its URIs
(replace `<origin>` with your deployment URL, e.g. `http://localhost:3000` in
development):

- **Redirect URI**: `<origin>/admin/callback`
- **Post sign-out redirect URI**: `<origin>/admin`

### 2. Provide the credentials

The app reads these environment variables (see [`.env.example`](.env.example)):

| Variable | Description |
| --- | --- |
| `NUXT_LOGTO_ENDPOINT` | Logto endpoint, e.g. `https://your-tenant.logto.app/` |
| `NUXT_LOGTO_APP_ID` | App ID from the Logto Console |
| `NUXT_LOGTO_APP_SECRET` | App secret from the Logto Console |
| `NUXT_LOGTO_COOKIE_ENCRYPTION_KEY` | Random secret for the session cookie (e.g. `openssl rand -base64 32`) |

**Local development** — put them in a `.env` file in the project root; `npm run
dev` loads it automatically.

**Production (Docker)** — a `.env` file is **not** read at runtime, and Docker
Compose's own `.env` only does `${VAR}` substitution *inside* the compose file.
You must pass the values into the container's environment. The simplest way is
`env_file`:

```yaml
services:
  piggybank:
    image: your-image
    env_file:
      - .env          # path is relative to the compose file
```

Alternatively, list them explicitly under `environment:` (each `${VAR}` is then
substituted from the compose-directory `.env`):

```yaml
    environment:
      NUXT_LOGTO_ENDPOINT: ${NUXT_LOGTO_ENDPOINT}
      NUXT_LOGTO_APP_ID: ${NUXT_LOGTO_APP_ID}
      NUXT_LOGTO_APP_SECRET: ${NUXT_LOGTO_APP_SECRET}
      NUXT_LOGTO_COOKIE_ENCRYPTION_KEY: ${NUXT_LOGTO_COOKIE_ENCRYPTION_KEY}
```

After recreating the container with `docker compose up -d`, confirm the values
landed with `docker compose exec piggybank env | grep NUXT_LOGTO`, and check the
startup logs for `[logto] Admin auth configured`.

> [!IMPORTANT]
> Logto requires **server-side rendering** — run the SSR build (`nuxt build`,
> the default Docker image), not the static `nuxt generate` output.
>
> If the Logto vars are unset the app still runs, with admin login disabled.
> But once `NUXT_LOGTO_ENDPOINT` is set you **must** also provide a real
> `NUXT_LOGTO_COOKIE_ENCRYPTION_KEY` — otherwise an insecure built-in fallback
> key is used for the admin session cookie.

## Development Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Seed a user into the database. Create a `config.json` (see the example
   above) and import it:

   ```bash
   npm run migrate:config
   ```

   This writes the users into `data/piggy-bank.db`.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Access the piggy bank using the configured PIN code (e.g., `338` for `DEV`).

## Support

If you like this project, give it a star! 🌟 If you love it, fork it and take it out for dinner. 🍽️

Feeling generous? Why not [send a tip](https://thespielplatz.com/tip-jar) to support the project? 💖

Thank you for using Piggy Bank! 🎉
