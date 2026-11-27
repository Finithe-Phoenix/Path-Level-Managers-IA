"""Deterministic, CPU-only English inference for the Supertonic 3 ONNX release."""
from pathlib import Path
import json
import re
import unicodedata

import numpy as np
import onnxruntime as ort


class Narrator:
    def __init__(self, assets, preset, threads=1):
        directory = Path(assets) / "onnx"
        cfg = json.loads((directory / "tts.json").read_text())
        self.rate = cfg["ae"]["sample_rate"]
        factor = cfg["ttl"]["chunk_compress_factor"]
        self.chunk = cfg["ae"]["base_chunk_size"] * factor
        self.channels = cfg["ttl"]["latent_dim"] * factor
        self.index = json.loads((directory / "unicode_indexer.json").read_text())
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = threads
        opts.inter_op_num_threads = 1
        opts.add_session_config_entry("session.intra_op.allow_spinning", "0")
        opts.add_session_config_entry("session.inter_op.allow_spinning", "0")
        opts.log_severity_level = 3
        self.graphs = {name: ort.InferenceSession(str(directory / (name + ".onnx")), opts,
                                                  providers=["CPUExecutionProvider"])
                       for name in ("duration_predictor", "text_encoder", "vector_estimator", "vocoder")}
        self.set_voice(assets, preset)

    def set_voice(self, assets, preset):
        voice = json.loads((Path(assets) / "voice_styles" / (preset + ".json")).read_text())
        self.style = {k: np.array(v["data"], dtype=np.float32).reshape(v["dims"]) for k, v in voice.items() if k in ("style_dp", "style_ttl")}

    def synthesize(self, text, speed, steps, seed):
        text = unicodedata.normalize("NFKD", text)
        text = re.sub(r"\s+", " ", text).strip()
        tokens = np.array([[self.index[ord(char)] for char in "<en>" + text + "</en>"]], dtype=np.int64)
        mask = np.ones((1, 1, tokens.shape[1]), dtype=np.float32)
        inputs = dict(text_ids=tokens, text_mask=mask)
        duration = float(self.graphs["duration_predictor"].run(None, dict(inputs, style_dp=self.style["style_dp"]))[0].item()) / speed
        features = self.graphs["text_encoder"].run(None, dict(inputs, style_ttl=self.style["style_ttl"]))[0]
        samples = round(duration * self.rate)
        latent_frames = (samples + self.chunk - 1) // self.chunk
        rng = np.random.default_rng(seed)
        latent = rng.standard_normal((1, self.channels, latent_frames), dtype=np.float32)
        args = dict(text_emb=features, style_ttl=self.style["style_ttl"], text_mask=mask,
                    latent_mask=np.ones((1, 1, latent_frames), dtype=np.float32),
                    total_step=np.array([steps], dtype=np.float32))
        for step in range(steps):
            args.update(noisy_latent=latent, current_step=np.array([step], dtype=np.float32))
            latent = self.graphs["vector_estimator"].run(None, args)[0]
        wave = self.graphs["vocoder"].run(None, {"latent": latent})[0].reshape(-1)[:samples]
        if wave.size == 0 or not np.isfinite(wave).all():
            raise ValueError("Invalid speech waveform")
        return wave
