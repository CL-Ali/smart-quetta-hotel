# 032 Phase 0 Analysis Prompt

## Purpose

Use this prompt before any coding starts.

The next AI pass must analyze the existing project and produce a clear implementation-ready assessment without modifying any code.

## Prompt

Read all files under `specs/`.

Understand the architecture before writing any code.

Do not modify any code yet.

Your task is only to analyze the project and produce:

1. Current architecture summary
2. Existing reusable modules
3. Missing pieces
4. Risks
5. Suggested execution plan

Do not implement anything.

This task is analysis only.

## Expected Output Shape

- Short summary of current architecture
- List of reusable modules and why they matter
- List of missing pieces or gaps
- Key risks, including migration and compatibility risks
- A concrete execution plan for the next coding phases

## Constraints

- Do not edit source files.
- Do not propose a rewrite-first strategy.
- Keep the existing frontend, tRPC, and SQLite stack in scope.
- Favor incremental migration over large-bang replacement.
