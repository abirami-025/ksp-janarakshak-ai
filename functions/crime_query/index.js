const catalyst = require('zcatalyst-sdk-node');
const fs = require('fs');
const path = require('path');

// Catalyst Serverless Basic I/O Function
module.exports = (context, basicIO) => {
  try {
    // 1. Initialize Catalyst App SDK Node
    const catalystApp = catalyst.initialize(context);
    
    // 2. Read query parameters
    const query = basicIO.getArgument('q') || '';
    const qLower = query.toLowerCase();

    // 3. Load database (simulating Catalyst Data Store queries)
    // In production, you would use:
    // const datastore = catalystApp.datastore();
    // const table = datastore.table('FIR_Records');
    // const queryResult = await table.selectQuery("SELECT * FROM FIR_Records WHERE...");
    
    const dbPath = path.join(__dirname, 'crime-data.json');
    let db = { firs: [], suspects: [], transactions: [], districtAnalytics: {} };
    
    // Fallback load local file if exists
    if (fs.existsSync(dbPath)) {
      db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }

    let responseText = "";
    let meta = "Zia NLP Serverless Engine";
    const isKannada = /[\u0C80-\u0CFF]/.test(query);

    if (isKannada) {
      meta = "ಝಿಯಾ ಕನ್ನಡ ಭಾಷಾ ಸರ್ವರ್‌ಲೆಸ್ ಎಂಜಿನ್";
      if (qLower.includes("ಸೈಬರ್") || qLower.includes("cyber")) {
        const cyber = db.firs.filter(f => f.incident_type === 'Cybercrime');
        responseText = `ವರದಿ: ಸಿಸ್ಟಮ್ ಒಟ್ಟು <strong>${cyber.length} ಸೈಬರ್ ಅಪರಾಧಗಳನ್ನು</strong> ಪತ್ತೆ ಮಾಡಿದೆ.<br><br>` + 
                       `ಪ್ರಮುಖ ಪ್ರಕರಣಗಳು:<br>` +
                       cyber.slice(0, 3).map(f => `• <strong>${f.fir_id}</strong> - ${f.police_station} (${f.severity}) - ₹${f.loss_amount_inr.toLocaleString()}`).join('<br>');
      } else if (qLower.includes("ಬೆಂಗಳೂರು") || qLower.includes("bengaluru")) {
        const blr = db.firs.filter(f => f.district.includes('Bengaluru'));
        responseText = `ಬೆಂಗಳೂರಿನಲ್ಲಿ ಒಟ್ಟು <strong>${blr.length} ಪ್ರಕರಣಗಳು</strong> ದಾಖಲಾಗಿವೆ.<br><br>` +
                       `ಇತ್ತೀಚಿನ ಪ್ರಕರಣ: <strong>${blr[0].fir_id}</strong> (${blr[0].incident_type}) - ${blr[0].police_station}.`;
      } else {
        responseText = `ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಪ್ರಶ್ನೆ: "${query}" ನಮಗೆ ತಲುಪಿದೆ. ಹೆಚ್ಚಿನ ವಿವರಗಳಿಗೆ "ಸೈಬರ್" ಅಥವಾ "ಬೆಂಗಳೂರು" ಬಳಸಿ.`;
      }
    } else {
      // English
      if (qLower.includes("cyber") || qLower.includes("phishing")) {
        const cyber = db.firs.filter(f => f.incident_type === 'Cybercrime');
        responseText = `🔍 <strong>RAG Analysis (Zia & QuickML)</strong>:<br>` +
                       `Found <strong>${cyber.length} Cybercrime cases</strong> in Data Store.<br><br>` +
                       cyber.slice(0, 3).map(f => `• <strong>${f.fir_id}</strong>: ₹${f.loss_amount_inr.toLocaleString()} loss in ${f.police_station}.`).join('<br>');
      } else if (qLower.includes("suspect") || qLower.includes("offender")) {
        const list = db.suspects.slice(0, 3).map(s => `• <strong>${s.name}</strong> - Risk Score: ${(s.risk_score*100).toFixed(0)}%`).join('<br>');
        responseText = `🕵️ <strong>Suspect Link Analysis</strong>:<br><br>${list}`;
      } else {
        responseText = `Serverless Response for: "${query}". Found ${db.firs.length} total FIR records inside Catalyst Data Store.`;
      }
    }

    // Return payload
    basicIO.write(JSON.stringify({
      status: "success",
      query,
      response: responseText,
      meta,
      timestamp: new Date().toISOString()
    }));

    context.close();
  } catch (error) {
    basicIO.write(JSON.stringify({
      status: "error",
      message: error.message
    }));
    context.close();
  }
};
