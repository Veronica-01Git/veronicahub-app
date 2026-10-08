import tempfile
import unittest
from pathlib import Path
from engine import candidates, timestamp, write_subtitles


class EngineTests(unittest.TestCase):
    def test_candidates_are_non_overlapping_and_cover_later_speech(self):
        segments = [{"start": i*6, "end": (i+1)*6, "text": "Como entender essa ideia e aplicar ao projeto."} for i in range(50)]
        result = candidates(segments)
        self.assertGreater(len(result), 1)
        self.assertTrue(any(c["start"] >= 60 for c in result))
        for left, right in zip(result, result[1:]):
            self.assertLessEqual(left["end"], right["start"])
        self.assertTrue(all(20 <= c["end"]-c["start"] <= 60 for c in result))

    def test_short_or_silent_source_does_not_invent_a_clip(self):
        self.assertEqual(candidates([]), [])
        self.assertEqual(candidates([{"start":0,"end":4,"text":"Breve."}]), [])

    def test_subtitles_are_relative_clamped_and_plain_text(self):
        with tempfile.TemporaryDirectory() as folder:
            target = Path(folder)/"test.srt"
            write_subtitles([{"start":9,"end":11,"word":"{\\an8}Olá"},
                             {"start":11,"end":12,"word":"mundo!"},
                             {"start":40,"end":41,"word":"fora"}],10,30,target)
            text = target.read_text()
            self.assertIn("00:00:00,000 --> 00:00:02,000", text)
            self.assertNotIn("fora", text)
            self.assertNotIn("\\", text)
            self.assertEqual(timestamp(3661.25),"01:01:01,250")


if __name__ == "__main__":
    unittest.main()
