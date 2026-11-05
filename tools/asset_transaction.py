"""Build generated assets beside the current bundle, replacing it only on success."""
import shutil
import tempfile
from pathlib import Path


def replace_assets(output, build, validate):
    output = Path(output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix=".assets-stage-", dir=output.parent)).resolve()
    backup = stage.with_name(stage.name + "-previous")
    # Every recursive operation below stays under the explicitly selected output parent.
    if stage.parent != output.parent or backup.parent != output.parent:
        raise ValueError("Unsafe asset staging paths")
    moved_previous = False
    committed = False
    try:
        if output.exists():
            shutil.copytree(output, stage, dirs_exist_ok=True)
        build(stage)
        validate(stage)
        if output.exists():
            output.rename(backup)
            moved_previous = True
        try:
            stage.rename(output)
            committed = True
        except BaseException:
            if moved_previous:
                backup.rename(output)
                moved_previous = False
            raise
    finally:
        if stage.exists():
            shutil.rmtree(stage)
        # If restoring the previous directory also fails, keep that backup for recovery.
        if committed and moved_previous and backup.exists():
            shutil.rmtree(backup)
