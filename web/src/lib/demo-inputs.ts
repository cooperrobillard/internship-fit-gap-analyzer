/**
 * Fictional hosted demo inputs for the Job Fit & Skill-Gap Analyzer.
 *
 * Safe for public prototypes: no real people, employers, contact info, or private
 * resume/job content. Used only to populate form fields in the browser.
 */

export type DemoAnalysisInputs = {
  resumeText: string;
  jobText: string;
  jobTitle: string;
  company: string;
  sourceUrl: string;
  notes: string;
};

export const DEMO_ANALYSIS_INPUTS: DemoAnalysisInputs = {
  resumeText: `Alex Rivera
Example University · Computer Science · Class of 2027

Summary
Junior student exploring data analytics and product-focused software work. Comfortable with Python, SQL, and collaborative Git workflows.

Experience
Campus Analytics Club — Project Lead
- Built Python scripts to clean CSV exports and answer stakeholder questions with SQL queries.
- Presented findings with clear documentation for non-technical teammates.

Coursework & skills
Programming: Python, JavaScript basics
Data: SQL, pandas, Excel, regression
Tools: Git, GitHub, terminal
Communication: requirements gathering, technical writing, teamwork`,

  jobText: `Product Data Analyst Intern — Demo Robotics (fictional posting)

About the role
Demo Robotics is hiring a summer intern to support product analytics and internal reporting. This posting is fictional for app demos only.

Responsibilities
- Write Python and SQL to explore product usage datasets.
- Build dashboards and summaries with pandas and clear documentation.
- Collaborate with engineers using Git and REST APIs.
- Communicate insights to stakeholders.

Requirements
- Python and SQL proficiency.
- Experience with pandas or similar data tooling.
- Git and collaborative development.
- Strong written communication and technical writing.

Nice to have
- FastAPI or backend API exposure.
- Machine learning curiosity.
- Interest in responsible AI and evaluation practices.`,

  jobTitle: "Product Data Analyst Intern",
  company: "Demo Robotics",
  sourceUrl: "",
  notes: "Demo analysis for exploring saved results",
};
