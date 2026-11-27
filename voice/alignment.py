"""Align caption boundaries to actual speech with a local English CTC acoustic model."""
import json
from pathlib import Path
import re

import numpy as np
import onnxruntime as ort


class CaptionAligner:
    def __init__(self, assets):
        assets = Path(assets) / "align"
        self.vocab = json.loads((assets / "vocab.json").read_text())
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 1
        opts.inter_op_num_threads = 1
        opts.add_session_config_entry("session.intra_op.allow_spinning", "0")
        opts.log_severity_level = 3
        self.model = ort.InferenceSession(str(assets / "model.onnx"), opts, providers=["CPUExecutionProvider"])

    def logits(self, wave, rate):
        signal = np.interp(np.arange(round(len(wave) * 16000 / rate)) * rate / 16000,
                           np.arange(len(wave)), wave).astype(np.float32)
        signal = (signal - signal.mean()) / np.sqrt(signal.var() + 1e-7)
        return self.model.run(None, {"input_values": signal[None, :]})[0][0]

    def align(self, wave, rate, spoken_pages):
        """Viterbi through blank/interleaved letters. Page times come from aligned acoustic frames."""
        chars = [re.sub(r"[^A-Z'|]", "", re.sub(r"[^A-Z']+", "|", p.upper())).strip("|") for p in spoken_pages]
        transcript = "|".join(chars)
        if not transcript or any(not page for page in chars):
            raise ValueError(f"Unable to form an English alignment transcript: {spoken_pages!r}")
        target = np.zeros(2 * len(transcript) + 1, dtype=np.int32)
        target[1::2] = [self.vocab[char] for char in transcript]
        logits = self.logits(wave, rate)
        # Per-frame normalizing constants cancel in comparisons among equal-length paths.
        states = np.full(len(target), -np.inf, dtype=np.float32)
        states[0] = logits[0, target[0]]
        states[1] = logits[0, target[1]]
        back = np.zeros((len(logits), len(target)), dtype=np.int8)
        skippable = (target != 0) & (target != np.roll(target, 2))
        for frame in range(1, len(logits)):
            advance = np.roll(states, 1); advance[0] = -np.inf
            skip = np.roll(states, 2); skip[:2] = -np.inf
            skip[~skippable] = -np.inf
            moves = np.stack((states, advance, skip))
            back[frame] = moves.argmax(axis=0)
            states = moves.max(axis=0) + logits[frame, target]
        position = len(target) - (1 if states[-1] >= states[-2] else 2)
        if not np.isfinite(states[position]):
            raise ValueError(f"Audio too short to align transcript: {spoken_pages!r}")
        path = np.zeros(len(logits), dtype=np.int32)
        for frame in range(len(logits) - 1, -1, -1):
            path[frame] = position
            position -= int(back[frame, position])
        delta = len(wave) / rate / len(path)
        bounds, start = [], 0
        for page in chars:
            stop = start + len(page) - 1
            left = int(np.searchsorted(path, 2 * start + 1))
            right = int(np.searchsorted(path, 2 * stop + 1, side="right"))
            bounds.append((max(0.0, left * delta - .045), min(len(wave) / rate, right * delta + .065)))
            start = stop + 2
        for i in range(1, len(bounds)):
            if bounds[i-1][1] > bounds[i][0]:
                edge = (bounds[i-1][1] + bounds[i][0]) / 2
                bounds[i-1] = (bounds[i-1][0], edge)
                bounds[i] = (edge, bounds[i][1])
        return bounds
