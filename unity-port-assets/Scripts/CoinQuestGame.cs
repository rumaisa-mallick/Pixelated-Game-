using System;
using System.Collections.Generic;
using UnityEngine;

namespace CoinQuest
{
    public enum GameState
    {
        Title,
        Playing,
        Paused,
        Complete
    }

    public partial class CoinQuestGame : MonoBehaviour
    {
        public const int Tile = 16;
        public const int ViewW = 640;
        public const int ViewH = 480;

        public static readonly string[] RealmOrder = { "castle", "forest", "sea" };

        private class CoinView
        {
            public CoinData data;
            public GameObject bodyGo;
            public GameObject glowGo;
            public GameObject shadowGo;
            public SpriteRenderer body;
            public SpriteRenderer glow;
            public SpriteRenderer shadow;
            public float x;
            public float y;
            public float phase;
            public string kind;
            public int value;
            public bool collected;
        }

        private class RealmRuntime
        {
            public MapData data;
            public GameObject root;
            public Texture2D minimap;
            public Texture2D preview;
            public List<CoinView> coins = new List<CoinView>();
            public List<Vector2> torches = new List<Vector2>();
        }

        private class PlayerState
        {
            public float x;
            public float y;
            public int dir; // 0 down, 1 left, 2 right, 3 up
            public bool moving;
            public bool sprinting;
            public float walk;
            public float footTimer;
            public float speed = 94f;
        }

        private class Particle
        {
            public float x;
            public float y;
            public float vx;
            public float vy;
            public float gravity;
            public float life;
            public float max;
            public int size;
            public float drag;
            public Color color;
            public int layer; // 0 back, 1 front
        }

        private class FloatText
        {
            public float x;
            public float y;
            public string text;
            public Color color;
            public float life;
            public float max;
        }

        private class Ambient
        {
            public float x;
            public float y;
            public float vx;
            public float vy;
            public float life;
            public float max;
            public float phase;
            public int size;
            public string type;
            public Color color;
        }

        private GameState state = GameState.Title;
        private MapDatabase db;
        private readonly Dictionary<string, RealmRuntime> realms = new Dictionary<string, RealmRuntime>();
        private RealmRuntime realm;
        private string mapKey = "castle";
        private string titleKey = "castle";

        private PlayerState player;
        private GameObject playerGo;
        private SpriteRenderer playerSr;
        private Sprite[][] playerFrames;

        private Camera cam;
        private Material spriteMat;
        private Font pixelFont;

        private Sprite coinSprite;
        private Sprite gemSprite;
        private Sprite glowGoldSprite;
        private Sprite glowTealSprite;
        private Sprite shadowSprite;
        private Texture2D glowGoldTex;

        private float camX;
        private float camY;
        private float camTX;
        private float camTY;

        private int score;
        private int collected;
        private int combo;
        private int maxCombo;
        private int totalCoins;
        private float comboTime;
        private float elapsed;
        private float titleTime;

        private readonly List<Particle> particles = new List<Particle>();
        private readonly List<FloatText> floats = new List<FloatText>();
        private readonly List<Ambient> ambient = new List<Ambient>();

        private Sfx sfx;

        private bool newBest;
        private bool fastest;
        private string resultKey = "castle";
        private int resultScore;
        private float resultTime;
        private int resultCollected;
        private int resultBestScore;
        private float resultBestTime;
        private int resultMaxCombo;

        private bool uiUp;
        private bool uiDown;
        private bool uiLeft;
        private bool uiRight;

        private void Awake()
        {
            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 1;

            SetupCamera();
            SetupSprites();
            LoadDatabase();
            BuildRealms();
            CreatePlayer();
            sfx = gameObject.AddComponent<Sfx>();
            sfx.Init();

            totalCoins = PlayerPrefs.GetInt("cq_total", 0);
            InitTitle();
        }

        private void SetupCamera()
        {
            Camera[] cameras = UnityEngine.Object.FindObjectsByType<Camera>(FindObjectsSortMode.None);
            for (int i = 0; i < cameras.Length; i++)
            {
                if (cameras[i] != null) Destroy(cameras[i].gameObject);
            }

            GameObject camGo = new GameObject("CoinQuest Camera");
            camGo.transform.SetParent(transform, false);
            cam = camGo.AddComponent<Camera>();
            cam.orthographic = true;
            cam.orthographicSize = 15f;
            cam.nearClipPlane = 0.1f;
            cam.farClipPlane = 100f;
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = PixelArt.Hex("#050409");
            cam.depth = 10f;
            cam.allowHDR = false;
            cam.allowMSAA = false;
            camGo.AddComponent<AudioListener>();

            Type urpCameraData = Type.GetType("UnityEngine.Rendering.Universal.UniversalAdditionalCameraData, Unity.RenderPipelines.Universal.Runtime");
            if (urpCameraData != null && camGo.GetComponent(urpCameraData) == null)
            {
                camGo.AddComponent(urpCameraData);
            }

            Shader shader = Shader.Find("Universal Render Pipeline/2D/Sprite-Unlit-Default");
            if (shader == null) shader = Shader.Find("Sprites/Default");
            if (shader != null) spriteMat = new Material(shader);
        }

        private void SetupSprites()
        {
            Texture2D coinTex = PixelArt.LoadArt("coin_body");
            Texture2D gemTex = PixelArt.LoadArt("gem_body");
            Texture2D goldTex = PixelArt.LoadArt("glow_gold");
            Texture2D tealTex = PixelArt.LoadArt("glow_teal");
            Texture2D shadowTex = PixelArt.LoadArt("shadow");

            glowGoldTex = goldTex;

            if (coinTex != null) coinSprite = PixelArt.MakeSprite(coinTex, new Rect(0, 0, coinTex.width, coinTex.height), new Vector2(0.5f, 0.5f), Tile);
            if (gemTex != null) gemSprite = PixelArt.MakeSprite(gemTex, new Rect(0, 0, gemTex.width, gemTex.height), new Vector2(0.5f, 0.5f), Tile);
            if (goldTex != null) glowGoldSprite = PixelArt.MakeSprite(goldTex, new Rect(0, 0, goldTex.width, goldTex.height), new Vector2(0.5f, 0.5f), Tile);
            if (tealTex != null) glowTealSprite = PixelArt.MakeSprite(tealTex, new Rect(0, 0, tealTex.width, tealTex.height), new Vector2(0.5f, 0.5f), Tile);
            if (shadowTex != null) shadowSprite = PixelArt.MakeSprite(shadowTex, new Rect(0, 0, shadowTex.width, shadowTex.height), new Vector2(0.5f, 0.5f), Tile);

            pixelFont = Resources.Load<Font>("Fonts/PressStart2P-Regular");
            if (pixelFont == null)
            {
                Debug.LogWarning("[CoinQuest] Pixel font missing; using a system fallback.");
                pixelFont = Font.CreateDynamicFontFromOSFont("Courier New", 16);
            }

            Texture2D sheet = PixelArt.LoadArt("player_sheet");
            if (sheet == null) return;

            playerFrames = new Sprite[4][];
            for (int row = 0; row < 4; row++)
            {
                playerFrames[row] = new Sprite[9];
                for (int col = 0; col < 9; col++)
                {
                    Rect rect = new Rect(col * 32, sheet.height - (row + 1) * 32, 32, 32);
                    playerFrames[row][col] = PixelArt.MakeSprite(sheet, rect, new Vector2(0.5f, 0.1875f), Tile);
                }
            }
        }

        private void LoadDatabase()
        {
            TextAsset json = Resources.Load<TextAsset>("Data/maps");
            if (json == null)
            {
                Debug.LogError("[CoinQuest] Missing Data/maps.json");
                db = new MapDatabase();
                db.maps = new MapData[0];
                return;
            }

            db = JsonUtility.FromJson<MapDatabase>(json.text);
            if (db == null || db.maps == null || db.maps.Length == 0)
            {
                Debug.LogError("[CoinQuest] maps.json could not be parsed.");
                db = new MapDatabase();
                db.maps = new MapData[0];
            }
        }

        private void BuildRealms()
        {
            if (db == null || db.maps == null) return;

            for (int i = 0; i < db.maps.Length; i++)
            {
                MapData data = db.maps[i];
                data.Prepare();

                Texture2D mapTex = PixelArt.LoadArt(data.key + "_map");
                if (mapTex == null) continue;

                GameObject root = new GameObject("Realm " + data.key);
                root.transform.SetParent(transform, false);

                GameObject mapGo = new GameObject("Map Art");
                mapGo.transform.SetParent(root.transform, false);
                mapGo.transform.position = new Vector3(0f, data.h, 0f);

                Sprite mapSprite = PixelArt.MakeSprite(mapTex, new Rect(0, 0, mapTex.width, mapTex.height), new Vector2(0f, 1f), Tile);
                SpriteRenderer mapSr = mapGo.AddComponent<SpriteRenderer>();
                mapSr.sprite = mapSprite;
                mapSr.sortingOrder = 0;
                if (spriteMat != null) mapSr.sharedMaterial = spriteMat;

                RealmRuntime runtime = new RealmRuntime();
                runtime.data = data;
                runtime.root = root;
                runtime.minimap = PixelArt.LoadArt(data.key + "_minimap");
                runtime.preview = PixelArt.LoadArt(data.key + "_preview");

                for (int y = 0; y < data.h; y++)
                {
                    for (int x = 0; x < data.w; x++)
                    {
                        if (data.CharAt(x, y) == 't') runtime.torches.Add(new Vector2(x * Tile, y * Tile));
                    }
                }

                for (int c = 0; c < data.coins.Length; c++)
                {
                    CoinData coin = data.coins[c];
                    CoinView view = new CoinView();
                    view.data = coin;
                    view.kind = coin.kind;
                    view.value = coin.kind == "gem" ? 5 : 1;
                    view.phase = coin.phase;

                    view.bodyGo = MakeCoinPart("Coin Body", runtime.root.transform, coin.kind == "gem" ? gemSprite : coinSprite, 7);
                    view.glowGo = MakeCoinPart("Coin Glow", runtime.root.transform, coin.kind == "gem" ? glowTealSprite : glowGoldSprite, 6);
                    view.shadowGo = MakeCoinPart("Coin Shadow", runtime.root.transform, shadowSprite, 5);

                    view.body = view.bodyGo.GetComponent<SpriteRenderer>();
                    view.glow = view.glowGo.GetComponent<SpriteRenderer>();
                    view.shadow = view.shadowGo.GetComponent<SpriteRenderer>();

                    runtime.coins.Add(view);
                }

                root.SetActive(false);
                realms[data.key] = runtime;
            }

            if (playerFrames != null)
            {
                GameObject p = new GameObject("Player");
                p.transform.SetParent(transform, false);
                playerSr = p.AddComponent<SpriteRenderer>();
                playerSr.sortingOrder = 20;
                if (spriteMat != null) playerSr.sharedMaterial = spriteMat;
                playerSr.sprite = playerFrames[0][0];
                p.SetActive(false);
                playerGo = p;
            }
        }

        private GameObject MakeCoinPart(string name, Transform parent, Sprite sprite, int order)
        {
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);
            SpriteRenderer sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = sprite;
            sr.sortingOrder = order;
            if (spriteMat != null) sr.sharedMaterial = spriteMat;
            return go;
        }

        private void CreatePlayer()
        {
            player = new PlayerState();
            if (playerGo == null && playerFrames != null)
            {
                GameObject p = new GameObject("Player");
                p.transform.SetParent(transform, false);
                playerSr = p.AddComponent<SpriteRenderer>();
                playerSr.sortingOrder = 20;
                if (spriteMat != null) playerSr.sharedMaterial = spriteMat;
                p.SetActive(false);
                playerGo = p;
            }
        }

        private RealmRuntime GetRealm(string key)
        {
            RealmRuntime r;
            return realms.TryGetValue(key, out r) ? r : null;
        }

        private void ActivateRealm(string key)
        {
            foreach (KeyValuePair<string, RealmRuntime> pair in realms)
            {
                if (pair.Value.root != null) pair.Value.root.SetActive(pair.Key == key);
            }
            realm = GetRealm(key);
        }

        private void ResetRealmCoins(RealmRuntime r)
        {
            if (r == null) return;
            for (int i = 0; i < r.coins.Count; i++)
            {
                CoinView c = r.coins[i];
                c.collected = false;
                c.x = c.data.x;
                c.y = c.data.y;
                c.phase = c.data.phase;
                SetCoinVisible(c, true);
            }
            UpdateCoinVisuals(Time.time);
        }

        private void SetCoinVisible(CoinView c, bool visible)
        {
            if (c.bodyGo != null) c.bodyGo.SetActive(visible);
            if (c.glowGo != null) c.glowGo.SetActive(visible);
            if (c.shadowGo != null) c.shadowGo.SetActive(visible);
        }

        private void UpdateCoinVisuals(float time)
        {
            if (realm == null) return;
            for (int i = 0; i < realm.coins.Count; i++)
            {
                CoinView c = realm.coins[i];
                if (c.collected)
                {
                    SetCoinVisible(c, false);
                    continue;
                }

                float bob = Mathf.Sin(time * 2.4f + c.phase) * 2f;
                Vector3 bodyPos = WorldPixel(c.x, c.y + bob);
                Vector3 shadowPos = WorldPixel(c.x, c.y + 6f);

                if (c.bodyGo != null && c.bodyGo.activeSelf) c.bodyGo.transform.position = bodyPos;
                if (c.glowGo != null && c.glowGo.activeSelf) c.glowGo.transform.position = bodyPos;
                if (c.shadowGo != null && c.shadowGo.activeSelf) c.shadowGo.transform.position = shadowPos;

                if (c.body != null)
                {
                    float spin = Mathf.Max(0.18f, Mathf.Abs(Mathf.Cos(time * 3f + c.phase)));
                    c.body.transform.localScale = new Vector3(spin, 1f, 1f);
                }
            }
        }

        private Vector3 WorldPixel(float px, float py)
        {
            float h = realm != null ? realm.data.h * Tile : 704f;
            return new Vector3(px / Tile, (h - py) / Tile, 0f);
        }

        private void InitTitle()
        {
            state = GameState.Title;
            titleTime = 0f;
            mapKey = titleKey;
            ActivateRealm(mapKey);
            if (realm == null) return;

            ResetRealmCoins(realm);
            if (playerGo != null) playerGo.SetActive(false);

            score = 0;
            collected = 0;
            elapsed = 0f;
            combo = 0;
            maxCombo = 0;
            comboTime = 0f;
            particles.Clear();
            floats.Clear();
            ambient.Clear();

            camX = CameraLimitX() * 0.5f;
            camY = CameraLimitY() * 0.5f;
            camTX = camX;
            camTY = camY;
            ApplyCameraImmediate();
        }

        private void SetTitleBackdrop(string key)
        {
            if (state != GameState.Title || !realms.ContainsKey(key)) return;
            titleKey = key;
            mapKey = key;
            ActivateRealm(key);
            ResetRealmCoins(realm);
            particles.Clear();
            floats.Clear();
            ambient.Clear();
        }

        private void StartMap(string key)
        {
            if (!realms.ContainsKey(key)) return;
            mapKey = key;
            titleKey = key;
            ActivateRealm(key);
            if (realm == null) return;

            ResetRealmCoins(realm);
            player.x = realm.data.spawn.x;
            player.y = realm.data.spawn.y;
            player.dir = 0;
            player.moving = false;
            player.sprinting = false;
            player.walk = 0f;
            player.footTimer = 0f;
            if (playerGo != null) playerGo.SetActive(true);

            score = 0;
            collected = 0;
            elapsed = 0f;
            combo = 0;
            maxCombo = 0;
            comboTime = 0f;
            particles.Clear();
            floats.Clear();
            ambient.Clear();
            newBest = false;
            fastest = false;

            state = GameState.Playing;
            SnapCamera();
            UpdatePlayerVisual();
            sfx.Init();
            sfx.PlayClick();
        }

        private void PauseGame()
        {
            if (state != GameState.Playing) return;
            state = GameState.Paused;
            sfx.PlayPause(true);
        }

        private void ResumeGame()
        {
            if (state != GameState.Paused) return;
            state = GameState.Playing;
            sfx.PlayPause(false);
        }

        private void ToggleSound()
        {
            sfx.Init();
            sfx.Toggle();
        }

        private void ToTitle()
        {
            titleKey = mapKey;
            sfx.PlayClick();
            InitTitle();
        }

        private string NextRealmKey()
        {
            int idx = Array.IndexOf(RealmOrder, mapKey);
            if (idx < 0) idx = 0;
            return RealmOrder[(idx + 1) % RealmOrder.Length];
        }

        private void NextRealm()
        {
            StartMap(NextRealmKey());
        }

        private void RestartRealm()
        {
            StartMap(mapKey);
        }

        private void Update()
        {
            if (Keys.PauseDown)
            {
                if (state == GameState.Playing) PauseGame();
                else if (state == GameState.Paused) ResumeGame();
            }

            if (Keys.MuteDown) ToggleSound();

            if (Keys.EnterDown)
            {
                if (state == GameState.Title) StartMap(titleKey);
                else if (state == GameState.Paused) ResumeGame();
                else if (state == GameState.Complete) NextRealm();
            }

            float dt = Mathf.Min(0.05f, Time.deltaTime);

            if (state == GameState.Playing) UpdatePlaying(dt);
            else if (state == GameState.Title)
            {
                titleTime += dt;
                UpdateAmbient(dt);
            }
            else if (state == GameState.Complete)
            {
                UpdateParticles(dt);
                UpdateAmbient(dt);
            }

            UpdateCamera(dt);
            UpdateCoinVisuals(Time.time);
            UpdatePlayerVisual();
            UpdateViewport();

            uiUp = false;
            uiDown = false;
            uiLeft = false;
            uiRight = false;
        }

        private void UpdatePlaying(float dt)
        {
            elapsed += dt;

            if (comboTime > 0f)
            {
                comboTime -= dt;
                if (comboTime <= 0f)
                {
                    comboTime = 0f;
                    combo = 0;
                }
            }

            float dx = 0f;
            float dy = 0f;
            bool up = Keys.Up || uiUp;
            bool down = Keys.Down || uiDown;
            bool left = Keys.Left || uiLeft;
            bool right = Keys.Right || uiRight;
            if (up) dy -= 1f;
            if (down) dy += 1f;
            if (left) dx -= 1f;
            if (right) dx += 1f;

            player.moving = dx != 0f || dy != 0f;

            if (player.moving)
            {
                if (dx != 0f && dy != 0f)
                {
                    dx *= 0.70710678f;
                    dy *= 0.70710678f;
                }
                if (Mathf.Abs(dx) > Mathf.Abs(dy)) player.dir = dx > 0f ? 2 : 1;
                else player.dir = dy > 0f ? 0 : 3;
            }

            player.sprinting = Keys.Sprint && player.moving;

            float speed = player.speed * (player.sprinting ? 1.48f : 1f);
            if (realm != null && realm.data.IsSlowAt(player.x, player.y)) speed *= 0.68f;

            float nx = player.x + dx * speed * dt;
            if (!Collides(nx, player.y)) player.x = nx;

            float ny = player.y + dy * speed * dt;
            if (!Collides(player.x, ny)) player.y = ny;

            if (player.moving)
            {
                player.walk += dt * (player.sprinting ? 12f : 8.4f);
                player.footTimer += dt;
                if (player.footTimer > (player.sprinting ? 0.13f : 0.19f))
                {
                    player.footTimer = 0f;
                    SpawnDust(player);
                }
            }
            else
            {
                player.walk = 0f;
            }

            for (int i = 0; i < realm.coins.Count; i++)
            {
                CoinView c = realm.coins[i];
                if (c.collected) continue;

                float tx = player.x;
                float ty = player.y - 6f;
                float cdx = tx - c.x;
                float cdy = ty - c.y;
                float dist = Mathf.Sqrt(cdx * cdx + cdy * cdy);
                if (dist < 0.0001f) dist = 0.0001f;

                if (dist < 36f)
                {
                    float pull = (1f - dist / 36f) * 260f + 90f;
                    c.x += (cdx / dist) * pull * dt;
                    c.y += (cdy / dist) * pull * dt;
                }

                float ndx = tx - c.x;
                float ndy = ty - c.y;
                float ndist = Mathf.Sqrt(ndx * ndx + ndy * ndy);
                if (ndist < 12f) CollectCoin(c);
            }

            UpdateParticles(dt);
            UpdateAmbient(dt);

            if (realm.coins.Count > 0 && collected >= realm.coins.Count)
            {
                CompleteRealm();
            }
        }

        private bool Collides(float cx, float cy)
        {
            if (realm == null) return true;
            const float hw = 5f;
            const float hh = 5f;
            MapData m = realm.data;
            if (m.IsSolidAt(cx - hw, cy - hh)) return true;
            if (m.IsSolidAt(cx + hw, cy - hh)) return true;
            if (m.IsSolidAt(cx - hw, cy + hh)) return true;
            if (m.IsSolidAt(cx + hw, cy + hh)) return true;
            if (m.IsSolidAt(cx, cy - hh)) return true;
            if (m.IsSolidAt(cx, cy + hh)) return true;
            if (m.IsSolidAt(cx - hw, cy)) return true;
            if (m.IsSolidAt(cx + hw, cy)) return true;
            return false;
        }

        private void SnapCamera()
        {
            if (realm == null || player == null) return;
            float maxX = CameraLimitX();
            float maxY = CameraLimitY();
            camX = Mathf.Clamp(player.x - ViewW * 0.5f, 0f, maxX);
            camY = Mathf.Clamp(player.y - ViewH * 0.5f, 0f, maxY);
            camTX = camX;
            camTY = camY;
            ApplyCameraImmediate();
        }

        private float CameraLimitX()
        {
            return realm == null ? 0f : Mathf.Max(0f, realm.data.PixelWidth - ViewW);
        }

        private float CameraLimitY()
        {
            return realm == null ? 0f : Mathf.Max(0f, realm.data.PixelHeight - ViewH);
        }

        private void UpdateCamera(float dt)
        {
            if (realm == null) return;

            if (state == GameState.Title)
            {
                float t = titleTime * 0.055f;
                camTX = Mathf.Clamp(CameraLimitX() * (0.5f + 0.42f * Mathf.Sin(t * 1.7f)), 0f, CameraLimitX());
                camTY = Mathf.Clamp(CameraLimitY() * (0.5f + 0.42f * Mathf.Cos(t * 1.1f)), 0f, CameraLimitY());
            }
            else if (state == GameState.Playing && player != null)
            {
                camTX = Mathf.Clamp(player.x - ViewW * 0.5f, 0f, CameraLimitX());
                camTY = Mathf.Clamp(player.y - ViewH * 0.5f, 0f, CameraLimitY());
            }

            float k = Mathf.Min(1f, dt * (state == GameState.Title ? 1.8f : 8f));
            camX += (camTX - camX) * k;
            camY += (camTY - camY) * k;
            ApplyCameraImmediate();
        }

        private void ApplyCameraImmediate()
        {
            if (cam == null || realm == null) return;
            float cx = Mathf.Round(camX);
            float cy = Mathf.Round(camY);
            float h = realm.data.h * Tile;
            cam.transform.position = new Vector3((cx + ViewW * 0.5f) / Tile, (h - (cy + ViewH * 0.5f)) / Tile, -10f);
        }

        private float UIViewportScale()
        {
            float raw = Mathf.Min(Screen.width / (float)ViewW, Screen.height / (float)ViewH);
            if (raw <= 0f) return 1f;
            return raw >= 1f ? Mathf.Floor(raw) : raw;
        }

        private void UpdateViewport()
        {
            if (cam == null || Screen.width <= 0 || Screen.height <= 0) return;
            float scale = UIViewportScale();
            float w = ViewW * scale;
            float h = ViewH * scale;
            float x = (Screen.width - w) * 0.5f;
            float y = (Screen.height - h) * 0.5f;
            cam.rect = new Rect(x / Screen.width, y / Screen.height, w / Screen.width, h / Screen.height);
        }

        private void UpdatePlayerVisual()
        {
            if (playerGo == null || playerSr == null || player == null || realm == null) return;
            bool show = state != GameState.Title;
            if (playerGo.activeSelf != show) playerGo.SetActive(show);
            if (!show) return;

            int col = 0;
            if (player.moving)
            {
                float w = player.walk % 2f;
                col = 1 + Mathf.FloorToInt(w * 4f);
                if (col > 8) col = 8;
            }

            if (playerFrames != null) playerSr.sprite = playerFrames[player.dir][col];
            playerGo.transform.position = WorldPixel(Mathf.Round(player.x), Mathf.Round(player.y));
        }

        private void CollectCoin(CoinView c)
        {
            c.collected = true;
            SetCoinVisible(c, false);
            collected++;

            combo = comboTime > 0f ? combo + 1 : 1;
            comboTime = 3.2f;
            if (combo > maxCombo) maxCombo = combo;

            int mult = Mathf.Min(combo, 5);
            int points = c.value * mult;
            score += points;

            Color color = c.kind == "gem" ? PixelArt.Hex("#7ef4ee") : PixelArt.Hex("#ffd86b");
            FloatText f = new FloatText();
            f.x = c.x;
            f.y = c.y - 10f;
            f.text = "+" + points + (mult > 1 ? " x" + mult : "");
            f.color = color;
            f.life = mult > 1 ? 1f : 0.85f;
            f.max = f.life;
            floats.Add(f);

            int count = c.kind == "gem" ? 14 : 8;
            for (int i = 0; i < count; i++)
            {
                Particle p = new Particle();
                p.x = c.x;
                p.y = c.y;
                p.vx = (UnityEngine.Random.value - 0.5f) * 110f;
                p.vy = -25f - UnityEngine.Random.value * 80f;
                p.gravity = 190f;
                p.life = 0.4f + UnityEngine.Random.value * 0.35f;
                p.max = p.life;
                p.size = UnityEngine.Random.value < 0.5f ? 2 : 1;
                p.color = c.kind == "gem" && UnityEngine.Random.value < 0.5f ? PixelArt.Hex("#b7ffff") : color;
                p.layer = 1;
                p.drag = 1.1f;
                particles.Add(p);
            }

            sfx.PlayPickup(c.kind);
            totalCoins++;
            PlayerPrefs.SetInt("cq_total", totalCoins);
            PlayerPrefs.Save();
        }

        private void CompleteRealm()
        {
            state = GameState.Complete;
            resultKey = mapKey;
            resultScore = score;
            resultTime = elapsed;
            resultCollected = collected;
            resultMaxCombo = Mathf.Max(1, maxCombo);

            int oldScore = PlayerPrefs.GetInt("cq_best_score_" + mapKey, 0);
            float oldTime = PlayerPrefs.GetFloat("cq_best_time_" + mapKey, 0f);
            resultBestScore = Mathf.Max(oldScore, score);
            resultBestTime = oldTime > 0f ? Mathf.Min(oldTime, elapsed) : elapsed;
            newBest = score > oldScore;
            fastest = oldTime <= 0f || elapsed < oldTime;

            PlayerPrefs.SetInt("cq_best_score_" + mapKey, resultBestScore);
            PlayerPrefs.SetFloat("cq_best_time_" + mapKey, resultBestTime);
            PlayerPrefs.Save();

            sfx.PlayComplete();
            SpawnConfetti();
        }

        private void SpawnDust(PlayerState p)
        {
            if (realm == null) return;
            string hex = realm.data.theme == "castle" ? "#7a738c" : realm.data.theme == "forest" ? "#7a9a52" : "#e3cf96";
            Particle particle = new Particle();
            particle.x = p.x + (UnityEngine.Random.value - 0.5f) * 6f;
            particle.y = p.y + 2f + (UnityEngine.Random.value - 0.5f) * 3f;
            particle.vx = (UnityEngine.Random.value - 0.5f) * 22f;
            particle.vy = -8f - UnityEngine.Random.value * 12f;
            particle.gravity = 22f;
            particle.life = 0.32f + UnityEngine.Random.value * 0.18f;
            particle.max = particle.life;
            particle.size = UnityEngine.Random.value < 0.4f ? 2 : 1;
            particle.color = PixelArt.Hex(hex);
            particle.layer = 0;
            particle.drag = 1.5f;
            particles.Add(particle);
        }

        private void SpawnConfetti()
        {
            string[] colors = { "#ffd86b", "#63e3dd", "#e14b5a", "#9cff8a", "#ffffff", "#c596ff" };
            float bx = player != null ? player.x : camX + ViewW * 0.5f;
            float by = player != null ? player.y - 20f : camY + ViewH * 0.5f;

            for (int i = 0; i < 70; i++)
            {
                Particle p = new Particle();
                p.x = bx;
                p.y = by;
                p.vx = (UnityEngine.Random.value - 0.5f) * 280f;
                p.vy = -80f - UnityEngine.Random.value * 200f;
                p.gravity = 360f;
                p.life = 1.2f + UnityEngine.Random.value * 1.1f;
                p.max = p.life;
                p.size = UnityEngine.Random.value < 0.5f ? 3 : 2;
                p.color = PixelArt.Hex(colors[UnityEngine.Random.Range(0, colors.Length)]);
                p.layer = 1;
                p.drag = 0.35f;
                particles.Add(p);
            }
        }

        private void UpdateParticles(float dt)
        {
            for (int i = particles.Count - 1; i >= 0; i--)
            {
                Particle p = particles[i];
                p.life -= dt;
                if (p.life <= 0f)
                {
                    particles.RemoveAt(i);
                    continue;
                }
                p.vy += p.gravity * dt;
                float drag = p.drag > 0f ? Mathf.Max(0f, 1f - p.drag * dt) : 1f;
                p.vx *= drag;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
            }

            for (int i = floats.Count - 1; i >= 0; i--)
            {
                FloatText f = floats[i];
                f.life -= dt;
                f.y -= 18f * dt;
                if (f.life <= 0f) floats.RemoveAt(i);
            }
        }

        private void UpdateAmbient(float dt)
        {
            if (realm == null) return;

            int max = realm.data.theme == "forest" ? 26 : realm.data.theme == "sea" ? 20 : 16;

            if (ambient.Count < max && UnityEngine.Random.value < dt * 14f)
            {
                float x = camX + UnityEngine.Random.value * ViewW;
                float y = camY + UnityEngine.Random.value * ViewH;
                Ambient p = new Ambient();

                if (realm.data.theme == "forest")
                {
                    p.x = x;
                    p.y = y;
                    p.vx = (UnityEngine.Random.value - 0.5f) * 9f;
                    p.vy = (UnityEngine.Random.value - 0.5f) * 9f;
                    p.life = 2f + UnityEngine.Random.value * 2f;
                    p.color = PixelArt.Hex("#d9f27a");
                    p.type = "firefly";
                    p.phase = UnityEngine.Random.value * 6.28f;
                }
                else if (realm.data.theme == "sea")
                {
                    p.x = x;
                    p.y = y;
                    p.vx = 0f;
                    p.vy = -3f - UnityEngine.Random.value * 4f;
                    p.life = 1.2f + UnityEngine.Random.value * 1.6f;
                    p.size = UnityEngine.Random.value < 0.5f ? 2 : 1;
                    p.color = PixelArt.Hex("#9ce8ff");
                    p.type = "bubble";
                }
                else
                {
                    p.x = x;
                    p.y = y;
                    p.vx = (UnityEngine.Random.value - 0.5f) * 5f;
                    p.vy = -5f - UnityEngine.Random.value * 7f;
                    p.life = 2f + UnityEngine.Random.value * 2f;
                    p.size = UnityEngine.Random.value < 0.3f ? 2 : 1;
                    p.color = PixelArt.Hex("#9a8a6a");
                    p.type = "dust";
                }

                p.max = p.life;
                ambient.Add(p);
            }

            for (int i = ambient.Count - 1; i >= 0; i--)
            {
                Ambient p = ambient[i];
                p.life -= dt;
                if (p.life <= 0f)
                {
                    ambient.RemoveAt(i);
                    continue;
                }
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                if (p.type == "firefly")
                {
                    p.x += Mathf.Sin(p.life * 3f + p.phase) * dt * 9f;
                    p.y += Mathf.Cos(p.life * 2f + p.phase) * dt * 7f;
                }
                if (p.x < camX - 30f || p.x > camX + ViewW + 30f || p.y < camY - 30f || p.y > camY + ViewH + 30f)
                {
                    ambient.RemoveAt(i);
                }
            }
        }

        internal void TestStart(string key)
        {
            StartMap(key);
        }

        internal void TestCollectAll()
        {
            if (realm == null) return;
            for (int i = 0; i < realm.coins.Count; i++)
            {
                CoinView c = realm.coins[i];
                if (!c.collected) CollectCoin(c);
            }
            if (state == GameState.Playing && realm.coins.Count > 0 && collected >= realm.coins.Count)
            {
                CompleteRealm();
            }
        }

        internal void TestPause()
        {
            PauseGame();
        }

        internal void TestResume()
        {
            ResumeGame();
        }

        internal void TestToTitle()
        {
            ToTitle();
        }

        internal string TestSnapshot()
        {
            int bestScore = PlayerPrefs.GetInt("cq_best_score_" + mapKey, 0);
            float bestTime = PlayerPrefs.GetFloat("cq_best_time_" + mapKey, 0f);
            return "state=" + state
                + " map=" + mapKey
                + " score=" + score
                + " collected=" + collected
                + " total=" + totalCoins
                + " best=" + bestScore
                + " bestTime=" + bestTime.ToString("0.000");
        }

        private void OnApplicationFocus(bool focus)
        {
            if (SmokeTest.Running) return;
            if (!focus && !Application.isEditor && state == GameState.Playing) PauseGame();
        }

        private void OnApplicationPause(bool paused)
        {
            if (SmokeTest.Running) return;
            if (paused && !Application.isEditor && state == GameState.Playing) PauseGame();
        }
    }
}
