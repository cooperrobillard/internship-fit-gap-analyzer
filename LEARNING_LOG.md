# Learning Log

This file tracks what I am building, what I am learning, where AI helped, and what I still need to understand better.

The goal of this project is not just to create a finished repo. The goal is to improve my actual understanding of Python, file handling, data structures, and eventually tools like pandas, SQLite, APIs, testing, and documentation.

## 2026-05-29 — Project setup and basic file loading

### What I built

* Set up the first version of the `internship-fit-gap-analyzer` project.
* Created the main folder structure with `data/`, `src/`, `tests/`, `README.md`, and `LEARNING_LOG.md`.
* Added my resume as a text file in `data/resume/resume.txt`.
* Added sample job descriptions in `data/jobs/`.
* Added a skills taxonomy in `data/skills_taxonomy.json`.
* Wrote code in `src/main.py` to:

  * read my resume text,
  * read the skills taxonomy JSON file,
  * read job description `.txt` files,
  * print previews in the terminal.

### What I practiced

* Using `Path` to point to files and folders.
* Reading text files with `.read_text(encoding="utf-8")`.
* Reading a JSON file as text.
* Using `json.loads()` to turn JSON text into a Python dictionary.
* Using `.glob("*.txt")` to find text files in a folder.
* Using a `for` loop to go through job description files.
* Printing previews with string slicing like `resume_text[:500]`.

### Bugs or issues I worked through

* I originally used `.read_text()` too early and accidentally stored the whole resume text in a variable that was supposed to be a file path.
* That caused Python to treat my whole resume as a file name.
* I also tried to loop directly through a `Path("data/jobs")` folder, which caused a `TypeError` because a plain folder path is not automatically a list of files.
* I fixed this by using `.glob("*.txt")` to get the job files.

### What AI helped with

* AI helped explain the error messages.
* AI helped show the correct file-reading pattern.
* AI helped explain what each line was doing.
* I copied some corrected code, but I am going line by line to understand how the pieces fit together instead of just pasting blindly.

### What I understand now

* A file path points Python to where a file or folder is.
* `Path("data/resume/resume.txt")` points to my resume file but does not read it yet.
* `.read_text(encoding="utf-8")` opens the file and reads the contents as text.
* JSON files can be loaded into Python dictionaries.
* A folder path is different from a group of files.
* `.glob("*.txt")` finds all text files in a folder.
* `main.py` is currently acting as the control script that loads the project inputs.

### What I still want to understand better

* How imports work between files inside the `src/` folder.
* How to organize code into separate helper files.
* How to make the terminal output cleaner.
* How to turn the printed output into an actual markdown report.

## 2026-05-29 — Added simple skill matching

### What I built

* Added a `find_skills(text, taxonomy)` function in `src/extract_keywords.py`.
* This function searches a piece of text for skills listed in the taxonomy.
* Updated `src/main.py` so it can find skills in:

  * my resume,
  * each job description.

### What I practiced

* Writing a function.
* Passing information into a function with parameters.
* Returning a result from a function.
* Using `.lower()` to make text matching easier.
* Looping through a dictionary with `.items()`.
* Looping through lists of skills.
* Using `if skill in text` to check whether a skill appears.
* Using `.append()` to add found skills to a list.
* Importing a function from another file.

### What AI helped with

* AI helped write the first clean version of the `find_skills()` function.
* AI helped add comments so I could understand each line.
* I am focusing on understanding what the function does, what inputs it needs, and what it returns.

### What I understand now

* `find_skills()` takes two inputs: text and the taxonomy dictionary.
* The text can be either my resume or a job description.
* The taxonomy is a dictionary where each category has a list of skills.
* The function returns a new dictionary showing which skills were found.
* `extract_keywords.py` is a helper file, while `main.py` controls the workflow.

### What I still want to understand better

* How to avoid false matches from simple keyword matching.
* For example, `java` could accidentally match inside `javascript`.
* How to compare job skills against resume skills.
* How to save the results instead of only printing them.

## 2026-05-29 — Current project state

### What currently works

* The project can read the resume text file.
* The project can read the skills taxonomy JSON file.
* The project can read multiple job description files.
* The project can find basic keyword skill matches in the resume and job descriptions.
* The output currently prints to the terminal.

### What is not built yet

* Comparing job skills against resume skills.
* Creating a markdown gap report.
* Saving results to CSV.
* Using pandas.
* Using SQLite.
* Using the OpenAI API.
* Building a Streamlit dashboard.
* Adding tests.

### Next step

* Build a simple comparison function in `src/compare_resume.py`.
* The function should compare skills found in a job description against skills found in my resume.
* The goal is to identify skills that appear in the job but not in the resume.

## 2026-05-29 — Generated first markdown gap report

### What I built
- Added `src/report_writer.py`.
- Created a `write_gap_report(output_path, resume_skills, job_results)` function.
- Updated `src/main.py` to collect job analysis results and write them into `data/outputs/gap_report.md`.

### What I practiced
- Creating a report-writing helper file.
- Passing dictionaries and lists into a function.
- Building a markdown file as text.
- Using `.append()` to add sections to a list.
- Using `"".join(lines)` to combine many text sections into one report.
- Using `.write_text()` to save text to a file.
- Creating an output folder with `.mkdir()`.

### What AI helped with
- AI helped structure the report writer and explain each line.
- I copied the code, but I reviewed the comments to understand how the report is built from the resume skills and job results.

### What I understand now
- `main.py` controls the full workflow.
- `extract_keywords.py` finds skills in text.
- `compare_resume.py` finds gaps between job skills and resume skills.
- `report_writer.py` turns the results into a markdown report.
- The project now has a basic input → analysis → output flow.

### What I still want to understand better
- How to make the report cleaner and easier to read.
- How to save results to CSV.
- How to avoid false keyword matches.

## 2026-05-29 — Added CSV gap summary output

### What I built
- Added `src/csv_writer.py`.
- Created a `write_gap_csv(output_path, job_results)` function.
- Updated `src/main.py` so the project now writes both a markdown report and a CSV summary.
- The CSV file saves one missing skill per row with the job name, category, and gap skill.

### What I practiced
- Importing Python's built-in `csv` module.
- Creating a new helper file.
- Writing rows to a CSV file.
- Using `csv.DictWriter`.
- Looping through nested data.
- Saving structured output to `data/outputs/gap_summary.csv`.

### What AI helped with
- AI helped write the first version of the CSV writer and explain how the nested loops work.
- I reviewed the comments to understand how `job_results` turns into CSV rows.

### What I understand now
- The markdown report is better for reading.
- The CSV file is better for later analysis.
- `job_results` stores all job analysis results in one list.
- Each job result contains the job name, skills found in the job, and skill gaps.
- The CSV writer loops through those results and saves each missing skill as its own row.

### What I still want to understand better
- How to summarize recurring gaps across multiple jobs.
- How to sort or count the most common missing skills.
- How to make the project output cleaner.

## 2026-05-29 — Added recurring gap summary

### What I built
- Added `src/summarize_gaps.py`.
- Created a `count_recurring_gaps(job_results)` function.
- Updated the markdown report to show the most common skill gaps near the top.
- Added `data/outputs/recurring_gaps.csv`, which counts how often each missing skill appears across all analyzed jobs.

### What I practiced
- Counting repeated values with a dictionary.
- Turning nested job results into a simpler summary.
- Sorting a list of dictionaries by count.
- Writing a second CSV output file.
- Passing the same analysis results into multiple output functions.

### What AI helped with
- AI helped structure the recurring gap counter and explain the loops.
- I reviewed the comments to understand how job-level gaps become an overall frequency summary.

### What I understand now
- `gap_summary.csv` shows each missing skill for each job.
- `recurring_gaps.csv` summarizes which missing skills appear most often.
- A dictionary can be used to count repeated values.
- Sorting lets the most common gaps appear first.

### What I still want to understand better
- How to clean up false matches from simple keyword searching.
- How to improve the report formatting.
- How to eventually use pandas to summarize this more easily.

## 2026-05-29 — Improved keyword matching accuracy

### What I built
- Updated `src/extract_keywords.py` to use a helper function called `skill_appears_in_text(skill, normalized_text)`.
- Replaced simple substring matching with a basic regular expression search.
- The goal was to reduce false matches, such as matching `java` inside `javascript`.

### What I practiced
- Importing Python's built-in `re` module.
- Creating a helper function.
- Using a return value of `True` or `False`.
- Separating small pieces of logic into simpler functions.
- Improving the matching logic without changing the rest of the project pipeline.

### What AI helped with
- AI helped write the first version of the improved matching function.
- I reviewed the comments to understand why simple substring matching can create false matches.

### What I understand now
- `if skill in text` is simple but can accidentally match text inside larger words.
- A word-boundary pattern can make matching more careful.
- Improving one helper function can improve the whole project because `main.py` already uses `find_skills()` everywhere.

### What I still want to understand better
- How regular expressions work.
- How to handle related terms like `api` and `apis`.
- How to add aliases for skills that can be written in multiple ways.

## 2026-05-29 — Added skill aliases

### What I built
- Added `data/skill_aliases.json`.
- Updated `find_skills()` so it can search for multiple phrases for one official skill.
- Updated `src/main.py` to load the aliases file and pass it into the skill matcher.

### What I practiced
- Creating another JSON input file.
- Loading multiple JSON files in `main.py`.
- Passing an optional third argument into a function.
- Using helper functions to keep matching logic easier to read.
- Avoiding duplicate matches by using `break`.

### What AI helped with
- AI helped design the alias structure and update the matching function.
- I reviewed the comments to understand the difference between official skill names and search phrases.

### What I understand now
- The taxonomy controls which skills the project reports.
- The aliases file controls extra phrases the project searches for.
- One official skill can have multiple search phrases.
- This makes the analyzer more realistic without adding AI yet.

### What I still want to understand better
- How to decide which aliases are too broad.
- How to test whether aliases improve or hurt the matching.
- How to make matching accurate without making it too complicated.

## 2026-05-29 — Added initial README documentation

### What I built
- Added the first real `README.md` for the project.
- Documented what the project does, how to run it, the input files, output files, source files, current limitations, and planned next steps.

### What I practiced
- Writing project documentation.
- Explaining how separate Python files work together.
- Describing inputs, processing steps, and outputs.
- Documenting limitations honestly.

### What AI helped with
- AI helped draft the README structure and wording.
- I reviewed the README to make sure I understand what each project file does and how the full workflow fits together.

### What I understand now
- A README helps make the project easier to understand for other people and for my future self.
- Documentation is part of making a project professional.
- The project currently has a working pure-Python input → analysis → output pipeline.

### What I still want to understand better
- How to make the project easier to run from the command line.
- How to add tests for the helper functions.
- How to decide when Version 1 is complete.

## 2026-05-30 — Added basic core logic tests

### What I built
- Added `tests/test_core_logic.py`.
- Created simple tests for `find_skills()`, `find_gaps()`, and `count_recurring_gaps()`.
- Used small fake examples to check that the helper functions return expected results.

### What I practiced
- Writing test functions.
- Using `assert` statements.
- Testing functions with small sample inputs.
- Running a test file from the terminal.
- Checking that the main project still works after adding tests.

### What AI helped with
- AI helped write the first basic test file and explain what each test checks.
- I reviewed the test inputs and expected outputs so I understand what the tests are proving.

### What I understand now
- Tests help catch mistakes when the code changes later.
- A good test gives a function known input and checks for expected output.
- Testing small helper functions is easier than testing the whole program at once.

### What I still want to understand better
- How pytest works.
- How to organize tests as the project grows.
- How to test file outputs like markdown and CSV files.

## 2026-05-31 — Refactored main workflow into helper functions

### What I built
- Refactored `src/main.py` into smaller helper functions.
- Added `load_text_file()` for reading text files.
- Added `load_json_file()` for reading JSON files.
- Added `analyze_jobs()` for analyzing all job description files.
- Moved the full workflow into a `main()` function.

### What I practiced
- Organizing a Python script into smaller functions.
- Reusing helper functions instead of repeating code.
- Using constants for important file paths.
- Understanding the basic purpose of `if __name__ == "__main__"`.

### What AI helped with
- AI helped reorganize the existing working script into smaller sections.
- I reviewed the comments to understand how the workflow still follows the same input → analysis → output process.

### What I understand now
- `main.py` is easier to read when each function has one clear job.
- The project still does the same thing, but the workflow is cleaner.
- Helper functions make future changes easier because repeated logic is in one place.

### What I still want to understand better
- How Python decides where imports come from.
- How to test helper functions that read and write files.
- How command-line options could make the script more flexible later.

## 2026-05-31 — Added input validation

### What I built
- Added a `validate_inputs()` function in `src/main.py`.
- The function checks that the resume file, skills taxonomy file, skill aliases file, and jobs folder exist.
- It also checks that the jobs folder contains at least one `.txt` job description file.

### What I practiced
- Checking whether files and folders exist.
- Using `.exists()` and `.is_dir()`.
- Using `raise` to stop the program with a clearer error message.
- Using `list()` with `.glob("*.txt")` to check for job files.
- Making the program safer before it runs the full analysis.

### What AI helped with
- AI helped design the validation function and explain how each check works.
- I reviewed the code so I understand why validation happens before loading files.

### What I understand now
- Input validation catches missing files early.
- Clear error messages make debugging easier.
- A project should check its assumptions before running the main workflow.

### What I still want to understand better
- How to handle errors without showing a traceback.
- How to test error cases automatically.
- How command-line options could make the project more flexible.

## 2026-05-31 — Added terminal run summary

### What I built
- Added `src/console_summary.py`.
- Created a `print_run_summary(job_results, recurring_gaps, output_paths)` function.
- Updated `src/main.py` so the terminal prints a cleaner summary after each run.

### What I practiced
- Creating another helper file.
- Passing lists into a function.
- Using `len()` to count analyzed jobs.
- Using list slicing to show only the top recurring gaps.
- Using `enumerate()` to number printed results.
- Keeping display/printing logic separate from analysis logic.

### What AI helped with
- AI helped structure the terminal summary function and explain each part.
- I reviewed the comments to understand how the summary uses the existing `job_results` and `recurring_gaps` data.

### What I understand now
- The analyzer can create useful output files and also show a quick terminal summary.
- Separating terminal printing into its own helper file keeps `main.py` cleaner.
- The same analysis results can be reused in multiple ways: markdown, CSV, recurring gap counts, and terminal summaries.

### What I still want to understand better
- How to make the command line more flexible.
- How to let the user choose folders or output paths.
- How to test printed terminal output.