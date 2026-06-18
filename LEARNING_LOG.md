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

## Dev Chat 3 - Version 3 Checkpoint and Version 4 Planning

- Added or updated `docs/VERSION_3_CHECKPOINT.md` to summarize the Version 3 backend and CLI-readiness work.
- Created `docs/LOCAL_UI_PLAN.md` to plan a future local UI prototype without implementing UI code yet.
- Clarified how the reusable analysis runner, single-job analysis support, `--job-file` mode, and structured results prepare the project for a future interface.
- Practiced separating planning from implementation so the project does not jump prematurely into Streamlit, FastAPI, deployment, OpenAI API, or authentication.
- Confirmed the full test suite and main CLI smoke commands still pass after the documentation update.

## Dev Chat 4 - Local Streamlit UI Skeleton

* Started Version 4 by adding a small local-only Streamlit UI skeleton.
* Connected the UI prototype to the existing reusable analysis backend instead of duplicating CLI logic.
* Displayed safe sample-data analysis results in a simple visual interface.
* Practiced adding a new UI dependency carefully while preserving existing CLI behavior and tests.
* Confirmed the full test suite and CLI smoke commands still pass after the UI skeleton was added.

## Dev Chat 4 - Pasted Job Description UI

* Added a local-only Streamlit workflow for pasting one job description into the UI.
* Kept the analysis connected to the reusable backend instead of duplicating skill-matching logic in the interface.
* Used the safe sample resume as the default resume input while testing the pasted-job workflow.
* Practiced separating UI input handling from backend analysis logic.
* Confirmed the test suite and CLI smoke commands still pass after adding the pasted-job UI workflow.

## Dev Chat 4 - Resume Source Selector

* Added a safe local resume source selector to the Streamlit UI.
* Kept the safe sample resume as the default input while allowing the app to use a private local resume file if it exists.
* Practiced handling private local files carefully without committing or exposing private resume content.
* Preserved the existing sample-job and pasted-job UI workflows.
* Confirmed the test suite and CLI smoke commands still pass after adding the resume selector.

## Dev Chat 4 - Results Display Polish

* Improved the Streamlit results display for the local UI prototype.
* Organized analysis output into clearer sections for summary information, matched skills, missing skills, recurring gaps, and output files.
* Practiced separating display formatting from backend analysis logic.
* Preserved the existing sample-job, pasted-job, and resume selector workflows.
* Confirmed the test suite and CLI smoke commands still pass after the UI display polish.

## Dev Chat 4 - Version 4 Local UI Checkpoint

* Documented the completed Version 4 local Streamlit UI workflow.
* Added a Version 4 checkpoint covering the UI skeleton, pasted job analysis, resume source selector, and results display polish.
* Updated the local UI plan to reflect completed work and remaining limitations.
* Practiced keeping project documentation aligned with actual completed features instead of future plans.
* Confirmed the test suite and CLI smoke commands still pass after the documentation update.

## Dev Chat 5 - SQLite Save Option in Local UI

- Started Version 5 by adding an optional SQLite save setting to the local Streamlit UI.
- Connected the UI to the existing local database workflow instead of creating a separate persistence system.
- Preserved the sample-job, pasted-job, resume selector, and results display workflows.
- Practiced keeping generated database files out of Git while testing local persistence.
- Confirmed the test suite, CLI smoke commands, database inspection workflow, and local UI still work after the change.

## Dev Chat 5 - Saved SQLite Summary in Local UI

- Added a read-only saved-history summary to the local Streamlit UI.
- Practiced reading from the existing local SQLite database without adding a separate persistence system.
- Displayed basic saved-run information such as analysis runs, job results, saved skill gaps, and top recurring gaps.
- Kept the feature local-only and avoided overbuilding a full history browser or comparison tool.
- Confirmed the UI, CLI smoke commands, database inspection workflow, and test suite still work.

## Dev Chat 5 - Recent Saved Runs in Local UI

- Added a read-only recent saved runs section to the local Streamlit UI.
- Practiced reading individual saved analysis records from the existing SQLite database.
- Kept the feature local-only and avoided overbuilding a full history browser or comparison dashboard.
- Preserved the SQLite save option, saved summary panel, sample-job workflow, pasted-job workflow, and resume selector.
- Confirmed the test suite, CLI smoke commands, database inspection workflow, and local UI still work after the change.

## Dev Chat 5 - Version 5 Local Persistence Checkpoint

- Documented the completed Version 5 local persistence workflow.
- Added a Version 5 checkpoint covering optional SQLite saving, saved database summaries, recent saved runs, and saved run details.
- Practiced keeping documentation aligned with actual project behavior instead of overstating future features.
- Clarified that the project remains local-only, rule-based, and not deployed.
- Confirmed the test suite and Git privacy checks still pass after documentation updates.

## Dev Chat 6 - Compare Saved Analyses

* Began Version 6 by adding a read-only comparison between two saved analysis results in the local Streamlit UI.
* Practiced identifying individual saved job results with stable database IDs instead of relying only on job names.
* Practiced comparing skill collections to identify shared gaps and gaps unique to each saved analysis.
* Kept the comparison descriptive instead of inventing an automatic job ranking, weighted score, or fit score.
* Used only the comparison data reliably supported by the existing SQLite schema and avoided an unnecessary database migration.
* Preserved the existing sample analysis, pasted job analysis, resume selection, SQLite saving, database summary, recent-run, and saved-detail workflows.
* Confirmed the test suite, CLI smoke commands, database inspection workflow, local Streamlit workflow, and Git privacy checks still work.

## Dev Chat 6 - Saved Gap Priority Summary

- Added a read-only saved gap priority summary to the local Streamlit UI.
- Practiced using saved SQLite analysis data to identify recurring missing skills across saved job results.
- Kept the summary descriptive instead of adding fit scores, weighted rankings, or automatic job recommendations.
- Preserved the existing analysis, SQLite saving, saved history, saved detail, and saved comparison workflows.
- Confirmed the test suite, CLI smoke commands, database inspection workflow, local UI workflow, and Git privacy checks still pass.

## Dev Chat 6 - Version 6 Checkpoint

- Documented the completed Version 6 saved-analysis comparison and decision-support workflow.
- Reviewed the implementation to make sure the documentation accurately reflects the SQLite data and local Streamlit behavior.
- Recorded the limitations of the current rule-based comparison, including the absence of fit scores, automatic rankings, semantic matching, deployment, and user accounts.
- Updated the project roadmap or README where necessary to distinguish current local features from future hosted-product ideas.
- Confirmed the test suite, CLI workflows, database inspection workflow, local UI, and Git privacy checks still work.

## Dev Chat 6 - Version 7 Planning

* Created a Version 7 planning document focused on saved-result organization and local data management.
* Chose a conservative next phase that improves the local SQLite/Streamlit workflow before deployment, authentication, or multi-user architecture.
* Identified likely Version 7 priorities such as clearer saved-result labels, sorting, filtering/search, optional metadata, and safe local cleanup.
* Kept hosted deployment, Clerk/authentication, cloud databases, OpenAI API, semantic matching, fit scores, and resume tailoring out of the immediate scope.
* Confirmed the project tests, CLI workflows, database inspection workflow, and Git privacy checks still pass.

## Dev Chat 6 - Improved Saved Result Labels

* Began Version 7 implementation by improving saved-result labels and sorting in the local Streamlit UI.
* Practiced making saved SQLite records easier to identify using stable information such as job names, timestamps, run IDs, job-result IDs, and gap counts where available.
* Improved the saved-history and comparison workflow without adding filtering, deletion, ranking, scoring, or new database schema changes.
* Preserved the existing analysis, SQLite saving, saved detail, saved comparison, and saved gap priority summary workflows.
* Confirmed the test suite, CLI smoke commands, database inspection workflow, local UI workflow, and Git privacy checks still pass.

## Dev Chat 6 - Saved Result Search

* Added a simple text search for saved analysis results in the local Streamlit UI.
* Practiced filtering saved SQLite records using case-insensitive text matching without modifying the underlying database.
* Preserved the existing saved-result labels and newest-first sorting while making saved analyses easier to find by job name and stable record information.
* Added friendly handling for no matches and for cases where fewer than two matching analyses are available for comparison.
* Kept the saved gap priority summary based on the complete saved history rather than silently changing its scope.
* Preserved the existing analysis, SQLite saving, saved history, saved details, saved comparison, and recurring-gap workflows.
* Confirmed the tests, CLI smoke commands, database inspection workflow, local UI workflow, and Git privacy checks still pass.

## Dev Chat 6 - Safe Saved Analysis Deletion

* Added a guarded local workflow for permanently deleting one selected saved job-analysis result.
* Practiced using parameterized SQLite deletion queries and transactions while preserving unrelated saved records.
* Added confirmation controls so destructive actions remain separate from normal saved-history browsing.
* Confirmed that related skill-gap records are cleaned up safely and that saved details, comparison controls, search results, and the recurring-gap summary refresh after deletion.
* Kept the feature limited to individual local records without adding bulk deletion, editing, archiving, authentication, or cloud storage.
* Confirmed the test suite, CLI smoke commands, database inspection workflow, local Streamlit workflow, and Git privacy checks still pass.

## Dev Chat 6 - Version 7 Checkpoint

* Documented the completed Version 7 saved-result organization and local data-management workflow.
* Recorded the improved saved-result labels, newest-first sorting, text search, and guarded single-result deletion features.
* Documented how SQLite deletion removes the selected saved job result and its related skill-gap records while preserving unrelated data.
* Recorded the Streamlit widget-state lesson that widget-backed session state must be reset before widget creation on a later rerun rather than modified after the widget is instantiated.
* Clarified that the current tests are executable scripts and that standard unittest discovery does not yet discover them.
* Kept deployment, authentication, cloud persistence, advanced metadata, bulk deletion, editing, rankings, and semantic matching outside the completed Version 7 scope.
* Confirmed the test suite, CLI commands, database inspection workflow, local UI workflow, and Git privacy checks still pass.

## Version 8 planning — testing and maintenance reliability

Planned Version 8 as a focused testing and maintenance reliability phase after completing Version 7 saved-result organization and deletion.

Key findings entering Version 8:
- The repository is clean on `main` and synchronized with `origin/main`.
- Version 7 is fully documented and merged.
- The current project uses script-style tests with plain `test_*` functions and direct execution blocks.
- `python3 run_tests.py` passes, but it does not currently run every test file.
- `tests/test_analysis_runner.py`, `tests/test_single_job_analysis.py`, and `tests/test_streamlit_app.py` pass when run directly but are not included in the main test runner output.
- `python3 -m unittest discover -s tests -p "test_*.py"` reports zero tests because the existing tests are not structured as discoverable `unittest.TestCase` tests.

Version 8 will focus on:
1. Updating the main test runner so one command runs every existing test file.
2. Deciding whether to keep the current script-style test approach or later migrate incrementally toward discoverable tests.
3. Cleaning up Streamlit deprecation warnings.
4. Documenting the Version 8 checkpoint.

This planning step intentionally avoided code changes, dependency changes, pytest adoption, deployment work, authentication, cloud databases, AI/API features, semantic matching, fit scores, and unrelated feature work.

## Version 8 Step 1 — Complete main test runner coverage

Updated `run_tests.py` so the project's main test command automatically discovers and executes every top-level file matching `tests/test_*.py`.

Before this change, `python3 run_tests.py` passed but only ran 7 of the repository's 10 test files. The analysis-runner, single-job-analysis, and Streamlit test files passed when run directly but were omitted from the main runner.

The updated runner:
- discovers all matching test files automatically,
- sorts them for deterministic execution,
- runs each test file in a separate Python process,
- uses the same Python interpreter that launched the runner,
- clearly reports which test file is running,
- stops and returns a failure if a test fails,
- fails clearly if no test files are found,
- and prints a final success message only after every test passes.

The test files remain simple executable Python scripts. This step did not add pytest, convert tests to `unittest.TestCase`, change dependencies, or modify application behavior.

This improved my understanding of:
- test runners,
- automatic file discovery,
- deterministic ordering,
- subprocess exit codes,
- failure propagation,
- and why a passing test command is only trustworthy when it actually includes every intended test.

## Version 8 Step 2 — Testing architecture decision

Documented the project's current testing strategy after updating the main runner to execute every test file.

The project will retain its current script-style tests for now. These tests use plain functions, Python `assert` statements, and direct-execution blocks. The canonical full-suite command is now:

```bash
python3 run_tests.py
```

The improved runner automatically discovers every top-level `tests/test_*.py` file, so new matching test files do not need to be manually added to a hard-coded runner list.

The project is not converting to `unittest.TestCase` or adding `pytest` at this stage. The current approach is readable, dependency-free, and reliable enough for the size and learning goals of the project. A framework migration would create significant code churn without solving an immediate problem.

The decision can be revisited if the project later needs fixtures, extensive mocking, parameterized tests, coverage tooling, more complex setup and teardown, continuous integration, or broader production use.

This step improved my understanding of:

* the difference between tests and test frameworks,
* why Python's `unittest` discovery does not recognize every possible test style,
* how a custom runner can provide reliable discovery,
* the tradeoff between standardization and unnecessary refactoring,
* and how to document a technical architecture decision honestly.

## Version 8 Step 3 — Streamlit width deprecation cleanup

Replaced deprecated Streamlit `use_container_width` arguments in the local UI with the newer `width` argument.

The goal was to preserve the existing layout while removing deprecation warnings. For elements that previously used `use_container_width=True`, the replacement was `width="stretch"` so the element continues to fill the available container width.

Also added a regression test to help prevent `use_container_width` from being reintroduced in `streamlit_app.py`.

This step did not change analysis logic, saved-history behavior, database behavior, search behavior, comparison behavior, deletion behavior, dependencies, or the test framework.

Validation completed:
- `python3 run_tests.py`
- `python3 tests/test_streamlit_app.py`
- `python3 -m py_compile streamlit_app.py tests/test_streamlit_app.py`
- manual Streamlit UI smoke test

This improved my understanding of:
- API deprecation warnings,
- preserving behavior while updating syntax,
- regression tests,
- the difference between maintenance changes and feature changes,
- and why small dependency/API updates should be isolated in their own branch.

## Version 8 checkpoint — testing and maintenance reliability

Completed Version 8 as a focused testing and maintenance reliability milestone.

Version 8 began after discovering that the project's main test command passed but executed only 7 of the 10 existing test files. The project also used script-style tests that were not recognized by Python's built-in `unittest` discovery, and the Streamlit UI emitted deprecation warnings for `use_container_width`.

Completed work:
- Updated `run_tests.py` to automatically discover and execute every top-level `tests/test_*.py` file.
- Ensured test files run in deterministic order as separate Python processes.
- Added clear failure behavior if a test fails or no test files are found.
- Established `python3 run_tests.py` as the canonical full-suite command.
- Documented the decision to retain the current script-style test architecture.
- Deferred pytest or `unittest.TestCase` migration until there is a demonstrated need.
- Replaced deprecated Streamlit `use_container_width=True` arguments with `width="stretch"`.
- Added a regression test to prevent deprecated width usage from returning to `streamlit_app.py`.
- Created the Version 8 checkpoint and reconciled the product roadmap.

At the Version 8 checkpoint, the main runner executed all 10 top-level test files and all tests passed.

Version 8 intentionally did not add deployment, authentication, cloud persistence, semantic matching, fit scores, automatic job ranking, resume tailoring, or another major product feature.

This version improved my understanding of:
- complete test-suite coverage,
- automatic test discovery,
- subprocess failure propagation,
- test-framework tradeoffs,
- architecture decision documentation,
- API deprecation cleanup,
- regression tests,
- and maintenance work as an important part of software development.

## Version 9 Step 1 — Portable resume input

Extended the local Streamlit workflow so a resume can be supplied without placing a private file at a predefined local path.

The pasted-job analysis workflow now supports:
- the safe sample resume,
- the private local resume when that file exists,
- pasted resume text,
- and an uploaded UTF-8 `.txt` resume.

Pasted and uploaded resume content is processed in memory. The app does not write the content to `data/resume/`, generated output files, or the SQLite database. Saved analyses use only a generic resume-source label rather than storing raw resume text.

The feature includes friendly validation for:
- blank pasted resume text,
- empty uploaded files,
- and uploaded files that cannot be decoded as UTF-8.

This step intentionally did not add PDF or DOCX parsing, new dependencies, authentication, deployment configuration, cloud storage, or a database-schema change.

Validation completed:
- `python3 tests/test_streamlit_app.py`
- `python3 run_tests.py`
- `python3 -m py_compile streamlit_app.py tests/test_streamlit_app.py`
- manual testing of sample, private-local, pasted, and uploaded resume workflows
- privacy and generated-file checks

This improved my understanding of:
- in-memory file handling,
- UTF-8 decoding,
- conditional Streamlit widgets,
- input validation,
- privacy-conscious UI design,
- and how removing local-file assumptions prepares an application for future hosting.

## Version 9 Step 2 — Pasted job metadata labels

Added optional job title and company fields to the local Streamlit pasted-job analysis workflow.

Before this change, pasted analyses could use a generic label such as `Pasted internship posting`, which made saved results harder to distinguish over time. The UI can now build a clearer job name from optional metadata:
- blank title and blank company preserve the existing default pasted-job name,
- title only uses the title,
- company only uses a readable company-based fallback,
- and company plus title creates a combined label.

The generated label flows through the existing analysis result and saved-history system using the existing job name field. This improves saved-analysis usability without changing the SQLite schema.

This step intentionally did not add source URLs, notes, tags, database migrations, authentication, deployment configuration, semantic matching, fit scores, or any new dependencies.

Validation completed:
- `python3 tests/test_streamlit_app.py`
- `python3 run_tests.py`
- `python3 -m py_compile streamlit_app.py tests/test_streamlit_app.py`
- manual Streamlit checks for blank metadata, title-only, company-only, company-plus-title, saved history, and saved search

This improved my understanding of:
- small UI metadata fields,
- string normalization,
- optional inputs,
- preserving default behavior,
- improving saved-record usability without a schema migration,
- and separating user-facing improvements from larger architecture changes.

## Version 9 Step 3 — Uploaded job-description input

Extended the local Streamlit analysis workflow so a job description can either be pasted into the app or uploaded as a UTF-8 `.txt` file.

Uploaded job descriptions are decoded and analyzed in memory. The app does not copy uploaded files into `data/jobs/`, write their raw contents to generated files, or store the raw job-description text in SQLite.

The upload workflow includes friendly validation for:
- no file selected,
- empty or whitespace-only files,
- and files that cannot be decoded as UTF-8.

The existing optional job title and company fields continue to create readable result and saved-history labels for both pasted and uploaded job descriptions.

This step intentionally did not add PDF or DOCX parsing, source URLs, notes, tags, a database migration, authentication, deployment configuration, or new dependencies.

Validation completed:
- `python3 tests/test_streamlit_app.py`
- `python3 run_tests.py`
- `python3 -m py_compile streamlit_app.py tests/test_streamlit_app.py`
- manual checks of pasted and uploaded job-description workflows
- empty-file and invalid-UTF-8 validation
- saved-history and search checks
- privacy and generated-file checks

This improved my understanding of:
- in-memory file uploads,
- UTF-8 decoding,
- conditional Streamlit input workflows,
- validating uploaded content,
- safe filename display,
- preserving privacy when handling user files,
- and reusing backend logic across multiple UI input methods.

## Version 9 Step 3 — Simplified local Streamlit layout

Simplified the local Streamlit UI layout after reviewing a PDF preview that showed the app had become too busy and hard to read.

The goal was to make the app feel more usable and closer to something that could eventually be published, without adding a new product feature or changing backend behavior.

The cleanup focused on:
- separating the main analysis workflow from saved-analysis management,
- reducing vertical clutter,
- grouping advanced saved-data tools more clearly,
- making deletion feel separate from normal browsing,
- making results easier to scan,
- and preserving the existing Streamlit-native style.

This step intentionally did not add uploaded job descriptions, source URLs, notes, tags, database migrations, authentication, deployment configuration, cloud persistence, semantic matching, fit scores, or new dependencies.

Validation completed:
- `python3 tests/test_streamlit_app.py`
- `python3 run_tests.py`
- `python3 -m py_compile streamlit_app.py tests/test_streamlit_app.py`
- manual Streamlit checks for sample analysis, pasted job analysis, portable resume input, metadata labels, saved history, search, comparison, priority summary, and guarded deletion

This improved my understanding of:
- user-facing UI polish,
- reducing cognitive load,
- grouping related controls,
- separating normal workflows from dangerous actions,
- preserving behavior during layout refactors,
- and why usability work can be just as important as adding features.

## Version 9 Step 4 — Simplified analysis input flow

Simplified the Streamlit analysis input flow after noticing that the UI asked for job source and job-description source in a repetitive way.

The new flow centers on one primary workflow choice. The sample path is treated as a quick demo that uses both the safe sample resume and the safe sample job together, instead of making the user separately choose sample inputs. The custom job path keeps the resume options, optional job title/company metadata, and pasted job-description input together.

This step focused on reducing UI friction and cognitive load without changing backend analysis logic, database behavior, saved-history behavior, comparison, deletion, or the SQLite schema.

This step intentionally did not add deployment, authentication, cloud persistence, source URLs, notes, tags, fit scores, semantic matching, PDF/DOCX parsing, or new dependencies.

Validation completed:
- `python3 tests/test_streamlit_app.py`
- `python3 run_tests.py`
- `python3 -m py_compile streamlit_app.py tests/test_streamlit_app.py`
- manual Streamlit checks for sample mode, pasted job mode, resume options, metadata labels, saved history, search, comparison, priority summary, and guarded deletion

This improved my understanding of:
- UI flow design,
- reducing repeated choices,
- grouping related inputs,
- hiding irrelevant controls,
- preserving behavior during layout cleanup,
- and making a prototype feel closer to a usable product.

## Version 9 Step 5 — Current analysis downloads

Added in-app download buttons for the current Streamlit analysis result.

After running an analysis, the Results area can now generate:
- a Markdown report, and
- a CSV skill-gap summary.

The downloads are generated in memory and do not write files into `data/outputs/` or other project folders. This makes the local UI more practical because a user can save or share an analysis result without using terminal commands.

The Markdown report includes the analyzed job name, summary counts, matched skills, missing skills, and recurring gaps. The CSV export includes missing-skill rows with job name, category, and skill columns.

This step intentionally did not change CLI output behavior, backend analysis logic, database schema, saved-history behavior, authentication, deployment configuration, source URLs, notes, tags, fit scores, semantic matching, or dependencies.

Validation completed:
- `python3 tests/test_streamlit_app.py`
- `python3 run_tests.py`
- `python3 -m py_compile streamlit_app.py tests/test_streamlit_app.py`
- manual Streamlit checks for sample, pasted, and uploaded job workflows
- manual download checks for Markdown and CSV files
- privacy and generated-file checks

This improved my understanding of:
- generating downloadable content in memory,
- using Streamlit download buttons,
- safe filename generation,
- CSV creation with Python's standard library,
- separating UI exports from disk-based CLI outputs,
- and making a local prototype feel more like a usable product.

## Version 9 Step 6 — Saved-analysis exports and backup

Added saved-analysis export and backup downloads to the local Streamlit UI.

When a saved SQLite database exists, the app can now provide:
- a saved analyses summary CSV,
- a saved skill gaps CSV,
- and a SQLite database backup download.

The CSV exports and database backup are generated from existing local saved data without writing new export files into the repository. This improves local data portability and makes the app more practical as an internship-search tool.

The exports intentionally avoid raw resume text and raw full job-description text. The SQLite backup is still private local data because it may contain saved job-analysis metadata and skill-gap results.

This step intentionally did not add cloud backup, restore/import behavior, database migrations, source URLs, notes, tags, authentication, deployment configuration, semantic matching, fit scores, or new dependencies.

Validation completed:
- `python3 tests/test_streamlit_app.py`
- `python3 run_tests.py`
- `python3 -m py_compile streamlit_app.py tests/test_streamlit_app.py`
- manual Streamlit checks for no-database and saved-database export states
- manual download checks for saved analyses CSV, saved skill gaps CSV, and SQLite backup
- privacy and generated-file checks

This improved my understanding of:
- local data portability,
- generating CSV exports from saved records,
- reading a SQLite database backup as bytes,
- protecting private local data,
- and adding practical user value without introducing cloud architecture.

## Version 9 checkpoint — usability and portability

Completed Version 9 as a usability, portability, and local-product-polish phase.

Version 9 moved the project closer to a practical private/local tool by improving the Streamlit workflow and making analysis results easier to use outside the app.

Completed work:
- Added portable resume input through safe sample, private local file, pasted text, and uploaded UTF-8 `.txt` resume options.
- Added optional job title and company labels for clearer saved-analysis names.
- Added uploaded UTF-8 `.txt` job-description input.
- Simplified the local Streamlit layout.
- Simplified the analysis input flow so the sample path uses the sample resume and sample job together.
- Added current-analysis downloads for Markdown reports and CSV skill-gap summaries.
- Added saved-analysis CSV exports and SQLite backup downloads.

The project remains intentionally local and rule-based. Version 9 did not add deployment, authentication, cloud persistence, semantic matching, fit scores, source URLs, notes, tags, PDF/DOCX parsing, or restore/import behavior.

Validation completed:
- `python3 tests/test_streamlit_app.py`
- `python3 run_tests.py`
- `python3 -m py_compile streamlit_app.py tests/test_streamlit_app.py`
- privacy/generated-file checks

This checkpoint improved my understanding of:
- product usability,
- portable input workflows,
- clearer UI flow,
- in-memory downloads,
- local data export,
- privacy-conscious handling of user text,
- and the difference between a useful local tool and a fully deployed production application.

## Version 10 Step 0 — planned saved-analysis metadata audit

Created the Version 10 planning document before making any database or UI changes.

This step reviewed the current saved-analysis architecture and identified source URL and notes as the strongest next metadata fields to add. Because these fields affect SQLite persistence, the plan emphasizes schema safety, backward compatibility, idempotent migration behavior, privacy boundaries, and focused tests before implementation.

Key decisions:
- Start Version 10 with planning before implementation.
- Treat source URL and notes as optional saved-analysis metadata.
- Avoid storing raw resume text or raw job-description text.
- Defer full application tracking, tags, status workflows, deployment, authentication, cloud persistence, and semantic/AI matching.
- Keep the next implementation branch small and focused on schema-safe metadata storage.

Verification:
- Confirmed the repository was clean on main before branching.
- Confirmed Version 9 was merged and documented.
- Confirmed the custom test suite passed before starting Version 10 planning.
- Kept the planning branch documentation-only.

## Version 10 Step 0 — planned saved-analysis metadata

Created the Version 10 planning document before making database or UI changes.

This step clarified that Version 10 should start with richer saved-analysis metadata, especially optional source URL and notes, but that implementation needs to be handled carefully because it affects SQLite persistence.

Key decisions:
- Treat source URL and notes as the strongest first metadata fields.
- Keep status, tags, full application tracking, restore/import, deployment, authentication, and AI/semantic matching out of this first Version 10 scope.
- Avoid storing raw resume text or raw job-description text.
- Plan for schema-safe, backward-compatible database changes before adding Streamlit UI fields.
- Keep Version 10 moving in small branches rather than combining metadata, UI, exports, and application tracking all at once.

What I learned:
- SQLite schema changes need more caution than UI-only changes because existing local databases may already exist.
- A migration should be idempotent, meaning it can run safely more than once without duplicating or breaking anything.
- Planning the data model before implementation helps prevent fragile code and protects saved user data.

## Version 10 Step 1 — added saved-analysis metadata storage

Added database support for optional saved-analysis metadata.

This step introduced storage for source URL and notes on saved job results while keeping the project backward-compatible with existing saved databases. The migration was designed to be idempotent, meaning it can run safely more than once without duplicating columns or damaging existing saved data.

Key decisions:
- Store metadata as optional saved job-result fields.
- Keep existing callers working by making metadata parameters optional.
- Preserve existing saved analyses during migration.
- Avoid storing raw resume text or raw job-description text.
- Keep this branch database-only before adding Streamlit UI fields.

What I learned:
- SQLite schema changes need migration logic when a local database may already exist.
- Backward compatibility means older code paths and older saved data should continue working after a schema update.
- Optional function parameters can add new behavior without forcing every existing caller to change immediately.

## Version 10 Step 2 — added Streamlit saved-analysis metadata fields

Added local Streamlit UI support for optional saved-analysis metadata.

This step connected the Version 10 database metadata fields to the local UI by allowing source URL and notes to be entered before saving an analysis. Saved results can now show this metadata, and saved-analysis exports/search behavior can include the metadata where appropriate.

Key decisions:
- Keep source URL and notes optional.
- Store the metadata only when saving to the local SQLite database.
- Preserve the simplified Version 9 analysis input flow.
- Avoid storing raw resume text or raw job-description text.
- Avoid expanding into full application tracking, tags, statuses, deployment, authentication, or AI matching.

What I learned:
- UI fields need to be connected to the save path, display path, search path, and export path to feel complete.
- Optional metadata should be normalized before storage so blank or whitespace-only values behave consistently.
- A small UI feature can touch several helper functions, so focused tests are important.

## Version 10 Step 3 — documented saved-analysis metadata checkpoint

Completed a short Version 10 checkpoint after adding saved-analysis metadata.

Version 10 added optional source URL and notes support across the local saved-analysis workflow. The project now stores this metadata safely in SQLite, passes it through the Streamlit save flow, shows it in saved analyses, includes it in search, and exports it in the saved analyses CSV.

Key decisions:
- Keep Version 10 focused on source URL and notes.
- Avoid expanding into statuses, tags, full application tracking, deployment, authentication, or AI matching.
- Keep the checkpoint short so the project can move faster toward publish-readiness.

Verification:
- Confirmed tests still pass.
- Confirmed generated/private files are not tracked.

## Version 11 Step 1 — polished Streamlit app for local demo

Improved the local Streamlit app so it is easier to understand and demo.

This step focused on publish-readiness without changing the underlying architecture. The app now presents itself more clearly as a local/private internship fit and skill-gap analyzer, explains the safe sample workflow, and summarizes privacy boundaries around pasted/uploaded resumes, job descriptions, SQLite saving, and optional saved metadata.

Key decisions:
- Improve the current local Streamlit product before jumping to hosting or accounts.
- Keep the app local/private for now.
- Preserve the existing analysis, saved-history, metadata, search, comparison, deletion, and export behavior.
- Avoid adding Clerk, authentication, cloud databases, deployment, or a rewrite in this step.

What I learned:
- Publish-readiness is not only deployment; it also means the product explains itself clearly.
- A future hosted/account-based version will be easier to design once the local product experience is cleaner.

## Version 11 Step 2 — added README quickstart and deployment-readiness checklist

Added publish-readiness documentation for the local version of the project.

This step made the repository easier to understand, run, and demo by adding or improving the README quickstart and creating a deployment-readiness checklist. The checklist separates what is already demo-ready from what still needs to change before a hosted multi-user version exists.

Key decisions:
- Keep the current project positioned as a local/private Streamlit tool.
- Document the safe sample workflow and local setup commands.
- Clearly state privacy boundaries around resumes, job descriptions, SQLite saving, source URL, and notes.
- Avoid jumping directly into Clerk, authentication, cloud databases, deployment, or a rewrite.
- Use this step to prepare for the next larger direction: an account-based hosted web app.

What I learned:
- Publish-readiness includes setup clarity, demo instructions, and privacy boundaries, not only deployment.
- A local SQLite app should not simply have authentication bolted onto it without redesigning the data model and storage boundaries.
- The next hosted version needs an intentional architecture decision before implementation.

## Version 12 Step 1 — added Next.js web-app scaffold

Started the transition from the local Streamlit prototype toward a larger hosted account-based web application.

This step added a separate Next.js app in the `web/` folder while preserving the existing Python/Streamlit app. The new web app is only a scaffold for now. It introduces the future hosted product direction without adding authentication, cloud persistence, or a Python API service yet.

Key decisions:
- Keep the existing Python/Streamlit analyzer working.
- Add the future hosted frontend in a separate `web/` folder.
- Use Next.js as the frontend foundation.
- Defer Clerk-style authentication, Postgres/Supabase database work, and Python analysis service integration to later branches.
- Avoid claiming that account saving or hosted analysis works before those features exist.

What I learned:
- A larger web app can be introduced safely beside an existing working app.
- Separating the frontend scaffold from the Python analyzer reduces risk.
- The hosted architecture should be built in layers: frontend first, then auth, then database, then analysis-service integration.

## Version 12 Step 2 — added Clerk-style auth shell

Added the first authentication shell for the future hosted web app.

This step connected the Next.js frontend scaffold to Clerk-style authentication. The web app now has Clerk provider setup, sign-in and sign-up routes, signed-in/signed-out navigation states, and a protected dashboard route. The dashboard is still a placeholder for the future account-based product and does not yet save analyses or connect to a cloud database.

Key decisions:
- Add authentication structure before adding cloud persistence.
- Keep the existing Python/Streamlit app unchanged.
- Keep Supabase/Postgres work for a later branch.
- Keep the dashboard honest by showing future saved-analysis areas without claiming they work yet.
- Keep Clerk secrets in local environment files and out of Git.

What I learned:
- Authentication in a Next.js app involves provider setup, route protection, public auth pages, and signed-in/signed-out UI states.
- Environment variables separate private local configuration from committed source code.
- A protected dashboard can be built before the database exists, as long as the UI clearly labels unfinished features.

## Version 12 Step 3 — designed Supabase user-owned analysis schema

Designed the first cloud database schema for the future hosted account-based version.

This step added a draft Supabase/Postgres schema for user-owned analysis data, including profiles, resume profiles, analysis runs, job analyses, missing skill gaps, and matched skills. The schema uses Clerk user IDs as the ownership field and includes first-pass Row Level Security policies so users can only access rows that belong to their account.

Key decisions:
- Keep the existing local Python/Streamlit app unchanged.
- Design the cloud schema before wiring Supabase into the app.
- Store Clerk user IDs as text because Clerk IDs are strings.
- Use Row Level Security as the main database-level protection model.
- Treat storing raw resume text and job-description text as a privacy-sensitive design question before public launch.

What I learned:
- Moving from local SQLite to hosted Postgres requires explicit user ownership on every saved-data table.
- Row Level Security policies act like database-level filters that restrict which rows a signed-in user can read or modify.
- Authentication alone is not enough; the database schema also needs user-specific access boundaries.

## Version 12 Step 4 — added Supabase client scaffold

Added the first Supabase client scaffolding for the future hosted web app.

This step installed the Supabase JavaScript client, added safe environment-variable placeholders, created a Clerk-aware Supabase client helper, and added a dashboard status section for checking the future cloud database connection. It does not yet save analyses, write data, or connect the Python analyzer to the web app.

Key decisions:
- Add Supabase wiring after the Clerk auth shell.
- Keep the existing Python/Streamlit app unchanged.
- Use Clerk session tokens for future Supabase RLS-backed queries.
- Keep Supabase service-role secrets out of browser code.
- Show a safe dashboard status instead of pretending cloud saving works.
- Defer real saved-analysis writes and Python analysis service integration to later branches.

What I learned:
- Supabase client setup requires public project URL/key values, while private service-role keys must never be exposed in frontend code.
- Clerk and Supabase need to agree on the signed-in user identity so Row Level Security can protect user-owned rows.
- A cloud integration can start with a read-only status check before adding data creation or persistence.

## Version 12 Step 5 — added cloud saved-analysis read model

Added the first read-only cloud saved-analysis model for the hosted web app.

This step created a TypeScript read model for user-owned rows in the Supabase `job_analyses` table and added a dashboard panel that can display loading, not-configured, empty, error, or saved-analysis list states. The dashboard still does not create or save analyses, but it now has the first real read path for future cloud-backed saved history.

Key decisions:
- Read from `job_analyses` before adding any write path.
- Avoid selecting or displaying raw `job_text`.
- Keep the existing Python/Streamlit app unchanged.
- Keep the cloud dashboard honest that saving and Python analysis integration are still future work.
- Let Supabase RLS remain responsible for filtering rows to the signed-in Clerk user.

What I learned:
- A read model is a small layer that shapes database rows into the data the UI needs.
- Building read-only database access first is safer than immediately adding writes.
- User-owned cloud data needs both application-level care and database-level Row Level Security.

## Version 12 Step 6 — added cloud saved-analysis write contract

Designed the first cloud saved-analysis write path for the hosted web app.

This step added a small TypeScript contract for the future Supabase save helper and documented the planned insert order. The first hosted write path is intentionally designed to save analysis results and job metadata without storing raw resume text or raw job-description text.

Key decisions:
- Define the write payload before implementing Supabase inserts.
- Save matched skills, missing skills, counts, and optional metadata.
- Avoid saving raw resume text or raw job text in the first hosted write path.
- Keep the existing Python/Streamlit app unchanged.
- Keep this branch free of UI changes and database writes.

What I learned:
- A write contract helps define the data boundary before adding persistence.
- Insert order matters when tables are connected by foreign keys.
- Privacy decisions should be made before the app starts writing user data to the cloud.

## Version 12 Step 7 — added Supabase saved-analysis insert helper

Added the first Supabase insert helper for future cloud saved analyses.

This step implemented a helper that uses the saved-analysis write contract to create analysis run, job analysis, matched skill, and missing skill rows in Supabase. The helper is not connected to the UI yet, but it defines the first real cloud write path for the hosted web app.

Key decisions:
- Insert parent rows before child rows.
- Use the signed-in Clerk user ID as the ownership field.
- Rely on Supabase Row Level Security for user-owned access.
- Avoid saving raw resume text or raw job-description text.
- Attempt best-effort cleanup if a later insert fails after parent rows are created.
- Keep this helper separate from the UI until the write behavior is tested carefully.

What I learned:
- Cloud writes need clear insert order when foreign keys connect tables.
- A save helper should return safe result states instead of leaking raw database errors into the UI.
- Partial failure handling matters because multiple related rows are created during one save operation.

## Version 12 Step 8 — added dashboard test save action

Added a controlled dashboard action for testing the cloud saved-analysis write path.

This step connected the signed-in dashboard to the Supabase insert helper through a clearly labeled test action. The button saves a small sample analysis to Supabase so the Clerk authentication, Supabase client, RLS policies, insert helper, and read model can be tested together before building the real web analysis workflow.

Key decisions:
- Add a controlled test action before adding real resume/job analysis saving.
- Keep the payload small and clearly marked as sample data.
- Avoid saving raw resume text or raw job-description text.
- Keep the Python/Streamlit app unchanged.
- Keep the dashboard honest that the real web analysis workflow and Python analysis service are not connected yet.

What I learned:
- Testing a full cloud write path requires the auth layer, database client, RLS policies, insert helper, and read model to work together.
- A controlled test save is safer than immediately connecting user-provided resume/job text.
- UI copy matters when a button exists only for development or verification.

## Version 12 Step 9 — added web analysis prototype boundary

Added the first minimal analysis workflow to the hosted web dashboard.

This step created a small pasted-text analysis form, shared TypeScript result types, and a temporary rule-based web adapter. The adapter compares a small set of known skills between pasted resume text and pasted job text so the dashboard can show matched and missing skills before the full Python analysis service is connected.

Key decisions:
- Add the web analysis boundary before connecting the Python service.
- Keep the prototype honest that the full analyzer still lives in Python.
- Do not save pasted resume text or job-description text from this form.
- Do not connect the analysis form to Supabase saving yet.
- Preserve the existing local Python/Streamlit app unchanged.

What I learned:
- A boundary defines the shape of data that future services can exchange.
- A temporary adapter can make the UI testable before the real backend service is connected.
- Separating analysis, saving, and cloud persistence keeps each branch safer and easier to debug.

## Version 12 Step 10 — mapped web analysis results to cloud save contract

Added a mapping layer between the web analysis prototype and the cloud saved-analysis write contract.

This step created a helper that converts a web analysis input and result into the existing cloud save payload shape. The mapping carries over job metadata, matched skills, and missing skills, while intentionally excluding raw pasted resume text and raw job-description text.

Key decisions:
- Add the mapping layer before adding a real “Save this analysis” button.
- Keep analysis, mapping, and Supabase writes separated.
- Exclude raw resume and job text from the cloud save payload.
- Preserve the existing Python/Streamlit app unchanged.
- Keep the dashboard honest that real cloud saving from the analysis form is not connected yet.

What I learned:
- Mapping helpers create clean boundaries between UI state and persistence contracts.
- Excluding sensitive raw text at the mapping layer helps enforce privacy before data reaches the database helper.
- Separating mapping from saving makes the next branch safer and easier to test.

## Version 12 Step 11 — added prototype analysis cloud save action

Connected the web analysis prototype to the cloud save path.

This step added a “Save this prototype analysis” action after a pasted-text analysis result is generated. The dashboard now maps the prototype analysis result into the cloud save contract and uses the Supabase insert helper to save matched skills, missing skills, counts, and optional metadata to the cloud database.

Key decisions:
- Connect the prototype analysis result to the existing mapper and Supabase insert helper.
- Keep the save button clearly labeled as a prototype action.
- Avoid saving raw resume text or raw job-description text.
- Keep the full Python analysis service disconnected for now.
- Preserve the existing local Python/Streamlit app unchanged.

What I learned:
- Connecting a feature end-to-end is easier after separating analysis, mapping, and saving into smaller layers.
- Privacy boundaries need to be enforced at the UI, mapping, and persistence layers.
- A prototype save flow can validate the cloud architecture before the production analysis service exists.

## Version 12 Step 12 — added FastAPI analysis service prototype

Added the first Python API boundary for the future hosted web app.

This step created a local FastAPI service prototype that exposes the existing rule-based Python analyzer through HTTP endpoints. The service can accept pasted resume and job text, run the analyzer in memory, and return matched and missing skills in a JSON shape that the Next.js app can eventually consume.

Key decisions:
- Use FastAPI to preserve and reuse the existing Python analysis work.
- Keep the API local/prototype-only for now.
- Do not connect the Next.js app to the API yet.
- Do not save analyses from the API.
- Do not store raw resume text or raw job-description text.
- Keep Supabase writes and Python analysis service integration as separate steps.

What I learned:
- A service boundary lets a frontend call existing backend logic without rewriting it.
- API request and response models define a contract between the web app and Python analyzer.
- Wrapping existing code safely is better than duplicating the analyzer in another language.

## Version 12 Step 13 — connected web analysis form to FastAPI service

Connected the Next.js dashboard analysis form to the local FastAPI analysis service.

This step replaced the main web analysis form behavior with a call to the Python API boundary. The dashboard can now send pasted resume and job text to the local FastAPI `/analyze` endpoint, receive matched and missing skills, display the result, and continue using the existing prototype cloud save path for the result data.

Key decisions:
- Use the FastAPI service as the bridge to the existing Python analyzer.
- Keep the API local/prototype-only for now.
- Keep the temporary TypeScript analyzer as a reference or fallback only if needed.
- Do not save raw resume text or raw job-description text.
- Do not connect API authentication, deployment, Docker, or production infrastructure yet.
- Preserve Supabase saving as a separate result-only cloud save path.

What I learned:
- A frontend can call a local backend service through a clearly defined JSON contract.
- Local cross-origin development may require explicit CORS handling.
- Connecting the real Python analysis boundary makes the hosted app direction more credible without rewriting the analyzer in TypeScript.

## Version 12 Step 14 — cleaned up web FastAPI prototype language and local dev commands

Cleaned up the web app language and local development instructions after connecting the dashboard analysis form to the FastAPI Python service.

This step clarified that the dashboard analysis form now calls the local FastAPI service, while the hosted/deployed service is not live yet. It also improved the local two-server workflow for running the Python API and Next.js app together.

Key decisions:
- Keep this as a cleanup branch, not a feature branch.
- Clarify that the web analysis form uses the local Python service boundary.
- Keep privacy language clear: raw pasted resume and job-description text are not saved.
- Keep the existing Python/Streamlit app unchanged.
- Avoid adding deployment, Docker, API authentication, or production infrastructure yet.

What I learned:
- After adding a service boundary, documentation and UI copy need to catch up so the product is not misleading.
- A two-server local workflow should be easy to run before adding deployment complexity.
- Cleanup steps can make a project more demo-ready without adding new architecture.

## Version 12 Step 15 — added local full-stack demo script

Added a script for running the local full-stack web demo.

This step created a small shell script that starts the FastAPI Python analysis service, checks the API health endpoint, and then starts the Next.js development server. The script makes it easier to demo the current hosted-app prototype locally without remembering multiple commands.

Key decisions:
- Keep this as a local development helper, not deployment.
- Start FastAPI and Next.js together while preserving the existing architecture.
- Avoid Docker, production process managers, API authentication, or deployment configuration for now.
- Keep Clerk and Supabase secrets in local environment files and out of Git.
- Preserve the existing Python/Streamlit app unchanged.

What I learned:
- A local full-stack project often needs a repeatable startup workflow before deployment.
- Cleanup behavior matters when a script starts background processes.
- Developer-experience improvements can make a project easier to demo without adding new product features.

## Version 13 Step 1 — Deployment path decision and checklist

Created a focused deployment-path checklist for the first hosted full-stack prototype.

Chosen direction:

* Vercel for the Next.js frontend
* Render or Railway for the FastAPI backend
* Supabase for Postgres/cloud saved analyses
* Clerk for authentication

Key decisions:

* Keep the stable local Python/Streamlit app intact.
* Deploy the hosted prototype in small steps rather than all at once.
* Do not save raw resume or job-description text in the hosted write path yet.
* Do not commit secrets or local environment files.
* Prepare FastAPI hosting, production CORS, Supabase RLS/JWT verification, and Vercel environment variables before a public demo.

Next implementation branch:

* feature/fastapi-hosting-prep

## Version 13 Step 2 — Prepare FastAPI service for backend hosting

Prepared the FastAPI analysis service for a future backend deployment step.

Changes included:

* Confirmed the hosted backend entrypoint should be `api.main:app`.
* Added or confirmed package/module support for the `api` service.
* Documented local and hosting-style FastAPI start commands.
* Documented the `/health` endpoint as the backend health check.
* Documented the `/analyze` endpoint as the analysis API boundary.
* Added or confirmed environment-based CORS configuration using `ALLOWED_ORIGINS`.
* Preserved local development defaults for the Next.js app.
* Kept the API privacy boundary: pasted resume and job text are analyzed in memory and are not written to disk, SQLite, Supabase, or external APIs.

Important caution:

* The FastAPI backend is still a prototype and does not yet include production API authentication.

Next step:

* Version 13 Step 3 — prepare Next.js/Vercel environment configuration.

## Version 13 Step 3 — Prepare Next.js for Vercel environment configuration

Prepared the Next.js frontend for a future Vercel deployment step.

Changes included:

* Updated the web environment example file with the required Clerk, Supabase, and analysis API variables.
* Documented that local values belong in `web/.env.local` and production values belong in the Vercel project dashboard.
* Clarified that `NEXT_PUBLIC_ANALYSIS_API_URL` should point to the local FastAPI server during development and the deployed Render/Railway FastAPI URL in production.
* Clarified that `NEXT_PUBLIC_` variables are browser-visible and should only contain values that are safe to expose.
* Preserved the rule that real secrets must never be committed.
* Preserved the rule that Supabase service-role keys must never be used in browser code.

Important caution:

* This was configuration preparation only. The web app has not been deployed to Vercel yet.

Next step:

* Version 13 Step 4 — configure production CORS strategy between the deployed frontend and FastAPI backend.

## Version 13 Step 4 — Configure production CORS strategy

Configured and documented the CORS strategy for the future hosted FastAPI backend.

Changes included:

* Confirmed or added `ALLOWED_ORIGINS` as the backend environment variable for CORS.
* Kept local development defaults limited to `http://localhost:3000` and `http://127.0.0.1:3000`.
* Avoided using `*` as the default allowed origin list.
* Documented how the deployed Vercel frontend URL should be added to the backend host environment variables.
* Added or strengthened tests for parsing comma-separated origins and preserving safe local defaults.
* Verified that the backend health endpoint and API tests still pass.

Important caution:

* CORS controls which browser origins can call the backend, but it is not the same thing as API authentication.
* The FastAPI service is still a prototype and needs production API authentication before serious public use.

Next step:

* Version 13 Step 5 — deploy backend prototype to Render or Railway.

## Version 13 Step 5 — Deploy FastAPI backend prototype to Render

Deployed the FastAPI analysis service prototype to Render as a Python web service.

Render deployment settings:

* Runtime: Python 3
* Root directory: repository root
* Build command: `pip install -r requirements.txt`
* Start command: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
* Health check path: `/health`

Verified:

* Render built and started the backend service.
* `GET /health` returned a healthy response.
* `POST /analyze` returned the expected analysis response shape using safe sample text.
* CORS still uses explicit allowed origins through `ALLOWED_ORIGINS`.

Important caution:

* This is a prototype backend deployment, not a production-secure API.
* CORS is not authentication.
* Real resume/job text should not be pasted into public logs, docs, screenshots, or commits.
* Production API authentication or request validation should be added before serious public use.

Next step:

* Version 13 Step 6 — deploy the Next.js frontend prototype to Vercel and point it to the Render backend URL.

## Version 13 Step 5.5 — Fix API matched/missing skill consistency

Fixed a FastAPI analysis response consistency issue discovered during Render deployment verification.

The hosted `/analyze` test revealed that a skill could appear in both `matchedSkills` and `missingSkills`.

Changes included:
- Added or strengthened a regression test for API matched/missing skill consistency.
- Ensured skills present only in the job text appear as missing, not matched.
- Ensured skills present in both resume and job text appear as matched.
- Ensured no skill appears in both result lists.

Important lesson:
- Deployment verification should check not only whether the service responds, but whether the response content is logically correct.

Next step:
- Redeploy the Render backend with the bugfix, then continue to Version 13 Step 6 — deploy the Next.js frontend prototype to Vercel.

## Version 13 Step 6 — Deploy Next.js frontend prototype to Vercel

Deployed the Next.js frontend prototype to Vercel and pointed it to the hosted Render FastAPI backend.

Vercel deployment settings:
- Framework preset: Next.js
- Root directory: `web`
- Production branch: `main`
- Build command: `npm run build`
- Analysis API URL: Render FastAPI backend

Configured Vercel environment variables for:
- Clerk authentication
- Supabase client access
- Render FastAPI API URL

Updated Render CORS so the deployed Vercel frontend origin can call the hosted FastAPI backend.

Verified:
- Vercel landing page loads.
- Sign-in/sign-up routes load.
- Dashboard protection works.
- Signed-in dashboard loads.
- Hosted frontend can call the hosted Render `/analyze` endpoint.
- Safe sample analysis returns the expected matched/missing skill result.
- Prototype save flow was tested against Supabase if Clerk/Supabase/RLS were configured.

Important caution:
- This is the first hosted prototype, not a production-secure SaaS.
- CORS is not API authentication.
- The backend still needs production API authentication or request validation before serious public use.
- Raw resume/job text is still not intentionally stored by the hosted analysis API.

Next step:
- Version 13 Step 7 — hosted deployment checkpoint and production-readiness cleanup list.

## Version 13 Step 7 — Hosted deployment checkpoint

Created a hosted deployment checkpoint after successfully deploying the first full-stack prototype.

Current hosted architecture:

* Vercel hosts the Next.js frontend.
* Render hosts the FastAPI backend.
* Supabase provides the cloud database layer.
* Clerk provides authentication.
* The frontend calls the hosted Render `/analyze` endpoint through `NEXT_PUBLIC_ANALYSIS_API_URL`.

Captured deployment lessons:

* Vercel production deployments may need to be redeployed or promoted after project setting changes.
* The Vercel project root must be `web`.
* Local `.env.local` files may be hidden in Finder, so terminal commands are useful for copying values safely.
* The actual app uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
* Render CORS must include the exact Vercel browser origin shown in request headers.
* CORS origins should not include trailing slashes.
* Chrome DevTools Network and `curl -i -X OPTIONS` are useful for diagnosing CORS failures.

Important caution:

* This is a hosted prototype, not production-secure SaaS.
* CORS is not authentication.
* The backend still needs production API authentication or request validation before serious public use.

Next step:

* Version 13 Step 8 — add a hosted prototype notice and deployment status section to the web app or README.

## Version 13 Step 8 — Hosted prototype notice and deployment status

Added visible hosted-prototype messaging to the web app after the first successful Vercel + Render deployment.

Changes included:

* Added a clear notice that the hosted app is still a prototype.
* Clarified that the analyzer is currently rule-based.
* Clarified that the frontend is deployed on Vercel and connected to the Render FastAPI backend.
* Added or documented the current deployment stack: Vercel, Render, Supabase, and Clerk.
* Added a warning not to paste sensitive resume or job text into the hosted prototype yet.
* Preserved the existing analysis, auth, and cloud-save behavior.

Important caution:

* The app is hosted, but it is not production-secure SaaS yet.
* CORS is working, but CORS is not authentication.
* The backend still needs production API authentication or request validation before broad sharing.

Next step:

* Version 13 Step 9 — add a hosted demo verification checklist or begin API authentication/request validation planning.

## Version 13 Step 9 — API request validation layer

Added the first request-validation layer between the hosted Next.js frontend and the Render FastAPI backend.

Changes included:
- Added `ANALYSIS_API_SHARED_SECRET` support to FastAPI.
- Required `X-Analysis-Api-Key` on `/analyze` when the shared secret is configured.
- Kept `/health` public for hosting health checks.
- Added a Next.js route handler so browser requests go to `/api/analyze` instead of directly calling Render.
- Protected the route handler with Clerk server-side auth where supported.
- Forwarded analysis requests from Vercel to Render using server-only environment variables.
- Preserved the existing analysis request and response shape.
- Added tests for missing, wrong, and correct shared-secret behavior.

Important caution:
- This is request validation, not full production security.
- CORS is still useful but is not authentication.
- The shared secret must be stored only in Vercel and Render environment variables.
- The shared secret must never use a `NEXT_PUBLIC_` prefix.

Next step:
- Redeploy Render and Vercel with the new environment variables, then verify the hosted protected analysis flow.

## Version 13 Step 10 — Verify Clerk/Supabase RLS saved-analysis flow

Verified the hosted Clerk/Supabase saved-analysis flow on the deployed prototype.

Checks performed:
- Signed in as one Clerk user and saved a safe sample analysis.
- Confirmed the saved analysis appeared in that user’s saved analyses panel.
- Signed in as a second Clerk user and confirmed the first user’s saved analysis was not visible.
- Saved a separate safe sample analysis as the second user.
- Confirmed each user only saw their own saved analyses.
- Checked Supabase tables to confirm rows were associated with distinct Clerk user IDs.

Important result:
- The hosted prototype’s saved-analysis flow is working with user-owned data isolation through Clerk/Supabase RLS.

Important caution:
- This confirms the current prototype save/read path, but it is not a full production security audit.
- RLS protects database rows, while API request validation protects the FastAPI analysis endpoint. Both are useful but neither replaces a complete privacy/security review.

Next step:
- Version 13 Step 11 — clean up hosted deployment docs/env naming and decide the next product/security priority.

## Version 13 Step 11 — Clean up hosted env naming and deployment docs

Cleaned up hosted deployment environment-variable naming after the first successful Vercel + Render + Supabase + Clerk deployment.

Changes included:

* Made deployment docs and env examples match the actual hosted app configuration.
* Standardized Supabase frontend env naming around `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
* Removed or clarified older references to `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
* Clarified that the browser now calls the Next.js `/api/analyze` route instead of calling Render directly.
* Clarified that `ANALYSIS_API_URL` is server-only and points from Vercel to Render.
* Clarified that `ANALYSIS_API_SHARED_SECRET` is server-only and must be set in both Vercel and Render.
* Preserved the rule that secrets must never use a `NEXT_PUBLIC_` prefix.

Important caution:

* This was a cleanup step, not a new security feature.
* The hosted prototype still needs continued security/privacy review before broad public use.

Next step:

* Version 13 Step 12 — choose the next product/security implementation priority.

## Version 13 Step 12 — Improve hosted analysis error handling

Improved hosted analysis error handling for the Vercel + Render analysis flow.

Changes included:
- Added safer error handling in the Next.js `/api/analyze` route.
- Added clearer handling for missing backend URL configuration.
- Added clearer handling for backend unavailability, timeouts, non-JSON responses, and non-2xx backend responses.
- Preserved the successful FastAPI analysis response shape.
- Improved user-facing dashboard error messages so hosted failures are easier to understand.
- Avoided exposing secrets, stack traces, or pasted resume/job text in error messages.
- Added a short troubleshooting note to the web README.

Important caution:
- This improves hosted prototype reliability and demo behavior, but it is not a full production observability or security system.

Next step:
- Version 13 Step 13 — improve hosted save/read error handling for Supabase saved analyses.

## Version 14 Step 1 — Improve hosted saved-analysis error handling

Improved the hosted Supabase saved-analysis save/read flow so common hosted failures produce safer, clearer UI messages.

What changed:
- Added safer handling for Supabase save failures.
- Added safer handling for saved-analysis list/read failures.
- Improved save feedback states in the dashboard.
- Added a small Supabase error-message helper.
- Added a short hosted save/read troubleshooting note to the web README.

What stayed the same:
- Successful save/read behavior should remain unchanged.
- The database schema was not changed.
- RLS was not disabled or bypassed.
- No service-role keys were added to browser code.
- Raw resume/job text is still not intentionally saved.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.

Learning:
This step reinforced the difference between developer-facing errors and user-facing errors. Hosted apps need safe, calm failure messages because env, auth, RLS, and network issues are normal deployment failure points.

## Version 14 Step 2 — Add hosted prototype smoke test

Added a concise hosted prototype smoke-test checklist for verifying the deployed app before demos or after deployment changes.

What changed:
- Added a repeatable checklist for the hosted Vercel + Render + Clerk + Supabase prototype.
- Included pre-flight Git checks, automated local tests, hosted backend health checks, hosted frontend checks, Clerk auth checks, analysis checks, Supabase save/read checks, and user-isolation/RLS checks.
- Added pass/fail criteria for deciding whether the prototype is safe to demo.

Why this matters:
The project is now hosted, so it needs a simple way to confirm the full deployed flow still works. A smoke test helps catch broken env vars, auth issues, backend downtime, Supabase/RLS problems, and privacy mistakes before showing the app.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Hosted Render `/health` check passed if manually verified.
- Hosted browser analysis/save/read/RLS flow should be checked before demos.

Learning:
This step reinforced the difference between unit tests and smoke tests. Unit tests check isolated behavior, while a hosted smoke test checks whether the real deployed pieces still work together.

## Version 14 Step 3 — Update README for hosted prototype

Updated the project README so it accurately explains the current local app and hosted full-stack prototype.

What changed:
- Clarified that the project is a rule-based internship fit and skill-gap analyzer.
- Documented the current hosted architecture: Vercel Next.js frontend, Clerk auth, Supabase/Postgres saved analyses with RLS, and Render FastAPI backend.
- Explained what currently works locally and in the hosted prototype.
- Added or clarified links to hosted smoke testing and existing test documentation.
- Kept privacy/security language conservative and honest.
- Clarified that the hosted app is still a prototype and should not be treated as production-secure SaaS.

What stayed the same:
- No app code changed.
- No database schema changed.
- No environment files or secrets were added.
- No private resume/job text was added.
- No new features were claimed beyond the current implementation.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.

Learning:
This step reinforced that a README is part of product reliability. It should help someone understand what exists, how to run it, how to test it, and what not to assume yet.

## Version 14 Step 4 — Final product polish before UI redesign

Completed a small hosted product polish pass focused on clarity, copy, and user-facing states before any larger UI redesign.

What changed:
- Improved landing page and/or dashboard copy to make the project easier to understand.
- Clarified the analysis flow for the hosted prototype.
- Improved wording for relevant status, empty, success, or error states.
- Reduced redundant prototype language where appropriate.
- Preserved essential privacy and prototype warnings.

What stayed the same:
- No backend behavior changed.
- No analyzer logic changed.
- No database schema or RLS policy changed.
- No Clerk/Supabase auth behavior changed.
- No new features were added.
- No new dependencies were added.
- The hosted prototype is still described conservatively and honestly.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.
- Local browser review confirmed the copy/state polish did not obviously break the UI.

Learning:
This step reinforced that product polish is not only visual design. Clear copy, calm states, honest limitations, and privacy guidance make a prototype easier to demo and safer to share.

## Version 14 Step 5 — Feature-parity and public-product roadmap audit

Created a practical roadmap for turning the hosted prototype into a finished public Job Fit & Skill-Gap Analyzer.

What changed:
- Added a public-product roadmap audit.
- Reframed the public product as Job Fit & Skill-Gap Analyzer while keeping the current repo name unchanged.
- Compared local app capabilities, current hosted web capabilities, and final public product requirements.
- Identified feature-parity gaps between the Streamlit/local app and hosted web app.
- Clarified public v1 requirements, later enhancements, and production-readiness needs.
- Captured the desired design direction: vibrant, bubbly, summery, sleek, modern, professional, and technical without feeling like a generic AI SaaS app.
- Recommended Version 15 as the start of hosted feature-parity implementation.

Important product decisions:
- First public version can stay rule-based.
- Semantic/AI matching can come later.
- Save structured analysis results and metadata first.
- Do not prioritize raw resume/job text storage yet.
- Persistent resume profiles are desired eventually.
- Users should be able to use a different resume per analysis.
- The final goal is a serious public tool safe enough for strangers and friends/family to use.

What stayed the same:
- No app code changed.
- No backend behavior changed.
- No database schema changed.
- No secrets or private data were added.
- No new dependencies were added.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.

Learning:
This step clarified the difference between a hosted prototype milestone and a finished public product. The hosted architecture is now the foundation; the next phase is rebuilding feature parity, production safety, and final design on top of it.

## Version 15 Step 1 — Add hosted recurring gap stats

Added hosted recurring skill-gap stats to the Next.js dashboard.

What changed:
- Added a dashboard view for recurring missing skills across the signed-in user's saved analyses.
- Ranked missing skills by how often they appear across saved results.
- Added clear empty/error states for cases where there are no saved analyses, no missing skills yet, or saved-analysis data cannot be loaded.
- Preserved the existing hosted analysis and save/read behavior.
- Kept the implementation based on structured saved analysis data rather than raw resume/job text.

Why this matters:
This is one of the most important feature-parity steps from the original local app. The product is more useful when it can show patterns across many job postings, not just results for one job at a time.

What stayed the same:
- No analyzer logic changed.
- No FastAPI behavior changed.
- No database schema or RLS policy changed unless explicitly noted.
- No raw resume/job text was added to storage.
- No service-role key was used in browser code.
- No new dependencies were added.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.
- Local dashboard review confirmed recurring gap stats render and saved-analysis behavior still works.

Learning:
This step reinforced how the hosted app can recreate local Streamlit product value using user-owned Supabase data. Aggregating structured saved results is safer than storing raw resume or job-description text and is enough to power meaningful recurring skill-gap insights.

## Version 15 Step 2 — Add hosted saved-analysis detail view

Added a richer saved-analysis detail view to the hosted Next.js dashboard.

What changed:
- Added a way to select or open a saved analysis from the hosted saved analyses list.
- Displayed available structured metadata such as job title, company, source URL, notes, and saved date.
- Displayed structured analysis results such as matched skills and missing skills.
- Added or preserved clear empty/error states for missing metadata, no selected analysis, no saved analyses, and load failures.
- Kept saved-analysis data user-owned through the existing Clerk/Supabase/RLS flow.

Why this matters:
This step moves the hosted app closer to feature parity with the original local/Streamlit saved-analysis workflow. Users need to review saved analyses in detail, not only see summary rows or aggregate gap stats.

What stayed the same:
- No analyzer logic changed.
- No FastAPI behavior changed.
- No database schema or RLS policy changed unless explicitly noted.
- No raw resume/job text was added to storage.
- No service-role key was used in browser code.
- No new dependencies were added.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.
- Local dashboard review confirmed saved analyses can be opened/reviewed and existing save/read behavior still works.

Learning:
This step reinforced the value of separating structured saved results from raw private text. The hosted app can provide meaningful saved-analysis review while continuing to avoid storing raw resume or job-description content by default.

## Version 15 Step 3 — Add job metadata polish for saved hosted analyses

Improved metadata capture and display for hosted saved analyses.

What changed:
- Improved the hosted analysis/save flow around job metadata such as job title, company, source URL, and notes.
- Made saved analyses easier to recognize in the hosted dashboard.
- Improved metadata display in the saved-analysis list and/or richer detail view.
- Added graceful fallbacks for missing metadata.
- Preserved the structured-results-first data model without storing raw resume or job-description text.

Why this matters:
Saved analyses become much more useful when users can identify which job, company, or application context each result belongs to. This step moves the hosted app closer to a real public job-search tool instead of a basic analysis demo.

What stayed the same:
- No analyzer logic changed.
- No FastAPI behavior changed.
- No database schema or RLS policy changed unless explicitly noted.
- No raw resume/job text was added to storage.
- No service-role key was used in browser code.
- No new dependencies were added.
- Existing recurring gap stats and saved-analysis detail behavior were preserved.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.
- Local dashboard review confirmed metadata capture/display worked and existing saved-analysis behavior still worked.

Learning:
This step reinforced that metadata can make saved structured analysis results feel much more useful without needing to store raw private resume or job-description text.

## Version 15 Step 4 — Add saved-analysis search/filter foundation

Added a search/filter foundation for hosted saved analyses in the Next.js dashboard.

What changed:
- Added saved-analysis search so users can find saved results by structured fields such as job title, company, notes, source URL, and/or skills.
- Added a simple filter foundation where useful.
- Added or preserved clear empty/no-match states.
- Preserved the richer saved-analysis detail view.
- Preserved hosted recurring gap stats.
- Kept the implementation focused on structured saved analysis data rather than raw resume/job-description text.

Why this matters:
As users save more job analyses, the dashboard needs basic organization tools. Search/filtering makes the hosted app feel more like a real job-search workspace and brings it closer to the original local/Streamlit saved-result workflow.

What stayed the same:
- No analyzer logic changed.
- No FastAPI behavior changed.
- No database schema or RLS policy changed.
- No raw resume/job text was added to storage.
- No service-role key was used in browser code.
- No new dependencies were added.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.
- Local dashboard review confirmed saved-analysis search/filter behavior worked and existing saved-analysis/detail/stats behavior still worked.

Learning:
This step reinforced that feature parity is not only about adding new analysis logic. Organization features like search and filtering make saved results usable once the app becomes a real ongoing job-search tool.

## Version 15 Step 5 — Add hosted saved-analysis delete flow

Added a user-owned delete flow for hosted saved analyses.

What changed:
- Added a delete action for saved analyses in the hosted dashboard.
- Added confirmation behavior to reduce accidental deletion.
- Added safe success/error feedback for delete attempts.
- Refreshed saved-analysis list state after successful deletion.
- Preserved or refreshed recurring gap stats after deletion.
- Handled selected detail state safely when the selected analysis is deleted.
- Kept deletion within the existing Clerk/Supabase/RLS user ownership model.

Why this matters:
A serious public app needs user data controls. Since users can save structured analysis results and metadata, they also need a clear way to remove analyses they no longer want.

What stayed the same:
- No analyzer logic changed.
- No FastAPI behavior changed.
- No Clerk auth behavior changed.
- No database schema or RLS policy changed unless explicitly noted.
- No raw resume/job text was added to storage.
- No service-role key was used in browser code.
- No new dependencies were added.
- Existing search/filter, detail view, metadata display, and recurring gap stats behavior were preserved.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.
- Local dashboard review confirmed delete confirmation, cancel, successful delete refresh, and existing saved-analysis behavior worked.

Learning:
This step reinforced that public-product readiness includes data control, not just feature display. Delete flows need confirmation, safe error handling, and careful state refresh so the UI remains trustworthy after user-owned data changes.

## Version 15 Step 6 — Version 15 checkpoint and public-product progress update

Added a Version 15 checkpoint documenting the hosted saved-analysis feature-parity foundation.

What changed:
- Added a Version 15 checkpoint document.
- Summarized hosted recurring gap stats, richer saved-analysis detail view, job metadata polish, saved-analysis search/filter, and saved-analysis deletion.
- Clarified the current hosted app capabilities after Version 15.
- Reframed progress toward the public Job Fit & Skill-Gap Analyzer product.
- Documented remaining gaps before the app can be considered production-ready.
- Recommended Version 16 as a hosted comparison, export, and data-control foundation phase.

Why this matters:
Version 15 moved the hosted app beyond a basic prototype. The dashboard now supports more of the saved-analysis workflow that made the original local/Streamlit app useful, while still preserving the structured-results-first privacy model.

What stayed the same:
- No app code changed.
- No backend behavior changed.
- No database schema or RLS policy changed.
- No secrets or private data were added.
- No new dependencies were added.
- The app is still described honestly as not production-ready yet.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.

Learning:
This step clarified that Version 15 was a meaningful hosted feature-parity milestone. The next phase should continue toward public-product readiness with comparison, export, and user data-control features.

## Version 16 Step 1 — Add hosted saved-analysis comparison

Added a hosted saved-analysis comparison workflow to the Next.js dashboard.

What changed:
- Added a way to select two saved analyses for comparison.
- Compared missing skills between the selected analyses.
- Displayed shared missing skills and skills unique to each selected analysis.
- Added clear empty/no-selection states.
- Preserved existing saved-analysis detail, recurring gap stats, search/filter, metadata display, and delete behavior.
- Kept comparison based on structured saved analysis data rather than raw resume/job-description text.

Why this matters:
Comparison was one of the useful original local/Streamlit features. Bringing it into the hosted app helps users understand how different jobs overlap, which gaps repeat, and which skills are unique to specific opportunities.

What stayed the same:
- No analyzer logic changed.
- No FastAPI behavior changed.
- No Clerk auth behavior changed.
- No database schema or RLS policy changed unless explicitly noted.
- No raw resume/job text was added to storage.
- No service-role key was used in browser code.
- No new dependencies were added.
- Existing recurring gap stats, saved detail view, search/filter, metadata display, and delete flow were preserved.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.
- Local dashboard review confirmed comparison worked and existing saved-analysis behavior still worked.

Learning:
This step reinforced how structured saved results can support higher-level decision features without storing raw private resume or job-description text. Comparison turns saved analyses into a more useful job-search decision tool.

## Version 16 Step 2 — Add hosted saved-analysis export/download

Added hosted export/download options for structured saved-analysis data in the Next.js dashboard.

What changed:
- Added download support for structured saved-analysis data.
- Added export helpers for saved-analysis metadata, matched skills, missing skills, and summary counts.
- Added CSV and/or Markdown exports where practical.
- Added export options for individual saved analyses.
- Added export options for all saved analyses, recurring gap stats, and/or comparison results where practical.
- Preserved existing saved-analysis detail, recurring gap stats, search/filter, comparison, metadata display, and delete behavior.
- Kept exports based on structured saved analysis data rather than raw resume/job-description text.

Why this matters:
Export/download support gives users more control over their saved work. It makes the hosted app feel more like a real job-search workspace because users can take their structured results outside the app, review them, or use them in their own notes.

What stayed the same:
- No analyzer logic changed.
- No FastAPI behavior changed.
- No Clerk auth behavior changed.
- No database schema or RLS policy changed unless explicitly noted.
- No raw resume/job text was added to storage.
- No raw resume/job text was exported.
- No service-role key was used in browser code.
- No new dependencies were added.
- Existing recurring gap stats, saved detail view, search/filter, comparison, metadata display, and delete flow were preserved.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.
- Local dashboard review confirmed export/download behavior worked and existing saved-analysis behavior still worked.

Learning:
This step reinforced the difference between storing/exporting structured analysis results and storing/exporting sensitive raw input text. Export features improve user control while preserving the app’s current privacy-first data model.

## Version 16 Step 3 — Add privacy and data-control page

Added a privacy/data-control explanation to the hosted Next.js app.

What changed:
- Added a user-facing privacy/data-control page or section.
- Explained what the app currently saves as structured saved-analysis data.
- Explained that the current saved-analysis model does not intentionally persist raw resume text or raw job-description text.
- Described current user controls, including deleting saved analyses, exporting structured saved data, and choosing not to save an analysis.
- Added honest caveats about what still needs review before broader public launch.
- Preserved existing saved-analysis detail, recurring gap stats, search/filter, comparison, export/download, metadata display, and delete behavior.

Why this matters:
The app asks users to analyze resume and job-description content, so trust and clarity are important. This step makes the product more honest and user-friendly by explaining the current privacy model and the controls users already have over saved structured results.

What stayed the same:
- No analyzer logic changed.
- No FastAPI behavior changed.
- No Clerk auth behavior changed.
- No database schema or RLS policy changed.
- No raw resume/job text was added to storage.
- No raw resume/job text was exported.
- No service-role key was used in browser code.
- No new dependencies were added.
- Existing recurring gap stats, saved detail view, search/filter, comparison, export/download, metadata display, and delete flow were preserved.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.
- Local dashboard review confirmed the privacy/data-control copy was visible and existing saved-analysis behavior still worked.

Learning:
This step reinforced that public-product readiness is not only about features. A useful product also needs clear explanations of data handling, user controls, limitations, and what still requires security/privacy review before wider launch.

## Version 16 Step 4 — Add production-readiness review before resume profiles

Added a production-readiness review before beginning persistent resume profile work.

What changed:
- Created a production-readiness review document for the hosted app.
- Audited the current hosted architecture, saved-data model, and user controls.
- Identified the main gaps before broader public launch, including privacy/security review, rate limiting, RLS re-checks, data retention, logging/observability, and abuse/cost controls.
- Explained why persistent resume profiles are more sensitive than the current structured saved-analysis model.
- Recommended waiting before storing raw resume text or raw job-description text.
- Proposed a safer Version 17 path that starts with input workflow polish and explicit profile design before persistent resume storage.

Why this matters:
Persistent resume profiles would introduce more sensitive data responsibility than the app currently has. This review helps prevent the project from rushing into raw resume storage before privacy, security, delete/export, and public-product expectations are clearer.

What stayed the same:
- No analyzer logic changed.
- No FastAPI behavior changed.
- No Clerk auth behavior changed.
- No database schema or RLS policy changed.
- No raw resume/job text was added to storage.
- No raw resume/job text was exported.
- No service-role key was used in browser code.
- No new dependencies were added.
- Existing hosted comparison, export/download, privacy/data-control copy, recurring gap stats, saved detail view, search/filter, metadata display, and delete flow were preserved.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.
- Manual review confirmed the production-readiness document does not claim production readiness or a completed security audit.

Learning:
This step reinforced that the next technical feature is not always the safest next product step. Before storing more sensitive user data, it is important to review data minimization, consent, delete/export expectations, RLS, logging, abuse protection, and public claims.

## Version 16 Step 5 — Add Version 16 checkpoint

Added the Version 16 checkpoint for the hosted comparison, export, and data-control foundation.

What changed:
- Created a Version 16 checkpoint document.
- Summarized hosted saved-analysis comparison.
- Summarized hosted export/download support.
- Summarized the privacy/data-control page or section.
- Summarized the production-readiness review before resume profiles.
- Updated the public product roadmap if needed.
- Clarified that the hosted app is beyond a basic prototype but still not ready for broad public launch.
- Recommended a careful Version 17 path focused on resume/input workflow polish before persistent resume profiles.

Why this matters:
Version 16 made saved analyses more useful, portable, and user-controlled. The checkpoint captures that progress and keeps the next phase disciplined, especially around the privacy risks of persistent resume profiles and raw resume storage.

What stayed the same:
- No analyzer logic changed.
- No FastAPI behavior changed.
- No Clerk auth behavior changed.
- No database schema or RLS policy changed.
- No raw resume/job text was added to storage.
- No raw resume/job text was exported.
- No service-role key was used in browser code.
- No new dependencies were added.
- Existing hosted comparison, export/download, privacy/data-control copy, recurring gap stats, saved detail view, search/filter, metadata display, and delete flow were preserved.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.
- Manual review confirmed the checkpoint does not claim production readiness or a completed security audit.

Learning:
This step reinforced the value of checkpointing after a major feature phase. Version 16 connected product usefulness with user control: comparison helps users interpret saved analyses, exports let them keep their data, privacy copy explains the model, and the readiness review protects the project before adding more sensitive resume-profile features.

## Version 17 Step 1 — Polish hosted resume/job input UX

Polished the hosted dashboard input experience for analyzing a resume against a job description.

What changed:
- Improved the resume/job input area in the hosted Next.js dashboard.
- Clarified what users should paste into the resume and job-description fields.
- Reinforced that the current saved-analysis model focuses on structured results and metadata rather than raw resume/job-description text.
- Improved the distinction between running an analysis and saving structured results.
- Improved input helper text, validation, loading states, or next-step guidance where practical.
- Preserved existing saved-analysis detail, recurring gap stats, search/filter, comparison, export/download, metadata display, and delete behavior.

Why this matters:
Version 17 begins with a safer input-workflow polish step before persistent resume profiles. This improves the core user experience while avoiding premature raw resume storage or account-level resume profiles.

What stayed the same:
- No analyzer logic changed.
- No FastAPI behavior changed.
- No Clerk auth behavior changed.
- No database schema or RLS policy changed.
- No persistent resume profiles were added.
- No raw resume/job text was added to storage.
- No raw resume/job text was exported.
- No service-role key was used in browser code.
- No new dependencies were added.
- Existing hosted comparison, export/download, privacy/data-control copy, recurring gap stats, saved detail view, search/filter, metadata display, and delete flow were preserved.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.
- Local dashboard review confirmed the polished input workflow worked and existing saved-analysis behavior still worked.

Learning:
This step reinforced that improving a product does not always require adding more data storage. The hosted input experience can become clearer and safer before introducing persistent resume profiles or raw resume storage.

## Version 17 Step 2 — Add hosted transient .txt upload inputs

Added transient `.txt` upload support for the hosted resume/job analysis form.

What changed:
- Added optional `.txt` upload support for resume text.
- Added optional `.txt` upload support for job-description text.
- Loaded uploaded text files into the existing analysis text areas.
- Kept uploads client-side and transient rather than saving files or creating resume profiles.
- Added friendly validation for unsupported, empty, or oversized files where practical.
- Preserved existing paste input, analysis, save, saved-analysis detail, recurring gap stats, search/filter, comparison, export/download, metadata display, and delete behavior.

Why this matters:
This improves the hosted input workflow without taking on the privacy risks of persistent resume profiles or raw file storage. Users can now paste text or load plain text files while the app still saves only structured analysis results when they choose to save.

What stayed the same:
- No analyzer logic changed.
- No FastAPI behavior changed.
- No Clerk auth behavior changed.
- No database schema or RLS policy changed.
- No persistent resume profiles were added.
- No uploaded files were persisted.
- No raw resume/job text was added to storage.
- No raw resume/job text was exported.
- No service-role key was used in browser code.
- No new dependencies were added.
- Existing hosted comparison, export/download, privacy/data-control copy, recurring gap stats, saved detail view, search/filter, metadata display, and delete flow were preserved.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.
- Local dashboard review confirmed `.txt` upload populated the analysis text areas and existing saved-analysis behavior still worked.

Learning:
This step reinforced a safer pattern for improving input convenience: browser-side transient file reading can improve UX without adding persistent storage, database schema changes, or long-term raw resume data responsibility.

## Version 17 Step 3 — Improve hosted sample/demo input workflow

Improved the hosted dashboard sample/demo input experience.

What changed:
- Added or improved a sample/demo action for the hosted analysis form.
- Added fictional demo resume and job-description input content.
- Populated the existing resume and job-description text areas with safe demo text.
- Populated demo metadata where practical.
- Clarified that sample inputs are fictional and that loading them does not save anything by itself.
- Preserved existing paste input, transient `.txt` upload, analysis, save, saved-analysis detail, recurring gap stats, search/filter, comparison, export/download, metadata display, and delete behavior.

Why this matters:
New users should be able to understand the product quickly without pasting their own real resume or job description first. A safe demo flow makes the hosted app easier to test, explain, and share while preserving the privacy-first direction of Version 17.

What stayed the same:
- No analyzer logic changed.
- No FastAPI behavior changed.
- No Clerk auth behavior changed.
- No database schema or RLS policy changed.
- No persistent resume profiles were added.
- No uploaded files were persisted.
- No raw resume/job text was added to storage.
- No raw resume/job text was exported.
- No service-role key was used in browser code.
- No new dependencies were added.
- Existing hosted comparison, export/download, privacy/data-control copy, recurring gap stats, saved detail view, search/filter, metadata display, and delete flow were preserved.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.
- Local dashboard review confirmed sample/demo inputs populated the analysis form and existing saved-analysis behavior still worked.

Learning:
This step reinforced that sample data is a useful product and testing tool when it is clearly fictional, privacy-safe, and separated from user-owned saved data. Demo inputs make the product easier to understand without increasing sensitive data responsibility.

## Version 17 Step 4 — Add input workflow checkpoint and resume-profile guardrail

Added a Version 17 input workflow checkpoint and resume-profile design guardrail.

What changed:
- Created a checkpoint document for Version 17 input workflow progress.
- Summarized hosted resume/job input UX polish.
- Summarized transient `.txt` resume/job upload support.
- Summarized fictional sample/demo input improvements.
- Documented the current transient input model.
- Clarified that persistent resume profiles and raw resume/job text storage remain intentionally out of scope.
- Added design questions that must be answered before implementing persistent resume profiles.
- Updated the public product roadmap if needed.

Why this matters:
Version 17 improves input convenience, but resume profiles introduce more sensitive data responsibility. This guardrail helps keep the project from moving into raw resume storage before the data model, consent, delete/export controls, RLS, privacy copy, and testing expectations are clear.

What stayed the same:
- No analyzer logic changed.
- No FastAPI behavior changed.
- No Clerk auth behavior changed.
- No database schema or RLS policy changed.
- No persistent resume profiles were added.
- No uploaded files were persisted.
- No raw resume/job text was added to storage.
- No raw resume/job text was exported.
- No service-role key was used in browser code.
- No new dependencies were added.
- Existing hosted input UX, transient `.txt` upload, sample/demo inputs, comparison, export/download, privacy/data-control copy, recurring gap stats, saved detail view, search/filter, metadata display, and delete flow were preserved.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.
- Manual document review confirmed the guardrail does not claim production readiness or a completed security audit.

Learning:
This step reinforced that a good product roadmap needs guardrails, not just features. Before adding persistent resume profiles, the project needs a clear decision about what data to store, what to avoid storing, how users consent, and how users can delete or export their data.

## Version 17 Step 5 — Add persistent resume-profile design

Added a persistent resume-profile design document before implementation.

What changed:
- Created a design document for future persistent resume profiles.
- Defined the intended future user experience for saved resume profiles.
- Compared structured-only, raw-text, and hybrid resume-profile data models.
- Recommended avoiding raw resume text storage by default for the first implementation.
- Documented consent, delete/export, RLS, and user-control expectations.
- Clarified that one-time paste and transient `.txt` upload analysis should remain available.
- Updated the public product roadmap if needed.

Why this matters:
Resume profiles could make the product more convenient, but they increase privacy and data-responsibility risk. Designing the model before implementation helps keep the project safe, honest, and aligned with the structured-results-first approach.

What stayed the same:
- No analyzer logic changed.
- No FastAPI behavior changed.
- No Clerk auth behavior changed.
- No database schema or RLS policy changed.
- No persistent resume profiles were added in code.
- No uploaded files were persisted.
- No raw resume/job text was added to storage.
- No raw resume/job text was exported.
- No service-role key was used in browser code.
- No new dependencies were added.
- Existing hosted input UX, transient `.txt` upload, sample/demo inputs, comparison, export/download, privacy/data-control copy, recurring gap stats, saved detail view, search/filter, metadata display, and delete flow were preserved.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.
- Manual document review confirmed the design does not implement resume profiles, store raw resume text, or claim production readiness.

Learning:
This step reinforced that sensitive features should be designed before they are implemented. Persistent resume profiles require careful choices around data minimization, consent, RLS, delete/export controls, and whether raw resume text should be stored at all.

## Version 17 Step 6 — Add resume-profile schema/RLS plan

Added a structured resume-profile schema and RLS planning document before implementation.

What changed:
- Created a schema/RLS plan for future persistent resume profiles.
- Proposed a structured-skills-first `resume_profiles` data model.
- Recommended avoiding raw resume text by default.
- Documented user ownership expectations using the existing Clerk/Supabase account model.
- Outlined RLS policy intent for select, insert, update, and delete operations.
- Described future helper/API shapes and expected UI behavior without implementing them.
- Added delete/export and testing expectations for future resume-profile work.
- Updated the public product roadmap if needed.

Why this matters:
Resume profiles require database and access-control design before code implementation. Planning the schema and RLS policies first reduces the risk of storing sensitive resume data too broadly or creating user-isolation mistakes.

What stayed the same:
- No analyzer logic changed.
- No FastAPI behavior changed.
- No Clerk auth behavior changed.
- No database schema or RLS policy changed.
- No migrations were added.
- No persistent resume profiles were added in code.
- No uploaded files were persisted.
- No raw resume/job text was added to storage.
- No raw resume/job text was exported.
- No service-role key was used in browser code.
- No new dependencies were added.
- Existing hosted input UX, transient `.txt` upload, sample/demo inputs, comparison, export/download, privacy/data-control copy, recurring gap stats, saved detail view, search/filter, metadata display, and delete flow were preserved.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.
- Manual document review confirmed the plan does not implement resume profiles, create migrations, store raw resume text, or claim production readiness.

Learning:
This step reinforced that database features should begin with ownership, RLS, delete/export, and privacy decisions before code. A structured-skills-first profile model keeps the project aligned with data minimization while still moving toward more convenient user workflows.

## Version 17 Step 7 — Add resume-profile schema/RLS draft

Added a docs-only structured resume-profile schema and RLS draft.

What changed:
- Created a reviewable schema/RLS draft for future persistent resume profiles.
- Drafted a structured-skills-first `resume_profiles` table concept.
- Omitted raw resume text from the first draft by default.
- Documented RLS ownership policy intent for selecting, inserting, updating, and deleting user-owned resume profiles.
- Added review notes and TODOs for matching the existing Clerk/Supabase user-id pattern before any real migration is applied.
- Updated the public product roadmap if needed.

Why this matters:
This step moves resume-profile work closer to implementation without touching the database yet. A docs-only SQL draft makes the data model and RLS policy intent reviewable before adding migrations, helper code, or UI.

What stayed the same:
- No analyzer logic changed.
- No FastAPI behavior changed.
- No Clerk auth behavior changed.
- No database schema or RLS policy changed.
- No migrations were added.
- No SQL was applied to Supabase.
- No persistent resume profiles were added in code.
- No uploaded files were persisted.
- No raw resume/job text was added to storage.
- No raw resume/job text was exported.
- No service-role key was used in browser code.
- No new dependencies were added.
- Existing hosted input UX, transient `.txt` upload, sample/demo inputs, comparison, export/download, privacy/data-control copy, recurring gap stats, saved detail view, search/filter, metadata display, and delete flow were preserved.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.
- Manual document review confirmed the draft does not apply SQL, create migrations, store raw resume text, or claim production readiness.

Learning:
This step reinforced the value of drafting schema and RLS logic before implementation. For user-owned resume profiles, access-control rules and data-minimization decisions should be reviewed before any database changes are made.

## Version 17 Step 8 — Review saved-analysis RLS pattern

Reviewed and documented the current saved-analysis Supabase/RLS user-ownership pattern before turning resume-profile planning into implementation.

What changed:
- Created a saved-analysis RLS pattern review document.
- Inspected the current saved-analysis data flow, user ownership field, helper patterns, and RLS documentation/evidence.
- Documented how saved analyses currently connect Clerk users to Supabase rows where visible in the repo.
- Identified the current RLS predicate if it could be confirmed, or clearly noted what still requires Supabase dashboard/project confirmation.
- Documented which helper patterns future resume-profile work should imitate.
- Captured implications for the resume-profile schema/RLS draft.
- Updated the public product roadmap if needed.

Why this matters:
Future resume-profile rows should use the same proven user-ownership model as saved analyses. Reviewing the existing pattern first reduces the risk of inventing a conflicting RLS policy or misaligning Clerk user ids with Supabase rows.

What stayed the same:
- No analyzer logic changed.
- No FastAPI behavior changed.
- No Clerk auth behavior changed.
- No database schema or RLS policy changed.
- No migrations were added.
- No SQL was applied to Supabase.
- No persistent resume profiles were added in code.
- No uploaded files were persisted.
- No raw resume/job text was added to storage.
- No raw resume/job text was exported.
- No service-role key was used in browser code.
- No new dependencies were added.
- Existing hosted input UX, transient `.txt` upload, sample/demo inputs, comparison, export/download, privacy/data-control copy, recurring gap stats, saved detail view, search/filter, metadata display, and delete flow were preserved.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.
- Manual document review confirmed the review does not implement resume profiles, create migrations, change RLS, or claim production readiness.

Learning:
This step reinforced that access-control details should be copied from proven project patterns, not guessed. Before adding user-owned resume profiles, the project needs a confirmed Clerk/Supabase ownership predicate and repeatable two-user RLS verification.

## Version 17 Step 9 — Align resume-profile RLS draft with saved analyses

Updated the docs-only resume-profile schema/RLS draft to match the current saved-analysis user-ownership pattern as closely as possible.

What changed:
- Updated the resume-profile schema/RLS draft using the saved-analysis RLS pattern review.
- Clarified which saved-analysis ownership/RLS details were confirmed and which still require confirmation.
- Adjusted the docs-only SQL draft comments, policy intent, and TODOs to better align with the existing saved-analysis pattern.
- Preserved the structured-skills-first resume-profile model.
- Kept raw resume text omitted from the first resume-profile draft.
- Updated the public product roadmap if needed.

Why this matters:
Future resume profiles should use the same proven user-ownership approach as saved analyses. Aligning the draft before creating a real migration reduces the chance of introducing inconsistent access-control behavior.

What stayed the same:
- No analyzer logic changed.
- No FastAPI behavior changed.
- No Clerk auth behavior changed.
- No database schema or RLS policy changed.
- No migrations were added.
- No SQL was applied to Supabase.
- No persistent resume profiles were added in code.
- No uploaded files were persisted.
- No raw resume/job text was added to storage.
- No raw resume/job text was exported.
- No service-role key was used in browser code.
- No new dependencies were added.
- Existing hosted input UX, transient `.txt` upload, sample/demo inputs, comparison, export/download, privacy/data-control copy, recurring gap stats, saved detail view, search/filter, metadata display, and delete flow were preserved.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.
- Manual document review confirmed the draft remains docs-only, does not apply SQL, does not create migrations, and does not store raw resume text.

Learning:
This step reinforced that RLS drafts should be aligned with existing working user-ownership patterns before implementation. Reusing the saved-analysis pattern helps keep future resume profiles consistent with the app’s current account-bound data model.

## Version 17 Step 10 — Add resume-profile pre-migration review

Added a final pre-migration review for the structured resume-profile schema/RLS work.

What changed:
- Created a pre-migration review document for future resume profiles.
- Reviewed the resume-profile design, schema/RLS plan, SQL draft, and saved-analysis RLS pattern review.
- Defined what should be included in the first actual resume-profile migration.
- Defined what should remain out of scope for the first migration.
- Confirmed that raw resume text should remain omitted from the first migration scope.
- Added a migration readiness checklist and post-migration RLS verification expectations.
- Updated the public product roadmap if needed.

Why this matters:
This review is the final safety check before touching the database. It helps ensure the migration scope is small, structured-skills-first, user-owned, and aligned with the existing saved-analysis RLS pattern.

What stayed the same:
- No analyzer logic changed.
- No FastAPI behavior changed.
- No Clerk auth behavior changed.
- No database schema or RLS policy changed.
- No migrations were added.
- No SQL was applied to Supabase.
- No persistent resume profiles were added in code.
- No uploaded files were persisted.
- No raw resume/job text was added to storage.
- No raw resume/job text was exported.
- No service-role key was used in browser code.
- No new dependencies were added.
- Existing hosted input UX, transient `.txt` upload, sample/demo inputs, comparison, export/download, privacy/data-control copy, recurring gap stats, saved detail view, search/filter, metadata display, and delete flow were preserved.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.
- Manual document review confirmed the review does not create migrations, apply SQL, implement resume profiles, store raw resume text, or claim production readiness.

Learning:
This step reinforced that database work should have a final scope and access-control review before migration. The safest first resume-profile step is small, user-owned, structured-skills-first, and backed by an explicit RLS verification plan.

## Version 17 Step 11 — Add structured resume-profile migration

Created the actual structured resume-profile migration file for future Supabase application.

What changed:
- Added a migration SQL file for converting the existing empty legacy `resume_profiles` table into the structured-skills-first shape.
- Designed the migration as an `ALTER TABLE` migration because the live `resume_profiles` table already exists.
- Preserved the Clerk ownership model through `clerk_user_id`.
- Used the confirmed RLS predicate: `clerk_user_id = (select auth.jwt() ->> 'sub'::text)`.
- Added structured profile fields such as `profile_name`, `profile_description`, `extracted_skills`, `user_added_skills`, and `source_type`.
- Removed or omitted raw resume text from the structured first implementation.
- Included select/insert/update/delete ownership policies for user-owned profile rows.
- Updated docs if needed to note that the migration exists but has not yet been applied.

Why this matters:
This step moves resume-profile work from planning into a reviewable migration file while still avoiding app implementation and raw resume storage. The migration is scoped to structured skills and metadata, which keeps the project aligned with the privacy-first design direction.

What stayed the same:
- No analyzer logic changed.
- No FastAPI behavior changed.
- No Clerk auth behavior changed.
- No SQL was applied to Supabase in this step.
- No persistent resume-profile UI was added.
- No Supabase helper code was added.
- No uploaded files were persisted.
- No raw resume/job text was added to storage through app code.
- No raw resume/job text was exported.
- No service-role key was used in browser code.
- No new dependencies were added.
- Existing hosted input UX, transient `.txt` upload, sample/demo inputs, comparison, export/download, privacy/data-control copy, recurring gap stats, saved detail view, search/filter, metadata display, and delete flow were preserved.

Verification:
- `python3 tests/test_api_service.py` passed.
- `python3 run_tests.py` passed.
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py` passed.
- `npm run lint` passed in `web/`.
- `npm run build` passed in `web/`.
- Privacy checks confirmed no tracked env/private/generated files.
- Manual SQL review confirmed the migration is scoped to the existing empty legacy `resume_profiles` table and does not include raw resume text storage.

Learning:
This step reinforced the difference between authoring a migration and applying it. Writing the migration as a reviewed artifact first gives us one more safety checkpoint before changing the hosted database.