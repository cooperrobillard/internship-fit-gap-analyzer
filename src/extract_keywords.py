# Define a function called find_skills.
# A function is a reusable block of code that performs one specific job.
#
# This function needs two inputs:
# 1. text: the resume text or job description text we want to search
# 2. taxonomy: the skills dictionary loaded from skills_taxonomy.json
def find_skills(text, taxonomy):
    """
    Find skills from a taxonomy that appear in a piece of text.

    Parameters:
        text: a string, like a resume or job description
        taxonomy: a dictionary where each category maps to a list of skills

    Returns:
        A dictionary where each category maps to the skills found in the text
    """

    # Create an empty dictionary where we will store the final results.
    #
    # Example of what this will eventually look like:
    # {
    #     "programming": ["python", "matlab"],
    #     "data": ["regression"],
    #     "software_tools": ["git", "github"]
    # }
    found_skills = {}

    # Convert the full input text to lowercase.
    #
    # This makes matching easier because Python treats "Python" and "python"
    # as different unless we normalize the capitalization.
    normalized_text = text.lower()

    # Loop through each category in the taxonomy dictionary.
    #
    # taxonomy.items() gives us both:
    # - category: the dictionary key, like "programming"
    # - skills_list: the dictionary value, like ["python", "matlab"]
    for category, skills_list in taxonomy.items():

        # Create an empty list for this category's matched skills.
        #
        # Example: if category is "programming", this list might become:
        # ["python", "matlab"]
        matched_skills = []

        # Loop through each skill inside the current category's skill list.
        #
        # Example: if skills_list is ["python", "matlab", "typescript"],
        # then this loop checks one skill at a time.
        for skill in skills_list:

            # Convert the skill to lowercase before checking for it.
            #
            # This makes the comparison match the lowercase version of the text.
            # Example: "Python" becomes "python".
            normalized_skill = skill.lower()

            # Check whether the normalized skill appears anywhere
            # inside the normalized text.
            #
            # Example:
            # "python" in "i built a python project"  -> True
            # "sql" in "i built a python project"     -> False
            if normalized_skill in normalized_text:

                # If the skill was found in the text, add the original skill
                # to the matched_skills list.
                #
                # We append skill, not normalized_skill, so the output keeps
                # the same formatting as the taxonomy file.
                matched_skills.append(skill)

        # After checking every skill in this category, store the category's
        # matched skills in the found_skills dictionary.
        #
        # Example:
        # found_skills["programming"] = ["python", "matlab"]
        found_skills[category] = matched_skills

    # Return the full dictionary of matched skills.
    #
    # This is what lets main.py use the result later.
    # Without return, the function would give back None.
    return found_skills
