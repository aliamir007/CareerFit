/**
 * ATS readiness scoring.
 *
 * A note on what this is and is not, because the term "ATS score" is widely
 * misused. Real applicant tracking systems (Workday, Taleo, Greenhouse, iCIMS)
 * do not publish a universal 0-100 score, and mostly do not compute one. What
 * they actually do is:
 *
 *   1. Parse the resume into structured fields (contact, roles, dates, skills).
 *      A resume that parses badly is ranked badly or dropped, regardless of how
 *      good the candidate is.
 *   2. Rank candidates against ONE specific job requisition, by matching the
 *      requisition's keywords against the parsed text.
 *
 * Step 2 is job-specific and this platform already does it elsewhere:
 * calculateSkillMatch() in skillNormalizer.js compares the candidate's skills
 * against a recruiter's skills_req. Duplicating it here would double-count.
 *
 * So this file scores step 1 only: how well-formed and machine-readable the
 * resume is, independent of any job. That is a real, measurable property, and
 * it is the part a candidate can act on. Every signal below is one an ATS
 * parser or a recruiter screen genuinely keys on:
 *
 *   Contact block     15  - unparseable contact info means nobody can call you
 *   Standard sections 20  - parsers look for known headings to segment the doc
 *   Experience depth  20  - datable roles are what populate the work-history table
 *   Quantified impact 15  - the strongest differentiator in recruiter screens
 *   Skills breadth    15  - what keyword matching has to work with
 *   Action verbs       5  - proxy for accomplishment-led (not duty-led) bullets
 *   Length            10  - too short says nothing; too long gets truncated
 *                     ---
 *                     100
 *
 * Deterministic and explainable by design: the same resume always scores the
 * same, and calculateATSBreakdown() can tell a candidate exactly what cost them
 * points. A black-box number nobody can act on would be worse than none.
 *
 * Tolerant of imperfect extraction: some PDFs carry no space glyphs, so the
 * extracted text arrives as "5yearsofexperience". Matching is therefore done on
 * a whitespace-stripped copy with substring checks, never \b word boundaries,
 * which would silently fail on those files.
 */

const ACTION_VERBS = [
  "achieved", "architected", "automated", "built", "created", "delivered",
  "deployed", "designed", "developed", "engineered", "implemented", "improved",
  "increased", "launched", "led", "managed", "mentored", "migrated",
  "optimized", "optimised", "reduced", "scaled", "shipped", "streamlined",
];

const ROLE_WORDS = [
  "engineer", "developer", "intern", "manager", "analyst", "scientist",
  "consultant", "architect", "administrator", "designer", "specialist", "lead",
];

const SECTION_SIGNALS = {
  experience: ["experience", "employment", "workhistory", "professional"],
  education: ["education", "university", "college", "bachelor", "master", "degree"],
  skills: ["skills", "technologies", "technicalskills", "toolsandtechnologies"],
  // A summary or a projects section both serve the same purpose here: giving the
  // parser (and the reader) context beyond a bare list of jobs.
  summaryOrProjects: ["summary", "objective", "project", "portfolio"],
};

/** Points awarded from the first threshold met, largest first. */
const tier = (value, thresholds) => {
  for (const [min, points] of thresholds) {
    if (value >= min) return points;
  }
  return 0;
};

const countMatches = (text, pattern) => (text.match(pattern) || []).length;

/**
 * Detailed, explainable score.
 *
 * @param {string} resumeText - text extracted from the PDF
 * @param {number} technicalSkillsCount - skills the AI extracted
 * @returns {{ total: number, breakdown: Array<{section,score,max,detail}> }}
 */
function calculateATSBreakdown(resumeText, technicalSkillsCount = 0) {
  const raw = typeof resumeText === "string" ? resumeText : "";
  const lower = raw.toLowerCase();

  // Spaces are unreliable (see header note), so headings and verbs are matched
  // against a whitespace-free copy.
  const squashed = lower.replace(/\s+/g, "");
  const skillsCount = Number(technicalSkillsCount) || 0;

  const breakdown = [];

  // --- 1. Contact block (15) ------------------------------------------------
  // If a parser cannot pull an email or phone out, the application is dead on
  // arrival no matter what the rest of the resume says.
  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.]+/.test(lower);
  const hasPhone = /(\+?\d{1,3})?[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{4}/.test(lower);
  const hasProfile = /linkedin\.com|github\.com|gitlab\.com/.test(squashed);
  // A "City, ST" pair, or an explicit relocation/location word.
  const hasLocation =
    /[a-z]+,\s?[a-z]{2}\b/.test(lower) || /\b(remote|relocat)/.test(lower);

  const contact =
    (hasEmail ? 6 : 0) +
    (hasPhone ? 4 : 0) +
    (hasProfile ? 3 : 0) +
    (hasLocation ? 2 : 0);

  breakdown.push({
    section: "Contact details",
    score: contact,
    max: 15,
    detail: [
      hasEmail ? "email" : null,
      hasPhone ? "phone" : null,
      hasProfile ? "LinkedIn/GitHub" : null,
      hasLocation ? "location" : null,
    ].filter(Boolean).join(", ") || "no contact details found",
  });

  // --- 2. Standard sections (20) --------------------------------------------
  // Parsers segment a resume by recognising conventional headings. Creative
  // headings ("Where I've Made A Dent") are exactly what breaks them.
  const foundSections = Object.entries(SECTION_SIGNALS).filter(([, signals]) =>
    signals.some((signal) => squashed.includes(signal)),
  );
  const sections = foundSections.length * 5;

  breakdown.push({
    section: "Standard sections",
    score: sections,
    max: 20,
    detail: `${foundSections.length} of 4 found (experience, education, skills, summary/projects)`,
  });

  // --- 3. Experience depth (20) ---------------------------------------------
  // Years and role titles are what populate an ATS work-history table. A resume
  // with no parseable dates leaves those fields empty.
  const years = countMatches(lower, /\b(19|20)\d{2}\b/g);
  const stillEmployed = /present|current/.test(squashed);
  const roles = ROLE_WORDS.filter((word) => squashed.includes(word)).length;

  const dateScore = tier(years + (stillEmployed ? 1 : 0), [[4, 10], [2, 7], [1, 4]]);
  const roleScore = tier(roles, [[3, 10], [2, 7], [1, 4]]);
  const experience = dateScore + roleScore;

  breakdown.push({
    section: "Experience depth",
    score: experience,
    max: 20,
    detail: `${years} date${years === 1 ? "" : "s"}, ${roles} role title${roles === 1 ? "" : "s"} detected`,
  });

  // --- 4. Quantified impact (15) --------------------------------------------
  // "Reduced p99 latency 40%" beats "Responsible for performance". This is the
  // single strongest signal in a human recruiter screen, so it is weighted like
  // one rather than treated as a nicety.
  const percentages = countMatches(raw, /\d+\s?%/g);
  const money = countMatches(raw, /[$£€]\s?\d/g);
  const magnitudes = countMatches(raw, /\b\d+(\.\d+)?\s?(k|m|bn|million|billion|x)\b/gi);
  const plainNumbers = countMatches(raw, /\b\d{2,}\b/g);

  const quantified = tier(
    percentages * 2 + money * 2 + magnitudes * 2 + Math.min(plainNumbers, 6),
    [[10, 15], [6, 12], [3, 8], [1, 4]],
  );

  breakdown.push({
    section: "Quantified impact",
    score: quantified,
    max: 15,
    detail:
      percentages + money + magnitudes === 0
        ? "no measurable results found — add figures like \"cut build time 30%\""
        : `${percentages} percentage${percentages === 1 ? "" : "s"}, ${money + magnitudes} other metric${money + magnitudes === 1 ? "" : "s"}`,
  });

  // --- 5. Skills breadth (15) -----------------------------------------------
  // Keyword matching has nothing to work with if the skills section is thin.
  const skills = tier(skillsCount, [[20, 15], [12, 12], [8, 9], [5, 6], [3, 3]]);

  breakdown.push({
    section: "Skills breadth",
    score: skills,
    max: 15,
    detail: `${skillsCount} skill${skillsCount === 1 ? "" : "s"} extracted`,
  });

  // --- 6. Action verbs (5) --------------------------------------------------
  const verbs = ACTION_VERBS.filter((verb) => squashed.includes(verb)).length;
  const verbScore = tier(verbs, [[6, 5], [4, 4], [2, 2]]);

  breakdown.push({
    section: "Action verbs",
    score: verbScore,
    max: 5,
    detail: `${verbs} distinct action verb${verbs === 1 ? "" : "s"}`,
  });

  // --- 7. Length (10) -------------------------------------------------------
  // Measured in characters, not words: whitespace is unreliable, so a word count
  // would be meaningless on the very files that need this to work.
  const chars = raw.trim().length;
  const length = tier(
    chars >= 1500 && chars <= 9000 ? 3 : chars >= 800 && chars <= 13000 ? 2 : chars >= 400 ? 1 : 0,
    [[3, 10], [2, 7], [1, 4]],
  );

  breakdown.push({
    section: "Length",
    score: length,
    max: 10,
    detail:
      chars < 400
        ? "too short, or the PDF is an image the parser cannot read"
        : chars > 13000
          ? "very long — an ATS may truncate it"
          : "reasonable length",
  });

  const total = breakdown.reduce((sum, item) => sum + item.score, 0);

  return {
    total: Math.max(0, Math.min(100, Math.round(total))),
    breakdown,
  };
}

/**
 * @param {string} resumeText
 * @param {number} technicalSkillsCount
 * @returns {number} 0-100
 */
function calculateATSScore(resumeText, technicalSkillsCount) {
  return calculateATSBreakdown(resumeText, technicalSkillsCount).total;
}

export { calculateATSScore, calculateATSBreakdown };
