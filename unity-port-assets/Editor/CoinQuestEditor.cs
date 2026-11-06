using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace CoinQuest.EditorTools
{
    public static class CoinQuestEditor
    {
        private const string ScenePath = "Assets/Scenes/CoinQuest.unity";

        [InitializeOnLoadMethod]
        private static void EnsureArtImportSettings()
        {
            if (!AssetDatabase.IsValidFolder("Assets/Resources/GameArt")) return;
            string[] guids = AssetDatabase.FindAssets("t:Texture2D", new[] { "Assets/Resources/GameArt" });
            bool changed = false;

            for (int i = 0; i < guids.Length; i++)
            {
                string path = AssetDatabase.GUIDToAssetPath(guids[i]);
                TextureImporter importer = AssetImporter.GetAtPath(path) as TextureImporter;
                if (importer == null) continue;

                bool dirty = false;
                if (importer.textureType != TextureImporterType.Default) { importer.textureType = TextureImporterType.Default; dirty = true; }
                if (importer.filterMode != FilterMode.Point) { importer.filterMode = FilterMode.Point; dirty = true; }
                if (importer.textureCompression != TextureImporterCompression.Uncompressed) { importer.textureCompression = TextureImporterCompression.Uncompressed; dirty = true; }
                if (importer.mipmapEnabled) { importer.mipmapEnabled = false; dirty = true; }
                if (importer.wrapMode != TextureWrapMode.Clamp) { importer.wrapMode = TextureWrapMode.Clamp; dirty = true; }
                if (importer.npotScale != TextureImporterNPOTScale.None) { importer.npotScale = TextureImporterNPOTScale.None; dirty = true; }
                if (importer.maxTextureSize < 2048) { importer.maxTextureSize = 2048; dirty = true; }
                if (importer.alphaIsTransparency == false) { importer.alphaIsTransparency = true; dirty = true; }

                if (dirty)
                {
                    importer.SaveAndReimport();
                    changed = true;
                }
            }

            if (changed) AssetDatabase.Refresh();
        }

        [MenuItem("CoinQuest/Prepare Empty Scene")]
        public static void PrepareScene()
        {
            if (!AssetDatabase.IsValidFolder("Assets/Scenes"))
            {
                AssetDatabase.CreateFolder("Assets", "Scenes");
            }

            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            EditorSceneManager.SaveScene(scene, ScenePath);
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
        }

        [MenuItem("CoinQuest/Build Windows")]
        public static void BuildWindows()
        {
            ConfigurePlayer();
            EnsureArtImportSettings();
            PrepareScene();

            string root = Path.GetDirectoryName(Application.dataPath);
            string location = Path.Combine(root, "Builds/Windows/CoinQuest.exe");
            Directory.CreateDirectory(Path.GetDirectoryName(location));
            BuildPlayerOptions options = new BuildPlayerOptions();
            options.scenes = new[] { ScenePath };
            options.locationPathName = location;
            options.target = BuildTarget.StandaloneWindows64;
            options.options = BuildOptions.None;
            Report(options, "Windows");
        }

        [MenuItem("CoinQuest/Build WebGL")]
        public static void BuildWebGL()
        {
            ConfigurePlayer();
            EnsureArtImportSettings();
            PrepareScene();

            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled;
            string root = Path.GetDirectoryName(Application.dataPath);
            string location = Path.Combine(root, "Builds/WebGL");
            Directory.CreateDirectory(location);

            BuildPlayerOptions options = new BuildPlayerOptions();
            options.scenes = new[] { ScenePath };
            options.locationPathName = location;
            options.target = BuildTarget.WebGL;
            options.options = BuildOptions.None;
            Report(options, "WebGL");
        }

        private static void ConfigurePlayer()
        {
            PlayerSettings.productName = "Coin Quest";
            PlayerSettings.companyName = "Pixel Purse";
            PlayerSettings.defaultScreenWidth = 1280;
            PlayerSettings.defaultScreenHeight = 960;
            PlayerSettings.defaultWebScreenWidth = 1280;
            PlayerSettings.defaultWebScreenHeight = 960;
            PlayerSettings.fullScreenMode = FullScreenMode.Windowed;
            PlayerSettings.resizableWindow = true;
            PlayerSettings.runInBackground = true;
        }

        private static void Report(BuildPlayerOptions options, string label)
        {
            BuildReport report = BuildPipeline.BuildPlayer(options);
            if (report.summary.result != BuildResult.Succeeded)
            {
                throw new Exception("CoinQuest " + label + " build failed: " + report.summary.result + " (" + report.summary.totalErrors + " errors)");
            }
            Debug.Log("[CoinQuest] " + label + " build succeeded: " + report.summary.outputPath + " (" + report.summary.totalSize + " bytes)");
        }
    }
}
