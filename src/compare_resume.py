# Define a function called find_gaps.
#
# This function compares:
# 1. skills found in a job description
# 2. skills found in the resume
#
# It returns the skills that appear in the job description
# but do not appear in the resume.
def find_gaps(job_skills, resume_skills):

    # Create an empty dictionary to store missing skills by category.
    #
    # Example final result:
    # {
    #     "data": ["sql", "pandas"],
    #     "cloud_backend": ["aws", "docker"]
    # }
    skill_gaps = {}

    # Loop through each category in the job_skills dictionary.
    #
    # category is something like "programming" or "data".
    # job_skill_list is the list of skills found in the job for that category.
    for category, job_skill_list in job_skills.items():

        # Get the resume skills for this same category.
        #
        # .get(category, []) means:
        # "Try to get this category from resume_skills.
        # If it does not exist, use an empty list instead."
        resume_skill_list = resume_skills.get(category, [])

        # Create an empty list to store skills that are missing
        # from the resume for this category.
        missing_skills = []

        # Loop through each skill found in the job description.
        for skill in job_skill_list:

            # Check whether this job skill is NOT in the resume skill list.
            #
            # If the job asks for "sql" but the resume skill list
            # does not include "sql", then this condition is True.
            if skill not in resume_skill_list:

                # Add the missing skill to the missing_skills list.
                missing_skills.append(skill)

        # Store the missing skills for this category in the final dictionary.
        skill_gaps[category] = missing_skills

    # Return the full dictionary of missing skills.
    return skill_gaps
