/**
 * DEMO DATA. Approximate national outcomes by major in the shape of the
 * New York Fed "Labor Market for Recent College Graduates" series (ACS-based)
 * and ACS earnings by field of degree. 50 majors.
 *
 * Columns: id, name, CIP, category, early-career median, mid-career median,
 *  unemployment %, underemployment %, grad-school %, earnings spread (log σ),
 *  months to first job (null = no defensible data), occupations "id:share",
 *  industry profile, one-line description
 */
import type { MajorCategory } from "@/types";

export type IndustryProfile =
  | "tech" | "engineering" | "finance" | "business" | "science" | "health"
  | "social" | "education" | "media" | "arts" | "government" | "agriculture" | "hospitality";

export type MajorRow = [
  string, string, string, MajorCategory, number, number, number, number, number, number,
  number | null, string, IndustryProfile, string,
];

const ENG: MajorCategory = "Engineering & computing";
const BUS: MajorCategory = "Business & economics";
const SCI: MajorCategory = "Math & physical sciences";
const LIFE: MajorCategory = "Life & health sciences";
const SOC: MajorCategory = "Social sciences";
const HUM: MajorCategory = "Humanities & arts";
const APP: MajorCategory = "Applied & professional";

export const MAJOR_ROWS: MajorRow[] = [
  ["computer-science", "Computer Science", "11.0701", ENG, 80000, 115000, 6.1, 16.5, 20, 0.36, 3.1, "software-developer:.42,software-qa:.08,web-developer:.07,data-scientist:.07,info-security-analyst:.05,computer-systems-analyst:.06", "tech", "How software and computation work, from algorithms to systems."],
  ["computer-engineering", "Computer Engineering", "14.0901", ENG, 80000, 120000, 7.5, 17.0, 25, 0.34, 3.4, "software-developer:.34,hardware-engineer:.14,electrical-engineer:.1,computer-systems-analyst:.06,network-admin:.05", "tech", "Hardware and software together: chips, embedded systems, devices."],
  ["electrical-engineering", "Electrical Engineering", "14.1001", ENG, 75000, 120000, 2.7, 17.0, 38, 0.32, 3.0, "electrical-engineer:.36,hardware-engineer:.1,software-developer:.14,engineering-manager:.05,engineering-tech:.05", "engineering", "Circuits, power, signals and electronics."],
  ["mechanical-engineering", "Mechanical Engineering", "14.1901", ENG, 75000, 110000, 1.5, 17.0, 33, 0.28, 2.8, "mechanical-engineer:.4,industrial-engineer:.1,aerospace-engineer:.07,engineering-manager:.06,project-manager:.05", "engineering", "Machines, energy and motion, designed and built."],
  ["chemical-engineering", "Chemical Engineering", "14.0701", ENG, 78000, 120000, 2.1, 15.0, 40, 0.3, 3.0, "chemical-engineer:.35,petroleum-engineer:.06,environmental-engineer:.06,engineering-manager:.06,chemist:.06", "engineering", "Turning chemistry into products and processes at scale."],
  ["civil-engineering", "Civil Engineering", "14.0801", ENG, 67000, 100000, 1.0, 14.0, 36, 0.26, 2.6, "civil-engineer:.5,environmental-engineer:.08,urban-planner:.04,engineering-manager:.06,project-manager:.06", "engineering", "Roads, bridges, water systems and the built environment."],
  ["aerospace-engineering", "Aerospace Engineering", "14.0201", ENG, 75000, 120000, 3.0, 20.0, 40, 0.3, 3.2, "aerospace-engineer:.4,mechanical-engineer:.15,engineering-manager:.06,software-developer:.08", "engineering", "Aircraft, spacecraft and the physics that moves them."],
  ["industrial-engineering", "Industrial Engineering", "14.3501", ENG, 73000, 105000, 1.9, 18.0, 30, 0.28, 2.9, "industrial-engineer:.34,logistician:.1,operations-research:.08,project-manager:.08,general-ops-manager:.06", "engineering", "Making systems, factories and supply chains work better."],
  ["biomedical-engineering", "Biomedical Engineering", "14.0501", ENG, 70000, 102000, 4.0, 25.0, 55, 0.3, 3.8, "biomedical-engineer:.3,mechanical-engineer:.08,medical-scientist:.08,sales-rep-technical:.07,physician:.06", "health", "Engineering for medicine: devices, imaging and tissues."],
  ["economics", "Economics", "45.0601", BUS, 65000, 105000, 4.1, 36.0, 43, 0.42, 4.2, "financial-analyst:.14,management-analyst:.1,market-research-analyst:.07,economist:.04,data-scientist:.05,business-ops-specialist:.07,policy-analyst:.03,lawyer:.05", "finance", "How people, firms and governments make choices with scarce resources."],
  ["finance", "Finance", "52.0801", BUS, 65000, 100000, 2.4, 33.0, 30, 0.4, 3.8, "financial-analyst:.22,personal-financial-advisor:.1,financial-manager:.08,securities-agent:.07,loan-officer:.06,credit-analyst:.05,accountant:.06", "finance", "Markets, investments, corporate finance and risk."],
  ["accounting", "Accounting", "52.0301", BUS, 60000, 85000, 2.7, 25.0, 35, 0.28, 3.0, "accountant:.48,financial-analyst:.08,tax-examiner:.04,budget-analyst:.04,financial-manager:.06", "finance", "Measuring, auditing and reporting how money moves."],
  ["business-administration", "Business Administration", "52.0201", BUS, 55000, 80000, 3.2, 52.0, 30, 0.38, 4.1, "general-ops-manager:.1,business-ops-specialist:.1,sales-rep:.08,sales-manager:.05,hr-specialist:.06,project-manager:.06,accountant:.05", "business", "The core of running an organization: management, operations, strategy."],
  ["business-analytics", "Business Analytics", "52.1301", BUS, 65000, 95000, 3.5, 35.0, 25, 0.34, 3.5, "market-research-analyst:.14,operations-research:.1,data-scientist:.1,management-analyst:.1,financial-analyst:.08", "business", "Data-driven decisions: statistics and modeling applied to business."],
  ["marketing", "Marketing", "52.1401", BUS, 50000, 80000, 2.8, 51.0, 20, 0.38, 4.0, "marketing-specialist:.2,market-research-analyst:.1,sales-rep:.12,marketing-manager:.06,pr-specialist:.05,sales-manager:.05", "business", "Understanding customers and bringing products to them."],
  ["mis", "Management Information Systems", "52.1201", BUS, 65000, 95000, 3.0, 30.0, 22, 0.32, 3.2, "computer-systems-analyst:.2,software-developer:.1,it-manager:.06,database-admin:.06,management-analyst:.08,project-manager:.08", "tech", "Where business meets information technology."],
  ["mathematics", "Mathematics", "27.0101", SCI, 60000, 90000, 3.8, 33.0, 55, 0.38, 4.0, "actuary:.08,statistician:.06,data-scientist:.1,software-developer:.1,high-school-teacher:.1,financial-analyst:.08,mathematician:.03", "finance", "Structure, proof and quantitative reasoning."],
  ["statistics-data-science", "Statistics & Data Science", "30.7001", SCI, 70000, 100000, 3.5, 28.0, 45, 0.34, 3.6, "data-scientist:.28,statistician:.12,operations-research:.08,market-research-analyst:.08,software-developer:.1,actuary:.04", "tech", "Learning from data: inference, modeling and machine learning."],
  ["physics", "Physics", "40.0801", SCI, 62000, 105000, 7.8, 35.0, 70, 0.4, 4.6, "physicist:.06,software-developer:.14,engineering-manager:.05,electrical-engineer:.08,postsecondary-teacher:.08,high-school-teacher:.06,data-scientist:.06", "science", "The fundamental laws of matter, energy and the universe."],
  ["chemistry", "Chemistry", "40.0501", SCI, 50000, 85000, 3.0, 38.0, 65, 0.34, 4.2, "chemist:.2,clinical-lab-tech:.08,pharmacist:.08,physician:.08,chemical-engineer:.05,high-school-teacher:.05", "science", "Molecules, reactions and materials."],
  ["biology", "Biology", "26.0101", LIFE, 42000, 70000, 4.7, 47.0, 64, 0.42, 4.8, "biological-technician:.1,physician:.1,clinical-lab-tech:.06,microbiologist:.04,registered-nurse:.05,high-school-teacher:.05,medical-scientist:.04", "health", "Living systems from cells to ecosystems."],
  ["biochemistry", "Biochemistry", "26.0202", LIFE, 45000, 78000, 5.0, 40.0, 70, 0.4, 4.6, "medical-scientist:.08,biological-technician:.12,chemist:.1,physician:.12,pharmacist:.06,clinical-lab-tech:.06", "health", "The chemistry of life: proteins, genes and metabolism."],
  ["neuroscience", "Neuroscience", "26.1501", LIFE, 42000, 72000, 4.5, 44.0, 65, 0.42, 4.7, "medical-scientist:.08,physician:.12,psychologist:.06,biological-technician:.1,clinical-lab-tech:.05,health-services-manager:.04", "health", "The brain, nervous system and behavior."],
  ["nursing", "Nursing", "51.3801", LIFE, 64000, 82000, 1.4, 11.0, 30, 0.2, 1.6, "registered-nurse:.78,nurse-practitioner:.06,health-services-manager:.04,health-educator:.02", "health", "Clinical care, patient advocacy and health promotion."],
  ["public-health", "Public Health", "51.2201", LIFE, 45000, 70000, 4.1, 44.0, 50, 0.36, 4.2, "health-educator:.12,epidemiologist:.06,health-services-manager:.1,policy-analyst:.04,social-worker:.05,dietitian:.03", "health", "Health at the scale of whole populations."],
  ["kinesiology", "Kinesiology / Exercise Science", "31.0505", LIFE, 40000, 60000, 4.0, 50.0, 55, 0.36, 4.0, "physical-therapist:.12,occupational-therapist:.06,health-educator:.08,physician-assistant:.05,high-school-teacher:.06,dietitian:.03", "health", "Human movement, performance and rehabilitation."],
  ["psychology", "Psychology", "42.0101", SOC, 42000, 65000, 4.3, 47.0, 55, 0.38, 4.6, "mental-health-counselor:.1,social-worker:.08,psychologist:.05,hr-specialist:.06,school-counselor:.04,market-research-analyst:.04", "social", "How people think, feel and behave."],
  ["sociology", "Sociology", "45.1101", SOC, 42000, 64000, 5.2, 50.0, 45, 0.38, 4.8, "social-worker:.12,probation-officer:.05,hr-specialist:.06,survey-researcher:.04,policy-analyst:.04,sales-rep:.05", "social", "Societies, institutions and inequality."],
  ["political-science", "Political Science", "45.1001", SOC, 50000, 85000, 5.0, 46.0, 60, 0.42, 4.8, "lawyer:.12,policy-analyst:.06,paralegal:.06,management-analyst:.06,pr-specialist:.05,political-scientist:.02", "government", "Power, policy, law and how governments work."],
  ["international-relations", "International Relations", "45.0901", SOC, 50000, 80000, 5.8, 46.0, 55, 0.42, 5.0, "policy-analyst:.08,management-analyst:.08,lawyer:.08,business-ops-specialist:.08,pr-specialist:.05", "government", "Diplomacy, global economics and security."],
  ["history", "History", "54.0101", HUM, 45000, 72000, 5.4, 47.0, 55, 0.4, 5.0, "high-school-teacher:.1,lawyer:.1,archivist:.04,writer:.04,paralegal:.05,management-analyst:.05", "education", "How the past shaped the present, told from evidence."],
  ["english", "English", "23.0101", HUM, 43000, 70000, 6.2, 50.0, 50, 0.4, 5.2, "writer:.08,editor:.07,high-school-teacher:.1,technical-writer:.05,pr-specialist:.06,lawyer:.06", "media", "Literature, writing and the power of language."],
  ["philosophy", "Philosophy", "38.0101", HUM, 48000, 75000, 5.5, 45.0, 60, 0.44, 5.0, "lawyer:.14,management-analyst:.06,writer:.04,postsecondary-teacher:.05,policy-analyst:.04,software-developer:.05", "social", "Argument, ethics and the foundations of knowledge."],
  ["communications", "Communications", "09.0101", HUM, 45000, 72000, 3.9, 49.0, 25, 0.4, 4.2, "pr-specialist:.12,marketing-specialist:.12,sales-rep:.08,writer:.04,producer-director:.04,marketing-manager:.04", "media", "How messages are made, spread and received."],
  ["journalism", "Journalism", "09.0401", HUM, 42000, 68000, 4.4, 48.0, 25, 0.4, 4.6, "reporter:.2,editor:.1,writer:.08,pr-specialist:.1,producer-director:.04", "media", "Reporting, verifying and telling true stories."],
  ["criminal-justice", "Criminal Justice", "43.0104", APP, 43000, 65000, 3.7, 70.0, 30, 0.32, 4.0, "police-officer:.16,probation-officer:.1,paralegal:.05,social-worker:.04,info-security-analyst:.02", "government", "Law enforcement, courts and corrections."],
  ["elementary-education", "Elementary Education", "13.1202", APP, 42000, 55000, 2.0, 16.0, 50, 0.22, 2.4, "elementary-teacher:.72,instructional-coordinator:.04,school-counselor:.03", "education", "Teaching and learning in the early grades."],
  ["social-work", "Social Work", "44.0701", APP, 42000, 55000, 3.5, 25.0, 50, 0.26, 3.4, "social-worker:.5,mental-health-counselor:.14,probation-officer:.04,health-educator:.04", "social", "Supporting people and communities through services and advocacy."],
  ["architecture", "Architecture", "04.0201", APP, 50000, 82000, 3.8, 29.0, 40, 0.32, 4.0, "architect:.4,urban-planner:.06,art-director:.03,project-manager:.06,civil-engineer:.04", "arts", "Designing buildings and the spaces people live in."],
  ["graphic-design", "Graphic Design", "50.0409", HUM, 43000, 65000, 6.0, 43.0, 15, 0.38, 4.6, "graphic-designer:.36,ux-designer:.1,art-director:.06,marketing-specialist:.06,web-developer:.04", "arts", "Visual communication: type, image and layout."],
  ["fine-arts", "Fine Arts", "50.0702", HUM, 38000, 60000, 7.0, 55.0, 25, 0.46, 5.6, "graphic-designer:.08,art-director:.04,high-school-teacher:.06,archivist:.03,producer-director:.03", "arts", "Making art: studio practice, history and critique."],
  ["music", "Music", "50.0901", HUM, 40000, 60000, 5.5, 55.0, 40, 0.46, 5.4, "musician:.14,high-school-teacher:.1,elementary-teacher:.06,producer-director:.04", "arts", "Performance, composition and music theory."],
  ["film-media", "Film & Media Studies", "50.0601", HUM, 42000, 67000, 7.5, 50.0, 20, 0.46, 5.4, "producer-director:.14,film-editor:.12,writer:.05,marketing-specialist:.05,pr-specialist:.04", "media", "Making and understanding film, video and media."],
  ["environmental-science", "Environmental Science", "03.0104", LIFE, 45000, 70000, 3.9, 40.0, 45, 0.34, 4.2, "environmental-scientist:.18,conservation-scientist:.08,environmental-engineer:.06,urban-planner:.04,biological-technician:.05", "science", "Earth systems, ecology and environmental policy."],
  ["agriculture", "Agriculture", "01.0000", APP, 45000, 70000, 1.5, 45.0, 25, 0.34, 3.2, "agricultural-manager:.14,food-scientist:.08,sales-rep:.08,conservation-scientist:.05,purchasing-agent:.05", "agriculture", "Food, farming and the business of agriculture."],
  ["hospitality", "Hospitality Management", "52.0901", APP, 45000, 70000, 3.3, 55.0, 12, 0.36, 3.6, "hotel-manager:.14,food-service-manager:.14,general-ops-manager:.06,sales-rep:.06,marketing-specialist:.04", "hospitality", "Running hotels, restaurants, events and travel."],
  ["supply-chain", "Supply Chain Management", "52.0203", BUS, 60000, 90000, 2.2, 30.0, 20, 0.3, 3.0, "logistician:.26,purchasing-agent:.12,general-ops-manager:.08,industrial-engineer:.04,business-ops-specialist:.08", "business", "Moving goods from source to customer, efficiently."],
  ["information-technology", "Information Technology", "11.0103", ENG, 55000, 85000, 4.5, 38.0, 18, 0.32, 3.6, "computer-support:.16,network-admin:.14,info-security-analyst:.1,computer-systems-analyst:.08,database-admin:.05,web-developer:.06", "tech", "Building and securing the systems organizations run on."],
  ["anthropology", "Anthropology", "45.0201", SOC, 40000, 63000, 8.0, 52.0, 50, 0.42, 5.4, "survey-researcher:.05,archivist:.05,social-worker:.06,market-research-analyst:.05,health-educator:.04", "social", "Human cultures, past and present."],
  ["liberal-arts", "Liberal Arts & General Studies", "24.0101", HUM, 40000, 62000, 6.5, 55.0, 40, 0.42, 5.2, "sales-rep:.08,business-ops-specialist:.06,elementary-teacher:.05,hr-specialist:.04,writer:.03", "education", "A broad education across the humanities and sciences."],
];

/** Industry breakdowns by profile (shares of recent graduates). */
export const INDUSTRY_PROFILES: Record<IndustryProfile, Array<[string, number]>> = {
  tech: [["Technology", 0.44], ["Finance & insurance", 0.14], ["Professional services", 0.14], ["Manufacturing", 0.08], ["Government", 0.06], ["Other", 0.14]],
  engineering: [["Manufacturing", 0.34], ["Professional services", 0.22], ["Construction & energy", 0.14], ["Technology", 0.1], ["Government", 0.08], ["Other", 0.12]],
  finance: [["Finance & insurance", 0.36], ["Professional services", 0.2], ["Technology", 0.1], ["Government", 0.08], ["Consulting", 0.1], ["Other", 0.16]],
  business: [["Professional services", 0.2], ["Retail & wholesale", 0.18], ["Finance & insurance", 0.16], ["Manufacturing", 0.12], ["Technology", 0.1], ["Other", 0.24]],
  science: [["Research & development", 0.26], ["Education", 0.18], ["Health care", 0.14], ["Manufacturing", 0.12], ["Government", 0.1], ["Other", 0.2]],
  health: [["Health care", 0.5], ["Research & development", 0.14], ["Education", 0.1], ["Social assistance", 0.06], ["Government", 0.06], ["Other", 0.14]],
  social: [["Social assistance", 0.2], ["Health care", 0.16], ["Education", 0.16], ["Government", 0.12], ["Professional services", 0.1], ["Other", 0.26]],
  education: [["Education", 0.42], ["Government", 0.1], ["Professional services", 0.1], ["Nonprofit", 0.08], ["Retail & wholesale", 0.08], ["Other", 0.22]],
  media: [["Media & publishing", 0.24], ["Professional services", 0.18], ["Education", 0.12], ["Technology", 0.1], ["Retail & wholesale", 0.08], ["Other", 0.28]],
  arts: [["Arts & entertainment", 0.24], ["Professional services", 0.2], ["Education", 0.14], ["Media & publishing", 0.1], ["Retail & wholesale", 0.1], ["Other", 0.22]],
  government: [["Government", 0.3], ["Legal services", 0.14], ["Professional services", 0.14], ["Nonprofit", 0.1], ["Education", 0.1], ["Other", 0.22]],
  agriculture: [["Agriculture & food", 0.38], ["Manufacturing", 0.14], ["Retail & wholesale", 0.12], ["Government", 0.1], ["Research & development", 0.06], ["Other", 0.2]],
  hospitality: [["Accommodation & food", 0.46], ["Arts & entertainment", 0.12], ["Retail & wholesale", 0.1], ["Real estate", 0.06], ["Professional services", 0.06], ["Other", 0.2]],
};
