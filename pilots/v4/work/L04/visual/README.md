# The pilot decision workshop

The 1920 × 1080 film opens inside a fictional review meeting. The learner counts two cohorts, follows the clock on one request, compares the two middle observations, works through a quality threshold and opens the patch behind a proposed adjustment. A separate 50-request exercise asks for two numbers and the evidence behind a recommendation.

## Recalculate the scorecard

Run from this directory. Python 3 uses only its standard library.

```bash
python3 evidence/calculate.py --check
```

[Open the editable spreadsheet](evidence/pilot-ledger.xlsx) in LibreOffice Calc or Excel. Its Requests tab contains the 80 individual observations. The Spend tab totals the costs, counts eligible pilot requests and calculates headroom and cost per request. [make_workbook.py](evidence/make_workbook.py) regenerates it with openpyxl.

The film also opens a real Python interpreter in Xfce Terminal. Run the same calculations from `evidence/`.

```bash
python3 -q -i ledger_cli.py
```

```python
sum(amounts)
cap - sum(amounts)
sum(amounts) / eligible
```

The returned values are 240, 60 and 6.0. Five original window captures are versioned in `assets/ledger-*.png`. [capture_ledger.py](qa/capture_ledger.py) recreates them by sending the commands to a live Bash and Python pseudoterminal on a dedicated X11 screen. The capture requires Xfce Terminal, xwininfo and ImageMagick.

The 80 individually identified pull requests are in [pull_requests.csv](evidence/pull_requests.csv). Each row carries its cohort, eligibility, follow-up, business-hour wait, active review minutes, material rework, defect and incident fields. [spend.csv](evidence/spend.csv) contains the three incremental expense items. [case.json](evidence/case.json) holds the agreement, calendar events, example scope review and separate transfer exercise. The example patch is an actual text fixture in [P020.diff](evidence/P020.diff). All rows, review notes and file changes were invented for teaching. No employee or repository activity was collected.

To change the training case, edit the CSVs and the case definition, update the expected values in [calculate.py](evidence/calculate.py) and run it without `--check` to refresh [scorecard.json](evidence/scorecard.json). The original generator is [make_fixture.py](evidence/make_fixture.py). Running it regenerates the starting CSVs, so keep your edits in Git first.

| Check | Baseline | Pilot | Decision rule |
| --- | ---: | ---: | --- |
| Eligible requests | 40 | 40 | Same service, eligibility and follow-up |
| Median wait to first substantive human review | 18 business hours | 13 business hours | At most 14 hours |
| Median active human review | 24 minutes | 26 minutes | At most 27 minutes |
| Material rework | 6/40, 15% | 7/40, 17.5% | At most 15% |
| Defects within follow-up | 1/40 | 1/40 | Inspect counts with their denominators |
| Serious incidents | 0 | 0 | A serious incident triggers a pause |
| Incremental pilot spend | — | $240, $6 per eligible request | At most $300 |

Four of the seven pilot rework reasons mention files outside the ticket. The worked example asks authors to declare their intended files and compare the final diff with that scope. A fresh hypothetical cohort contains eight cases among 50 requests. Seven is the largest whole count that meets a 15% limit. The new cohort has its own review reasons to investigate.

## Edit the scene

[scene.cjs](scene.cjs) exports `frame({scene, progress, seconds, index, episode})`. Use `progress` between zero and one and `seconds` relative to the start of the scene. The production timeline supplies local word-group captions and beat times so the two percentages and the retest decision appear with the English narration. During the independent exercise the solution stays hidden until the debrief. The encoder, Remotion and HyperFrames share this renderer.

| Scene ID | What the viewer can inspect |
| --- | --- |
| question | The review room, two 40-request samples and the pre-agreed gates |
| wait | Request P020, bot and human events, two ranked distributions and the middle observations |
| effort | A review-minute instrument plus the wait and effort entries side by side |
| quality | Repeated comments on one request, the 40-request populations and two defect counts |
| cost | The three-line ledger, live terminal calculation, $60 in headroom and the per-request calculation |
| decision | The synthetic patch, four out-of-scope IDs and a recorded adjustment |
| transfer | A new cohort, eight marked cases, the ceiling and an answer pause |
| debrief | Seven and eight cases on the same scale, then the evidence needed for the next decision |

The original generated photographic plates and the embedded JPEG versions are in [assets](assets/). The illustrations depict fictional participants. The module reads the JPEGs locally and embeds the images into its SVG. For a plate edit, export a standard RGB JPEG and retain the matching versioned PNG. Typography uses Open Sans, Liberation Serif and DejaVu Sans Mono.

For a 23-frame storyboard, install the studio dependencies, set `SHARP_MODULE` to the installed `sharp` module if your environment needs it, then run the following. You may pass the final timed episode JSON instead of the editorial lesson to inspect narration-driven edits.

```bash
node qa/frames.cjs ../lesson.json /tmp/l04-proof
```

The script rasterizes at the final picture dimensions, rejects invalid numeric geometry and produces a contact sheet. [The storyboard contact sheet](qa/contact-sheet.jpg) and [the opening frame](qa/opening.jpg) are included for reference. To review the exercise hold, play the finished English narration through the transition from `transfer` to `debrief`.

The final synchronized QA used the recorded 24 fps [narration timing](../audio/episode.json). [narration-sync.json](qa/narration-sync.json) records the 2.5-second division hold, 6-second independent exercise and the real terminal state changes. The [typed input](qa/terminal-formula.jpg) appears before [the calculated output](qa/terminal-ledger.jpg). [bounds.json](qa/bounds.json) records the browser framing check and [workbook.json](qa/workbook.json) records the independent Calc result.

```bash
node qa/sync.cjs ../audio/episode.json /tmp/l04-sync.json
```
