using UnityEngine;

namespace CoinQuest
{
    public static class Bootstrap
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Boot()
        {
            CoinQuestGame existing = Object.FindFirstObjectByType<CoinQuestGame>();
            if (existing != null) return;

            GameObject root = new GameObject("CoinQuest");
            Object.DontDestroyOnLoad(root);
            root.AddComponent<CoinQuestGame>();
            if (SmokeTest.CommandLineHas("-cq-smoke"))
            {
                root.AddComponent<SmokeTest>();
            }
        }
    }
}
