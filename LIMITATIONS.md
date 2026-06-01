# Limitations

This project is a pure-Python Version 1 MVP. It is designed to compare a resume against internship or co-op job descriptions using rule-based skill matching.

## What the tool does well

* Reads a resume from a text file.
* Reads multiple job descriptions from a folder.
* Loads a skills taxonomy from JSON.
* Loads skill aliases from JSON.
* Finds skills using keyword and alias matching.
* Compares job skills against resume skills.
* Identifies missing skills for each job.
* Counts recurring gaps across multiple jobs.
* Writes markdown and CSV outputs.
* Supports command-line options for custom input and output paths.
* Includes basic tests for core logic, output writing, CLI behavior, and validation.

## Current limitations

The tool does not truly understand job descriptions. It uses rule-based text matching, so it may miss skills that are described indirectly or match skills that appear in a misleading context.

The tool does not currently distinguish between required skills and preferred skills.

The tool does not evaluate how strong the resume evidence is for a skill. It only checks whether the skill appears in the resume text.

The tool does not currently rank gaps by importance beyond counting how often they appear across job descriptions.

The tool does not know whether a skill is beginner, intermediate, or advanced.

The tool does not store results in a database.

The tool does not use pandas, SQLite, OpenAI API, Streamlit, FastAPI, Docker, or RAG.

## Why these limitations are acceptable for Version 1

Version 1 is meant to prove the basic workflow before adding more advanced tools.

The current version creates a working foundation:

1. Load project inputs.
2. Extract skill matches.
3. Compare resume skills to job skills.
4. Identify gaps.
5. Summarize recurring gaps.
6. Write useful output files.
7. Test the behavior.

Future versions can build on this foundation without replacing the entire project.

## Possible Version 2 improvements

Version 2 may add pandas and SQLite to support stronger data analysis, including:

* storing job analysis results in a database,
* querying recurring gaps with SQL,
* summarizing results with pandas,
* creating cleaner tables,
* tracking analysis history across runs,
* making the project stronger as data-analysis portfolio evidence.

Later versions may explore more advanced features, but only after the core Python, pandas, and SQLite workflow is stable and understandable.
