def find_skills(text, taxonomy):
    """
    Find skills from a taxonomy that appear in a piece of text.

    Parameters:
        text: a string, like a resume or job description
        taxonomy: a dictionary where each category maps to a list of skills

    Returns:
        A dictionary where each category maps to the skills found in the text
    """

    found_skills = {}
    normalized_text = text.lower()

    for category, skills_list in taxonomy.items():
        matched_skills = []

        for skill in skills_list:
            normalized_skill = skill.lower()

            if normalized_skill in normalized_text:
                matched_skills.append(skill)

        found_skills[category] = matched_skills

    return found_skills
