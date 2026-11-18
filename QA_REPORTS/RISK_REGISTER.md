# WORLD CHAOS — RISK REGISTER

| ID | Risk | Severity | Probability | Impact | Mitigation Measure | Status |
|---|---|---|---|---|---|---|
| R-01 | Native Unity 6 LTS / Android SDK unavailable in Linux web container | Critical | Certain | Cannot build native `.apk` or edit `D:\` local path | Build full playable 3D Web + Mobile-Touch Three.js MVP in `/app/applet`; document limitation transparently | Mitigated (Web 3D MVP) |
| R-02 | Software WebGL (SwiftShader) CPU stall during continuous 3D loop | High | High | Low FPS / frozen browser tab on GPU-less devices | Detect `isSoftwareGl` via renderer string; pace loop with `gl.fenceSync` + `afterDraw`, disable shadows/AA on software GL only | Mitigated |
| R-03 | Chaos Engine events trapping player or leaving permanent soft-locks | High | Medium | Player stuck underwater or blocked by collapsed debris | All 4 Chaos events use bounded timers, reversible transforms, and swim/jump safety bounds | Mitigated |
| R-04 | Mobile touch controls occluding central 3D combat viewport | Medium | Medium | Poor visibility and accidental button presses | Edge-pinned translucent controls, >=44px touch targets, toggleable touch overlay, zero center obstruction | Mitigated |
| R-05 | Corrupted or incompatible `localStorage` save data | Medium | Low | Crash on Continue or lost quest progression | Versioned JSON schema (`v1`) with strict field validation and safe fallback to defaults | Mitigated |
| R-06 | Camera clipping through terrain or ruin walls | Medium | Medium | Obscured protagonist during combat | Heightmap terrain floor clamping + soft spring radius adjustment | Mitigated |
| R-07 | Draw-call bottleneck from dense jungle vegetation on mobile | High | High | Frame drops below 30 FPS | `InstancedMesh` batching for trees, ferns, rocks, and grass tufts + Low/Medium/High quality profiles | Mitigated |
