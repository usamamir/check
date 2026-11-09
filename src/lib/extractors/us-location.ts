const US_STATES: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  "district of columbia": "DC",
};

const STATE_ABBR = new Set(Object.values(US_STATES));

const ADDRESS_RE =
  /(\d{1,6}\s+[A-Za-z0-9.\-'\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir|Parkway|Pkwy)\.?)\s*,?\s*([A-Za-z.\s]+)\s*,?\s*([A-Z]{2}|[A-Za-z\s]+)\s+(\d{5}(?:-\d{4})?)/gi;

export type UsLocationResult = {
  city?: string;
  state?: string;
  zip?: string;
  street?: string;
  confidence: number;
  signals: string[];
};

export function detectUsLocation(text: string): UsLocationResult {
  const signals: string[] = [];
  let city: string | undefined;
  let state: string | undefined;
  let zip: string | undefined;
  let street: string | undefined;
  let confidence = 0;

  for (const m of text.matchAll(ADDRESS_RE)) {
    street = m[1].trim();
    city = m[2].trim().replace(/,$/, "");
    const stateRaw = m[3].trim();
    zip = m[4];
    const abbr = STATE_ABBR.has(stateRaw.toUpperCase())
      ? stateRaw.toUpperCase()
      : US_STATES[stateRaw.toLowerCase()];
    if (abbr) {
      state = abbr;
      signals.push(`address:${city},${state} ${zip}`);
      confidence = Math.max(confidence, 0.9);
      break;
    }
  }

  const lower = text.toLowerCase();
  if (/\bmade in usa\b|\bmade in the usa\b|\bmade in america\b/.test(lower)) {
    signals.push("made_in_usa");
    confidence = Math.max(confidence, 0.55);
  }
  if (/\bships? from (?:the )?usa\b|\bus based\b|\busa based\b|\bunited states\b/.test(lower)) {
    signals.push("ships_from_usa");
    confidence = Math.max(confidence, 0.5);
  }
  if (/\$\d|USD|US\$/.test(text)) {
    signals.push("usd_currency");
    confidence = Math.max(confidence, confidence || 0.25);
  }

  // State name mentions with city-like context
  if (!state) {
    for (const [name, abbr] of Object.entries(US_STATES)) {
      const re = new RegExp(`\\b([A-Z][a-z]+(?:\\s[A-Z][a-z]+)?)[,\\s]+${name}\\b`, "i");
      const m = text.match(re);
      if (m) {
        city = m[1];
        state = abbr;
        signals.push(`state_name:${city},${state}`);
        confidence = Math.max(confidence, 0.65);
        break;
      }
      if (new RegExp(`\\b${abbr}\\s+\\d{5}\\b`).test(text)) {
        state = abbr;
        signals.push(`state_zip:${abbr}`);
        confidence = Math.max(confidence, 0.7);
        break;
      }
    }
  }

  return { city, state, zip, street, confidence, signals };
}
