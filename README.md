# Emberwake

[Play Emberwake](https://tboy450.github.io/emberwake/)

A browser RPG about a lantern mage crossing a kingdom without dawn. Explore a walkable world, recruit companions, and decide what returning the light should cost.

- 31 locations and 15 distinct main-story battles
- Three party members with different abilities
- Four branching story scenes with combat consequences
- Optional islands, roaming guardians, equipment, and two ending paths
- Mouse, touch, and keyboard controls
- Animated character artwork and spell/strike/hit/defeat effects, with a Canvas battle option
- Small supply, currency, seal and equipment illustrations in menus

The existing RPG contributes artwork and effects only. Emberwake's combat engine, turn order, damage, focus, progression and saves are unchanged in this visual update. Characters use front-facing relief animation, not full sculpted 3D models. Some enemy artwork mappings remain provisional.

## Play

Choose **Light the lantern & begin**. Use arrow keys, WASD, or direction buttons to walk. Click a landmark to follow a walking route; Escape stops. Select an enemy and a combat action during battles. Keys 1–4 switch adventure panels outside battle.

Progress saves in your browser. Camp offers JSON backup downloads and imports. Saves do not automatically move between devices, browsers, localhost, and this public site. To move an existing adventure, export it from Camp on the old site and import it here.

Use **Battle view: animated / canvas** in the header to choose the battle presentation. Animated battles require WebGL2; unavailable graphics or character loads fall back to Canvas. Reduced-motion preferences shorten action animations.

## Development

Requires Node.js. No dependencies or build step.

```sh
node server.mjs
```

Open the loopback URL printed by the server.

```sh
node --test tests/*.test.mjs
python tests/test_asset_transaction.py
node tests/walking-sim.mjs
```

GitHub Actions runs the regression suite before deploying `dist/` to GitHub Pages. Edit the source files in `dist/`, commit, and push to `main` to publish an update.

## Prototype status

This is a playable development prototype. 51 JavaScript tests cover rules, progression gates, story choices, save migration, recovery and presentation utilities; five Python tests cover asset transaction recovery. Desktop and phone browser checks covered battle entry, spell/strike/defeat, enemy turns, view switching, reload and menu icons. Full party/boss/failure-mode coverage remains ongoing. Simulated completion is not a measured human playthrough. No measured playtime is claimed.

See [issues and workarounds](ISSUES.md) and the [update checklist](UPDATE_CHECKLIST.md). Audio, region scenery, the generated terrain and later combat-design changes are separate pending tasks.

Inspired by the compact exploration and turn-based party mechanics of Grognak & the Ruby Ruins. The world, story, characters, rules, and implementation here are an original project, unaffiliated with Bethesda or Fallout.

See [asset notes](CREDITS.md) for artwork provenance.
