# Emberwake

[Play Emberwake](https://tboy450.github.io/emberwake/)

A browser RPG about a lantern mage crossing a kingdom without dawn. Explore a walkable world, recruit companions, and decide what returning the light should cost.

- 31 locations and 15 distinct main-story battles
- Three party members with different abilities
- Four branching story scenes with combat consequences
- Optional islands, roaming guardians, equipment, and two ending paths
- Mouse, touch, and keyboard controls

## Play

Choose **Light the lantern & begin**. Use arrow keys, WASD, or direction buttons to walk. Click a landmark to follow a walking route; Escape stops. Select an enemy and a combat action during battles. Keys 1–4 switch adventure panels outside battle.

Progress saves in your browser. Camp offers JSON backup downloads and imports. Saves do not automatically move between devices, browsers, localhost, and this public site. To move an existing adventure, export it from Camp on the old site and import it here.

## Development

Requires Node.js. No dependencies or build step.

```sh
node server.mjs
```

Open the loopback URL printed by the server.

```sh
node --test tests/engine.test.mjs tests/world.test.mjs tests/story.test.mjs tests/storage.test.mjs
node tests/walking-sim.mjs
```

GitHub Actions runs the regression suite before deploying `dist/` to GitHub Pages. Edit the source files in `dist/`, commit, and push to `main` to publish an update.

## Prototype status

This is a playable development prototype. The 48 regression tests cover rules, progression gates, story choices, save migration, and recovery. Simulated completion is not a measured human playthrough; balance, art, accessibility, and full story verification remain ongoing. No measured playtime is claimed.

Inspired by the compact exploration and turn-based party mechanics of Grognak & the Ruby Ruins. The world, story, characters, rules, and implementation here are an original project, unaffiliated with Bethesda or Fallout.

See [asset notes](CREDITS.md) for artwork provenance.
