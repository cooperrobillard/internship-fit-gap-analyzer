# Limitations

This document explains the current limitations of the Internship Fit & Skill-Gap Analyzer.

The current version is a rule-based CLI tool with optional SQLite and pandas features. It is useful for learning and for first-pass skill-gap analysis, but it should not be treated as a perfect job-fit evaluator.

## Current approach

The analyzer uses rule-based keyword matching.

It compares:

- skills found in a resume text file,
- skills found in job description text files,
- skills listed in `skills_taxonomy.json`,
- alternate skill phrases listed in `skill_aliases.json`.

Then it reports which job skills appear to be missing from the resume.

## What the tool does well

The current version can:

- read resume and job-description text files,
- search for known skills,
- group skills by category,
- compare job skills against resume skills,
- identify missing skills,
- count recurring gaps across multiple jobs,
- generate markdown and CSV outputs,
- optionally save analysis results to a SQLite database (`--database`),
- optionally create pandas-generated summary CSV files (`--pandas-summary`),
- run basic tests.

This is useful for spotting repeated skill gaps across internship postings.

## What the tool does not do yet

The current version does not:

- understand the full meaning of a job description,
- distinguish required skills from preferred skills,
- judge whether resume evidence is strong or weak,
- detect skill level, such as beginner vs. intermediate vs. advanced,
- understand whether a project actually proves a skill,
- identify transferable experience unless the keyword appears,
- use OpenAI API or structured AI extraction,
- generate resume bullets or application materials,
- provide a web UI or dashboard.

Optional SQLite and pandas features store and summarize results locally. They do not add semantic understanding of job descriptions or resume evidence.

## Keyword matching limitations

Because the analyzer uses keyword matching, it can miss skills when the wording is different.

For example, if the taxonomy contains:

```text
rest api
```

but a job description says:

```text
API development
```

the tool may not count that as the same skill unless an alias is added.

The alias file helps, but it is still manual and incomplete.

### False positives

The tool can also find skills that are not actually strong evidence.

For example, if a resume mentions a skill only once, the analyzer may count it as present even if the experience is limited.

This means the report answers:

```text
Does this word or phrase appear?
```

It does not fully answer:

```text
Can the person confidently use this skill?
```

### False negatives

The tool can also miss real skills.

For example, the resume might show data-analysis experience without using the exact word pandas.

In that case, the analyzer may mark pandas as a gap even if the person has related experience.

## Privacy considerations

Private resumes and real job descriptions may contain personal or sensitive information.

For public GitHub use:

- use `data/resume/sample_resume.txt` and `data/sample_jobs/` for sample inputs,
- put private files in `data/resume/resume.txt` and `data/jobs/` (ignored by Git),
- keep generated outputs out of Git if they are based on private data.

The `.gitignore` file helps avoid tracking private local files, generated outputs, and SQLite database files.

## How to interpret the output

The output should be treated as a first-pass guide.

The report is useful for asking:

- Which skills keep appearing across jobs?
- Which tools should I learn next?
- Which gaps might be worth building projects around?
- Which areas should I describe more clearly on my resume?

The report should not be treated as a final hiring judgment or a complete resume review.

## Current best use

The best current use of this tool is:

1. Add several internship job descriptions.
2. Run the analyzer.
3. Review recurring gaps.
4. Decide which skills are worth learning or documenting better.
5. Use the results to guide future projects and resume updates.

## Future improvements

Possible future improvements include:

- better matching logic,
- required vs. preferred skill detection,
- stronger tests,
- OpenAI API structured extraction,
- confidence notes,
- evidence mapping from resume projects to job requirements,
- a private web UI for uploading job descriptions and tracking runs over time,
- responsible AI evaluation examples.

## Bottom line

This tool is useful, but it is not magic.

It helps organize job-skill patterns, but a human still needs to review the results, interpret the context, and decide what action to take.
