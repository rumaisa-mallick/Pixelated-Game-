# Coin Quest - Unity Port

A native Unity 2D rebuild of the browser game in the parent folder. It keeps the
same three realms, maps, coin placements, scoring, saves, and pixel-art look,
but runs as a standalone Unity project instead of loading the web build.

## At a glance

- **Engine:** Unity 6.3 LTS (`6000.3.27f1`)
- **Template:** Universal 2D (URP)
- **Targets:** Windows 64-bit and WebGL
- **Internal resolution:** 640 x 480, 16 pixels per unit, point-filtered art
- **Cloud project:** `4930609f-3e0f-4b7d-b405-9117993c7c14` (`PIXEL GAME`)
- **Cloud organization:** `4b5e5c49-7f5e-489e-0000-11407485610a`

## Open and play

1. Open this folder as a project in Unity Hub with `6000.3.27f1`.
2. Open `Assets/Scenes/CoinQuest.unity` if the editor does not open it.
3. Press **Play**.

The scene is intentionally empty. `Assets/Scripts/Bootstrap.cs` creates the game
at runtime, so it works from the editor, the Windows build, and WebGL without
scene or prefab setup. If the scene is missing or empty, use
**CoinQuest > Prepare Empty Scene** once.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | WASD or arrow keys | On-screen D-pad |
| Sprint | Shift | - |
| Pause / resume | Esc or P | HUD pause button |
| Start / next realm | Enter | Title cards, next button |
| Mute | M | HUD sound button |

The HUD realm tabs switch maps while playing. Pressing Enter after a realm is
complete moves to the next realm.

## Run the smoke test

The built Windows player has an autonomous test mode:

```powershell
.\Builds\Windows\CoinQuest.exe -cq-smoke
```

It visits each realm, exercises pause/resume, completes all 32 coins in each
map, returns to the title screen, and writes:

- `Builds/Windows/Screenshots/*.png`
- `Builds/Windows/Screenshots/smoke_results.txt`

The screenshots include title, castle, pause, castle complete, forest, forest
complete, sea, sea complete, and title again.

## Build

Use the editor menu **CoinQuest > Build Windows** or **CoinQuest > Build WebGL**.
Outputs:

- `Builds/Windows/CoinQuest.exe`
- `Builds/WebGL/index.html`

The WebGL build has compression disabled so it can be served by a basic local
HTTP server. Browsers do not allow the Unity WebGL loader to run from a bare
`file://` URL, unlike the parent HTML5 canvas game.

```powershell
cd Builds/WebGL
python -m http.server 8000
```

Then open `http://127.0.0.1:8000`.

## Saves

Unity PlayerPrefs use the same keys as the browser game:

- `cq_total`
- `cq_sound`
- `cq_best_score_<realm>`
- `cq_best_time_<realm>`

On Windows these live under
`%USERPROFILE%\AppData\LocalLow\Pixel Purse\Coin Quest\PlayerPrefs`.
On WebGL PlayerPrefs are stored in the browser's IndexedDB.

## Project layout

```
Assets/
  Editor/CoinQuestEditor.cs     # import settings, scene, Windows/WebGL builds
  Resources/
    Data/maps.json              # wrapped level grids and coin placements
    Fonts/PressStart2P-Regular.ttf
    GameArt/                    # map, minimap, preview, player, coin, VFX art
  Scenes/CoinQuest.unity        # empty bootstrap scene
  Scripts/
    Bootstrap.cs                # runtime entry point
    CoinQuestGame.cs            # gameplay, camera, particles, saves
    CoinQuestGame.UI.cs         # IMGUI screens, HUD, minimap, touch pad, CRT
    GameData.cs                 # JsonUtility models and collision helpers
    Keys.cs                     # Input System / legacy input compatibility
    PixelArt.cs                 # sprite, palette, vignette helpers
    Sfx.cs                      # runtime chiptune synthesis
    SmokeTest.cs                # optional command-line validation run
```

## Art and data provenance

`Assets/Resources/GameArt` and `Assets/Resources/Data/maps.json` were extracted
from the browser project in the parent folder. The static maps and previews are
reused directly; the player animation sheet is a nine-column rebuild (idle plus
eight walk frames per direction). Torch flames, water shimmer, ambient motes,
dust, confetti, floating score text, UI, audio, and saves are native Unity
implementations.

The maps are generated with fixed seeds in the browser project, so the layouts
and coin positions are deterministic. The Unity port reads the exported
collision grids rather than regenerating them at runtime.

## Font credit

Press Start 2P by CodeMan38, SIL Open Font License 1.1. The license text is at
`Assets/Resources/Fonts/OFL.txt`.
