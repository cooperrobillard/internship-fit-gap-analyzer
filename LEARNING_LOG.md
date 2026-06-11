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