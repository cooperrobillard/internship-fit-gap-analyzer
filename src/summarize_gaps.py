# Define a function that counts how often each skill gap appears.
#
# Input:
# job_results: the list of job analysis results created in main.py
#
# Output:
# A list of dictionaries, where each dictionary represents one recurring gap.
def count_recurring_gaps(job_results):

    # Create an empty dictionary to store gap counts.
    #
    # Example:
    # {
    #     "sql": {"category": "data", "count": 2},
    #     "aws": {"category": "cloud_backend", "count": 1}
    # }
    gap_counts = {}

    # Loop through each job result.
    for job_result in job_results:

        # Get the skill gaps dictionary for this job.
        skill_gaps = job_result["skill_gaps"]

        # Loop through each category and its list of gaps.
        for category, gaps in skill_gaps.items():

            # Loop through each missing skill in this category.
            for gap_skill in gaps:

                # If this gap skill has not been counted yet,
                # add it to the gap_counts dictionary.
                if gap_skill not in gap_counts:
                    gap_counts[gap_skill] = {
                        "category": category,
                        "count": 0,
                    }

                # Add 1 to this skill's count.
                gap_counts[gap_skill]["count"] += 1

    # Create an empty list for the final summary.
    #
    # A list is easier to sort than the dictionary above.
    recurring_gaps = []

    # Loop through the counted gaps.
    for gap_skill, gap_info in gap_counts.items():

        # Create one result dictionary for this gap skill.
        gap_result = {
            "gap_skill": gap_skill,
            "category": gap_info["category"],
            "count": gap_info["count"],
        }

        # Add this result to the recurring_gaps list.
        recurring_gaps.append(gap_result)

    # Sort the recurring gaps so the most common gaps come first.
    #
    # key=lambda gap: gap["count"] tells Python to sort by the count value.
    # reverse=True means highest count first.
    recurring_gaps.sort(key=lambda gap: gap["count"], reverse=True)

    # Return the sorted list.
    return recurring_gaps
