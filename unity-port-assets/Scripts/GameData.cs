using System;
using System.Collections.Generic;
using UnityEngine;

namespace CoinQuest
{
    [Serializable]
    public class Vec2
    {
        public float x;
        public float y;

        public Vec2() { }
        public Vec2(float x, float y) { this.x = x; this.y = y; }
    }

    [Serializable]
    public class CoinData
    {
        public float x;
        public float y;
        public float phase;
        public string kind;
    }

    [Serializable]
    public class MapData
    {
        public string key;
        public string name;
        public string desc;
        public string theme;
        public int w;
        public int h;
        public string[] grid;
        public string[] solid;
        public string[] slow;
        public Vec2 spawn;
        public Vec2 preferred;
        public int totalPoints;
        public CoinData[] coins;

        [NonSerialized] private HashSet<char> solidSet;
        [NonSerialized] private HashSet<char> slowSet;
        [NonSerialized] private bool prepared;

        public int PixelWidth { get { return w * CoinQuestGame.Tile; } }
        public int PixelHeight { get { return h * CoinQuestGame.Tile; } }
        public int CoinCount { get { return coins == null ? 0 : coins.Length; } }

        public void Prepare()
        {
            if (prepared) return;
            prepared = true;
            solidSet = new HashSet<char>();
            slowSet = new HashSet<char>();
            if (solid != null)
            {
                for (int i = 0; i < solid.Length; i++)
                {
                    if (!string.IsNullOrEmpty(solid[i])) solidSet.Add(solid[i][0]);
                }
            }
            if (slow != null)
            {
                for (int i = 0; i < slow.Length; i++)
                {
                    if (!string.IsNullOrEmpty(slow[i])) slowSet.Add(slow[i][0]);
                }
            }
            if (grid == null) grid = new string[0];
            if (coins == null) coins = new CoinData[0];
            if (spawn == null) spawn = new Vec2(w * CoinQuestGame.Tile * 0.5f, h * CoinQuestGame.Tile * 0.5f);
        }

        public char CharAt(int tx, int ty)
        {
            if (grid == null || ty < 0 || ty >= grid.Length) return '\0';
            string row = grid[ty];
            if (string.IsNullOrEmpty(row) || tx < 0 || tx >= row.Length) return '\0';
            return row[tx];
        }

        public bool IsSolidTile(int tx, int ty)
        {
            if (tx < 0 || ty < 0 || tx >= w || ty >= h) return true;
            return solidSet != null && solidSet.Contains(CharAt(tx, ty));
        }

        public bool IsSolidAt(float px, float py)
        {
            int tx = Mathf.FloorToInt(px / CoinQuestGame.Tile);
            int ty = Mathf.FloorToInt(py / CoinQuestGame.Tile);
            return IsSolidTile(tx, ty);
        }

        public bool IsSlowAt(float px, float py)
        {
            int tx = Mathf.FloorToInt(px / CoinQuestGame.Tile);
            int ty = Mathf.FloorToInt(py / CoinQuestGame.Tile);
            if (tx < 0 || ty < 0 || tx >= w || ty >= h) return false;
            return slowSet != null && slowSet.Contains(CharAt(tx, ty));
        }
    }

    [Serializable]
    public class MapDatabase
    {
        public MapData[] maps;
    }
}
