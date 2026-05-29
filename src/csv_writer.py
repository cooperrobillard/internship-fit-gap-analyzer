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
    # This makes sure Python treats it like a file path.
    output_path = Path(output_path)

    # Make sure the output folder exists.
    # For data/outputs/gap_summary.csv, this creates data/outputs if needed.
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Open the CSV file in write mode.
    #
    # "w" means write.
    # newline="" helps prevent extra blank rows in CSV files.
    # encoding="utf-8" keeps text handling consistent with the rest of the project.
    with open(output_path, "w", newline="", encoding="utf-8") as csv_file:

        # Define the column names for the CSV file.
        fieldnames = ["job_name", "category", "gap_skill"]

        # Create a DictWriter.
        # This lets us write each CSV row as a dictionary.
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)

        # Write the first row of the CSV file with the column names.
        writer.writeheader()

        # Loop through each job result in the full job_results list.
        for job_result in job_results:

            # Get the job file name.
            job_name = job_result["job_name"]

            # Get the skill gaps dictionary for this job.
            skill_gaps = job_result["skill_gaps"]

            # Loop through each category in the skill gaps dictionary.
            for category, gaps in skill_gaps.items():

                # Loop through each missing skill in this category.
                for gap_skill in gaps:

                    # Write one row to the CSV file.
                    writer.writerow(
                        {
                            "job_name": job_name,
                            "category": category,
                            "gap_skill": gap_skill,
                        }
                    )
