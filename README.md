# Emberwake

[Play Emberwake](https://tboy450.github.io/emberwake/)

A browser RPG about a lantern mage crossing a kingdom without dawn. Explore a walkable world, recruit companions, and decide what returning the light should cost.

- 31 locations and 15 distinct main-story battles
- Three party members with different abilities
- Four branching story scenes with combat consequences
- Optional islands, roaming guardians, equipment, and two ending paths
- Mouse, touch, and keyboard controls
- Animated character artwork and spell/strike/hit/defeat effects, with a Canvas battle option
- Camera-facing idle heroes and selected/active units; a quick turn toward the target for attacks, then return to the camera
- Foreground party and far-field enemy positions with exaggerated road perspective; depth-adjusted character scale keeps rear enemies readable
- Town, exploration and battle music with separate saved music/effect volumes and master mute
- Small supply, currency, seal and equipment illustrations in menus

The existing RPG contributes artwork and effects only. Emberwake's combat engine, turn order, damage, focus, progression and saves are unchanged in this visual update. Characters use front-facing relief animation, not full sculpted 3D models. Some enemy artwork mappings remain provisional.

## Play

Choose **Light the lantern & begin**. Use arrow keys, WASD, or direction buttons to walk. Click a landmark to follow a walking route; Escape stops. Select an enemy and a combat action during battles. Keys 1–4 switch adventure panels outside battle.

Progress saves in your browser. Camp offers JSON backup downloads and imports. Saves do not automatically move between devices, browsers, localhost, and this public site. To move an existing adventure, export it from Camp on the old site and import it here.

Use **Battle view: animated / canvas** in the header to choose the battle presentation. Animated battles require WebGL2; unavailable graphics or character loads fall back to Canvas. Reduced-motion preferences shorten action animations.

Use **Sound on/off** for a quick mute or **Audio** for separate music and sound-effect sliders. The first visit starts muted. Playback begins after interaction; tracks load as needed and fade between contexts. Settings remain on this browser. Humanoid art uses strong three-quarter relief poses; separately drawn side/back character views are still a future artwork task.

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

This is a playable development prototype. 59 JavaScript tests cover rules, progression gates, story choices, save migration, recovery, projected battle spacing/size and audio lifecycle; five Python tests cover asset transaction recovery. Browser checks covered actual spell/special resolution, held attack poses, full-party/dragon staging, music playback, volume persistence and phone layouts. Full campaign and graphics failure-mode coverage remain ongoing. Simulated completion is not a measured human playthrough. No measured playtime is claimed.

See [issues and workarounds](ISSUES.md) and the [update checklist](UPDATE_CHECKLIST.md). Further artwork/scenery polish, generated-terrain integration and later combat-design changes remain separate tasks.

Inspired by the compact exploration and turn-based party mechanics of Grognak & the Ruby Ruins. The world, story, characters, rules, and implementation here are an original project, unaffiliated with Bethesda or Fallout.

See [asset notes](CREDITS.md) for artwork provenance.
