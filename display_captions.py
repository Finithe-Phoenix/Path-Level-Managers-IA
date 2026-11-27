"""Keep very short one-word subtitles visible during the following pause."""
import math


MIN_SINGLE_WORD_MS = 650


def stamp(seconds):
    seconds, milliseconds = divmod(round(seconds * 1000), 1000)
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    return f"{hours:02}:{minutes:02}:{seconds:02},{milliseconds:03}"


def display_captions(scenes, fps):
    """Return new scene dictionaries and a matching SRT. The input stays unmodified.

    Cue times are relative to each scene. An extended cue keeps the original
    acoustic offset in speechEnd so the sound designer can still find silence.
    """
    displayed = []
    blocks = []
    offset_frames = 0
    for scene in scenes:
        chapter_end_ms = math.floor(scene["durationFrames"] * 1000 / fps)
        source = scene["cues"]
        cues = []
        for index, raw in enumerate(source):
            cue = dict(raw)
            start_ms = round(cue["start"] * 1000)
            end_ms = round(cue["end"] * 1000)
            if len(cue["text"].split()) == 1 and end_ms - start_ms < MIN_SINGLE_WORD_MS:
                next_ms = (round(source[index + 1]["start"] * 1000)
                           if index + 1 < len(source) else chapter_end_ms)
                new_end_ms = min(next_ms, start_ms + MIN_SINGLE_WORD_MS)
                if new_end_ms > end_ms:
                    cue.setdefault("speechEnd", cue["end"])
                    cue["end"] = new_end_ms / 1000
            offset = offset_frames / fps
            blocks.append(f"{len(blocks) + 1}\n{stamp(offset + cue['start'])} --> {stamp(offset + cue['end'])}\n{cue['text']}")
            cues.append(cue)
        displayed.append(dict(scene, cues=cues))
        offset_frames += scene["durationFrames"]
    return displayed, "\n\n".join(blocks) + "\n"
