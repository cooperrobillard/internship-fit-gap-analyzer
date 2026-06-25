"""Quality checks for the production skill taxonomy and alias map."""
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from src.extract_keywords import find_skills

TAXONOMY_PATH = REPO_ROOT / "data" / "skills_taxonomy.json"
ALIASES_PATH = REPO_ROOT / "data" / "skill_aliases.json"

REQUIRED_CATEGORIES = {
    "programming", "data", "ai_ml", "cloud_backend", "software_tools",
    "responsible_ai", "communication", "cybersecurity",
    "engineering_manufacturing", "science_research",
    "healthcare_life_sciences", "finance_accounting",
    "sales_customer_success", "marketing_content", "operations_supply_chain",
    "project_program_management", "product_management", "design_creative",
    "human_resources", "legal_risk_compliance", "education_training",
    "administrative_support", "languages",
}

EXISTING_SKILLS = {
    "python", "matlab", "typescript", "javascript", "java", "sql", "pandas",
    "jupyter", "power bi", "tableau", "excel", "data cleaning", "regression",
    "openai api", "rag", "langchain", "llamaindex", "pytorch",
    "machine learning", "vector database", "embeddings", "aws", "docker",
    "fastapi", "rest api", "json", "supabase", "postgres", "git", "github",
    "vs code", "linux", "terminal", "responsible ai", "ai governance",
    "privacy", "evaluation", "limitations", "human review", "documentation",
    "training", "stakeholder", "requirements", "technical writing",
}

REPRESENTATIVE_SKILLS = {
    "programming": {"python", "java", "javascript", "typescript", "c", "c++", "c#", "go", "rust", "ruby", "php", "swift", "kotlin", "bash", "powershell"},
    "data": {"sql", "excel", "tableau", "power bi", "statistics", "data visualization", "etl", "data warehousing", "spark", "sas", "spss"},
    "ai_ml": {"machine learning", "deep learning", "natural language processing", "computer vision", "tensorflow", "scikit-learn", "model evaluation", "generative ai"},
    "cloud_backend": {"aws", "azure", "google cloud", "docker", "kubernetes", "terraform", "fastapi", "django", "flask", "graphql", "microservices"},
    "software_tools": {"git", "github", "jira", "linux", "microsoft office", "terminal", "vs code"},
    "responsible_ai": {"ai governance", "bias assessment", "data privacy", "explainability", "human review", "model monitoring", "responsible ai"},
    "cybersecurity": {"incident response", "siem", "splunk", "vulnerability assessment", "identity and access management", "zero trust", "threat modeling", "digital forensics"},
    "engineering_manufacturing": {"cad", "autocad", "solidworks", "gd&t", "systems engineering", "plcs", "six sigma", "quality control", "root-cause analysis"},
    "science_research": {"experimental design", "literature review", "laboratory safety", "pcr", "cell culture", "microscopy", "chromatography"},
    "healthcare_life_sciences": {"patient care", "hipaa", "electronic health records", "epic", "medical terminology", "clinical trials", "care coordination"},
    "finance_accounting": {"gaap", "budgeting", "forecasting", "financial modeling", "auditing", "quickbooks", "account reconciliation", "valuation"},
    "sales_customer_success": {"crm", "salesforce", "prospecting", "account management", "customer onboarding", "customer retention", "sales forecasting"},
    "marketing_content": {"seo", "content marketing", "email marketing", "social media marketing", "google ads", "hubspot", "public relations"},
    "operations_supply_chain": {"procurement", "inventory management", "logistics", "sourcing", "demand planning", "erp", "order fulfillment"},
    "project_program_management": {"project management", "program management", "agile", "scrum", "kanban", "project scheduling", "change management"},
    "product_management": {"product strategy", "product roadmap", "user stories", "backlog prioritization", "product discovery", "a/b testing"},
    "design_creative": {"figma", "adobe photoshop", "adobe illustrator", "ux research", "ui design", "wireframing", "video editing", "motion graphics"},
    "human_resources": {"recruiting", "talent acquisition", "hris", "workday hcm", "employee relations", "benefits administration"},
    "legal_risk_compliance": {"contract review", "legal research", "regulatory compliance", "internal controls", "aml", "kyc", "gdpr"},
    "education_training": {"curriculum development", "instructional design", "lesson planning", "classroom management", "learning management systems"},
    "administrative_support": {"scheduling", "calendar management", "records management", "data entry", "microsoft word", "microsoft powerpoint", "microsoft outlook"},
    "languages": {"spanish", "french", "german", "mandarin chinese", "arabic", "portuguese", "italian", "japanese", "korean", "american sign language"},
    "communication": {"leadership", "collaboration", "negotiation", "presentation", "public speaking", "conflict resolution", "customer service"},
}

POSITIVE_FIXTURES = [
    ("finance_accounting", "Analyst with GAAP, QuickBooks, budgeting, forecasting, valuation, and account reconciliation.", {"gaap", "quickbooks", "budgeting", "forecasting", "valuation", "account reconciliation"}),
    ("healthcare_life_sciences", "Clinic coordinator using Epic EHRs for HIPAA-aware patient care and clinical trials.", {"epic", "electronic health records", "hipaa", "patient care", "clinical trials"}),
    ("marketing_content", "Marketing lead owned SEO, HubSpot, Google Ads, email marketing, PR, and content marketing.", {"seo", "hubspot", "google ads", "email marketing", "public relations", "content marketing"}),
    ("sales_customer_success", "Sales team used CRM, Salesforce, prospecting, customer onboarding, customer retention, and sales forecasting.", {"crm", "salesforce", "prospecting", "customer onboarding", "customer retention", "sales forecasting"}),
    ("human_resources", "HR partner handled recruiting, talent acquisition, HRIS, Workday HCM, employee relations, and benefits administration.", {"recruiting", "talent acquisition", "hris", "workday hcm", "employee relations", "benefits administration"}),
    ("education_training", "Teacher built curriculum development, instructional design, lesson planning, classroom management, and learning management systems practices.", {"curriculum development", "instructional design", "lesson planning", "classroom management", "learning management systems"}),
    ("legal_risk_compliance", "Compliance analyst performed contract review, legal research, AML, KYC, GDPR, and internal controls.", {"contract review", "legal research", "aml", "kyc", "gdpr", "internal controls"}),
    ("operations_supply_chain", "Operations role covered procurement, inventory management, logistics, SAP ERP, sourcing, demand planning, and order fulfillment.", {"procurement", "inventory management", "logistics", "sap erp", "sourcing", "demand planning", "order fulfillment"}),
    ("project_program_management", "Program manager used Agile, Scrum, Kanban, project scheduling, project management, and change management.", {"agile", "scrum", "kanban", "project scheduling", "project management", "change management"}),
    ("product_management", "Product manager led product strategy, product roadmap, user stories, backlog prioritization, product discovery, and A/B testing.", {"product strategy", "product roadmap", "user stories", "backlog prioritization", "product discovery", "a/b testing"}),
    ("design_creative", "Designer worked in Figma, Photoshop, Illustrator, UX research, UI design, wireframing, video editing, and motion graphics.", {"figma", "adobe photoshop", "adobe illustrator", "ux research", "ui design", "wireframing", "video editing", "motion graphics"}),
    ("science_research", "Research assistant managed experimental design, literature review, laboratory safety, PCR, cell culture, microscopy, and chromatography.", {"experimental design", "literature review", "laboratory safety", "pcr", "cell culture", "microscopy", "chromatography"}),
    ("engineering_manufacturing", "Engineer used CAD, AutoCAD, SolidWorks, GD&T, PLCs, Six Sigma, quality control, systems engineering, and root cause analysis.", {"cad", "autocad", "solidworks", "gd&t", "plcs", "six sigma", "quality control", "systems engineering", "root-cause analysis"}),
]

FALSE_POSITIVE_FIXTURES = [
    ("programming", "go", "We go to meetings and help projects go smoothly.", "go"),
    ("programming", "r", "Research teams review reports and revise requirements.", "r"),
    ("programming", "c", "The C-suite discussed customer concerns.", "c"),
    ("data", "excel", "Candidates should excel in collaborative environments.", "excel"),
    ("administrative_support", "microsoft access", "The assistant can access records after approval.", "microsoft access"),
    ("engineering_manufacturing", "lean manufacturing", "Teams lean on mentors during onboarding.", "lean manufacturing"),
    ("human_resources", "workday hcm", "The workday starts at nine.", "workday hcm"),
    ("operations_supply_chain", "sap erp", "Trees can release sap in spring.", "sap erp"),
    ("programming", "java", "The frontend uses JavaScript and TypeScript.", "java"),
]

PUNCTUATION_POSITIVE_FIXTURES = [
    ("programming", "c++", "Built services in C++ for embedded devices."),
    ("programming", "c#", "Built desktop tools with C# and .NET."),
    ("programming", ".net", "Maintained APIs on .NET."),
    ("programming", "node.js", "Built backend services with Node.js."),
]


def load_taxonomy_and_aliases():
    return json.loads(TAXONOMY_PATH.read_text()), json.loads(ALIASES_PATH.read_text())


def _flatten_found(found):
    return {skill for skills in found.values() for skill in skills}


def test_taxonomy_and_alias_structures():
    taxonomy, aliases = load_taxonomy_and_aliases()
    assert isinstance(taxonomy, dict)
    assert isinstance(aliases, dict)
    assert taxonomy
    assert aliases
    assert all(isinstance(k, str) and isinstance(v, list) for k, v in taxonomy.items())
    assert all(isinstance(k, str) and isinstance(v, list) for k, v in aliases.items())


def test_required_categories_and_counts():
    taxonomy, aliases = load_taxonomy_and_aliases()
    canonical = [skill for skills in taxonomy.values() for skill in skills]
    assert REQUIRED_CATEGORIES.issubset(taxonomy)
    assert all(skills for skills in taxonomy.values())
    assert len(taxonomy) == 23
    assert 250 <= len(canonical) <= 285
    assert len(aliases) >= 86


def test_lowercase_trimmed_snake_case_alphabetized_and_non_empty():
    taxonomy, aliases = load_taxonomy_and_aliases()
    snake_case = re.compile(r"^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$")
    for category, skills in taxonomy.items():
        assert category == category.strip().lower()
        assert snake_case.match(category)
        assert skills == sorted(skills)
        for skill in skills:
            assert skill
            assert skill == skill.strip().lower()
    assert list(aliases) == sorted(aliases)
    for canonical, phrases in aliases.items():
        assert canonical
        assert canonical == canonical.strip().lower()
        assert phrases == sorted(phrases)
        assert len(phrases) == len(set(phrases))
        for phrase in phrases:
            assert phrase
            assert phrase == phrase.strip().lower()


def test_no_duplicate_canonical_skills_and_alias_integrity():
    taxonomy, aliases = load_taxonomy_and_aliases()
    canonical = [skill for skills in taxonomy.values() for skill in skills]
    canonical_set = set(canonical)
    assert len(canonical) == len(canonical_set)
    assert set(aliases).issubset(canonical_set)
    seen_aliases = {}
    for canonical_skill, phrases in aliases.items():
        for phrase in phrases:
            assert phrase not in seen_aliases, (phrase, seen_aliases.get(phrase), canonical_skill)
            seen_aliases[phrase] = canonical_skill


def test_existing_skills_remain_present():
    taxonomy, _ = load_taxonomy_and_aliases()
    canonical_set = {skill for skills in taxonomy.values() for skill in skills}
    assert EXISTING_SKILLS.issubset(canonical_set)


def test_representative_skill_coverage():
    taxonomy, _ = load_taxonomy_and_aliases()
    for category, expected_skills in REPRESENTATIVE_SKILLS.items():
        assert expected_skills.issubset(set(taxonomy[category])), category


def test_guarded_aliases_for_ambiguous_skills():
    _, aliases = load_taxonomy_and_aliases()
    assert aliases["go"] == ["go language", "go programming", "golang"]
    assert aliases["r"] == ["r language", "r programming", "r statistical programming"]
    assert aliases["c"] == ["ansi c", "c language", "c programming"]
    assert "excel" not in aliases["excel"]
    assert "access" not in aliases["microsoft access"]
    assert "lean" not in aliases["lean manufacturing"]
    assert "workday" not in aliases["workday hcm"]
    assert "sap" not in aliases["sap erp"]
    assert "js" not in aliases["javascript"]
    assert "requirements" not in aliases["requirements"]
    assert "training" not in aliases["training"]
    assert "documentation" not in aliases["documentation"]
    assert "privacy" not in aliases["privacy"]
    assert "leadership" not in aliases["leadership"]
    assert "collaboration" not in aliases["collaboration"]


def test_cross_domain_positive_fixtures():
    taxonomy, aliases = load_taxonomy_and_aliases()
    for category, text, expected in POSITIVE_FIXTURES:
        found = find_skills(text, taxonomy, aliases)
        assert expected.issubset(set(found[category])), (category, expected, found[category])


def test_false_positive_fixtures():
    taxonomy, aliases = load_taxonomy_and_aliases()
    for category, skill, text, label in FALSE_POSITIVE_FIXTURES:
        found = find_skills(text, taxonomy, aliases)
        assert skill not in set(found[category]), label


def test_punctuation_positive_fixtures():
    taxonomy, aliases = load_taxonomy_and_aliases()
    for category, skill, text in PUNCTUATION_POSITIVE_FIXTURES:
        found = find_skills(text, taxonomy, aliases)
        assert skill in set(found[category]), (skill, found[category])


if __name__ == "__main__":
    test_taxonomy_and_alias_structures()
    test_required_categories_and_counts()
    test_lowercase_trimmed_snake_case_alphabetized_and_non_empty()
    test_no_duplicate_canonical_skills_and_alias_integrity()
    test_existing_skills_remain_present()
    test_representative_skill_coverage()
    test_guarded_aliases_for_ambiguous_skills()
    test_cross_domain_positive_fixtures()
    test_false_positive_fixtures()
    test_punctuation_positive_fixtures()
    print("All taxonomy quality tests passed.")
