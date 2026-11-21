# Kumo Café ☁️☕

A cozy cooking game on a floating cloud island, made by KumoPlay. Cook pancakes, toast and cocoa for sky folk at the counter of a little café in the clouds. Each shift is a short visit (one to two minutes), with stars, coins, upgrades and an All-Day Café for players who want to keep going.

- Runs in phone and computer browsers. Made to be held upright; installable ("Add to Home Screen") and playable offline after the first visit.
- No server, no accounts, no ads, no purchases, no links out, no data collection. Progress is saved in the player's own browser.
- Cozy by design: a shift is a set number of guests, not a countdown. Guests never leave angry, food never burns, and every shift ends with at least one star. Relaxed mode (in Settings) stops patience from running down at all.

Play: <https://kumoplay.github.io/kumo-cafe/>

More KumoPlay games: [Bubble Pop](https://kumoplay.github.io/games/bubble-pop/), a cozy pocket fidget toy, [Peek-a-Kumo](https://kumoplay.github.io/games/peek-a-kumo/), a cozy hidden-object game in a little town on the clouds, and [Kumo Farm](https://kumoplay.github.io/games/kumo-farm/). See them all at <https://kumoplay.github.io>.

## Run it

You need [Node.js](https://nodejs.org) 22.12 or newer (the deployment uses Node 24).

```sh
npm install
npm run dev
```

Open <http://localhost:5173/kumo-cafe/>.

### Try it on your phone (same Wi-Fi)

```sh
npm run dev:phone
```

The terminal prints a line like `Network: http://192.168.1.23:5173/kumo-cafe/`. Type that address into the phone's browser. The phone and the computer must be on the same Wi-Fi, and if the computer asks whether Node may accept incoming connections, allow it.

Over this plain `http` address, browsers switch off a few things that only work on `https`: installing to the home screen, offline play, one-tap "Copy backup code" (the code is shown to copy by hand instead) and the request to keep storage. They all work on the real site.

## Check it

```sh
npm test          # game rules, saving, content checks, and the pace checks below
npm run simulate  # the same pace checks, with a full report
npm run build     # type-check, then build into dist/
npm run preview   # serve the built game at http://localhost:4173/kumo-cafe/ (offline support works here)
```

## Deploy

Every push to `main` runs the tests, builds the game and publishes it to GitHub Pages with `.github/workflows/deploy.yml`. The repository's Pages source must be set to "GitHub Actions". If a test fails, nothing is published.

The game is served from `/kumo-cafe/`. That path is set once, as `base` in `vite.config.ts`.

## Where things are

| Folder | What is in it |
| --- | --- |
| `src/content/` | **All game content and balance.** Data only: ingredients, stations, dishes, shifts, guests, upgrades, decorations, the All-Day Café, prices, timings, star goals. |
| `src/art/` | **Every picture**, one SVG per file. |
| `src/i18n/` | **Every word** the player reads (`en.ts`). |
| `src/core/` | The game rules in plain TypeScript, with tests next to them. No drawing code. |
| `src/core/shift/` | One shift: guests, cooking, where a tap sends things, tips, combos, stars, and the helper. |
| `src/core/save/` | The save format, upgrades for old saves, and backup codes. |
| `src/sim/` | Pretend players that play every shift to check the pace and the stars. |
| `src/platform/` | Browser things: storage, sounds, pausing, home-screen install, offline support. |
| `src/ui/` | The screens (Preact and plain CSS): home, shift map, shop, kitchen, panels. |
| `public/` | The app icons. |

## How a shift works

- Guests sit at the counter (two or three seats) and show their order as pictures. Their hearts slowly empty while they wait. When the hearts are gone they get sleepy, but they never leave.
- **Tap a jar** to start cooking it on its station (batter on the griddle). If every spot is busy, up to two taps wait in a little queue and start by themselves. Toppings (strawberries, cream) go straight onto the best plate.
- **Tap finished food** and it goes to the guest who has waited longest for it, or onto a plate if it is part of a bigger dish. **Tap a plate** to serve the dish on it. **Tap a guest** to hand over everything ready for them. **Dragging** works too, to choose the guest or plate yourself.
- A small bin appears on plates, and on finished food that nobody needs, to make room.
- Each dish pays its price, plus a tip for the hearts left (up to +50%). Guests served one after another with all hearts left make a **happy streak**, which pays a bonus.
- Finishing a shift gives ★. ★★ and ★★★ need a share of the coins of a perfect shift (every guest served with full hearts, in one long streak). All orders are planned when the shift starts, so the goals are fair whatever the guests order.
- **The helper:** after a quiet moment with a guest waiting, the next useful thing glows. In shift 1 it comes sooner, with a short tip.
- Closing the game mid-shift is fine: the shift is simply played again. Shifts are never saved half-way.
- The shift pauses by itself when the tab is hidden, the window loses focus, or a phone is turned sideways.

## Adding and changing content

Everything below is done by editing data files. Run `npm test` afterwards: it tells you if a name or picture is missing, or if something cannot be made with the kitchen.

Ids are lowercase with dashes (`berry-pancake`). An id is used three times: in the content file, as the key for its name in `src/i18n/en.ts`, and as the file name of its picture.

The first café's files are in `src/content/cafes/morning-cloud/`:

| To add… | Edit | Name in `en.ts` | Picture in `src/art/` |
| --- | --- | --- | --- |
| an ingredient (a jar) | `kitchen.ts`, `ingredients` | `items` | `items/<id>.svg` |
| something cooked | `kitchen.ts`, `cooking` (station, input jar, output, time) | `items` (output) | `items/<output>.svg` |
| a station | `kitchen.ts`, `stations` | `stations` | `stations/<id>.svg` and `stations/<id>-slot.svg` |
| a dish (recipe) | `dishes.ts` | `items` | `items/<id>.svg` |
| a shift | `levels.ts`, `levels` | none | none |
| a guest | `src/content/guests.ts`, then add them to shifts' `who` | `guests` and `guestAbout` | `guests/<id>.svg` |
| a kitchen upgrade | `shop.ts`, `upgrades` | `upgrades` | uses the station's picture |
| a decoration | `shop.ts`, `decor` | `decor` | `decor/<id>.svg` |

### Dishes

```ts
{ id: 'berry-pancake', parts: ['fluffy-pancake', 'strawberries'], price: 9 },
```

`parts` are put together on a plate, in any order: cooked things (from `cooking`) and toppings (jars that go to `'board'`). A dish with no parts (`parts: []`) is served straight from its station: it must be the `output` of a cooking step with the same id, like Sky Tea from the kettle. Up to three parts.

### Shifts

```ts
{
  guests: 12,                      // how many guests come; the shift ends when all are served
  seats: 3,                        // seats at the counter (1 to 3)
  menu: ['sky-tea', 'fluffy-pancake', 'berry-toast'],
  featured: 'berry-toast',         // optional: new in this shift, ordered more often and shown as New
  who: ['mochi', 'pip', 'sora'],   // which guests may come
  orderSizes: [5, 5, 1],           // how likely an order has 1, 2 or 3 things
  firstGuestMs: 1.5 * SEC,
  gapMs: [5 * SEC, 7 * SEC],       // time between guests, shortest and longest
  patienceMs: 28 * SEC,            // until a guest's last heart is gone
  stars: [55, 80],                 // ★★ and ★★★, in percent of a perfect shift
  tutorial: true,                  // optional: the helper comes sooner, with tips
}
```

The kitchen shows only the jars and stations the menu needs, in the order of `stations` in `kitchen.ts` (top to bottom). Shifts open one after another; the shift map, the shop and the All-Day Café follow by themselves.

### A new café

1. Copy the folder `src/content/cafes/morning-cloud/` to a new id, for example `src/content/cafes/sweet-cloud/`, and change its data.
2. Add it to the list in `src/content/cafes/index.ts`.
3. Add its name to `cafes` in `src/i18n/en.ts`, and names and pictures for its new things as above.

Guests are shared by every café. Saves keep progress per café, so a new café needs no change to the save format. As soon as there are two cafés, the home screen shows a café picker; a café opens once every shift of the café before it is finished, and the game starts on the newest open café.

## Tuning difficulty

| What | Where |
| --- | --- |
| Guests per shift, seats, time between guests, patience, order sizes, star goals | `levels.ts` (`levels`) |
| Cooking times | `kitchen.ts` (`cooking`) |
| Dish prices | `dishes.ts` |
| Each guest's patience and favourite dish | `src/content/guests.ts` |
| Hearts, tips per heart, happy streak bonus, queue size, patience back per item handed over, speed upgrade size, when the helper glows | `src/content/balance.ts` |
| Upgrade and decoration prices, and when decorations appear | `shop.ts` |
| The All-Day Café: when it opens, starting pace, how fast it speeds up, the fastest pace, how long the line may get | `levels.ts` (`endless`) |

Then run:

```sh
npm run simulate
```

Pretend players (`src/sim/player.ts`) play every shift on eight random seeds at four speeds: quick, steady, unhurried and little kid. They tap whatever the in-game helper would suggest. The report shows each player's coins as a percentage of a perfect shift, their stars, how long the shift took, and their best happy streak. It also shows how long a day in the All-Day Café lasts for each player, and the coins a steady player earns per shift compared with the prices in the shop.

`npm test` runs the same checks as guard rails, so a change that breaks the pace shows up as a failing test (and stops a deployment):

- Every player finishes every shift, and a steady player takes about one to two minutes.
- A quick player earns ★★★, and a steady player at least ★★, almost every time.
- From shift 3 on, ★★★ takes some care: the unhurried player gets it at most half the time, and the little-kid pace never does.
- A steady player's day in the All-Day Café lasts at least three minutes, and even a quick player's day ends.
- Something in the shop is affordable after the first shift, and buying everything takes one to two rounds of all shifts' coins.

With the current numbers, a steady player earns ★★★ early on and ★★ in the last shifts, in about 50 seconds (shift 1) to 100 seconds (shift 15).

## Swapping in better art

Replace an SVG in `src/art/` and keep its file name. Nothing else changes. `src/art/index.ts` lists the naming rules and sizes: items, stations and icons use a `0 0 64 64` viewBox, guests `0 0 96 96`, the café wall is 360 wide.

Decorations are placed with `place` in `shop.ts`: on the `'wall'` (x and y in the 360-wide wall picture) or standing on the `'counter'`.

The home-screen icons in `public/` were exported from `src/art/app/icon.svg` at 512, 192, 180 and 32 pixels; `public/favicon.svg` is the same picture with rounded corners. After changing the icon, export those sizes again, for example:

```sh
rsvg-convert -w 512 -h 512 src/art/app/icon.svg -o public/icon-512.png
```

## Text and languages

All text is in `src/i18n/en.ts`. To add Thai, copy it to `th.ts`, translate the values, and choose the language in `src/i18n/index.ts`. Words in `{curly braces}` are filled in by the game and must stay as they are. The Nunito font has no Thai letters, so Thai also needs a font added in `src/ui/styles/main.css`.

## Sounds

Sounds are made in code, with no audio files: see `src/platform/audio.ts`. Each sound is a short list of notes (or a soft burst of noise for sizzling and pouring) that can be edited there. Nothing plays until the player has tapped once, and Settings and the pause panel have a sound switch.

## How saving works

- Progress (stars, best scores, coins, upgrades, decorations, settings) is saved after every finished shift, every purchase and every settings change, in IndexedDB, with a mirror in localStorage. On load the newest good copy wins, and a copy of the last save that loaded fine is kept as a backup.
- The game asks the browser to keep its storage, and once (after the first shift) gently suggests "Add to Home Screen": some browsers, Safari on iPhone in particular, may clear a website's storage after a while without visits.
- Settings has a backup code (copy, or save as a file) to move progress to another device, and "Reset progress" with a confirmation. A backup code from another KumoPlay game is recognised and politely refused.
- A second tab takes over politely: the older tab stops saving, so two tabs never overwrite each other.

### Changing the save format

When the shape of the saved progress changes (`SaveState` in `src/core/progress.ts`):

1. Raise `SAVE_VERSION` in `src/core/save/schema.ts` by one.
2. Add a step under the old version number in `src/core/save/migrations.ts`. It receives the old shape and returns the new one.
3. Add a test with an example of the old save in `src/core/save/save.test.ts`.

Old saves are upgraded step by step when they are loaded, so existing progress keeps working. Loaded data is also checked and repaired (`normalizeState`), so a damaged save, or a dish or decoration that was removed, cannot crash the game.

## Offline and install

`vite-plugin-pwa` builds a service worker that keeps a copy of the whole game on the device. When a new version has been downloaded, the home screen shows an "Update" button rather than changing mid-play. The web app manifest (name, colours, icons) is in `vite.config.ts`.
