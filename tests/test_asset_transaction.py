import sys
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from asset_transaction import replace_assets


class AssetTransactionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = Path(__file__).resolve().parents[1] / '.test-tmp'
        cls.root.mkdir(exist_ok=True)

    @classmethod
    def tearDownClass(cls):
        cls.root.rmdir()

    def test_failed_swap_restores_the_old_bundle(self):
        with tempfile.TemporaryDirectory(dir=self.root) as parent:
            out = Path(parent) / "assets"
            out.mkdir()
            (out / "original.txt").write_text("keep")
            rename = Path.rename
            def fail_stage(path, target):
                if path.name.startswith('.assets-stage-') and not path.name.endswith('-previous'):
                    raise PermissionError('locked output')
                return rename(path, target)
            with patch.object(Path, 'rename', fail_stage):
                with self.assertRaises(PermissionError):
                    replace_assets(out, lambda s: None, lambda s: None)
            self.assertEqual((out / "original.txt").read_text(), "keep")

    def test_failed_rollback_keeps_the_previous_directory_for_recovery(self):
        with tempfile.TemporaryDirectory(dir=self.root) as parent:
            out = Path(parent) / "assets"
            out.mkdir()
            (out / "original.txt").write_text("keep")
            rename = Path.rename
            def fail_after_backup(path, target):
                if path.name.startswith('.assets-stage-'):
                    raise PermissionError('directory locked')
                return rename(path, target)
            with patch.object(Path, 'rename', fail_after_backup):
                with self.assertRaises(PermissionError):
                    replace_assets(out, lambda s: None, lambda s: None)
            backup = next(Path(parent).glob('*-previous'))
            self.assertEqual((backup / "original.txt").read_text(), "keep")

    def test_failed_build_preserves_current_bundle(self):
        with tempfile.TemporaryDirectory(dir=self.root) as parent:
            out = Path(parent) / "assets"
            out.mkdir()
            (out / "original.txt").write_text("keep")
            def fail(stage):
                (stage / "original.txt").unlink()
                raise FileNotFoundError("missing source")
            with self.assertRaises(FileNotFoundError):
                replace_assets(out, fail, lambda stage: None)
            self.assertEqual((out / "original.txt").read_text(), "keep")
            self.assertEqual(list(Path(parent).iterdir()), [out])

    def test_validation_failure_preserves_current_bundle(self):
        with tempfile.TemporaryDirectory(dir=self.root) as parent:
            out = Path(parent) / "assets"
            out.mkdir()
            (out / "original.txt").write_text("keep")
            def reject(stage):
                raise ValueError("incomplete build")
            with self.assertRaises(ValueError):
                replace_assets(out, lambda stage: None, reject)
            self.assertEqual((out / "original.txt").read_text(), "keep")

    def test_success_replaces_generated_files_and_preserves_other_assets(self):
        with tempfile.TemporaryDirectory(dir=self.root) as parent:
            out = Path(parent) / "assets"
            out.mkdir()
            (out / "mage.png").write_bytes(b"original")
            replace_assets(out, lambda s: (s / "new.txt").write_text("built"), lambda s: None)
            self.assertEqual((out / "new.txt").read_text(), "built")
            self.assertEqual((out / "mage.png").read_bytes(), b"original")
            self.assertEqual(list(Path(parent).iterdir()), [out])


if __name__ == "__main__":
    unittest.main()
