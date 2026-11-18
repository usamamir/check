import { findEmails, focusLine, formatList, hasPhrase } from "./text.js";

function article(word) {
  return /^[aeiou]/i.test(String(word || "").trim()) ? "an" : "a";
}

function greeting(job) {
  if (job.contactName) return `Dear ${job.contactName},`;
  return "Dear Hiring Team,";
}

function experienceSentence(profile, skills) {
  const list = formatList(skills);
  if (profile.years && list) return `I have ${profile.years} years in this field, using ${list}.`;
  if (list) return `I use ${list}.`;
  if (profile.years) return `I have ${profile.years} years in the work described on my resume.`;
  return "The resume I am attaching is the experience I am offering for this role.";
}

function matchedSkills(profile, job) {
  const fromScore = (job.matchedTerms || []).filter((term) => (profile.skills || []).includes(term));
  if (fromScore.length) return fromScore.slice(0, 3);
  return (profile.skills || []).filter((skill) => hasPhrase(`${job.title}\n${job.description}`, skill)).slice(0, 3);
}

export function coverLetter({ profile, job, hasResume = false }) {
  const skills = matchedSkills(profile, job);
  const focus = focusLine(job.description || "").replace(/"/g, "'");
  const lines = [greeting(job), ""];
  const intro = [
    job.company && job.company !== "Unknown company"
      ? `${job.company} is hiring ${article(job.title)} ${job.title}.`
      : `This posting is for ${article(job.title)} ${job.title}.`,
  ];
  if (focus) intro.push(`This is the line I am answering: "${focus}"`);
  lines.push(intro.join(" "));
  lines.push("");
  lines.push(experienceSentence(profile, skills));
  const highlights = (profile.highlights || [])
    .filter((highlight) => highlight !== focus)
    .slice(0, 3);
  if (highlights.length) {
    lines.push("");
    lines.push("From my resume:");
    for (const highlight of highlights) lines.push(`- ${highlight}`);
  }
  lines.push("");
  lines.push(
    hasResume
      ? "I can talk this week. My resume is attached."
      : "I can talk this week and send the resume in whatever format you use.",
  );
  lines.push("");
  if (profile.name) lines.push(profile.name);
  if (profile.email) lines.push(profile.email);
  if (profile.phone) lines.push(profile.phone);
  let letter = `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
  const foreignEmails = findEmails(letter).filter(
    (email) => email.toLowerCase() !== String(profile.email || "").toLowerCase(),
  );
  for (const email of foreignEmails) letter = letter.split(email).join("[address omitted]");
  if (!letter.endsWith("\n")) letter += "\n";
  return letter;
}
