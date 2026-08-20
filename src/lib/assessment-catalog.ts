export type AssessmentKey = "PHQ-9" | "GAD-7";

export type ScoreBand = {
  min: number;
  max: number;
  severity: string;
  en: string;
  he: string;
};

export type CatalogAssessment = {
  key: AssessmentKey;
  name: string;
  descriptionEn: string;
  descriptionHe: string;
  minScore: number;
  maxScore: number;
  questions: { en: string; he: string }[];
  bands: ScoreBand[];
};

export const LIKERT_OPTIONS = [
  { value: 0, en: "Not at all", he: "כלל לא" },
  { value: 1, en: "Several days", he: "מספר ימים" },
  { value: 2, en: "More than half the days", he: "יותר ממחצית הימים" },
  { value: 3, en: "Nearly every day", he: "כמעט כל יום" },
] as const;

export const ASSESSMENT_CATALOG: CatalogAssessment[] = [
  {
    key: "PHQ-9",
    name: "PHQ-9",
    descriptionEn: "Patient Health Questionnaire-9",
    descriptionHe: "שאלון בריאות המטופל 9",
    minScore: 0,
    maxScore: 27,
    questions: [
      { en: "Little interest or pleasure in doing things", he: "עניין או הנאה מועטים בפעילויות" },
      { en: "Feeling down, depressed, or hopeless", he: "תחושת עצבות, דיכאון או חוסר תקווה" },
      { en: "Trouble falling/staying asleep, or sleeping too much", he: "קשיי שינה או שינה מרובה" },
      { en: "Feeling tired or having little energy", he: "עייפות או מיעוט אנרגיה" },
      { en: "Poor appetite or overeating", he: "תיאבון ירוד או אכילת יתר" },
      { en: "Feeling bad about yourself — or that you are a failure", he: "תחושה רעה כלפי עצמך או כישלון" },
      { en: "Trouble concentrating on things, such as reading the newspaper", he: "קושי בריכוז, למשל בקריאה" },
      {
        en: "Moving/speaking so slowly that others noticed? Or the opposite — fidgety/restless",
        he: "תנועה או דיבור איטיים, או אי-שקט בולט",
      },
      {
        en: "Thoughts that you would be better off dead or of hurting yourself",
        he: "מחשבות שמוטב היה למות, או לפגוע בעצמך",
      },
    ],
    bands: [
      { min: 0, max: 4, severity: "none", en: "None–minimal", he: "ללא–מינימלי" },
      { min: 5, max: 9, severity: "mild", en: "Mild", he: "קל" },
      { min: 10, max: 14, severity: "moderate", en: "Moderate", he: "בינוני" },
      { min: 15, max: 19, severity: "moderately_severe", en: "Moderately severe", he: "בינוני–חמור" },
      { min: 20, max: 27, severity: "severe", en: "Severe", he: "חמור" },
    ],
  },
  {
    key: "GAD-7",
    name: "GAD-7",
    descriptionEn: "Generalized Anxiety Disorder-7",
    descriptionHe: "שאלון חרדה מוכללת 7",
    minScore: 0,
    maxScore: 21,
    questions: [
      { en: "Feeling nervous, anxious, or on edge", he: "תחושת עצבנות, חרדה או דריכות" },
      { en: "Not being able to stop or control worrying", he: "חוסר יכולת להפסיק או לשלוט בדאגה" },
      { en: "Worrying too much about different things", he: "דאגה מוגזמת לגבי דברים שונים" },
      { en: "Trouble relaxing", he: "קושי להירגע" },
      { en: "Being so restless that it is hard to sit still", he: "אי-שקט שמקשה לשבת במקום" },
      { en: "Becoming easily annoyed or irritable", he: "הפיכה למוטרד/ת או עצבני/ת בקלות" },
      { en: "Feeling afraid as if something awful might happen", he: "פחד שמשהו נורא עלול לקרות" },
    ],
    bands: [
      { min: 0, max: 4, severity: "none", en: "None–minimal", he: "ללא–מינימלי" },
      { min: 5, max: 9, severity: "mild", en: "Mild", he: "קל" },
      { min: 10, max: 14, severity: "moderate", en: "Moderate", he: "בינוני" },
      { min: 15, max: 21, severity: "severe", en: "Severe", he: "חמור" },
    ],
  },
];

export function getCatalog(key: string) {
  return ASSESSMENT_CATALOG.find((item) => item.key === key) ?? null;
}

export function scoreAnswers(key: string, answers: number[]) {
  const catalog = getCatalog(key);
  if (!catalog) return { ok: false as const, error: "type" };
  if (answers.length !== catalog.questions.length) {
    return { ok: false as const, error: "answers" };
  }
  if (answers.some((value) => !Number.isInteger(value) || value < 0 || value > 3)) {
    return { ok: false as const, error: "answers" };
  }
  const total = answers.reduce((sum, value) => sum + value, 0);
  const band =
    catalog.bands.find((item) => total >= item.min && total <= item.max) ??
    catalog.bands[catalog.bands.length - 1];
  return {
    ok: true as const,
    totalScore: total,
    severityLevel: band.severity,
    interpretationEn: band.en,
    interpretationHe: band.he,
  };
}
