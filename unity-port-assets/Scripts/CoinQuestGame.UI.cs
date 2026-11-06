using System;
using UnityEngine;

namespace CoinQuest
{
    public partial class CoinQuestGame
    {
        private bool stylesReady;
        private GUIStyle stLogo;
        private GUIStyle stTitle;
        private GUIStyle stNormal;
        private GUIStyle stTiny;
        private GUIStyle stKicker;
        private GUIStyle stButton;
        private GUIStyle stButtonSmall;
        private GUIStyle stValue;
        private GUIStyle stScore;
        private GUIStyle stRealm;
        private GUIStyle stCenterSmall;
        private GUIStyle stTinyRight;
        private GUIStyle stFloat;
        private GUIStyle hitStyle;

        private Color cInk;
        private Color cPanel;
        private Color cPanel2;
        private Color cGold;
        private Color cGoldBright;
        private Color cGoldDim;
        private Color cCream;
        private Color cMuted;
        private Color cTeal;
        private Color cBorder;

        private string titleHover = "";
        private Vector2 uiMouse;

        private void EnsureStyles()
        {
            if (stylesReady) return;
            stylesReady = true;

            cInk = PixelArt.Hex("#07050b");
            cPanel = PixelArt.Hex("#0f0b16");
            cPanel2 = PixelArt.Hex("#1d1528");
            cGold = PixelArt.Hex("#e3b64d");
            cGoldBright = PixelArt.Hex("#ffdf85");
            cGoldDim = PixelArt.Hex("#8d6c2f");
            cCream = PixelArt.Hex("#ffeccd");
            cMuted = PixelArt.Hex("#9c8fa8");
            cTeal = PixelArt.Hex("#63e3dd");
            cBorder = PixelArt.Hex("#3d2f4a");

            if (pixelFont == null)
            {
                pixelFont = Font.CreateDynamicFontFromOSFont("Courier New", 16);
            }

            stLogo = MakeStyle(38, TextAnchor.MiddleCenter, cCream, true);
            stTitle = MakeStyle(20, TextAnchor.MiddleCenter, cCream, false);
            stNormal = MakeStyle(8, TextAnchor.MiddleLeft, cCream, false);
            stTiny = MakeStyle(6, TextAnchor.MiddleLeft, cMuted, false);
            stKicker = MakeStyle(7, TextAnchor.MiddleCenter, cGoldDim, false);
            stButton = MakeStyle(7, TextAnchor.MiddleCenter, cCream, false);
            stButtonSmall = MakeStyle(6, TextAnchor.MiddleCenter, cMuted, false);
            stValue = MakeStyle(12, TextAnchor.MiddleCenter, cGold, false);
            stScore = MakeStyle(10, TextAnchor.MiddleCenter, cGold, false);
            stRealm = MakeStyle(10, TextAnchor.MiddleCenter, cCream, false);
            stCenterSmall = MakeStyle(6, TextAnchor.MiddleCenter, cMuted, false);
            stTinyRight = MakeStyle(6, TextAnchor.MiddleRight, cMuted, false);
            stFloat = MakeStyle(7, TextAnchor.MiddleCenter, cCream, false);

            hitStyle = new GUIStyle();
            hitStyle.normal.background = null;
            hitStyle.hover.background = null;
            hitStyle.active.background = null;
            hitStyle.focused.background = null;
            hitStyle.border = new RectOffset(0, 0, 0, 0);
            hitStyle.padding = new RectOffset(0, 0, 0, 0);
            hitStyle.margin = new RectOffset(0, 0, 0, 0);

            titleHover = titleKey;
        }

        private GUIStyle MakeStyle(int size, TextAnchor anchor, Color color, bool rich)
        {
            GUIStyle style = new GUIStyle(GUI.skin.label);
            style.font = pixelFont;
            style.fontSize = size;
            style.alignment = anchor;
            style.normal.textColor = color;
            style.wordWrap = false;
            style.richText = rich;
            style.padding = new RectOffset(0, 0, 0, 0);
            style.margin = new RectOffset(0, 0, 0, 0);
            style.clipping = TextClipping.Overflow;
            style.fontStyle = FontStyle.Normal;
            return style;
        }

        private void OnGUI()
        {
            EnsureStyles();

            float scale = UIViewportScale();
            float w = ViewW * scale;
            float h = ViewH * scale;
            float ox = (Screen.width - w) * 0.5f;
            float oy = (Screen.height - h) * 0.5f;
            Vector2 screenMouse = Keys.MousePosition;
            uiMouse = new Vector2((screenMouse.x - ox) / Mathf.Max(0.0001f, scale), (Screen.height - screenMouse.y - oy) / Mathf.Max(0.0001f, scale));

            GUI.matrix = Matrix4x4.identity;
            GUI.depth = 0;

            if (oy > 0f)
            {
                FillScreen(new Rect(0f, 0f, Screen.width, oy), Color.black);
                FillScreen(new Rect(0f, oy + h, Screen.width, Screen.height - (oy + h)), Color.black);
            }
            if (ox > 0f)
            {
                FillScreen(new Rect(0f, oy, ox, h), Color.black);
                FillScreen(new Rect(ox + w, oy, Screen.width - (ox + w), h), Color.black);
            }

            GUI.matrix = Matrix4x4.TRS(new Vector3(ox, oy, 0f), Quaternion.identity, new Vector3(scale, scale, 1f));

            DrawWorldOverlays();
            DrawCrtOverlay();

            if (state == GameState.Title)
            {
                DrawTitleScreen();
            }
            else
            {
                DrawHud();
                if (state == GameState.Paused) DrawPauseScreen();
                else if (state == GameState.Complete) DrawCompleteScreen();
                else if (state == GameState.Playing) DrawTouchPad();
            }

            GUI.matrix = Matrix4x4.identity;
        }

        private void FillScreen(Rect r, Color c)
        {
            if (r.width <= 0f || r.height <= 0f) return;
            Color old = GUI.color;
            GUI.color = c;
            GUI.DrawTexture(r, PixelArt.White, ScaleMode.StretchToFill, true);
            GUI.color = old;
        }

        private void Fill(Rect r, Color c)
        {
            if (r.width <= 0f || r.height <= 0f || c.a <= 0f) return;
            Color old = GUI.color;
            GUI.color = c;
            GUI.DrawTexture(r, PixelArt.White, ScaleMode.StretchToFill, true);
            GUI.color = old;
        }

        private void Tex(Rect r, Texture2D tex, Color tint)
        {
            if (tex == null) return;
            Color old = GUI.color;
            GUI.color = tint;
            GUI.DrawTexture(r, tex, ScaleMode.StretchToFill, true);
            GUI.color = old;
        }

        private void Label(Rect r, string text, GUIStyle style, Color color)
        {
            Color old = style.normal.textColor;
            style.normal.textColor = color;
            GUI.Label(r, text, style);
            style.normal.textColor = old;
        }

        private void ShadowLabel(Rect r, string text, GUIStyle style, Color color)
        {
            Label(new Rect(r.x + 1f, r.y + 1f, r.width, r.height), text, style, new Color(0f, 0f, 0f, 0.9f));
            Label(r, text, style, color);
        }

        private Color Alpha(Color c, float a)
        {
            c.a = a;
            return c;
        }

        private void Panel(Rect r, Color border, Color fill)
        {
            Fill(new Rect(r.x, r.y + 3f, r.width, r.height), Alpha(Color.black, 0.55f));
            Fill(new Rect(r.x - 2f, r.y - 2f, r.width + 4f, r.height + 4f), Alpha(Color.black, 0.9f));
            Fill(r, border);
            Fill(new Rect(r.x + 2f, r.y + 2f, r.width - 4f, r.height - 4f), fill);
            Fill(new Rect(r.x + 2f, r.y + 2f, r.width - 4f, 1f), Alpha(Color.white, 0.05f));
        }

        private bool Button(Rect r, string text, bool primary, bool small, bool interactive)
        {
            bool hover = r.Contains(uiMouse);
            Color fill = primary
                ? (hover ? cGoldBright : cGold)
                : (hover ? cPanel2 : Alpha(cPanel, 0.96f));
            Color border = primary ? cGoldBright : (hover ? PixelArt.Hex("#6b5878") : cBorder);

            Fill(new Rect(r.x, r.y + 3f, r.width, r.height), Alpha(Color.black, 0.6f));
            Fill(r, border);
            Fill(new Rect(r.x + 2f, r.y + 2f, r.width - 4f, r.height - 4f), fill);
            Fill(new Rect(r.x + 2f, r.y + 2f, r.width - 4f, 1f), Alpha(Color.white, 0.12f));

            bool clicked = false;
            if (interactive)
            {
                clicked = GUI.Button(r, GUIContent.none, hitStyle);
            }

            GUIStyle style = small ? stButtonSmall : stButton;
            Label(r, text, style, primary ? cInk : (hover && interactive ? cCream : cMuted));
            return clicked;
        }

        private void DrawCrtOverlay()
        {
            for (int y = 0; y < ViewH; y += 3)
            {
                Fill(new Rect(0f, y, ViewW, 1f), new Color(0f, 0f, 0f, 0.075f));
            }
            Tex(new Rect(0f, 0f, ViewW, ViewH), PixelArt.Vignette, Color.white);
        }

        private void DrawWorldOverlays()
        {
            if (realm == null) return;

            float cx = Mathf.Round(camX);
            float cy = Mathf.Round(camY);
            DrawAnimatedTiles(Time.time, cx, cy);
            DrawParticles(0, cx, cy);
            DrawParticles(1, cx, cy);
            DrawFloats(cx, cy);
            DrawAmbient(cx, cy, Time.time);
        }

        private void DrawAnimatedTiles(float time, float cx, float cy)
        {
            MapData map = realm.data;
            int x0 = Mathf.Max(0, Mathf.FloorToInt(cx / Tile) - 1);
            int y0 = Mathf.Max(0, Mathf.FloorToInt(cy / Tile) - 1);
            int x1 = Mathf.Min(map.w - 1, Mathf.CeilToInt((cx + ViewW) / Tile) + 1);
            int y1 = Mathf.Min(map.h - 1, Mathf.CeilToInt((cy + ViewH) / Tile) + 1);

            for (int y = y0; y <= y1; y++)
            {
                for (int x = x0; x <= x1; x++)
                {
                    char ch = map.CharAt(x, y);
                    float px = x * Tile - cx;
                    float py = y * Tile - cy;
                    float seed = Mathf.Sin(x * 0.37f + y * 0.17f);

                    if (map.theme == "castle" && ch == 't')
                    {
                        DrawTorch(px, py, time, seed);
                    }
                    else if (map.theme == "sea" && (ch == 'w' || ch == 'W'))
                    {
                        float phase = time * 1.4f + seed * 6.28f;
                        int ox = Mathf.RoundToInt(Mathf.Sin(phase) * 3f);
                        Color line = ch == 'W' ? new Color(0.86f, 0.98f, 1f, 0.34f) : new Color(0.59f, 0.84f, 0.96f, 0.18f);
                        Fill(new Rect(px + 3f + ox, py + 5f, 4f, 1f), line);
                        Fill(new Rect(px + 9f - ox, py + 11f, 3f, 1f), line);
                        if (seed > 0.3f)
                        {
                            Fill(new Rect(px + 6f - ox, py + 8f, 2f, 1f), new Color(1f, 1f, 1f, 0.28f));
                        }
                    }
                    else if (map.theme == "forest" && ch == 'w')
                    {
                        float phase = time * 1.1f + seed * 6.28f;
                        Fill(new Rect(px + 4f + Mathf.RoundToInt(Mathf.Sin(phase) * 2f), py + 6f, 3f, 1f), new Color(0.59f, 0.84f, 0.9f, 0.18f));
                    }
                }
            }
        }

        private void DrawTorch(float px, float py, float time, float seed)
        {
            int flick = Mathf.RoundToInt(Mathf.Sin(time * 9f + seed * 13f) + Mathf.Sin(time * 17f + seed * 7f) * 0.5f);

            if (glowGoldTex != null)
            {
                Tex(new Rect(px + 8f - 18f, py + 3f - 18f, 36f, 36f), glowGoldTex, new Color(1f, 0.92f, 0.72f, 0.65f));
            }
            Fill(new Rect(px + 6f, py + 4f + flick, 4f, 4f), PixelArt.Hex("#d84a26"));
            Fill(new Rect(px + 7f, py + 2f + flick, 2f, 4f), PixelArt.Hex("#ff9d2e"));
            Fill(new Rect(px + 7f, py + 3f + flick, 2f, 2f), PixelArt.Hex("#ffe27a"));
            Fill(new Rect(px + 8f, py + 1f + flick, 1f, 2f), PixelArt.Hex("#fff2b0"));
        }

        private void DrawParticles(int layer, float cx, float cy)
        {
            for (int i = 0; i < particles.Count; i++)
            {
                Particle p = particles[i];
                if (p.layer != layer) continue;
                float alpha = Mathf.Clamp01(p.life / p.max);
                Fill(new Rect(Mathf.Round(p.x - cx), Mathf.Round(p.y - cy), p.size, p.size), Alpha(p.color, alpha));
            }
        }

        private void DrawFloats(float cx, float cy)
        {
            for (int i = 0; i < floats.Count; i++)
            {
                FloatText f = floats[i];
                float alpha = Mathf.Clamp01(f.life / f.max);
                Rect r = new Rect(Mathf.Round(f.x - cx) - 42f, Mathf.Round(f.y - cy) - 7f, 84f, 14f);
                Label(new Rect(r.x + 1f, r.y + 1f, r.width, r.height), f.text, stFloat, new Color(0f, 0f, 0f, alpha));
                Label(r, f.text, stFloat, Alpha(f.color, alpha));
            }
        }

        private void DrawAmbient(float cx, float cy, float time)
        {
            for (int i = 0; i < ambient.Count; i++)
            {
                Ambient p = ambient[i];
                float x = Mathf.Round(p.x - cx);
                float y = Mathf.Round(p.y - cy);
                float ratio = Mathf.Clamp01(p.life / p.max);
                float fade = Mathf.Min(1f, ratio * 2f);

                if (p.type == "firefly")
                {
                    float blink = 0.35f + 0.65f * Mathf.Abs(Mathf.Sin(time * 2f + p.phase));
                    Fill(new Rect(x, y, 1f, 1f), Alpha(p.color, fade * blink));
                    Fill(new Rect(x - 2f, y - 2f, 5f, 5f), Alpha(p.color, fade * blink * 0.18f));
                }
                else if (p.type == "bubble")
                {
                    Fill(new Rect(x, y, p.size, p.size), Alpha(p.color, fade * 0.55f));
                }
                else
                {
                    Fill(new Rect(x, y, p.size, p.size), Alpha(p.color, fade * 0.35f));
                }
            }
        }

        private void DrawTitleScreen()
        {
            Tex(new Rect(0f, 0f, ViewW, ViewH), PixelArt.TitleShade, Color.white);

            Label(new Rect(0f, 58f, ViewW, 12f), "A TINY PIXEL ADVENTURE", stKicker, cGold);

            string logoShadow = "<color=#07050b>COIN QUEST</color>";
            string logoMain = "<color=#e3b64d>COIN</color> <color=#ffeccd>QUEST</color>";
            float logoBob = Mathf.Round(Mathf.Sin(Time.time * 1.57f) * 2f);
            Label(new Rect(0f, 76f + logoBob, ViewW, 48f), logoShadow, stLogo, cInk);
            Label(new Rect(0f, 73f + logoBob, ViewW, 48f), logoShadow, stLogo, cInk);
            Label(new Rect(0f, 70f + logoBob, ViewW, 48f), logoMain, stLogo, cCream);

            Label(new Rect(0f, 122f, ViewW, 12f), "THREE REALMS. ONE VERY GREEDY HERO.", stCenterSmall, cMuted);

            float cardW = 176f;
            float gap = 8f;
            float total = cardW * 3f + gap * 2f;
            float startX = (ViewW - total) * 0.5f;
            float cardY = 146f;
            string clicked = null;

            for (int i = 0; i < RealmOrder.Length; i++)
            {
                string key = RealmOrder[i];
                float x = startX + i * (cardW + gap);
                if (DrawRealmCard(key, i, x, cardY, cardW, 174f)) clicked = key;
            }

            float blink = 0.45f + 0.55f * Mathf.Abs(Mathf.Sin(Time.time * 2.2f));
            Label(new Rect(0f, 334f, ViewW, 14f), "PRESS ENTER OR CHOOSE A REALM", stCenterSmall, Alpha(cCream, blink));
            Label(new Rect(0f, 352f, ViewW, 12f), "WASD / ARROWS MOVE  |  SHIFT SPRINT  |  ESC PAUSE  |  M MUTE", stCenterSmall, cMuted);

            Fill(new Rect(232f, 370f, 176f, 1f), Alpha(cBorder, 0.9f));
            Label(new Rect(0f, 378f, ViewW, 12f), "TOTAL COINS CLAIMED  " + totalCoins, stCenterSmall, PixelArt.Hex("#b49a6a"));

            if (clicked != null) StartMap(clicked);
        }

        private bool DrawRealmCard(string key, int index, float x, float y, float w, float h)
        {
            RealmRuntime r = GetRealm(key);
            if (r == null) return false;

            Rect card = new Rect(x, y, w, h);
            bool hover = new Rect(card.x, card.y - 3f, card.width, card.height + 3f).Contains(uiMouse);
            if (hover && titleHover != key)
            {
                titleHover = key;
                SetTitleBackdrop(key);
            }

            float lift = hover ? 3f : 0f;
            card.y -= lift;

            Color border = hover ? cGoldBright : cBorder;
            Color fill = hover ? PixelArt.Hex("#1b1327") : PixelArt.Hex("#171021");

            Fill(new Rect(card.x, card.y + 4f, card.width, card.height), Alpha(Color.black, 0.6f));
            Fill(new Rect(card.x - 2f, card.y - 2f, card.width + 4f, card.height + 4f), Alpha(Color.black, 0.9f));
            Fill(card, border);
            Fill(new Rect(card.x + 2f, card.y + 2f, card.width - 4f, card.height - 4f), fill);

            Rect preview = new Rect(card.x + 4f, card.y + 4f, 168f, 124f);
            Fill(preview, Alpha(Color.black, 0.8f));
            Tex(preview, r.preview, hover ? Color.white : new Color(0.82f, 0.82f, 0.9f, 1f));
            Fill(new Rect(preview.x, preview.y + preview.height, preview.width, 2f), Alpha(cBorder, 0.9f));

            Fill(new Rect(card.x + 5f, card.y + 5f, 18f, 13f), Alpha(cInk, 0.82f));
            Label(new Rect(card.x + 5f, card.y + 5f, 18f, 13f), "0" + (index + 1), stTiny, cGoldBright);

            Label(new Rect(card.x, card.y + 132f, card.width, 14f), r.data.name, stRealm, cGoldBright);
            Label(new Rect(card.x, card.y + 146f, card.width, 10f), r.data.desc, stCenterSmall, cMuted);

            int best = PlayerPrefs.GetInt("cq_best_score_" + key, 0);
            string bestText = best > 0 ? "BEST " + best + " PTS" : "UNEXPLORED";
            Label(new Rect(card.x, card.y + 158f, card.width, 10f), bestText, stCenterSmall, best > 0 ? cTeal : cGoldDim);

            return GUI.Button(card, GUIContent.none, hitStyle);
        }

        private void DrawHud()
        {
            if (realm == null) return;
            bool interactive = state == GameState.Playing;

            Panel(new Rect(10f, 10f, 184f, 28f), cBorder, Alpha(cPanel, 0.94f));
            Tex(new Rect(15f, 16f, 14f, 14f), coinSprite != null ? coinSprite.texture : null, Color.white);
            Label(new Rect(33f, 16f, 48f, 14f), collected + "/" + realm.coins.Count, stNormal, cCream);
            Fill(new Rect(84f, 17f, 1f, 12f), cBorder);
            Label(new Rect(91f, 14f, 48f, 16f), score.ToString(), stScore, cGold);
            Label(new Rect(139f, 18f, 28f, 10f), "PTS", stTiny, cGoldDim);

            int mult = Mathf.Min(combo, 5);
            if (mult > 1)
            {
                Rect comboRect = new Rect(200f, 10f, 38f, 28f);
                Panel(comboRect, cTeal, Alpha(PixelArt.Hex("#0c2224"), 0.95f));
                Label(comboRect, "x" + mult, stScore, cTeal);
            }

            Panel(new Rect(250f, 10f, 140f, 28f), cBorder, Alpha(cPanel, 0.94f));
            Label(new Rect(250f, 10f, 140f, 28f), realm.data.name, stRealm, cCream);

            Panel(new Rect(478f, 10f, 72f, 28f), cBorder, Alpha(cPanel, 0.94f));
            Label(new Rect(478f, 10f, 72f, 28f), FormatTime(elapsed), stScore, cCream);

            Rect soundRect = new Rect(556f, 10f, 38f, 28f);
            string soundText = sfx != null && sfx.Enabled ? "SFX" : "MUTE";
            if (interactive)
            {
                if (Button(soundRect, soundText, false, true, true)) ToggleSound();
            }
            else
            {
                Panel(soundRect, cBorder, Alpha(cPanel, 0.94f));
                Label(soundRect, soundText, stButtonSmall, sfx != null && sfx.Enabled ? cCream : cGoldDim);
            }

            Rect pauseRect = new Rect(600f, 10f, 30f, 28f);
            if (interactive)
            {
                if (Button(pauseRect, "II", false, true, true)) PauseGame();
            }
            else
            {
                Panel(pauseRect, cBorder, Alpha(cPanel, 0.94f));
                Label(pauseRect, "II", stButtonSmall, cMuted);
            }

            DrawMinimap();

            float tabW = 70f;
            float tabH = 26f;
            float gap = 6f;
            float totalW = tabW * 2f + 54f + gap * 2f;
            float startX = (ViewW - totalW) * 0.5f;
            float tabY = 444f;
            for (int i = 0; i < RealmOrder.Length; i++)
            {
                string key = RealmOrder[i];
                float w = key == "sea" ? 54f : tabW;
                Rect tab = new Rect(startX, tabY, w, tabH);
                bool active = key == mapKey;
                if (interactive && Button(tab, GetRealmName(key), active, true, true))
                {
                    if (key != mapKey) StartMap(key);
                }
                else if (!interactive)
                {
                    Panel(tab, active ? cGoldBright : cBorder, active ? cGold : Alpha(cPanel, 0.94f));
                    Label(tab, GetRealmName(key), stButtonSmall, active ? cInk : cMuted);
                }
                startX += w + gap;
            }
        }

        private string GetRealmName(string key)
        {
            RealmRuntime r = GetRealm(key);
            return r != null ? r.data.name : key.ToUpperInvariant();
        }

        private void DrawMinimap()
        {
            if (realm == null) return;

            Rect panel = new Rect(492f, 56f, 138f, 112f);
            Panel(panel, cBorder, Alpha(cPanel, 0.94f));
            Label(new Rect(500f, 58f, 120f, 10f), "REALM MAP", stTinyRight, cGoldDim);

            Rect img = new Rect(500f, 68f, 120f, 88f);
            Fill(img, Color.black);
            Tex(img, realm.minimap, Color.white);

            for (int i = 0; i < realm.coins.Count; i++)
            {
                CoinView c = realm.coins[i];
                if (c.collected) continue;
                float mx = Mathf.Round(c.x / Tile) * 2f;
                float my = Mathf.Round(c.y / Tile) * 2f;
                Fill(new Rect(img.x + mx - 1f, img.y + my - 1f, 2f, 2f), c.kind == "gem" ? cTeal : PixelArt.Hex("#ffd35e"));
            }

            if (player != null && state != GameState.Title)
            {
                float px = Mathf.Round(player.x / Tile) * 2f;
                float py = Mathf.Round(player.y / Tile) * 2f;
                bool blink = Mathf.FloorToInt(Time.time * 3f) % 2 == 0;
                Fill(new Rect(img.x + px - 1f, img.y + py - 1f, 3f, 3f), blink ? Color.white : cGold);
            }

            float vx = img.x + Mathf.Round((camX / Tile) * 2f);
            float vy = img.y + Mathf.Round((camY / Tile) * 2f);
            float vw = Mathf.Round((ViewW / (float)Tile) * 2f) - 1f;
            float vh = Mathf.Round((ViewH / (float)Tile) * 2f) - 1f;
            Color vc = new Color(1f, 0.92f, 0.74f, 0.35f);
            Fill(new Rect(vx, vy, vw, 1f), vc);
            Fill(new Rect(vx, vy + vh, vw, 1f), vc);
            Fill(new Rect(vx, vy, 1f, vh), vc);
            Fill(new Rect(vx + vw, vy, 1f, vh), vc);
        }

        private void DrawPauseScreen()
        {
            Tex(new Rect(0f, 0f, ViewW, ViewH), PixelArt.TitleShade, Color.white);

            Rect panel = new Rect(125f, 118f, 390f, 224f);
            Panel(panel, cGoldDim, Alpha(cPanel, 0.98f));

            Label(new Rect(panel.x, 138f, panel.width, 12f), "THE PURSE WAITS", stKicker, cGold);
            Label(new Rect(panel.x, 154f, panel.width, 30f), "PAUSED", stTitle, cGoldBright);
            Label(new Rect(panel.x, 188f, panel.width, 12f), realm != null ? realm.data.name : "", stCenterSmall, cMuted);

            if (Button(new Rect(150f, 218f, 170f, 30f), "RESUME", true, false, true))
            {
                ResumeGame();
                return;
            }
            if (Button(new Rect(330f, 218f, 170f, 30f), "RESTART REALM", false, false, true))
            {
                RestartRealm();
                return;
            }
            if (Button(new Rect(150f, 258f, 170f, 30f), "ALL REALMS", false, false, true))
            {
                ToTitle();
                return;
            }
            if (Button(new Rect(330f, 258f, 170f, 30f), "SOUND: " + (sfx != null && sfx.Enabled ? "ON" : "OFF"), false, false, true))
            {
                ToggleSound();
            }

            Label(new Rect(panel.x, 308f, panel.width, 12f), "ESC OR P TO RESUME", stCenterSmall, cMuted);
        }

        private void DrawCompleteScreen()
        {
            Tex(new Rect(0f, 0f, ViewW, ViewH), PixelArt.TitleShade, Color.white);

            Rect panel = new Rect(110f, 80f, 420f, 280f);
            Panel(panel, cGoldDim, Alpha(cPanel, 0.98f));

            RealmRuntime r = GetRealm(resultKey);
            string name = r != null ? r.data.name : resultKey.ToUpperInvariant();

            Label(new Rect(panel.x, 98f, panel.width, 12f), "ALL COINS CLAIMED", stKicker, cGold);
            Label(new Rect(panel.x, 114f, panel.width, 32f), name + " CLEARED", stTitle, cGoldBright);

            string ribbon = newBest ? "NEW BEST!" : (fastest ? "FASTEST CLEAR!" : "");
            if (!string.IsNullOrEmpty(ribbon))
            {
                Label(new Rect(panel.x, 148f, panel.width, 12f), ribbon, stCenterSmall, newBest ? cTeal : cGold);
            }

            Rect results = new Rect(140f, 168f, 360f, 102f);
            Panel(results, cBorder, Alpha(PixelArt.Hex("#100b19"), 0.96f));

            Label(new Rect(150f, 180f, 100f, 10f), "SCORE", stCenterSmall, cMuted);
            Label(new Rect(150f, 190f, 100f, 20f), resultScore.ToString(), stValue, cGoldBright);
            Label(new Rect(390f, 180f, 100f, 10f), "TIME", stCenterSmall, cMuted);
            Label(new Rect(390f, 190f, 100f, 20f), FormatTime(resultTime), stValue, cGoldBright);

            Label(new Rect(150f, 216f, 100f, 10f), "COINS", stCenterSmall, cMuted);
            int coinTotal = r != null ? r.coins.Count : 32;
            Label(new Rect(150f, 226f, 100f, 20f), resultCollected + "/" + coinTotal, stValue, cGoldBright);
            Label(new Rect(390f, 216f, 100f, 10f), "BEST", stCenterSmall, cMuted);
            Label(new Rect(390f, 226f, 100f, 20f), resultBestScore + " PTS", stValue, cGoldBright);

            Label(new Rect(results.x, 250f, results.width, 12f), "MAX COMBO  x" + resultMaxCombo, stCenterSmall, cTeal);

            if (Button(new Rect(140f, 286f, 160f, 32f), "NEXT REALM", true, false, true))
            {
                NextRealm();
                return;
            }
            if (Button(new Rect(310f, 286f, 90f, 32f), "RETRY", false, false, true))
            {
                RestartRealm();
                return;
            }
            if (Button(new Rect(410f, 286f, 100f, 32f), "REALMS", false, false, true))
            {
                ToTitle();
                return;
            }

            Label(new Rect(panel.x, 330f, panel.width, 12f), "ENTER FOR THE NEXT REALM", stCenterSmall, cMuted);
        }

        private void DrawTouchPad()
        {
            if (!Keys.TouchSupported) return;

            DpadButton(new Rect(38f, 372f, 32f, 32f), "^", ref uiUp);
            DpadButton(new Rect(4f, 406f, 32f, 32f), "<", ref uiLeft);
            DpadButton(new Rect(38f, 406f, 32f, 32f), "v", ref uiDown);
            DpadButton(new Rect(72f, 406f, 32f, 32f), ">", ref uiRight);
        }

        private void DpadButton(Rect r, string glyph, ref bool flag)
        {
            bool hover = r.Contains(uiMouse);
            Panel(r, hover ? cGoldDim : cBorder, Alpha(cPanel, 0.9f));
            Label(r, glyph, stScore, hover ? cGold : cCream);
            if (GUI.RepeatButton(r, GUIContent.none, hitStyle)) flag = true;
        }

        private string FormatTime(float t)
        {
            int secs = Mathf.FloorToInt(t);
            int m = secs / 60;
            int s = secs % 60;
            return m.ToString("00") + ":" + s.ToString("00");
        }
    }
}
