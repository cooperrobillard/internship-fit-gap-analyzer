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

## 2026-05-31 — Added command-line options

### What I built
- Added command-line options to `src/main.py` using Python's built-in `argparse` module.
- The analyzer can still run with default paths using `python3 src/main.py`.
- The analyzer can now accept optional paths for the resume, jobs folder, taxonomy file, aliases file, and outputs folder.
- Added a `--top-gaps` option to control how many recurring gaps appear in the terminal summary.

### What I practiced
- Using `argparse`.
- Creating command-line arguments.
- Using default values.
- Converting command-line path strings into `Path` objects.
- Passing selected paths into validation, loading, analysis, and output-writing functions.
- Keeping the program flexible without changing the core analysis logic.

### What AI helped with
- AI helped update the structure of `main.py` and explain how command-line arguments fit into the workflow.
- I reviewed the comments to understand how terminal options become variables inside the program.

### What I understand now
- Hardcoded paths are simple, but command-line options make the tool more flexible.
- Defaults let the project still run normally without extra options.
- `argparse` creates a help screen and reads user-provided options.
- The same analysis code can run on different input files if the paths are passed in.

### What I still want to understand better
- How to test command-line behavior.
- How to decide which settings should be command-line options.
- How real Python packages make command-line tools easier to install and run.

## 2026-05-31 — Added tests for output writer functions

### What I built

* Added `tests/test_output_writers.py`.
* Created tests for the markdown report writer and CSV writer functions.
* Tested that the project can create markdown and CSV files with expected content.

### What I practiced

* Testing file-writing functions.
* Using `TemporaryDirectory()` to create temporary test folders.
* Checking whether a file exists with `.exists()`.
* Reading generated markdown text back into Python.
* Reading generated CSV files with `csv.DictReader`.
* Using `assert` statements to check expected output.

### What AI helped with

* AI helped write the first version of the output writer tests.
* I reviewed the fake test data and comments to understand what each test is checking.

### What I understand now

* Tests can check not only logic, but also whether files are created correctly.
* Temporary folders let me test output files without changing my real project outputs.
* Reading generated files back into Python helps confirm that the writer functions worked.

### What I still want to understand better

* How pytest would simplify running multiple test files.
* How to test command-line arguments.
* How to organize tests as the project grows.

## 2026-05-31 — Added simple test runner

### What I built
- Added `run_tests.py`.
- The script runs the current test files from one command.
- It stops if any test file fails and prints a success message if all tests pass.

### What I practiced
- Running Python files from another Python script.
- Using `subprocess.run()`.
- Using `sys.executable` to run tests with the current Python interpreter.
- Checking command success with `returncode`.
- Making the project easier to test.

### What AI helped with
- AI helped write the first simple test runner and explain how it works.
- I reviewed the comments to understand how the script runs each test file.

### What I understand now
- A test runner saves time because I do not have to run every test file manually.
- `returncode` tells the script whether a test passed or failed.
- This is a small step toward more professional testing, even before using pytest.

### What I still want to understand better
- How pytest discovers and runs tests automatically.
- How to test command-line arguments.
- How to organize tests as the project grows.

## 2026-05-31 — Added command-line behavior tests

### What I built
- Added `tests/test_cli.py`.
- Tested that `python3 src/main.py --help` works.
- Tested that the analyzer can run with a custom output folder using `--outputs`.
- Updated `run_tests.py` so it runs the new CLI test file.

### What I practiced
- Running terminal commands from Python with `subprocess.run()`.
- Capturing command output with `capture_output=True`.
- Checking terminal output with `result.stdout`.
- Checking command success with `result.returncode`.
- Using `TemporaryDirectory()` so tests do not affect the real output folder.

### What AI helped with
- AI helped write the first CLI test file and explain how the subprocess test works.
- I reviewed the comments to understand how the test runs the project from the command line.

### What I understand now
- Tests can check both helper functions and full command-line behavior.
- Temporary folders make output tests safer.
- The project is easier to trust when the main command and options are tested.

### What I still want to understand better
- How pytest would make these tests easier to run.
- How to test error cases for missing input files.
- How larger projects organize CLI tests.

## 2026-05-31 — Added input validation tests

### What I built
- Added `tests/test_validation.py`.
- Tested that `validate_inputs()` works when all required files and folders exist.
- Tested that `validate_inputs()` catches a missing resume file.
- Tested that `validate_inputs()` catches an empty jobs folder.
- Updated `run_tests.py` so the validation tests run with the rest of the test suite.

### What I practiced
- Testing both successful cases and error cases.
- Using `try` / `except` to check expected errors.
- Creating fake input files with `.write_text()`.
- Using `TemporaryDirectory()` to avoid changing real project files.
- Adding a new test file to the test runner.

### What AI helped with
- AI helped write the first validation test file and explain how the error tests work.
- I reviewed the comments to understand how temporary files are used to test missing or invalid inputs.

### What I understand now
- Good tests should check both when code works and when code should fail clearly.
- Input validation is useful because it catches problems before the full analysis runs.
- Temporary test folders help test file-related code safely.

### What I still want to understand better
- How pytest would make error testing cleaner.
- How to test more command-line error cases.
- How to organize tests if the project keeps growing.

## 2026-05-31 — Updated README after MVP improvements

### What I built
- Updated `README.md` to match the current state of the project.
- Documented the project structure, input files, source files, output files, command-line options, tests, limitations, and planned next steps.

### What I practiced
- Writing project documentation.
- Explaining how the full system works.
- Documenting command-line usage.
- Documenting tests and output files.
- Keeping documentation consistent with the actual code.

### What AI helped with
- AI helped draft the updated README based on the current project state.
- I reviewed the README to make sure I understand what each file does and how the project fits together.

### What I understand now
- A README should explain how to run the project, what files matter, and what the current limitations are.
- Documentation is part of making a project professional.
- The project now has enough working pieces that the README needs to stay updated as the code changes.

### What I still want to understand better
- How to decide when Version 1 is complete.
- How to write stronger project documentation over time.
- How to prepare the repo for future pandas or SQLite phases.

## 2026-05-31 — Added Version 1 MVP checklist

### What I built
- Added `docs/VERSION_1_CHECKLIST.md`.
- Documented what the pure-Python MVP currently does.
- Listed the current input files, source files, output files, tests, commands, limitations, and possible cleanup tasks.

### What I practiced
- Creating project documentation.
- Defining what counts as a completed MVP.
- Separating Version 1 goals from future pandas, SQLite, OpenAI, and dashboard work.
- Reviewing the project as a full system instead of only individual files.

### What AI helped with
- AI helped draft the checklist structure.
- I reviewed the checklist to make sure it matches the actual project and helps me understand when Version 1 is complete.

### What I understand now
- A project milestone should have a clear definition of done.
- Version 1 is mainly about a working pure-Python input → analysis → output pipeline.
- Future tools should only be added after the current version is stable and understandable.

### What I still want to understand better
- Whether to add more pure-Python cleanup before moving to pandas and SQLite.
- How to decide when a project is portfolio-ready.
- How to describe this project honestly on a resume after each phase.

## 2026-05-31 — Added sample data and gitignore

### What I built
- Added a `.gitignore` file.
- Added a safe sample resume file at `data/resume/sample_resume.txt`.
- Added a safe sample job description at `data/jobs/sample_ai_internship.txt`.
- Tested the analyzer with the sample resume using a command-line argument.

### What I practiced
- Separating private local files from public sample files.
- Using `.gitignore` to avoid tracking generated files and private inputs.
- Running the analyzer with a custom resume path.
- Thinking about what should and should not be committed to GitHub.

### What AI helped with
- AI helped create a safe sample resume and sample job description.
- AI helped explain how `.gitignore` protects future commits.

### What I understand now
- A portfolio repo should include sample data so other people can run it.
- My real resume and private job files should usually stay local.
- `.gitignore` prevents future tracking, but it does not automatically erase files that were already committed.

### What I still want to understand better
- How to safely stop tracking files that were already committed.
- How to structure sample data for a public portfolio project.
- How to prepare the repo before moving into pandas or SQLite.

## 2026-05-31 — Made default resume path public-safe

### What I built
- Changed the default resume path from my private resume file to the safe sample resume.
- Updated the README to explain how to run the analyzer with the sample resume or a private local resume.

### What I practiced
- Using command-line options to switch between sample and private inputs.
- Keeping public repo defaults safe.
- Making the project easier for someone else to clone and run.

### What AI helped with
- AI helped identify that the default path should point to sample data after removing the private resume from Git tracking.

### What I understand now
- `.gitignore` keeps private files local, but the program should still have safe defaults for public use.
- A GitHub project should run with tracked sample files by default.
- Private local files can still be used through command-line arguments.

### What I still want to understand better
- How to remove sensitive data from old Git history if needed.
- How to structure sample data for a public portfolio repo.

## 2026-05-31 — Added limitations documentation

### What I built
- Added `docs/LIMITATIONS.md`.
- Documented the current limits of the pure-Python keyword-matching approach.
- Added notes about false positives, false negatives, privacy, and how to interpret the outputs.

### What I practiced
- Writing honest technical documentation.
- Explaining what the tool can and cannot do.
- Thinking about privacy and responsible use.
- Separating project limitations from future improvements.

### What AI helped with
- AI helped draft the limitations document.
- I reviewed the wording to make sure it honestly describes the current project instead of overstating what it can do.

### What I understand now
- A useful project should explain its limits clearly.
- Keyword matching can help find patterns, but it does not fully understand job descriptions.
- Documentation helps make the project more trustworthy and easier to explain.

## 2026-05-31 — Made default job inputs public-safe

### What I built
- Added a `data/sample_jobs/` folder with a safe sample job description.
- Changed the default jobs folder from `data/jobs/` to `data/sample_jobs/`.
- Updated `.gitignore` so real local job descriptions in `data/jobs/` are not tracked by Git.
- Updated the README to explain the difference between sample jobs and private local jobs.

### What I practiced
- Separating public sample data from private local data.
- Updating default command-line paths.
- Using command-line options to run the analyzer on different input folders.
- Thinking about what belongs in a public portfolio repo.

### What AI helped with
- AI helped identify that the default jobs folder should also be sample-safe.
- AI helped explain how to keep private local inputs separate from tracked sample inputs.

### What I understand now
- A public repo should run with safe sample files by default.
- Private resume and job files can still be used locally through command-line options.
- `.gitignore` helps prevent private inputs from being accidentally committed.

## 2026-05-31 — Stopped tracking Python cache files

### What I built
- Removed Python cache files from Git tracking.
- Confirmed that `.gitignore` ignores `__pycache__/` and `.pyc` files.

### What I practiced
- Using `git rm --cached` to stop tracking generated files.
- Understanding that some files are created by Python automatically and should not be committed.
- Keeping the repository cleaner for public use.

### What AI helped with
- AI helped identify that `src/__pycache__/main.cpython-313.pyc` should not be tracked.

### What I understand now
- `.gitignore` prevents new ignored files from being tracked.
- If a file was already tracked, I need `git rm --cached` to remove it from Git tracking.
- Python cache files are not source code and should stay out of the repo.

## 2026-05-31 — Completed Version 1 checkpoint

### What I built
- Completed a final checkpoint for the pure-Python MVP.
- Confirmed that the analyzer runs with sample data by default.
- Confirmed that private local inputs can still be used with command-line options.
- Confirmed that the test runner passes.
- Updated the Version 1 checklist to mark the MVP as complete enough to move toward Version 2.

### What I practiced
- Running a full project smoke test.
- Checking command-line behavior.
- Checking tests before moving to a new phase.
- Reviewing project documentation against the actual code.
- Thinking about when a project version is stable enough to build on.

### What AI helped with
- AI helped define the final Version 1 checklist and what commands to run.
- I used the checklist to confirm the project is working instead of blindly adding more features.

### What I understand now
- Version 1 is a working pure-Python command-line analyzer.
- It has a clear input → analysis → output flow.
- It is now safer for GitHub because it uses sample data by default.
- The next phase should add pandas and SQLite carefully, not all at once.

### What I still want to understand better
- How pandas will improve recurring-gap summaries.
- How SQLite will store job and gap history.
- How to structure Version 2 without making the project too complicated.

## Version 1 limitations documentation

Added a `LIMITATIONS.md` file to clearly explain what the current pure-Python MVP can and cannot do.

Key takeaways:
- The project currently uses rule-based keyword and alias matching.
- It does not truly understand job descriptions yet.
- It does not distinguish required vs. preferred skills.
- It does not evaluate the strength of resume evidence.
- These limitations are acceptable for Version 1 because the core workflow is working and tested.
- Documenting limitations helps keep the project honest and sets up a clearer path for Version 2.

Tested with:
- `python3 src/main.py --resume data/resume/resume.txt --jobs data/jobs`
- `python3 run_tests.py`

## Version 2 planning

Created a `VERSION2_PLAN.md` file to outline the next phase of the project.

Key takeaways:
- Version 1 is now a stable pure-Python MVP.
- Version 2 will focus on SQLite and pandas.
- SQLite will store analysis runs, job results, and skill gaps.
- pandas will later help summarize and export cleaner analysis tables.
- Planning the database structure before coding helps avoid overbuilding or adding confusing features too early.

Important database idea:
- One analysis run can include many job results.
- Each job result can include many skill gaps.

Tested with:
- `python3 src/main.py --resume data/resume/resume.txt --jobs data/jobs`
- `python3 run_tests.py`

## Added initial SQLite database setup

Added a new `src/database.py` module for Version 2.

What I added:
- A function to connect to a SQLite database.
- A function to create the first database tables.
- A function to initialize the database.
- A new database test file.

Key concepts:
- SQLite is a lightweight database stored in a local file.
- Python can use SQLite through the built-in `sqlite3` module.
- A database connection lets Python communicate with the database.
- A cursor runs SQL commands.
- `CREATE TABLE IF NOT EXISTS` creates a table only if it does not already exist.
- `commit()` saves database changes.
- `close()` closes the database connection.

Tables created:
- `analysis_runs`
- `job_results`
- `skill_gaps`

Tested with:
- `python3 tests/test_database.py`
- `python3 run_tests.py`
- `python3 src/main.py --resume data/resume/resume.txt --jobs data/jobs`

## Added analysis run database insert

Added an `insert_analysis_run()` function to `src/database.py`.

What I added:
- A function that inserts one row into the `analysis_runs` table.
- A test that confirms the row is added correctly.
- A check that the function returns the new run ID.

Key concepts:
- `INSERT INTO` adds a new row to a database table.
- `VALUES (?, ?, ?)` uses placeholders so Python can safely pass values into SQL.
- `connection.commit()` saves the inserted row.
- `cursor.lastrowid` returns the ID of the row that was just inserted.
- The run ID will later connect job results and skill gaps back to one analyzer run.

Tested with:
- `python3 tests/test_database.py`
- `python3 run_tests.py`
- `python3 src/main.py`

## Added skill gap database insert

Added an `insert_skill_gap()` function to `src/database.py`.

What I added:
- A function that inserts one row into the `skill_gaps` table.
- A test that confirms the row is added correctly.
- A check that the function returns the new skill gap ID.

Key concepts:
- The `skill_gaps` table stores one row for each missing skill found in a job.
- `run_id` connects each skill gap back to the analysis run that produced it.
- `job_filename` records which job description produced the gap.
- `INSERT INTO` adds a row to a database table.
- `cursor.lastrowid` returns the ID of the inserted row.

Tested with:
- `python3 tests/test_database.py`
- `python3 run_tests.py`
- `python3 src/main.py`

## Added recurring gap database query

Added a `query_recurring_gaps()` function to `src/database.py`.

What I added:
- A function that reads recurring skill gaps from the SQLite `skill_gaps` table.
- A test that inserts multiple skill gaps and checks that SQL counts them correctly.
- A query that returns results in the same general shape as the existing pure-Python recurring gap summary.

Key concepts:
- `SELECT` chooses the data to return from a database table.
- `WHERE run_id = ?` filters results to one analysis run.
- `GROUP BY skill, category` combines repeated skill-gap rows.
- `COUNT(*)` counts how many rows are in each group.
- `ORDER BY COUNT(*) DESC` sorts the most common gaps first.
- SQL can summarize data that was previously stored row by row.

Tested with:
- `python3 tests/test_database.py`
- `python3 run_tests.py`
- `python3 src/main.py`

## Added full analysis database save helper

Added a `save_analysis_results()` function to `src/database.py`.

What I added:
- A helper that saves one full analysis result into SQLite.
- The helper inserts one analysis run.
- It inserts one job result row for each analyzed job.
- It inserts one skill gap row for each missing skill.
- A database test confirms the saved rows can be queried correctly.

Key concepts:
- A helper function can coordinate smaller helper functions.
- `len(job_results)` gives the number of jobs analyzed.
- Nested loops can turn job result dictionaries into database rows.
- `run_id` connects all saved job results and skill gaps back to one analysis run.
- This creates the bridge between the existing Python analysis structure and the SQLite database structure.

Tested with:
- `python3 tests/test_database.py`
- `python3 run_tests.py`
- `python3 src/main.py`

## Added full analysis database save helper

Added a `save_analysis_results()` function to `src/database.py`.

What I added:
- A helper that saves one full analysis result into SQLite.
- The helper inserts one analysis run.
- It inserts one job result row for each analyzed job.
- It inserts one skill gap row for each missing skill.
- A database test confirms the saved rows can be queried correctly.

Key concepts:
- A helper function can coordinate smaller helper functions.
- `len(job_results)` gives the number of jobs analyzed.
- Nested loops can turn job result dictionaries into database rows.
- `run_id` connects all saved job results and skill gaps back to one analysis run.
- This creates the bridge between the existing Python analysis structure and the SQLite database structure.

Tested with:
- `python3 tests/test_database.py`
- `python3 run_tests.py`
- `python3 src/main.py`

## Added optional database CLI output

Added an optional `--database` command-line argument to save analyzer results to SQLite.

What I added:
- A `--database` CLI option in `src/main.py`.
- Logic that saves analysis results to SQLite only when a database path is provided.
- A CLI test that confirms the analyzer can create normal outputs and a SQLite database file.
- The default behavior remains unchanged when `--database` is not used.

Key concepts:
- Optional CLI arguments can add features without changing default behavior.
- `None` can be used to represent that the user did not provide an optional value.
- A `Path` object can represent the database file location.
- The main analyzer can now reuse the database helper functions built earlier.
- This connects the existing analysis workflow to SQLite while keeping database output optional.

Tested with:
- `python3 run_tests.py`
- `python3 src/main.py`
- `python3 src/main.py --database data/outputs/analysis_results.db`

## Documented optional SQLite output

Updated project documentation after adding optional SQLite database output.

What I updated:
- Added SQLite database file patterns to `.gitignore`.
- Updated the README to document the `--database` option.
- Added an example command for saving analysis results to SQLite.
- Clarified that SQLite is now optional output, while pandas and advanced tools are still future work.

Key concepts:
- Generated database files should usually not be committed to Git.
- `.gitignore` helps prevent accidental tracking of local output files.
- Documentation should stay aligned with actual project behavior.
- Optional CLI features should be clearly explained so users know when they are active.

Tested with:
- `python3 run_tests.py`
- `python3 src/main.py`
- `python3 src/main.py --database data/outputs/analysis_results.db`

## Added jobs-with-most-gaps database query

Added a `query_jobs_with_most_gaps()` function to `src/database.py`.

What I added:
- A SQL query helper that reads job-level results from the `job_results` table.
- The helper returns jobs sorted by how many missing skills they had.
- A database test that confirms jobs are returned from most gaps to fewest gaps.

Key concepts:
- `SELECT` chooses which columns to return from a database table.
- `WHERE run_id = ?` filters results to one analysis run.
- `ORDER BY missing_skills_count DESC` sorts jobs with the most gaps first.
- SQL can help identify which job descriptions are the biggest reach based on missing skills.

Tested with:
- `python3 tests/test_database.py`
- `python3 run_tests.py`
- `python3 src/main.py`
- `python3 src/main.py --database data/outputs/analysis_results.db`

## Added first pandas summary helper

Added a new `src/pandas_summary.py` module to start using pandas in a small, isolated way.

What I added:
- A helper that loads `recurring_gaps.csv` into a pandas DataFrame.
- A helper that sorts recurring gaps by count and returns the top rows.
- A new pandas test file.
- Added pandas to `requirements.txt`.

Key concepts:
- pandas is a Python library for working with table-like data.
- A DataFrame is like a spreadsheet inside Python.
- `read_csv()` loads CSV data into a DataFrame.
- `sort_values()` sorts rows by one or more columns.
- `head()` returns the first few rows.
- `requirements.txt` lists external packages needed for the project.

Tested with:
- `python3 tests/test_pandas_summary.py`
- `python3 run_tests.py`
- `python3 src/main.py`

## Added pandas gap category summary

Added a pandas helper to summarize skill gaps by category.

What I added:
- A `load_gap_summary_csv()` function that loads the detailed gap summary CSV into a pandas DataFrame.
- A `summarize_gaps_by_category()` function that groups gaps by category and counts them.
- Tests that confirm pandas loads the CSV and produces the expected category counts.

Key concepts:
- A pandas DataFrame stores table-like data in Python.
- `read_csv()` loads a CSV file into a DataFrame.
- `groupby()` groups rows that share the same value in a column.
- `size()` counts how many rows are in each group.
- `reset_index()` turns grouped results back into a regular DataFrame.
- `sort_values()` sorts rows by one or more columns.

Tested with:
- `python3 tests/test_pandas_summary.py`
- `python3 run_tests.py`
- `python3 src/main.py`

## Added pandas summary output writer

Added a pandas helper that writes pandas-generated summary CSV files.

What I added:
- A `write_pandas_summary_outputs()` function in `src/pandas_summary.py`.
- The helper loads existing CSV outputs into pandas DataFrames.
- It creates a category-level gap summary.
- It creates a top recurring gaps summary.
- It writes two pandas-generated CSV files:
  - `gap_categories_pandas.csv`
  - `top_recurring_gaps_pandas.csv`
- Tests confirm that both files are created and contain expected sorted summary data.

Key concepts:
- pandas can read existing CSV outputs and create new summary tables.
- `to_csv()` writes a DataFrame back to a CSV file.
- Helper functions can combine smaller pandas operations into one reusable workflow.
- Keeping this isolated from `main.py` makes it safer to test before adding CLI integration.

Tested with:
- `python3 tests/test_pandas_summary.py`
- `python3 run_tests.py`
- `python3 src/main.py`

## Added optional pandas summary CLI output

Added an optional `--pandas-summary` command-line flag to create pandas-generated summary CSV files.

What I added:
- A `--pandas-summary` CLI option in `src/main.py`.
- Logic that creates pandas summary outputs only when the flag is used.
- A CLI test that confirms the normal outputs and pandas outputs are created together.
- The default analyzer behavior remains unchanged when `--pandas-summary` is not used.

Key concepts:
- A boolean CLI flag can turn an optional feature on or off.
- `action="store_true"` means the argument becomes `True` only when the user includes the flag.
- pandas can now be used as an optional analysis-output layer.
- Keeping pandas optional avoids changing the core Version 1 behavior.

Tested with:
- `python3 run_tests.py`
- `python3 src/main.py`
- `python3 src/main.py --pandas-summary`

## Updated README for Version 2 outputs

Updated the README to match the current Version 2 project behavior.

What I updated:
- Documented optional SQLite database output.
- Documented optional pandas summary output.
- Added command examples for `--database` and `--pandas-summary`.
- Added setup instructions using `requirements.txt`.
- Updated the project structure to include the database and pandas modules.
- Updated the output files section to include SQLite and pandas-generated outputs.

Key concepts:
- Documentation should stay aligned with actual code behavior.
- Optional CLI features should be clearly explained.
- `requirements.txt` helps other people install project dependencies.
- A README should help someone clone, install, run, test, and understand the project.

Tested with:
- `python3 run_tests.py`
- `python3 src/main.py`
- `python3 src/main.py --database data/outputs/analysis_results.db --pandas-summary`

## Added database inspection script

Added a standalone database inspection script for checking SQLite output from the terminal.

What I added:
- A `scripts/inspect_database.py` script.
- A test file for the inspection script.
- The script prints database row counts, the latest run ID, recurring gaps, and jobs with the most gaps.
- Updated the test runner so the inspection script test runs with the full suite.

Key concepts:
- A standalone script can help inspect project outputs without changing the main analyzer.
- `subprocess.run()` can test a command-line script.
- SQL row counts help verify that data was saved correctly.
- Existing database query helpers can be reused in utility scripts.
- Keeping this separate from `main.py` avoids changing the main CLI behavior.

Tested with:
- `python3 tests/test_inspect_database.py`
- `python3 run_tests.py`
- `python3 src/main.py`
- `python3 src/main.py --database data/outputs/analysis_results.db`
- `python3 scripts/inspect_database.py data/outputs/analysis_results.db`

## Added Version 2 checkpoint documentation

Added `docs/VERSION_2_CHECKPOINT.md` to summarize the current Version 2 project state.

What I added:
- A checkpoint document explaining the SQLite and pandas features added in Version 2.
- A list of commands that should work.
- A summary of current outputs.
- A list of current limitations.
- Possible next development directions.

Key concepts:
- A checkpoint document helps pause and stabilize a project after many changes.
- Documentation should explain what the project currently does, not just what it may do later.
- Version checkpoints help make future development safer and easier to understand.

Tested with:
- `python3 run_tests.py`
- `python3 src/main.py`
- `python3 src/main.py --database data/outputs/analysis_results.db --pandas-summary`
- `python3 scripts/inspect_database.py data/outputs/analysis_results.db`

## Added combined Version 2 CLI test

Added a CLI test that runs the analyzer with both `--database` and `--pandas-summary`.

What I added:
- A test that confirms normal markdown and CSV outputs are still created.
- A test that confirms pandas summary CSV files are created.
- A test that confirms the SQLite database file is created.
- A check that the terminal output lists the expected files.

Key concepts:
- Integration tests check whether multiple features work together.
- `TemporaryDirectory()` keeps test outputs isolated from real project files.
- Testing combined CLI options helps prevent future changes from breaking optional features.

Tested with:
- `python3 tests/test_cli.py`
- `python3 run_tests.py`
- `python3 src/main.py`
- `python3 src/main.py --database data/outputs/analysis_results.db --pandas-summary`
- `python3 scripts/inspect_database.py data/outputs/analysis_results.db`

## Added Version 2 test commands documentation

Added `docs/VERSION_2_TEST_COMMANDS.md` to document the main commands used to verify Version 2 behavior.

What I added:
- A test command checklist for the full project.
- Commands for default analysis, pandas summaries, SQLite output, and database inspection.
- A full Version 2 smoke test sequence.
- A reminder to remove generated SQLite database files after testing.

Key concepts:
- Smoke tests help quickly confirm that the project still works.
- Documentation can make repeated testing easier and less error-prone.
- Generated output files should not be committed to Git.
- Version 2 now has enough optional behavior that a command checklist is useful.

Tested with:
- `python3 run_tests.py`
- `python3 src/main.py`
- `python3 src/main.py --database data/outputs/analysis_results.db --pandas-summary`
- `python3 scripts/inspect_database.py data/outputs/analysis_results.db`

## Cleaned up Version 2 documentation and repo hygiene

Completed a conservative cleanup pass after the SQLite and pandas Version 2 features were added.

What I cleaned up:
- Removed duplicate `.gitignore` patterns.
- Clarified `.gitignore` comments for generated outputs, SQLite files, and private local inputs.
- Made `docs/LIMITATIONS.md` the canonical limitations document.
- Replaced the outdated root `LIMITATIONS.md` with a short pointer to the canonical limitations document.
- Updated README sections that were outdated, repetitive, or still described the project as only Version 1.
- Added a note to `VERSION2_PLAN.md` that it is a historical planning document.

Key concepts:
- Cleanup passes help keep a growing project understandable.
- Documentation should match actual project behavior.
- Generated outputs and private local inputs should not be committed.
- Conservative cleanup is safer than broad refactoring when the program already works.
- A future web UI will be easier to build if the repo clearly separates core analysis logic, storage, outputs, docs, and sample/private data.

Tested with:
- `python3 run_tests.py`
- `python3 src/main.py`
- `python3 src/main.py --pandas-summary`
- `python3 src/main.py --database data/outputs/analysis_results.db --pandas-summary`
- `python3 scripts/inspect_database.py data/outputs/analysis_results.db`

## Cleaned up public/private data organization

Completed a final repo hygiene cleanup for Version 2.

What I cleaned up:
- Stopped tracking `.DS_Store` files.
- Stopped tracking legacy sample job files in `data/jobs/`.
- Confirmed `data/jobs/` is now treated as a private local folder.
- Confirmed `data/sample_jobs/` is the tracked public sample jobs folder.
- Updated documentation so the data layout is clearer.
- Confirmed generated outputs and SQLite database files stay ignored.

Key concepts:
- `.gitignore` prevents new ignored files from being tracked, but already-tracked files need `git rm --cached`.
- `git rm --cached` removes a file from Git tracking while keeping it on the local computer.
- Public sample data and private local data should be clearly separated in a portfolio repo.
- Clean repo hygiene makes future development safer and easier to understand.

Tested with:
- `python3 run_tests.py`
- `python3 src/main.py`
- `python3 src/main.py --pandas-summary`
- `python3 src/main.py --database data/outputs/analysis_results.db --pandas-summary`
- `python3 scripts/inspect_database.py data/outputs/analysis_results.db`

## Dev Chat 3 - Version 2 Portfolio Summary

- Added `docs/PORTFOLIO_SUMMARY.md` as a portfolio-ready explanation of the project.
- Summarized the project purpose, Version 1 MVP, Version 2 SQLite/pandas additions, testing coverage, privacy design, limitations, and future directions.
- Practiced documenting technical work honestly without overstating the analyzer as AI-powered or production-ready.
- Confirmed the project still passes the full test suite after the documentation update.

## Dev Chat 3 - CLI Error Handling Polish

- Improved the command-line interface so common invalid input cases produce clearer user-facing error messages.
- Added or updated tests for invalid CLI inputs such as missing files or folders.
- Practiced defensive programming with validation, nonzero exit behavior, and preserving successful CLI behavior.
- Confirmed the full test suite and main CLI smoke tests still pass after the change.

## Dev Chat 3 - Product Roadmap Planning

- Added `docs/PRODUCT_ROADMAP.md` to define a phased future direction for the Internship Fit & Skill-Gap Analyzer.
- Planned a conservative path from the current CLI/data-analysis project toward a future private web UI.
- Defined possible Version 3, Version 4, Version 5, and Version 6 milestones without implementing premature features.
- Compared future UI and deployment options while keeping privacy, testing, and learning goals central.
- Practiced separating product planning from implementation so the project does not overbuild too early.

## Dev Chat 3 - Reusable Analysis Runner

- Refactored the project toward a cleaner backend structure by creating a reusable analysis workflow for the current CLI.
- Preserved the existing command-line behavior while making the analysis logic easier for future UI code to call.
- Practiced separating CLI argument handling from core application logic.
- Added or updated tests to confirm the reusable analysis workflow works and the existing CLI behavior still passes.
- Confirmed the full test suite and main smoke-test commands still pass after the refactor.

## Dev Chat 3 - Single-Job Analysis Support

- Added backend support for analyzing a single job description against a resume.
- Practiced preparing the project for a future UI without adding any UI framework yet.
- Kept the analysis logic reusable and separate from folder-based CLI behavior.
- Added or updated tests to confirm the single-job analysis workflow works directly from backend code.
- Confirmed existing CLI behavior and the full test suite still pass after the change.

## Dev Chat 3 - Single-Job CLI Mode

- Added a `--job-file` CLI option so the analyzer can process one job description file directly.
- Connected the command-line interface more closely to the reusable single-job analysis backend.
- Practiced designing CLI options, handling conflicting arguments, and testing user-facing command behavior.
- Preserved the existing folder-based job analysis workflow while preparing the project for a future paste/upload UI.
- Confirmed the full test suite and main smoke-test commands still pass after the change.

## Dev Chat 3 - Version 3 Documentation Update

- Updated project documentation to reflect the current Version 3 CLI/backend workflow.
- Documented the reusable analysis runner, single-job analysis support, and `--job-file` command.
- Created or updated a Version 3 checkpoint document explaining how the project is preparing for future UI work without adding a UI yet.
- Practiced keeping documentation aligned with actual implemented features instead of overstating the project.
- Confirmed the full test suite and main CLI smoke commands still pass after the documentation update.

## Dev Chat 3 - Structured Analysis Results

- Cleaned up the reusable analysis runner so it returns clearer structured results for future UI use.
- Practiced designing simple Python dictionaries/lists that can be inspected directly by tests and future interface code.
- Preserved the existing CLI behavior while making the backend easier to call from non-CLI workflows.
- Added or updated tests to check the returned analysis result directly.
- Confirmed the full test suite, default CLI run, single-job CLI run, and SQLite/pandas smoke tests still pass.