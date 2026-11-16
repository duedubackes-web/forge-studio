"""Verify Qubes ZIP extraction by two tools and inventory Python syntax offline.

Usage: python scripts/verify-qubes-sources.py WORK_DIRECTORY OUTPUT_JSON
WORK_DIRECTORY contains archives.json, ZIP files and the saved tool responses.
This script never imports or executes Qubes code.
"""
import ast
import hashlib
import json
import pathlib
import stat
import sys
import zipfile


def sha(data):
    return hashlib.sha256(data).hexdigest()


def verify(work):
    sources = json.loads((work / "archives.json").read_text())
    result = []
    for source in sources:
        name = source["repo"]
        archive = work / (name + ".zip")
        assert archive.stat().st_size <= 30_000_000
        assert sha(archive.read_bytes()) == source["sha256"]
        rea_name = "rea-admin-extract.json" if name == "qubes-core-admin" else f"rea-{name}-extract.json"
        rea = json.loads((work / rea_name).read_text())["normalized_result"]
        craft = json.loads((work / f"craft-{name}-extract.json").read_text())["result"]
        imported = json.loads((work / f"craft-{name}-source.json").read_text())
        roots = [pathlib.Path(rea["output_root"]), pathlib.Path(craft["output_directory"])]
        skipped = {s["path"]: s["reason"] for s in craft["skipped"]}
        craft_verified = 0
        files, links, python = [], [], []
        with zipfile.ZipFile(archive) as z:
            assert len(z.infolist()) <= 5000
            assert sum(i.file_size for i in z.infolist()) <= 50_000_000
            for entry in z.infolist():
                path = pathlib.PurePosixPath(entry.filename)
                assert not path.is_absolute() and ".." not in path.parts
                if entry.is_dir():
                    continue
                data = z.read(entry)  # zipfile also checks the CRC
                if stat.S_ISLNK(entry.external_attr >> 16):
                    links.append({"path": entry.filename, "target": data.decode(), "sha256": sha(data)})
                    continue
                for index, root in enumerate(roots):
                    if index == 1 and entry.filename in skipped:
                        assert not (root / entry.filename).exists()
                        continue
                    extracted = root / entry.filename
                    assert not extracted.is_symlink()
                    assert extracted.resolve().is_relative_to(root.resolve())
                    assert extracted.read_bytes() == data
                    if index == 1:
                        craft_verified += 1
                files.append({"path": entry.filename, "bytes": len(data), "sha256": sha(data)})
                if path.suffix == ".py":
                    try:
                        tree = ast.parse(data, filename=entry.filename)
                        nodes = list(ast.walk(tree))
                        python.append({"path": entry.filename, "status": "parsed",
                            "functions": sum(isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)) for n in nodes),
                            "classes": sum(isinstance(n, ast.ClassDef) for n in nodes),
                            "imports": sum(isinstance(n, (ast.Import, ast.ImportFrom)) for n in nodes)})
                    except (SyntaxError, ValueError) as error:
                        python.append({"path": entry.filename, "status": "failed", "error": type(error).__name__})
        assert len(files) == len(rea["artifacts"])
        assert craft_verified == craft["files_written"]
        assert rea["coverage"]["status"] == "complete"
        result.append({"source": source, "files": files, "symlinks_not_materialized": links,
            "verification": {"regular_files": len(files), "bytes": sum(f["bytes"] for f in files),
                "rea_verified_files": len(files), "craft_verified_files": craft_verified,
                "craft_skipped": craft["skipped"],
                "rea_matches_archive": True, "craft_materialized_files_match_archive": True},
            "python_syntax": python,
            "craft_source_import": {"coverage": imported["coverage"],
                "ignored": imported["result"]["ignored"], "truncated": imported["result"]["truncated"],
                "languages": imported["result"]["languages"]},
            "tool_evidence": [{"file": n, "sha256": sha((work / n).read_bytes())}
                for n in [rea_name, f"craft-{name}-extract.json", f"craft-{name}-source.json"]]})
    return {"schema_version": 1, "repositories": result,
        "limitations": ["Only three selected source archives; not the Qubes distribution.",
            "AST counts include tests and do not prove runtime behavior or security.",
            "Symlink targets are inventoried, not materialized.",
            "Source import does not reconstruct Python or C semantics."]}


if __name__ == "__main__":
    output = verify(pathlib.Path(sys.argv[1]))
    pathlib.Path(sys.argv[2]).write_text(json.dumps(output, indent=2) + "\n")
    print(json.dumps({r["source"]["repo"]: r["verification"] for r in output["repositories"]}))
