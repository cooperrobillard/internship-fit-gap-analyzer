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
  resumeText: `Demo Candidate
Fictional State University · Business Analytics · Class of 2027

Summary
Operations-focused student with internship and class project experience supporting distribution teams, inventory reporting, and cross-functional process updates. Comfortable using Microsoft Excel to organize shipment logs, reconcile cycle-count notes, and prepare weekly summaries for supervisors.

Experience
Campus Supply Desk — Operations Assistant
- Helped maintain inventory management trackers for lab supplies and event materials using Excel workbooks.
- Coordinated logistics for incoming deliveries, pickup windows, and storage-room moves during busy campus events.
- Compared purchase requests with procurement records and flagged missing vendor details for review.
- Suggested a process improvement checklist that reduced repeated follow-up questions from student organizations.
- Practiced stakeholder communication by sharing clear status updates with facilities staff, student leaders, and finance reviewers.`,

  jobText: `Supply Chain Operations Analyst Intern — Northstar Distribution

About the role
Northstar Distribution is a fictional regional distribution company hiring an intern to support operations planning and supplier coordination. This posting is synthetic demo content only.

Responsibilities
- Maintain Microsoft Excel trackers for inventory management, logistics milestones, and procurement follow-up.
- Assist with demand planning reviews by comparing historical order patterns with current warehouse capacity.
- Use SAP ERP reports to reconcile purchase orders, inbound shipments, and stocking exceptions.
- Prepare basic forecasting summaries for weekly operations meetings.
- Support supplier management by documenting vendor response times, open issues, and escalation notes.

Requirements
- Coursework or project experience with Excel, inventory management, logistics, and procurement.
- Interest in demand planning, forecasting, SAP ERP, and supplier management.
- Clear written updates for operations, warehouse, and purchasing stakeholders.`,

  jobTitle: "Supply Chain Operations Analyst Intern",
  company: "Northstar Distribution",
  sourceUrl: "",
  notes: "Fictional supply-chain demo for reviewing structured skill gaps",
};
