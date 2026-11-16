"""Extract static PE sections and resources locally; never execute the input."""
import argparse
import hashlib
import json
import pathlib
import struct


def digest(data):
    return hashlib.sha256(data).hexdigest()


def extract(source, resource_report, destination):
    data = source.read_bytes()
    if len(data) > 64 * 1024 * 1024:
        raise ValueError("Input exceeds 64 MiB")

    def region(offset, size):
        if offset < 0 or size < 0 or offset + size > len(data):
            raise ValueError("Range outside input")
        return data[offset:offset + size]

    def number(fmt, offset):
        return struct.unpack(fmt, region(offset, struct.calcsize(fmt)))[0]

    if region(0, 2) != b"MZ":
        raise ValueError("Expected MZ")
    pe = number("<I", 60)
    if region(pe, 4) != b"PE\0\0":
        raise ValueError("Expected PE signature")
    count = number("<H", pe + 6)
    optional_size = number("<H", pe + 20)
    if count > 96:
        raise ValueError("Section limit exceeded")
    section_table = pe + 24 + optional_size
    report = json.loads(resource_report.read_text())
    if report["subject"]["sha256"] != digest(data):
        raise ValueError("Resource report belongs to another input")
    pending = []
    sections = []
    for index in range(count):
        header = region(section_table + index * 40, 40)
        name = header[:8].split(b"\0")[0].decode("ascii", errors="replace")
        size, offset = struct.unpack_from("<II", header, 16)
        item = {"index": index, "name": name, "offset": offset, "bytes": size}
        sections.append(item)
        if size:
            pending.append((f"section-{index:03}.bin", item, region(offset, size)))
    resources = report["result"]["entries"]
    if len(resources) > 16384 or report["result"]["truncated"]:
        raise ValueError("Resource inventory incomplete or too large")
    for index, entry in enumerate(resources):
        content = region(entry["file_offset"], entry["size"])
        if digest(content) != entry["sha256"]:
            raise ValueError("Resource digest mismatch")
        pending.append((f"resource-{index:04}.bin", {
            "index": index, "type": entry["type"], "name": entry["name"],
            "language": entry["language"], "offset": entry["file_offset"],
            "bytes": entry["size"],
        }, content))
    # Partition every input byte, including headers, padding and certificates.
    # Sorted boundaries make coverage independent of overlapping PE sections.
    boundaries = {0, len(data)}
    for section in sections:
        boundaries.update([section["offset"], section["offset"] + section["bytes"]])
    points = sorted(boundaries)
    partitions = []
    for index, (start, end) in enumerate(zip(points, points[1:])):
        item = {"offset": start, "bytes": end - start}
        name = f"region-{index:03}.bin"
        content = region(start, end - start)
        partitions.append({"file": name, **item, "sha256": digest(content)})
        pending.append((name, item, content))
    destination.mkdir(parents=False, exist_ok=False)
    artifacts = []
    for name, item, content in pending:
        (destination / name).write_bytes(content)
        artifacts.append({"file": name, **item, "sha256": digest(content)})
    manifest = {
        "schema_version": 1, "input_sha256": digest(data), "input_bytes": len(data),
        "sections": sections, "resource_count": len(resources),
        "partitions": partitions, "artifacts": artifacts,
        "limitations": [
            "Byte coverage does not establish semantic understanding.",
            "No decompression, installed components or runtime behavior examined.",
            "Extracted proprietary bytes are local analysis artifacts.",
        ],
    }
    (destination / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=pathlib.Path)
    parser.add_argument("resource_report", type=pathlib.Path)
    parser.add_argument("destination", type=pathlib.Path)
    args = parser.parse_args()
    result = extract(args.source, args.resource_report, args.destination)
    print(json.dumps({"sections": len(result["sections"]),
                      "resources": result["resource_count"],
                      "input_bytes": result["input_bytes"]}))
