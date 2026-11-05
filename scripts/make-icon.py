#!/usr/bin/env python3
"""Generate a simple Streakly app icon (PNG + ICO)."""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "build"
OUT.mkdir(parents=True, exist_ok=True)


def png_chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_png(path: Path, size: int, rgba_fn) -> None:
    raw = bytearray()
    for y in range(size):
        raw.append(0)  # filter none
        for x in range(size):
            raw.extend(rgba_fn(x, y, size))
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    data = b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", ihdr) + png_chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + png_chunk(b"IEND", b"")
    path.write_bytes(data)


def pixel(x: int, y: int, size: int) -> bytes:
    # Circular coral badge with a simple flame/streak mark
    cx = cy = (size - 1) / 2
    r = size * 0.46
    dx, dy = x - cx, y - cy
    dist = (dx * dx + dy * dy) ** 0.5
    if dist > r:
        return b"\x00\x00\x00\x00"
    # soft edge
    edge = max(0.0, min(1.0, (r - dist) * 4 / size))
    # background coral
    t = (dy / r + 1) / 2
    rcol = int(255 * (0.95 - 0.15 * t))
    gcol = int(90 + 40 * (1 - t))
    bcol = int(60 + 20 * t)
    # inner ring
    if abs(dist - r * 0.78) < size * 0.035:
        rcol, gcol, bcol = 255, 230, 210
    # flame-ish center mark (teardrop)
    nx, ny = dx / r, dy / r
    flame = (nx * nx) / 0.18 + ((ny + 0.15) ** 2) / 0.42
    if flame < 1 and ny < 0.35:
        rcol, gcol, bcol = 255, 245, 230
    a = int(255 * edge)
    return bytes((rcol, gcol, bcol, a))


def png_to_ico(png_bytes: bytes, path: Path) -> None:
    # ICO with a single PNG image (Vista+)
    # ICONDIR + ICONDIRENTRY + PNG
    count = 1
    header = struct.pack("<HHH", 0, 1, count)
    # width/height 0 means 256
    entry = struct.pack("<BBBBHHII", 0, 0, 0, 0, 1, 32, len(png_bytes), 6 + 16)
    path.write_bytes(header + entry + png_bytes)


def main() -> None:
    png_path = OUT / "icon.png"
    write_png(png_path, 256, pixel)
    ico_path = OUT / "icon.ico"
    png_to_ico(png_path.read_bytes(), ico_path)
    # also copy smaller for electron
    write_png(OUT / "icon-512.png", 512, pixel)
    print(f"Wrote {png_path} and {ico_path}")


if __name__ == "__main__":
    main()
