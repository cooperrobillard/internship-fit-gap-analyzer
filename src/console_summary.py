# Define a function that prints a short summary in the terminal.
#
# Inputs:
# 1. job_results: the list of analyzed job results
# 2. recurring_gaps: the list of most common skill gaps
# 3. output_paths: a list of files created by the program
# 4. max_gaps: how many top gaps to show
def print_run_summary(job_results, recurring_gaps, output_paths, max_gaps=5):

    # Print a blank line and a simple title.
    print("\nAnalysis complete.\n")

    # len(job_results) counts how many job files were analyzed.
    print(f"Jobs analyzed: {len(job_results)}")

    # Print a section title for the top recurring gaps.
    print("\nTop recurring gaps:")

    # If there are no gaps, print a simple message.
    if not recurring_gaps:
        print("- No skill gaps found")

    # Otherwise, print the most common gaps.
    else:

        # recurring_gaps[:max_gaps] means:
        # only use the first few gaps from the list.
        for index, gap in enumerate(recurring_gaps[:max_gaps], start=1):

            # Get each piece of information from the gap dictionary.
            gap_skill = gap["gap_skill"]
            category = gap["category"]
            count = gap["count"]

            # Print one numbered line for this gap.
            print(f"{index}. {gap_skill} ({category}): {count} job(s)")

    # Print a section title for output files.
    print("\nOutput files:")

    # Loop through each output path and print it.
    for output_path in output_paths:
        print(f"- {output_path}")
