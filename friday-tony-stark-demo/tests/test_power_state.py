from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from friday.app.power import PowerIntent, detect_power_intent, handle_power_message, initialize_power_state


class PowerStateTests(unittest.TestCase):
    def test_power_intents_are_exact(self) -> None:
        self.assertEqual(detect_power_intent("FRIDAY sleep!"), PowerIntent.SLEEP)
        self.assertEqual(detect_power_intent("Friday wake up"), PowerIntent.WAKE)
        self.assertEqual(detect_power_intent("Friday wakeup"), PowerIntent.WAKE)
        self.assertEqual(detect_power_intent("tell me about sleep"), PowerIntent.NONE)

    def test_sleep_blocks_work_until_wake(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            state_path = str(Path(directory) / "power-state.json")
            env = {
                "FRIDAY_POWER_STATE_PATH": state_path,
                "FRIDAY_INITIAL_STATE": "active",
            }
            with patch.dict(os.environ, env, clear=False):
                initialize_power_state(source="test")
                sleeping = handle_power_message("friday sleep", source="test")
                blocked = handle_power_message("open youtube", source="test")
                silent = handle_power_message(
                    "background speech",
                    source="microphone",
                    silent_when_sleeping=True,
                )
                awake = handle_power_message("friday wake up", source="test")

            self.assertTrue(sleeping.snapshot.sleeping)
            self.assertTrue(blocked.handled)
            self.assertTrue(silent.handled)
            self.assertEqual(silent.reply, "")
            self.assertEqual(awake.snapshot.state, "active")


if __name__ == "__main__":
    unittest.main()
