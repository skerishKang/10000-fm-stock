# Research Workspace

This folder contains templates and lightweight working documents for turning public source references into structured FM-Stock data.

The workspace is not a place to store original report PDFs, copied full report text, video files, or full raw transcripts.

## Operating rule

```text
local originals -> outside repo
workspace templates/notes -> repo
approved structured data -> data/*.json
```

## Recommended local originals folder

Keep downloaded reports and raw transcripts outside this repository, but under the same working root for local convenience.

Recommended Windows/WSL layout:

```text
/mnt/g/Ddrive/BatangD/task/workdiary/
├── 10000-fm-stock/
└── 10000-fm-stock-local-sources/
    ├── reports/
    │   └── 2026/
    │       └── 05/
    ├── expert-sources/
    │   └── transcripts/
    └── analysis/
```

Equivalent Windows paths:

```text
G:\Ddrive\BatangD\task\workdiary\10000-fm-stock\
G:\Ddrive\BatangD\task\workdiary\10000-fm-stock-local-sources\
```

Do not place `10000-fm-stock-local-sources/` inside the Git repository. It should be a sibling folder of `10000-fm-stock/`.

## Folder roles

- `experts/`: non-analyst experts, YouTube channels/videos, public broadcasts, blog/interview sources.
- `analysts/`: brokerage analysts, research firms, report links, report analysis notes.
- `market-sources/`: report aggregators, news sites, public broadcast/article source lists.
- `prompts/`: reusable extraction and normalization prompts.
- `exports/`: intermediate JSON outputs before promotion into `data/*.json`.

## Promotion flow

```text
source reference
-> candidate source
-> human review
-> claim/knowledge note candidate
-> approved structured JSON
-> evaluation after target horizon
```

Do not commit original PDF/report/video content. Store only references, short notes, extracted candidates, and structured outputs.
