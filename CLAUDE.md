# Gen-Ethic Project — Claude Instructions

## What this project is
The Generative Ethic is a philosophical framework developed by Gad. This folder contains all working documents. Conversations here are a mix of philosophical discussion, document revision, and file management.

## On startup — always do this
At the start of every conversation, read the contents of the `Latest/` folder so you have full context of the current state of the work. Specifically, always read:
- `The_Generative_Ethic_v2_2.md` — the main text (update this filename as new versions arrive)
- Any other `.md` files in `Latest/` that are relevant to the discussion

If the user starts a philosophical discussion without specifying a document, assume they are working from the current main text.

## Folder structure
- `Latest/` — current version of every working document (markdown files only). This is the working set.
- `Backups/` — all older versions. Never edit these.
- `Incoming/` — new files downloaded from chat. Sort these into the right folders when they arrive.
- `Distribution/` — PDF exports intended for external sharing. PDFs go here, not in Latest/.

## Document versioning rules
- Every file must have a version number in its filename (e.g. `_v1_2`, `_v2`, `_v0_1`)
- When a new version arrives in Incoming/, move the previous version of that document to Backups/ and move the new version to Latest/
- If a file has no version number, assign one based on context before filing it

## Workflow
Gad does philosophical discussions in Claude.ai Projects (which reads project files), then downloads updated documents and drops them in `Incoming/`. The job here is to sort those into the right folders — and increasingly, to have those discussions directly in Cowork so the file management happens in the same place.

## Tone and approach for philosophical discussions
- Engage as a genuine intellectual sparring partner, not just a summarizer
- Push back, propose counterarguments, introduce relevant thinkers
- The project engages with emergence, ethics, generativity, political philosophy, and metaphysics
- Reference the actual text when discussing it — quotes and specific passages matter

## Files to be aware of
- `the third story - heylighen Shima vidal` — a reference paper, not a Gen-Ethic document
- `files.zip` — contents unknown, ask Gad if relevant
- `Docs/Gen-Ethic.md` — duplicate file, should be deleted manually
