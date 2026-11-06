using UnityEngine;

#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace CoinQuest
{
    public static class Keys
    {
#if ENABLE_INPUT_SYSTEM
        private static Keyboard Kb { get { return Keyboard.current; } }

        public static bool Up { get { return Kb != null && (Kb.wKey.isPressed || Kb.upArrowKey.isPressed); } }
        public static bool Down { get { return Kb != null && (Kb.sKey.isPressed || Kb.downArrowKey.isPressed); } }
        public static bool Left { get { return Kb != null && (Kb.aKey.isPressed || Kb.leftArrowKey.isPressed); } }
        public static bool Right { get { return Kb != null && (Kb.dKey.isPressed || Kb.rightArrowKey.isPressed); } }
        public static bool Sprint { get { return Kb != null && (Kb.leftShiftKey.isPressed || Kb.rightShiftKey.isPressed); } }
        public static bool PauseDown { get { return Kb != null && (Kb.escapeKey.wasPressedThisFrame || Kb.pKey.wasPressedThisFrame); } }
        public static bool MuteDown { get { return Kb != null && Kb.mKey.wasPressedThisFrame; } }
        public static bool EnterDown { get { return Kb != null && (Kb.enterKey.wasPressedThisFrame || Kb.numpadEnterKey.wasPressedThisFrame); } }
        public static bool TouchSupported { get { return Touchscreen.current != null; } }
        public static Vector2 MousePosition
        {
            get
            {
                if (Mouse.current == null) return Vector2.zero;
                return Mouse.current.position.ReadValue();
            }
        }
#else
        public static bool Up { get { return Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow); } }
        public static bool Down { get { return Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow); } }
        public static bool Left { get { return Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow); } }
        public static bool Right { get { return Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow); } }
        public static bool Sprint { get { return Input.GetKey(KeyCode.LeftShift) || Input.GetKey(KeyCode.RightShift); } }
        public static bool PauseDown { get { return Input.GetKeyDown(KeyCode.Escape) || Input.GetKeyDown(KeyCode.P); } }
        public static bool MuteDown { get { return Input.GetKeyDown(KeyCode.M); } }
        public static bool EnterDown { get { return Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.KeypadEnter); } }
        public static bool TouchSupported { get { return Input.touchSupported; } }
        public static Vector2 MousePosition { get { return Input.mousePosition; } }
#endif
    }
}
