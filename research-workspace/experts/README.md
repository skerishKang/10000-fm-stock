# Experts Workspace

Use this folder for non-analyst experts and public speakers.

Examples:

- YouTube channels
- individual YouTube videos
- broadcast appearances
- interviews
- blog posts
- public article references

## Manual input files

- `expert-index.template.csv`: people/speaker index.
- `channels.template.csv`: channel/platform URLs.
- `videos.template.csv`: individual video candidates.
- `video-notes/`: manually written analysis notes for selected video segments.

## Rule

YouTube is a source path, not the top-level identity. The top-level entity is the expert/speaker.

```text
expert -> channel/platform -> video/article/broadcast -> analysis note -> claim candidate
```
