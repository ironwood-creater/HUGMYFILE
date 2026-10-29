export interface ToolContent {
  /** Opening paragraphs (plain text; simple inline HTML links allowed). */
  intro: string[];
  /** 3–5 "How to use" steps. */
  steps: string[];
  /** Key features as short sentences. */
  features: string[];
  /** Optional extra section such as "Good to know". */
  extra?: { heading: string; paragraphs: string[] };
  /** 4–6 questions and answers. */
  faqs: { q: string; a: string }[];
}
