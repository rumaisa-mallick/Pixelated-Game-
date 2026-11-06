using UnityEngine;

namespace CoinQuest
{
    public class Sfx : MonoBehaviour
    {
        private const int SampleRate = 44100;

        private enum Wave
        {
            Square,
            Triangle,
            Sine
        }

        private struct Note
        {
            public float freq;
            public float dur;
            public float delay;
            public float slideTo;
            public float volume;
            public Wave wave;
        }

        private AudioSource source;
        private AudioClip clipClick;
        private AudioClip clipCoin;
        private AudioClip clipGem;
        private AudioClip clipComplete;
        private AudioClip clipPauseIn;
        private AudioClip clipPauseOut;
        private bool enabled = true;
        private bool ready;

        public bool Enabled { get { return enabled; } }

        public void Init()
        {
            if (ready) return;
            ready = true;

            source = gameObject.GetComponent<AudioSource>();
            if (source == null) source = gameObject.AddComponent<AudioSource>();
            source.playOnAwake = false;
            source.loop = false;
            source.spatialBlend = 0f;
            source.volume = 0.92f;

            enabled = PlayerPrefs.GetInt("cq_sound", 1) == 1;

            clipClick = MakeClip("cq_click", NoteSquare(520f, 0.045f, 0.025f, 0f));
            clipCoin = MakeClip("cq_coin",
                NoteSquare(880f, 0.055f, 0.032f, 0f),
                NoteSquare(1320f, 0.080f, 0.026f, 0.045f));
            clipGem = MakeClip("cq_gem",
                NoteSquare(784f, 0.070f, 0.030f, 0f),
                NoteSquare(1046f, 0.070f, 0.030f, 0.055f),
                NoteSquare(1568f, 0.120f, 0.028f, 0.110f));
            clipComplete = MakeClip("cq_complete",
                NoteTri(523f, 0.16f, 0.050f, 0.00f),
                NoteTri(659f, 0.16f, 0.050f, 0.11f),
                NoteTri(784f, 0.16f, 0.050f, 0.22f),
                NoteTri(1046f, 0.16f, 0.050f, 0.33f),
                NoteTri(1318f, 0.16f, 0.050f, 0.44f),
                NoteTri(1568f, 0.40f, 0.040f, 0.55f));
            clipPauseIn = MakeClip("cq_pause_in",
                NoteSlide(392f, 0.09f, 0.035f, 294f));
            clipPauseOut = MakeClip("cq_pause_out",
                NoteSlide(523f, 0.09f, 0.035f, 784f));
        }

        public void PlayClick()
        {
            Play(clipClick);
        }

        public void PlayPickup(string kind)
        {
            Play(kind == "gem" ? clipGem : clipCoin);
        }

        public void PlayComplete()
        {
            Play(clipComplete);
        }

        public void PlayPause(bool paused)
        {
            Play(paused ? clipPauseIn : clipPauseOut);
        }

        public void SetEnabled(bool on)
        {
            enabled = on;
            if (source != null) source.Stop();
            PlayerPrefs.SetInt("cq_sound", enabled ? 1 : 0);
            PlayerPrefs.Save();
        }

        public bool Toggle()
        {
            SetEnabled(!enabled);
            if (enabled)
            {
                Init();
                PlayClick();
            }
            return enabled;
        }

        private void Play(AudioClip clip)
        {
            if (!ready) Init();
            if (!enabled || source == null || clip == null) return;
            source.PlayOneShot(clip, 1f);
        }

        private static Note NoteSquare(float freq, float dur, float volume, float delay)
        {
            Note n = new Note();
            n.freq = freq;
            n.dur = dur;
            n.volume = volume;
            n.delay = delay;
            n.wave = Wave.Square;
            return n;
        }

        private static Note NoteTri(float freq, float dur, float volume, float delay)
        {
            Note n = new Note();
            n.freq = freq;
            n.dur = dur;
            n.volume = volume;
            n.delay = delay;
            n.wave = Wave.Triangle;
            return n;
        }

        private static Note NoteSlide(float freq, float dur, float volume, float slideTo)
        {
            Note n = new Note();
            n.freq = freq;
            n.dur = dur;
            n.volume = volume;
            n.delay = 0f;
            n.slideTo = slideTo;
            n.wave = Wave.Triangle;
            return n;
        }

        private static AudioClip MakeClip(string name, params Note[] notes)
        {
            float length = 0.06f;
            for (int i = 0; i < notes.Length; i++)
            {
                length = Mathf.Max(length, notes[i].delay + notes[i].dur + 0.04f);
            }

            int samples = Mathf.CeilToInt(length * SampleRate);
            float[] data = new float[samples];
            float[] phases = new float[notes.Length];

            for (int s = 0; s < samples; s++)
            {
                float t = s / (float)SampleRate;
                float value = 0f;

                for (int i = 0; i < notes.Length; i++)
                {
                    Note n = notes[i];
                    if (t < n.delay || t > n.delay + n.dur) continue;

                    float local = t - n.delay;
                    float freq = n.freq;
                    if (n.slideTo > 0.001f)
                    {
                        float k = Mathf.Clamp01(local / Mathf.Max(0.0001f, n.dur));
                        freq = n.freq * Mathf.Pow(n.slideTo / n.freq, k);
                    }

                    phases[i] += freq / SampleRate;
                    float phase = phases[i] - Mathf.Floor(phases[i]);
                    float wave;
                    if (n.wave == Wave.Square)
                    {
                        wave = phase < 0.5f ? 1f : -1f;
                    }
                    else if (n.wave == Wave.Triangle)
                    {
                        wave = 1f - 4f * Mathf.Abs(phase - 0.5f);
                    }
                    else
                    {
                        wave = Mathf.Sin(phase * Mathf.PI * 2f);
                    }

                    float attack = 0.008f;
                    float env;
                    if (local < attack)
                    {
                        float a = Mathf.Clamp01(local / attack);
                        env = Mathf.Lerp(0.0001f, n.volume, a);
                    }
                    else
                    {
                        float k = Mathf.Clamp01((local - attack) / Mathf.Max(0.0001f, n.dur - attack));
                        env = n.volume * Mathf.Pow(0.0001f / Mathf.Max(0.0001f, n.volume), k);
                    }

                    value += wave * env;
                }

                data[s] = Mathf.Clamp(value * 0.9f, -1f, 1f);
            }

            AudioClip clip = AudioClip.Create(name, samples, 1, SampleRate, false);
            clip.SetData(data, 0);
            return clip;
        }
    }
}
