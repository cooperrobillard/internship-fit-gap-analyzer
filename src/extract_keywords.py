# Import Python's built-in re module.
# re lets us search text using patterns instead of only simple substring checks.
import re


# Define a small helper function that checks whether one skill appears in text.
#
# This is separated into its own function so find_skills() stays easier to read.
def skill_appears_in_text(skill, normalized_text):

    # Convert the skill to lowercase so it matches the lowercase text.
    normalized_skill = skill.lower()

    # Escape the skill text so special characters are treated like normal text.
    #
    # Example:
    # "c++" has plus signs, which mean something special in regex.
    # re.escape() protects those characters.
    escaped_skill = re.escape(normalized_skill)

    # Build a search pattern.
    #
    # \b means "word boundary."
    # This helps match "java" as its own word, but not inside "javascript."
    pattern = r"\b" + escaped_skill + r"\b"

    # Search the text for the pattern.
    #
    # re.search(...) returns a match object if found.
    # It returns None if not found.
    match = re.search(pattern, normalized_text)

    # Convert the result into True or False.
    #
    # True means the skill appeared in the text.
    # False means it did not.
    return match is not None


# Define a function called find_skills.
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
    found_skills = {}

    # Convert the full input text to lowercase.
    normalized_text = text.lower()

    # Loop through each category in the taxonomy dictionary.
    for category, skills_list in taxonomy.items():

        # Create an empty list for this category's matched skills.
        matched_skills = []

        # Loop through each skill inside the current category's skill list.
        for skill in skills_list:

            # Check whether this skill appears in the text.
            #
            # This now uses our helper function instead of simple substring matching.
            if skill_appears_in_text(skill, normalized_text):

                # If the skill was found, add it to the matched skills list.
                matched_skills.append(skill)

        # Store this category's matched skills in the final dictionary.
        found_skills[category] = matched_skills

    # Return the full dictionary of matched skills.
    return found_skills
