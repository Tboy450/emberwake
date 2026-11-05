# Emberwake issue register

Updated November 5, 2026. This distinguishes working gameplay, experimental files, and planned changes. No image generator may be used. The protagonist is the mage, he/him; retain Emberwake's own plot.

| ID | Issue and impact | Fix or workaround | Status |
| --- | --- | --- | --- |
| A01 | Asset rebuild deletes generated folders before validating sources; failure can destroy a working bundle. | Staging, validation and rollback implemented; five transaction tests pass. Full archive rebuild remains unverified. | Fixed; regeneration pending |
| R01 | Bare `three` imports have no browser resolution. New modules cannot load directly. | Adapter modules resolve against the bundled version using explicit relative imports. Browser and module checks pass. | Fixed for active modules |
| R02 | GLTFLoader imports a missing BufferGeometryUtils dependency. | Do not load GLB scenery in this batch; complete and verify the loader dependency tree before use. | Deferred |
| R03 | Fractional particle rates guarantee at least one particle per frame, exceeding the requested rate. | Fractional accumulator implemented; 30/60/120Hz checks pass. | Fixed |
| R04 | Experimental Stage owns an endless animation loop and ResizeObserver without cleanup. | Explicit pause/dispose lifecycle, resource release and cancellation of stale actor loads implemented. | Fixed; extended soak check pending |
| R05 | Relief actor uses a bent painted surface, not a full 3D mesh/rig; shadows do not follow shader deformation. | Front-facing relief presentation; inaccurate cast shadows disabled. | Workaround implemented |
| R06 | Integrated animated battle needs runtime coverage beyond rule tests. | Desktop/phone checks cover spell, strike/defeat, enemy turns, reload and Canvas switch. Reduced-motion, actual context loss and broader battle outcomes remain unverified. | Partly verified |
| M01 | Generated organic map is not used; nine landmark coordinates differ from the active map. | Integrate drawing/collision/landmarks/patrols together with a versioned save migration. Keep current map until ready. | Deferred |
| M02 | Generated map omits existing roaming-boss coordinates and adds a location absent from the active engine. | Reconcile data and test story gates, ferry and both patrols before switching. | Deferred |
| G01 | Existing rules differ from requested Grognak-like mechanics: XP growth, recruitment, Guard, full revival after battle. | Planned item-led growth, opening companion selection, Meditate and paid revival require a coordinated rule/save/test pass. | Planned |
| G02 | Many imported assets are unused; copying assets does not make them gameplay. | Adapter uses hero/enemy art and fireball visuals; shop/satchel use equipment icons. Several enemy mappings remain provisional. Scenery/audio remain unused. | Partly implemented |
| N01 | Existing hero text says Vera/she; user identifies the mage as him. | Update player-facing text and imported hero display fields without changing the stable internal save ID. | Planned |
| N02 | Four scenes and two endings still need complete interactive/human verification; measured playtime unknown. | Preserve plot; modest editing/expansion, real UI walkthroughs and timed human runs. | Open |
| S01 | Music/effect files are not connected; no independent volume/mute persistence. | User-initiated audio with separate volumes, lazy loading and recoverable playback errors. | Planned |
| P01 | Imported artwork has no separate creator/license notice alongside the supplied processed files. | Record owner-supplied RPG provenance without asserting new ownership or a license; carry three.js MIT notice. Trace original artwork notices before adding further packs. | Credits updated; original art notices unresolved |
| P02 | Public checkout and development folder are separate. Blind copying could publish unfinished/private files. | Explicit file selection, tests, public-path smoke check, then GitHub Pages deployment. | Open |

51 JavaScript tests (including the original 48 rule/storage checks) and 5 Python transaction tests pass. The rule engine is byte-identical to the previous public build. Ghost Face art is provisionally mapped to existing ghost enemies; a dedicated low-level boss is still deferred. Full humanoid modeling, extra companions, new item systems, and an organic-map switch are not completed features.
