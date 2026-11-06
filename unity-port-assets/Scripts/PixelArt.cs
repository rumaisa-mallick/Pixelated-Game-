using UnityEngine;

namespace CoinQuest
{
    public static class PixelArt
    {
        private static Texture2D white;
        private static Texture2D vignette;
        private static Texture2D titleShade;

        public static Texture2D White
        {
            get
            {
                if (white == null)
                {
                    white = new Texture2D(1, 1, TextureFormat.RGBA32, false);
                    white.name = "cq_white";
                    white.hideFlags = HideFlags.HideAndDontSave;
                    white.filterMode = FilterMode.Point;
                    white.wrapMode = TextureWrapMode.Clamp;
                    white.SetPixel(0, 0, Color.white);
                    white.Apply();
                }
                return white;
            }
        }

        public static Texture2D Vignette
        {
            get
            {
                if (vignette == null) vignette = MakeVignette(128, 0.0f, 0.42f);
                return vignette;
            }
        }

        public static Texture2D TitleShade
        {
            get
            {
                if (titleShade == null) titleShade = MakeVignette(128, 0.52f, 0.95f);
                return titleShade;
            }
        }

        public static Texture2D MakeVignette(int size, float innerAlpha, float outerAlpha)
        {
            Texture2D tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            tex.name = "cq_vignette";
            tex.hideFlags = HideFlags.HideAndDontSave;
            tex.filterMode = FilterMode.Bilinear;
            tex.wrapMode = TextureWrapMode.Clamp;

            Color[] pixels = new Color[size * size];
            Vector2 center = new Vector2((size - 1) * 0.5f, (size - 1) * 0.5f);
            float maxDist = center.magnitude;

            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    float d = new Vector2(x - center.x, y - center.y).magnitude / maxDist;
                    float a = Mathf.Lerp(innerAlpha, outerAlpha, Mathf.SmoothStep(0f, 1f, d));
                    pixels[y * size + x] = new Color(0f, 0f, 0f, a);
                }
            }

            tex.SetPixels(pixels);
            tex.Apply();
            return tex;
        }

        public static Color Hex(string hex)
        {
            Color color;
            if (ColorUtility.TryParseHtmlString(hex, out color)) return color;
            return Color.magenta;
        }

        public static Color Hex(string hex, float alpha)
        {
            Color color = Hex(hex);
            color.a = alpha;
            return color;
        }

        public static Texture2D LoadArt(string name)
        {
            Texture2D tex = Resources.Load<Texture2D>("GameArt/" + name);
            if (tex == null)
            {
                Debug.LogError("[CoinQuest] Missing art: GameArt/" + name);
                return null;
            }
            tex.filterMode = FilterMode.Point;
            tex.wrapMode = TextureWrapMode.Clamp;
            tex.anisoLevel = 0;
            return tex;
        }

        public static Sprite MakeSprite(Texture2D tex, Rect rect, Vector2 pivot, float ppu)
        {
            return Sprite.Create(tex, rect, pivot, ppu, 0, SpriteMeshType.FullRect);
        }
    }
}
