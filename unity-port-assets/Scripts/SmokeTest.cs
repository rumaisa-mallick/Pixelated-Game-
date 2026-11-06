using System;
using System.Collections;
using System.IO;
using System.Text;
using UnityEngine;

namespace CoinQuest
{
    public class SmokeTest : MonoBehaviour
    {
        public static bool Running { get; private set; }

        private CoinQuestGame game;
        private string shotDir;
        private readonly StringBuilder log = new StringBuilder();

        public static bool CommandLineHas(string flag)
        {
            string[] args = Environment.GetCommandLineArgs();
            for (int i = 0; i < args.Length; i++)
            {
                if (args[i] == flag) return true;
            }
            return false;
        }

        private IEnumerator Start()
        {
            Running = true;
            game = FindFirstObjectByType<CoinQuestGame>();
            shotDir = Path.GetFullPath(Path.Combine(Application.dataPath, "..", "Screenshots"));
            Directory.CreateDirectory(shotDir);
            Note("screen=" + Screen.width + "x" + Screen.height);
            Note("persistentDataPath=" + Application.persistentDataPath);

            yield return new WaitForSeconds(0.8f);
            Note("title " + game.TestSnapshot());
            yield return Capture("01_title");

            game.TestStart("castle");
            yield return new WaitForSeconds(0.55f);
            Note("castle " + game.TestSnapshot());
            yield return Capture("02_castle");

            game.TestPause();
            yield return new WaitForSeconds(0.15f);
            Note("pause " + game.TestSnapshot());
            yield return Capture("03_pause");

            game.TestResume();
            yield return new WaitForSeconds(1.1f);
            game.TestCollectAll();
            yield return new WaitForSeconds(0.65f);
            Note("castle-complete " + game.TestSnapshot());
            yield return Capture("04_castle_complete");

            game.TestStart("forest");
            yield return new WaitForSeconds(1.1f);
            Note("forest " + game.TestSnapshot());
            yield return Capture("05_forest");

            game.TestCollectAll();
            yield return new WaitForSeconds(0.65f);
            Note("forest-complete " + game.TestSnapshot());
            yield return Capture("06_forest_complete");

            game.TestStart("sea");
            yield return new WaitForSeconds(1.1f);
            Note("sea " + game.TestSnapshot());
            yield return Capture("07_sea");

            game.TestCollectAll();
            yield return new WaitForSeconds(0.65f);
            Note("sea-complete " + game.TestSnapshot());
            yield return Capture("08_sea_complete");

            game.TestToTitle();
            yield return new WaitForSeconds(0.45f);
            Note("back-to-title " + game.TestSnapshot());
            yield return Capture("09_title_again");

            string file = Path.Combine(shotDir, "smoke_results.txt");
            File.WriteAllText(file, log.ToString());
            Debug.Log("[CoinQuest] Smoke test complete: " + file);
            yield return new WaitForSeconds(0.25f);
            Running = false;
            Application.Quit();
        }

        private IEnumerator Capture(string name)
        {
            string file = Path.Combine(shotDir, name + ".png");
            ScreenCapture.CaptureScreenshot(file, 1);
            yield return new WaitForEndOfFrame();
            yield return null;
            yield return new WaitForSeconds(0.1f);
            Note("capture=" + file);
        }

        private void Note(string message)
        {
            log.AppendLine(message);
            Debug.Log("[CoinQuest] " + message);
        }
    }
}
