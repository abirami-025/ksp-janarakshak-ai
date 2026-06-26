/* ==========================================================================
   KSP Janarakshak AI — Enhanced Synthetic Crime Database Generator v2.0
   Generates 200+ FIRs with full socio-demographic, behavioral, and 
   investigation timeline data for all 10 capability areas.
   ========================================================================== */

const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const NUM_FIRS = 200;
const NUM_SUSPECTS = 25;
const NUM_VICTIMS = 30;

// --- REFERENCE DATA ---
const districts = [
  { name: "Bengaluru Urban", lat: 12.9716, lng: 77.5946, urbanIndex: 0.95, population: 12000000 },
  { name: "Bengaluru Rural", lat: 13.1000, lng: 77.5800, urbanIndex: 0.55, population: 1100000 },
  { name: "Mysuru", lat: 12.2958, lng: 76.6394, urbanIndex: 0.72, population: 3200000 },
  { name: "Mangaluru", lat: 12.9141, lng: 74.8560, urbanIndex: 0.68, population: 2100000 },
  { name: "Hubballi-Dharwad", lat: 15.3647, lng: 75.1240, urbanIndex: 0.64, population: 1800000 },
  { name: "Belagavi", lat: 15.8497, lng: 74.4977, urbanIndex: 0.58, population: 2500000 },
  { name: "Kalaburagi", lat: 17.3297, lng: 76.8343, urbanIndex: 0.42, population: 1500000 },
  { name: "Shivamogga", lat: 13.9299, lng: 75.5681, urbanIndex: 0.48, population: 800000 },
  { name: "Davangere", lat: 14.4644, lng: 75.9218, urbanIndex: 0.50, population: 950000 },
  { name: "Raichur", lat: 16.2076, lng: 77.3563, urbanIndex: 0.35, population: 700000 }
];

const policeStations = {
  "Bengaluru Urban": ["Whitefield PS", "Indiranagar PS", "Koramangala PS", "Electronic City PS", "Jayanagar PS", "Yelahanka PS", "HSR Layout PS", "Mahadevapura PS"],
  "Bengaluru Rural": ["Devanahalli PS", "Doddaballapur PS", "Nelamangala PS", "Hoskote PS"],
  "Mysuru": ["Nazarbad PS", "Lakshmipuram PS", "Krishnaraja PS", "Hunsur PS"],
  "Mangaluru": ["Mangaluru North PS", "Mangaluru South PS", "Surathkal PS", "Bantwal PS"],
  "Hubballi-Dharwad": ["Gokul Road PS", "Vidyanagar PS", "Keshwapur PS"],
  "Belagavi": ["Belagavi City PS", "Khanapur PS", "Chikodi PS"],
  "Kalaburagi": ["Kalaburagi City PS", "Aland PS", "Chincholi PS"],
  "Shivamogga": ["Shivamogga City PS", "Bhadravathi PS"],
  "Davangere": ["Davangere City PS", "Harihara PS"],
  "Raichur": ["Raichur City PS", "Sindhanur PS"]
};

const crimeTypes = [
  { type: "Cybercrime", ipc: "IPC 420, IT Act 66C/66D", severity: "High", category: "White Collar" },
  { type: "Theft", ipc: "IPC 379/380", severity: "Medium", category: "Property" },
  { type: "Burglary", ipc: "IPC 454/457", severity: "High", category: "Property" },
  { type: "Financial Fraud", ipc: "IPC 420/406", severity: "High", category: "White Collar" },
  { type: "Assault", ipc: "IPC 323/324/325", severity: "Medium", category: "Violent" },
  { type: "Murder", ipc: "IPC 302/304", severity: "Critical", category: "Violent" },
  { type: "Drug Trafficking", ipc: "NDPS Act 20/22", severity: "Critical", category: "Organized" },
  { type: "Kidnapping", ipc: "IPC 363/364", severity: "High", category: "Violent" },
  { type: "Domestic Violence", ipc: "IPC 498A", severity: "Medium", category: "Social" },
  { type: "Sexual Harassment", ipc: "IPC 354/509", severity: "High", category: "Social" },
  { type: "Chain Snatching", ipc: "IPC 392", severity: "Medium", category: "Property" },
  { type: "Vehicle Theft", ipc: "IPC 379", severity: "Medium", category: "Property" },
  { type: "Extortion", ipc: "IPC 384/385", severity: "High", category: "Organized" },
  { type: "Forgery", ipc: "IPC 463/468", severity: "Medium", category: "White Collar" },
  { type: "Rioting", ipc: "IPC 147/148", severity: "High", category: "Public Order" }
];

const moPatterns = [
  "Targeted phishing via fake UPI payment links",
  "House break-in during festival season when owners travel",
  "Impersonation of bank officials via phone calls",
  "Street ambush near ATM during late night hours",
  "Organized gang operation with scout-driver-executor roles",
  "Social media honey-trapping and subsequent blackmail",
  "Counterfeit currency distribution through retail networks",
  "Drug smuggling via interstate highway transport",
  "Domestic dispute escalating to physical violence",
  "Road rage incident leading to assault",
  "Vehicle theft from unguarded parking areas",
  "Chain snatching on isolated roads at dusk",
  "Land dispute leading to organized intimidation",
  "OTP interception using SIM swap technique",
  "Employment fraud via fake recruitment portals"
];

const occupations = ["Daily Wage Laborer", "Auto/Taxi Driver", "IT Professional", "Student", "Homemaker", "Farmer", "Shopkeeper", "Government Employee", "Private Employee", "Business Owner", "Unemployed", "Construction Worker", "Healthcare Worker", "Teacher"];
const educationLevels = ["Illiterate", "Primary School", "High School", "PUC/12th", "Graduate", "Post Graduate", "Professional Degree"];
const incomeGroups = ["BPL (<1L)", "Low (1-3L)", "Middle (3-8L)", "Upper Middle (8-15L)", "High (>15L)"];
const genders = ["Male", "Female", "Other"];
const maritalStatuses = ["Single", "Married", "Divorced", "Widowed"];

const investigationStages = [
  { stage: "FIR Registered", daysOffset: 0 },
  { stage: "Preliminary Investigation", daysOffset: 2 },
  { stage: "Evidence Collection", daysOffset: 7 },
  { stage: "Witness Statements Recorded", daysOffset: 12 },
  { stage: "Suspect Identified", daysOffset: 18 },
  { stage: "Arrest Made", daysOffset: 25 },
  { stage: "Charge Sheet Filed", daysOffset: 40 },
  { stage: "Court Hearing Scheduled", daysOffset: 60 }
];

const statuses = ["Under Investigation", "Charge Sheet Filed", "Pending Trial", "Closed - Solved", "Closed - Unresolved", "Referred to CID"];
const festivals = ["Dasara", "Diwali", "Ugadi", "Ganesh Chaturthi", "Eid", "Christmas", "New Year", "Independence Day", "Republic Day"];

const firstNames = ["Karthik", "Mohammed", "Nagaraj", "Syed", "Ramesh", "Suresh", "Vijay", "Raju", "Manoj", "Deepak", "Praveen", "Santosh", "Girish", "Mahesh", "Anil", "Naveen", "Prasad", "Venkatesh", "Harish", "Rajesh", "Anita", "Lakshmi", "Priya", "Kavitha", "Shobha"];
const lastNames = ["Gowda", "Raje", "Khan", "Pasha", "Shetty", "Reddy", "Patil", "Naik", "Kumar", "Rao", "Hegde", "Murthy", "Bhat", "Acharya", "Poojary"];
const aliases = ["Psycho", "Bullet", "Simcard", "Shadow", "MD", "Tiger", "Cobra", "Blade", "Lucky", "Rockstar", "Chaaku", "Ninga", "Rowdy", "Don", "Genius"];

// --- HELPER FUNCTIONS ---
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickWeighted = (arr, weights) => {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
};

function generateDate(yearRange = [2022, 2025]) {
  const year = rand(yearRange[0], yearRange[1]);
  const month = rand(0, 11);
  const day = rand(1, 28);
  const hour = rand(0, 23);
  return new Date(year, month, day, hour, rand(0, 59));
}

function getNearbyEvent(date) {
  const month = date.getMonth();
  const day = date.getDate();
  // Approximate festival windows
  if (month === 9 && day >= 1 && day <= 15) return "Dasara";
  if (month === 10 && day >= 1 && day <= 15) return "Diwali";
  if (month === 3 && day >= 10 && day <= 25) return "Ugadi";
  if (month === 8 && day >= 15 && day <= 30) return "Ganesh Chaturthi";
  if (month === 11 && day >= 20 && day <= 31) return "Christmas/New Year";
  if (month === 7 && day === 15) return "Independence Day";
  if (month === 0 && day === 26) return "Republic Day";
  if (date.getDay() === 0 || date.getDay() === 6) return "Weekend";
  return null;
}

function getTimeCategory(hour) {
  if (hour >= 6 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
}

function getSeason(month) {
  if (month >= 2 && month <= 4) return "Summer";
  if (month >= 5 && month <= 8) return "Monsoon";
  if (month >= 9 && month <= 10) return "Post-Monsoon";
  return "Winter";
}

// --- BUILD SUSPECTS ---
function buildSuspects() {
  const suspects = [];
  for (let i = 0; i < NUM_SUSPECTS; i++) {
    const firstName = pick(firstNames);
    const lastName = pick(lastNames);
    const alias = pick(aliases);
    const age = rand(19, 55);
    const gender = pickWeighted(["Male", "Female"], [85, 15]);
    const crimeType = pick(crimeTypes);
    const district = pick(districts);
    const priorArrests = rand(0, 8);
    
    // Behavioral MO patterns
    const moHistory = [];
    const numMOs = rand(1, 3);
    for (let j = 0; j < numMOs; j++) moHistory.push(pick(moPatterns));
    
    // Risk Evolution
    const riskEvolution = [];
    let currentRisk = 0.2;
    for (let m = 0; m < 6; m++) {
      currentRisk = parseFloat((currentRisk + (Math.random() * 0.15 * (priorArrests > 0 ? 1 : -0.5))).toFixed(2));
      currentRisk = Math.max(0.1, Math.min(0.99, currentRisk));
      riskEvolution.push({ month: `Month -${5-m}`, score: currentRisk });
    }
    let finalRisk = parseFloat((0.3 + Math.random() * 0.65).toFixed(2));
    if (i === 0) finalRisk = 0.92;
    if (i === 1) finalRisk = 0.87;
    if (i === 2) finalRisk = 0.89;
    riskEvolution.push({ month: 'Current', score: finalRisk });

    suspects.push({
      suspect_id: `SUS-${String(i + 1).padStart(3, '0')}`,
      name: `${firstName} '${alias}' ${lastName}`,
      alias,
      age,
      gender,
      education: pick(educationLevels),
      occupation: pick(occupations),
      income_group: pick(incomeGroups),
      marital_status: pick(maritalStatuses),
      native_place: district.name,
      native_district_urban_index: district.urbanIndex,
      primary_mo: crimeType.type,
      mo_history: moHistory,
      behavioral_tags: [
        priorArrests > 3 ? "Habitual Offender" : "First-Time/Occasional",
        age < 25 ? "Juvenile/Young Adult" : age > 45 ? "Seasoned Criminal" : "Active Career",
        crimeType.category === "Organized" ? "Syndicate Member" : crimeType.category === "Violent" ? "Violence Prone" : "Opportunistic",
        moHistory.length > 2 ? "Multi-MO Versatile" : "Specialized"
      ],
      risk_score: finalRisk,
      risk_evolution: riskEvolution,
      status: pick(["Active – At Large", "In Custody", "On Bail", "Absconding", "Under Surveillance"]),
      gang_affiliation: Math.random() < 0.4 ? `Gang-${String.fromCharCode(65 + rand(0, 5))}` : null,
      bank_accounts: [`AC-${rand(100000, 999999)}`],
      phone_numbers: [`+91-9${rand(100000000, 999999999)}`],
      last_known_location: `${pick(policeStations[district.name] || ["Unknown"])} area`,
      prior_arrests: priorArrests,
      physical_desc: `${pick(["Tall", "Medium", "Short"])} build, ${pick(["dark", "fair", "medium"])} complexion, ${pick(["short black", "long", "bald", "grey"])} hair`
    });
  }
  return suspects;
}

// --- BUILD VICTIMS ---
function buildVictims() {
  const victims = [];
  for (let i = 0; i < NUM_VICTIMS; i++) {
    const age = rand(18, 72);
    const gender = pickWeighted(["Male", "Female", "Other"], [55, 42, 3]);
    victims.push({
      victim_id: `VIC-${String(i + 1).padStart(3, '0')}`,
      name: `${pick(firstNames)} ${pick(lastNames)}`,
      age,
      gender,
      education: pick(educationLevels),
      occupation: pick(occupations),
      income_group: pick(incomeGroups),
      marital_status: pick(maritalStatuses),
      social_vulnerability_score: parseFloat((0.1 + Math.random() * 0.8).toFixed(2)),
      contact: `+91-9${rand(100000000, 999999999)}`
    });
  }
  return victims;
}

// --- BUILD FIRs ---
function buildFIRs(suspects, victims) {
  const firs = [];
  const links = [];
  const transactions = [];

  for (let i = 0; i < NUM_FIRS; i++) {
    const district = pick(districts);
    const stations = policeStations[district.name] || ["Central PS"];
    const station = pick(stations);
    const crime = pick(crimeTypes);
    const date = generateDate();
    const hour = date.getHours();
    const nearbyEvent = getNearbyEvent(date);
    const season = getSeason(date.getMonth());
    const status = pick(statuses);
    
    // Generate investigation timeline
    const timeline = [];
    const numStages = status.includes("Closed") ? investigationStages.length : rand(2, 5);
    for (let s = 0; s < numStages && s < investigationStages.length; s++) {
      const stageDate = new Date(date);
      stageDate.setDate(stageDate.getDate() + investigationStages[s].daysOffset);
      timeline.push({
        stage: investigationStages[s].stage,
        date: stageDate.toISOString(),
        officer: `SI ${pick(firstNames)} ${pick(lastNames)}`
      });
    }

    const firId = `FIR-${date.getFullYear()}-${String(i + 1).padStart(4, '0')}`;
    const lossAmt = crime.category === "White Collar" ? rand(50000, 2500000) : 
                    crime.category === "Property" ? rand(5000, 500000) : rand(0, 50000);

    const fir = {
      fir_id: firId,
      incident_type: crime.type,
      crime_category: crime.category,
      severity: crime.severity,
      modus_operandi: pick(moPatterns),
      ipc_sections: crime.ipc,
      incident_date: date.toISOString(),
      incident_hour: hour,
      incident_time_category: getTimeCategory(hour),
      season,
      nearby_event: nearbyEvent,
      day_of_week: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()],
      district: district.name,
      district_urban_index: district.urbanIndex,
      district_population: district.population,
      division: "Division Hub",
      police_station: station,
      latitude: parseFloat((district.lat + (Math.random() - 0.5) * 0.08).toFixed(6)),
      longitude: parseFloat((district.lng + (Math.random() - 0.5) * 0.08).toFixed(6)),
      status,
      investigation_timeline: timeline,
      loss_amount_inr: lossAmt,
      recovery_percent: status.includes("Solved") ? rand(40, 100) : rand(0, 20),
      description: `${crime.type} incident reported at ${station} (${district.name}). MO: ${pick(moPatterns)}. Case registered under ${crime.ipc}.`,
      similar_case_tags: [crime.type, crime.category, district.name, getTimeCategory(hour)],
      evidence_items: rand(1, 8),
      witness_count: rand(0, 5)
    };
    firs.push(fir);

    // Link victims
    const numVictims = rand(1, 2);
    for (let v = 0; v < numVictims; v++) {
      const victim = pick(victims);
      links.push({
        link_id: `LNK-${firId}-V${v}`,
        fir_id: firId,
        entity_id: victim.victim_id,
        entity_type: "Victim",
        association_type: v === 0 ? "Primary Complainant" : "Secondary Victim",
        confidence: parseFloat((0.7 + Math.random() * 0.3).toFixed(2))
      });
    }

    // Link suspects (60% chance)
    if (Math.random() < 0.6) {
      const suspect = pick(suspects);
      links.push({
        link_id: `LNK-${firId}-S`,
        fir_id: firId,
        entity_id: suspect.suspect_id,
        entity_type: "Suspect",
        association_type: pick(["Primary Accused", "Accomplice", "Modus Operandi Match", "Financial Trail Link"]),
        confidence: parseFloat((0.5 + Math.random() * 0.5).toFixed(2))
      });

      // Financial transactions for white collar / organized crimes
      if (crime.category === "White Collar" || crime.category === "Organized" || Math.random() < 0.3) {
        const numTxns = rand(1, 4);
        for (let t = 0; t < numTxns; t++) {
          // Financial typologies
          let riskFlag = pick(["High - Structuring", "Medium - Unusual Pattern", "High - Rapid Layering", "Low - Normal", "Critical - Shell Account"]);
          let isSuspicious = Math.random() < 0.6;
          let aiInsight = "";
          
          if (isSuspicious) {
            if (riskFlag.includes("Layering")) {
              aiInsight = "AI Insight: Rapid successive transfers detected splitting primary amount into 3-4 unverified external accounts within 24 hours.";
            } else if (riskFlag.includes("Shell")) {
              aiInsight = "AI Insight: Account activity shows zero organic daily spend. Exclusively used as a high-volume transit node. 90% probability of shell entity.";
            } else if (riskFlag.includes("Structuring")) {
              aiInsight = "AI Insight: Deposits kept deliberately below the ₹50,000 PAN reporting threshold in a clustered pattern.";
            } else {
              aiInsight = "AI Insight: Velocity of transactions and counterparty network strongly correlate with known syndicate money-mule behaviors.";
            }
          }

          transactions.push({
            transaction_id: `TXN-${firId}-${t}`,
            fir_id: firId,
            suspect_id: suspect.suspect_id,
            amount_inr: rand(5000, 500000),
            bank: pick(["SBI", "HDFC", "ICICI", "Axis", "Canara", "PNB", "Kotak", "PayTM Wallet", "PhonePe", "Google Pay"]),
            account_number: `XXXX-${rand(1000, 9999)}`,
            utr_number: `UTR${rand(100000000, 999999999)}`,
            transaction_date: date.toISOString(),
            transaction_type: pick(["UPI Transfer", "NEFT", "Cash Deposit", "ATM Withdrawal", "Hawala", "Crypto Exchange"]),
            risk_flag: riskFlag,
            ai_insight: aiInsight,
            destination_account: `AC-${rand(100000, 999999)}`,
            is_suspicious: isSuspicious
          });
        }
      }
    }
  }

  // Inject guaranteed MO-recurrence clusters
  const seedCases = [
    // Cluster 1: Bengaluru Urban Cybercrime
    {
      id: "FIR-2025-9001", district: "Bengaluru Urban", type: "Cybercrime", cat: "White Collar",
      mo: "Targeted phishing via fake UPI payment links", ipc: "IPC 420, IT Act 66C/66D",
      date: "2025-05-01T10:00:00.000Z", hour: 10, station: "Indiranagar PS", loss: 650000, lat: 12.9716, lng: 77.5946
    },
    {
      id: "FIR-2025-9002", district: "Bengaluru Urban", type: "Cybercrime", cat: "White Collar",
      mo: "Targeted phishing via fake UPI payment links", ipc: "IPC 420, IT Act 66C/66D",
      date: "2025-05-10T14:30:00.000Z", hour: 14, station: "Whitefield PS", loss: 1200000, lat: 12.9816, lng: 77.6046
    },
    {
      id: "FIR-2025-9003", district: "Bengaluru Urban", type: "Cybercrime", cat: "White Collar",
      mo: "Targeted phishing via fake UPI payment links", ipc: "IPC 420, IT Act 66C/66D",
      date: "2025-05-18T09:15:00.000Z", hour: 9, station: "Koramangala PS", loss: 450000, lat: 12.9616, lng: 77.5846
    },
    // Cluster 2: Mysuru Burglary
    {
      id: "FIR-2025-9004", district: "Mysuru", type: "Burglary", cat: "Property",
      mo: "House break-in during festival season when owners travel", ipc: "IPC 454/457",
      date: "2025-10-05T02:00:00.000Z", hour: 2, station: "Lakshmipuram PS", loss: 150000, lat: 12.2958, lng: 76.6394
    },
    {
      id: "FIR-2025-9005", district: "Mysuru", type: "Burglary", cat: "Property",
      mo: "House break-in during festival season when owners travel", ipc: "IPC 454/457",
      date: "2025-10-12T03:00:00.000Z", hour: 3, station: "Krishnaraja PS", loss: 220000, lat: 12.3058, lng: 76.6494
    },
    {
      id: "FIR-2025-9006", district: "Mysuru", type: "Burglary", cat: "Property",
      mo: "House break-in during festival season when owners travel", ipc: "IPC 454/457",
      date: "2025-10-20T01:30:00.000Z", hour: 1, station: "Nazarbad PS", loss: 80000, lat: 12.2858, lng: 76.6294
    }
  ];

  seedCases.forEach((c, idx) => {
    const dateObj = new Date(c.date);
    const season = getSeason(dateObj.getMonth());
    const nearbyEvent = getNearbyEvent(dateObj);
    const timeline = [
      { stage: "FIR Registered", date: c.date, officer: "SI Karthik Gowda" },
      { stage: "Preliminary Investigation", date: new Date(dateObj.getTime() + 2*24*60*60*1000).toISOString(), officer: "SI Karthik Gowda" }
    ];

    firs.push({
      fir_id: c.id,
      incident_type: c.type,
      crime_category: c.cat,
      severity: "High",
      modus_operandi: c.mo,
      ipc_sections: c.ipc,
      incident_date: c.date,
      incident_hour: c.hour,
      incident_time_category: getTimeCategory(c.hour),
      season,
      nearby_event: nearbyEvent,
      day_of_week: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dateObj.getDay()],
      district: c.district,
      district_urban_index: c.district === "Bengaluru Urban" ? 0.95 : 0.72,
      district_population: c.district === "Bengaluru Urban" ? 12000000 : 3200000,
      division: "Division Hub",
      police_station: c.station,
      latitude: c.lat,
      longitude: c.lng,
      status: "Under Investigation",
      investigation_timeline: timeline,
      loss_amount_inr: c.loss,
      recovery_percent: 0,
      description: `${c.type} incident reported at ${c.station} (${c.district}). MO: ${c.mo}. Case registered under ${c.ipc}.`,
      similar_case_tags: [c.type, c.cat, c.district, getTimeCategory(c.hour)],
      evidence_items: 3,
      witness_count: 2
    });

    // Link a victim
    const victim = victims[idx % victims.length];
    links.push({
      link_id: `LNK-${c.id}-V`,
      fir_id: c.id,
      entity_id: victim.victim_id,
      entity_type: "Victim",
      association_type: "Primary Complainant",
      confidence: 0.95
    });

    // Link a suspect
    const suspect = suspects[idx % suspects.length];
    links.push({
      link_id: `LNK-${c.id}-S`,
      fir_id: c.id,
      entity_id: suspect.suspect_id,
      entity_type: "Suspect",
      association_type: "Primary Accused",
      confidence: 0.88
    });
  });

  return { firs, links, transactions };
}

// --- BUILD DISTRICT ANALYTICS ---
function buildDistrictAnalytics(firs) {
  const analytics = {};
  districts.forEach(d => {
    const df = firs.filter(f => f.district === d.name);
    const solved = df.filter(f => f.status.includes('Solved') || f.status.includes('Closed')).length;
    const byCat = {};
    const byType = {};
    const byTime = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    const bySeason = { Summer: 0, Monsoon: 0, "Post-Monsoon": 0, Winter: 0 };
    const byGender = { Male: 0, Female: 0 };

    df.forEach(f => {
      byCat[f.crime_category] = (byCat[f.crime_category] || 0) + 1;
      byType[f.incident_type] = (byType[f.incident_type] || 0) + 1;
      byTime[f.incident_time_category]++;
      bySeason[f.season]++;
    });

    analytics[d.name] = {
      total_firs: df.length,
      by_category: byCat,
      by_type: byType,
      by_time_of_day: byTime,
      by_season: bySeason,
      total_loss_inr: df.reduce((sum, f) => sum + f.loss_amount_inr, 0),
      solved_rate: df.length > 0 ? parseFloat(((solved / df.length) * 100).toFixed(1)) : 0,
      urban_index: d.urbanIndex,
      population: d.population,
      crime_rate_per_lakh: df.length > 0 ? parseFloat(((df.length / d.population) * 100000).toFixed(2)) : 0,
      hotspot_severity: df.length > 25 ? "Critical" : df.length > 15 ? "High" : df.length > 8 ? "Medium" : "Low"
    };
  });
  return analytics;
}

// --- MAIN EXECUTION ---
function main() {
  console.log("Generating enhanced KSP Janarakshak AI database v2.0...");

  const suspects = buildSuspects();
  const victims = buildVictims();
  const { firs, links, transactions } = buildFIRs(suspects, victims);
  const districtAnalytics = buildDistrictAnalytics(firs);

  const database = {
    metadata: {
      version: "2.0",
      generated_at: new Date().toISOString(),
      total_firs: firs.length,
      total_suspects: suspects.length,
      total_victims: victims.length,
      total_transactions: transactions.length,
      total_links: links.length,
      districts_covered: districts.length,
      source: "KSP Janarakshak AI Synthetic Database v2.0"
    },
    suspects,
    victims,
    firs,
    links,
    transactions,
    districtAnalytics,
    generated_at: new Date().toISOString()
  };

  // Write to root and client directory
  const outPath = path.join(__dirname, 'crime-data.json');
  const clientPath = path.join(__dirname, 'client', 'crime-data.json');
  const funcPath = path.join(__dirname, 'functions', 'crime_query', 'crime-data.json');

  fs.writeFileSync(outPath, JSON.stringify(database, null, 2));
  console.log(`Written to: ${outPath}`);

  if (fs.existsSync(path.join(__dirname, 'client'))) {
    fs.writeFileSync(clientPath, JSON.stringify(database, null, 2));
    console.log(`Written to: ${clientPath}`);
  }
  if (fs.existsSync(path.join(__dirname, 'functions', 'crime_query'))) {
    fs.writeFileSync(funcPath, JSON.stringify(database, null, 2));
    console.log(`Written to: ${funcPath}`);
  }

  console.log("==========================================");
  console.log("KSP DATABASE v2.0 GENERATION COMPLETE");
  console.log(`FIRs: ${firs.length} | Suspects: ${suspects.length} | Victims: ${victims.length}`);
  console.log(`Transactions: ${transactions.length} | Links: ${links.length}`);
  console.log("==========================================");
}

main();
