# Emberwake TODO / update checklist

Updated November 6, 2026. Earlier checklists are retained in review/.

## Constraints and direction

- [x] Reuse the existing RPG's art, attack visuals and audio where useful; do not import its combat rules.
- [x] Preserve Emberwake's current engine during the graphics pass.
- [x] Keep the protagonist's asset and avoid a color-based nickname.
- [x] Create a clear [issue register](ISSUES.md) separating fixes, workarounds and later tasks.
- [ ] Update the protagonist's visible name/pronouns to the mage/he while retaining the stable save ID.
- [ ] Improve/expand Emberwake's own story a little; it does not need to copy Grognak's story.
- [ ] Never use the built-in image generator (standing requirement).

## Completed in this batch

- [x] November 6 review: no newer Claude pass found; current build matched the published game. Fixed revived sprites retaining dissolve, misdirected healing effects, runtime-render failure recovery and cancellation of late actor loads.
- [x] 63 JavaScript + five Python checks pass. Browser fixture using the real engine confirms draught revival, Greenwake healing/poison clearing and injected-render-error fallback.
- [x] Latest staging correction: party in foreground, all enemies farther upfield, same apparent enemy height; broaden the receding road to exaggerate distance.
- [x] Heroes, active units and selected targets face the camera while resting. Attacks turn toward the target in place, then restore the resting pose; avoid marching through allies.
- [x] Reduced the bat's hover height so its wings stay inside the far-field framing. Actual Sunshard/enemy turns return to camera-facing heroes correctly; all 59 JavaScript checks pass.
- [x] Replace the single-row field with staggered formations, a clear attack lane and stronger target-facing release poses.
- [x] Perspective arena with a receding stone road, ruins, trees, foreground lanterns, contact shadows and regional colors.
- [x] Compensate character scale for camera depth; test front/rear apparent height and projected silhouette clearance.
- [x] Load the fireball sheet before enabling animation, fixing the first-cast empty-texture warning.
- [x] Music for towns/travel/battles, crossfades, master mute, independent saved volume controls and lazy user-initiated playback.
- [x] Transfer retained CC0 audio credits/notices; verify original music hashes.
- [x] Current verification: 59 JavaScript tests, five Python recovery tests; held-pose visual fixtures, full-party/dragon staging, actual Sunshard/Iron vigil turns, desktop/phone audio controls and volume persistence.
- [x] Facing adjustment: remove the enemy mirror that pointed bat/dragon art away; angle both formations inward.
- [x] Fit spacing to actual sprite widths, add a wider central aisle and refit the camera for larger formations.
- [x] Quick spin before strikes/spells, ending toward the target; reduced motion skips the spin. Flee does not play an attack.
- [x] Facing/spacing checks: 53 JavaScript tests pass; desktop and 390px two-ally/two-enemy layout checked without page overflow or console errors.
- [x] R01: resolve local three.js imports without a bundler or import map.
- [x] R03: fix ambient particle emission; test 30/60/120Hz behavior.
- [x] A01: stage/validate asset builds, preserve output on failure, configurable source paths, retain backup if rollback itself fails.
- [x] R04: renderer frame-loop/observer cleanup and effect disposal; reject stale asynchronous actor loads.
- [x] R05 workaround: retain front-facing relief presentation and disable inaccurate static cast shadows.
- [x] Connect battle adapter to the real game without changing engine rules.
- [x] Prevent duplicate input during an animation; resolve enemy visual targets from the engine's actual outcome.
- [x] Mage casting, ordinary strikes, hit flashes, guard/heal effects and defeat dissolve.
- [x] Explicit view switch plus automatic load/shader/WebGL/context-loss fallback.
- [x] Small supply/crown/seal drawings and imported equipment icons in menus.
- [x] 51 JavaScript tests and 5 Python build-transaction tests pass.
- [x] Desktop browser: icons, battle entry, spell, attack/defeat, enemy turns, view switch and reload.
- [x] Phone-width animated battle check at390px; no horizontal page overflow observed.

## Current limitations / next work

- [ ] Broader battle checks: three allies, all enemy types, AoE, revival, flee, win/defeat, pause, reduced motion and context loss.
- [ ] Ensure all displayed enemy art fits its name and story; current mappings are provisional.
- [ ] Complete GLTFLoader dependencies before using imported GLB scenery; unused loader is not part of the adapter.
- [ ] Refine regional scenery and individual attacks further; code-built regional arenas now work. Side/back character artwork is still absent; the renderer uses stronger three-quarter poses over supplied front art.
- [x] Music and effects playback with independent saved volume/mute controls, lazy loads and crossfade.
- [ ] Menu icons for additional real loot; do not imply the 51 imported icons are all implemented items.
- [x] Carry retained RPG artwork credits and CC0 sound/music notices into public credits; trace any still-unknown gear/dragon source notices before adding further packs.
- [ ] Verify full asset regeneration from the original archive; failure/rollback paths are tested.

## Later systems pass, separate from graphics

- [ ] Integrate generated organic terrain, collision, nine moved landmarks, new location and patrols together with save migration.
- [ ] Opening companion choices and roles, item-led growth, Meditate, survivor-only healing and paid revival, and multi-room dungeons toward the Grognak-like design.
- [ ] Keep save compatibility and rewrite/test affected balance and progression when those rules actually change.
- [ ] Ghost Face encounter and extra companion/NPC assets.
- [ ] Both endings through UI, full human playthrough, accessibility and measured duration.
- [x] Publish tested visuals and menu assets through the existing GitHub Pages repo; commit b9613a3 deployed successfully. Private paths, unused loaders and review files stayed local.

Bot runs establish scripted reachability, not human duration or final balance. Relief deformation is not full volumetric character modeling. Public and development builds must remain distinguishable.
