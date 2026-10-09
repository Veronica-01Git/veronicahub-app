import unittest
from unittest import mock

import worker


class DrainTest(unittest.TestCase):
    def run_drain(self, jobs, outcomes, max_jobs=10):
        queue = list(jobs)
        def call(action, data):
            self.assertEqual(action, "claim")
            return {"ok": True, "job": queue.pop(0) if queue else None}
        with mock.patch.object(worker, "hub_client", return_value=call), \
             mock.patch.object(worker, "storage_client", return_value=(object(), "bucket")), \
             mock.patch.object(worker, "process", side_effect=outcomes) as process:
            return worker.drain(max_jobs), process

    def test_counts_completed_and_failed_jobs_until_queue_is_empty(self):
        summary, process = self.run_drain([{"id": "a"}, {"id": "b"}], [True, False])
        self.assertEqual(summary, {"completed": 1, "failed": 1})
        self.assertEqual(process.call_count, 2)

    def test_empty_queue_claims_nothing_else(self):
        summary, process = self.run_drain([], [])
        self.assertEqual(summary, {"completed": 0, "failed": 0})
        process.assert_not_called()

    def test_one_run_is_bounded(self):
        summary, process = self.run_drain([{"id": str(i)} for i in range(5)], [True] * 5, max_jobs=2)
        self.assertEqual(summary, {"completed": 2, "failed": 0})


class SafeLogTest(unittest.TestCase):
    def test_public_log_masks_ids_that_form_media_urls(self):
        error = RuntimeError("Failed to upload /tmp/x/0.mp4 to veronicahub-shorts/shorts/"
                             "1893d896-248d-4d71-8d6d-dc6619ac63d6/9AA2D964-8A64-46FE-9B65-C51E6764A94B/0.mp4")
        text = worker.safe(error)
        self.assertNotRegex(text, r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}")
        self.assertIn("shorts/<id>/<id>/0.mp4", text)
        self.assertTrue(text.startswith("RuntimeError"))
        self.assertLessEqual(len(worker.safe(RuntimeError("x" * 1000))), 300)


if __name__ == "__main__":
    unittest.main()
