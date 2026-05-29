# Import Python's built-in re module.
# re lets us search text using patterns instead of only simple substring checks.
import re


# Define a helper function that checks whether one search phrase appears in text.
#
# search_phrase could be:
# - the official skill name, like "fastapi"
# - an alias, like "fast api"
def phrase_appears_in_text(search_phrase, normalized_text):

    # Convert the search phrase to lowercase.
    normalized_phrase = search_phrase.lower()

    # Escape the phrase so special characters are treated like normal text.
    #
    # Example:
    # "sql/nosql" includes a slash.
    # re.escape() makes sure Python searches for the slash normally.
    escaped_phrase = re.escape(normalized_phrase)

    # Build a search pattern with word boundaries.
    #
    # This helps avoid matching short skills inside larger words.
    # Example: "java" should not match inside "javascript."
    pattern = r"\b" + escaped_phrase + r"\b"

    # Search the text for this pattern.
    match = re.search(pattern, normalized_text)

    # Return True if found, False if not found.
    return match is not None


# Define a helper function that gets all search phrases for one skill.
#
# If the skill has aliases, use those aliases.
# If the skill does not have aliases, just search for the skill itself.
def get_search_phrases(skill, aliases):

    # Check whether this skill exists in the aliases dictionary.
    if skill in aliases:

        # Return the list of aliases for this skill.
        return aliases[skill]

    # If there are no aliases, return a list containing only the skill itself.
    return [skill]


# Define a function called find_skills.
#
# Inputs:
# 1. text: the resume text or job description text we want to search
# 2. taxonomy: the skills dictionary loaded from skills_taxonomy.json
# 3. aliases: optional dictionary loaded from skill_aliases.json
def find_skills(text, taxonomy, aliases=None):
    """
    Find skills from a taxonomy that appear in a piece of text.

    Parameters:
        text: a string, like a resume or job description
        taxonomy: a dictionary where each category maps to a list of skills
        aliases: a dictionary where a skill maps to alternate search phrases

    Returns:
        A dictionary where each category maps to the skills found in the text
    """

    # If no aliases were provided, use an empty dictionary.
    #
    # This keeps the function from crashing if we call it without aliases.
    if aliases is None:
        aliases = {}

    # Create an empty dictionary where we will store the final results.
    found_skills = {}

    # Convert the full input text to lowercase.
    normalized_text = text.lower()

    # Loop through each category in the taxonomy dictionary.
    for category, skills_list in taxonomy.items():

        # Create an empty list for this category's matched skills.
        matched_skills = []

        # Loop through each official skill inside this category.
        for skill in skills_list:

            # Get the search phrases for this skill.
            #
            # Example:
            # skill = "fastapi"
            # search_phrases = ["fastapi", "fast api"]
            search_phrases = get_search_phrases(skill, aliases)

            # Loop through each possible phrase for this skill.
            for phrase in search_phrases:

                # Check whether this phrase appears in the text.
                if phrase_appears_in_text(phrase, normalized_text):

                    # Add the official skill name to the matched skills list.
                    matched_skills.append(skill)

                    # Stop checking aliases for this skill after the first match.
                    #
                    # This prevents the same skill from being added multiple times.
                    break

        # Store this category's matched skills in the final dictionary.
        found_skills[category] = matched_skills

    # Return the full dictionary of matched skills.
    return found_skills
