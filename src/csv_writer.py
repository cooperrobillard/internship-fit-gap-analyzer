# Import Python's built-in csv module.
# This module helps us write rows into a CSV file.
import csv

# Import Path so this file can work with file paths.
from pathlib import Path


# Define a function that writes skill gaps to a CSV file.
#
# Inputs:
# 1. output_path: where the CSV file should be saved
# 2. job_results: the list of job analysis results created in main.py
def write_gap_csv(output_path, job_results):

    # Convert output_path into a Path object.
    output_path = Path(output_path)

    # Make sure the output folder exists.
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Open the CSV file in write mode.
    with open(output_path, "w", newline="", encoding="utf-8") as csv_file:

        # Define the column names for the CSV file.
        fieldnames = ["job_name", "category", "gap_skill"]

        # Create a CSV writer that writes dictionary rows.
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)

        # Write the header row.
        writer.writeheader()

        # Loop through each job result.
        for job_result in job_results:

            # Get the job file name.
            job_name = job_result["job_name"]

            # Get the skill gaps dictionary for this job.
            skill_gaps = job_result["skill_gaps"]

            # Loop through each category and list of gaps.
            for category, gaps in skill_gaps.items():

                # Loop through each missing skill.
                for gap_skill in gaps:

                    # Write one row for each missing skill.
                    writer.writerow(
                        {
                            "job_name": job_name,
                            "category": category,
                            "gap_skill": gap_skill,
                        }
                    )


# Define a function that writes recurring gap counts to a CSV file.
#
# Inputs:
# 1. output_path: where the CSV file should be saved
# 2. recurring_gaps: the sorted recurring gaps list from summarize_gaps.py
def write_recurring_gap_csv(output_path, recurring_gaps):

    # Convert output_path into a Path object.
    output_path = Path(output_path)

    # Make sure the output folder exists.
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Open the recurring gaps CSV file in write mode.
    with open(output_path, "w", newline="", encoding="utf-8") as csv_file:

        # Define the columns for the recurring gaps CSV.
        fieldnames = ["gap_skill", "category", "count"]

        # Create a CSV writer that writes dictionary rows.
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)

        # Write the header row.
        writer.writeheader()

        # Loop through each recurring gap result.
        for gap in recurring_gaps:

            # Write one row for this recurring gap.
            writer.writerow(
                {
                    "gap_skill": gap["gap_skill"],
                    "category": gap["category"],
                    "count": gap["count"],
                }
            )
