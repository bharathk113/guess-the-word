console.log("WordServiceGen2: Loaded");

window.WordService = class WordService {
    static async getWords(category = 'general', length = 5) {
        // Fetch new JSON data format: words/general/5_letter_words.json
        const path = `./words/${category}/${length}_letter_words.json`;

        try {
            console.log(`WordServiceGen2: Fetching words from ${path}...`);
            const response = await fetch(path);

            if (!response.ok) {
                console.error(`WordServiceGen2: Failed to fetch ${path} - ${response.statusText}`);
                return null;
            }

            const data = await response.json();

            let solutions = [];
            let allowed = [];

            if (Array.isArray(data)) {
                solutions = data;
                allowed = data;
            } else {
                solutions = data.solutions || data.words || [];
                allowed = data.allowed || data.valid || solutions;
            }

            // Ensure uppercase
            const allowedSet = new Set(allowed.map(w => w.toUpperCase()));
            const upperSolutions = solutions.map(w => w.toUpperCase());

            return {
                solutions: upperSolutions,
                allowed: allowedSet
            };

        } catch (error) {
            console.error("WordServiceGen2: Error parsing word data", error);
            alert("Error loading word data. Check console.");
            return null;
        }
    }

    static getDailySolution(solutions, length) {
        if (!solutions || solutions.length === 0) return "ERROR";

        // 1. Filter Top 1000 (Common words are at start of JSON)
        // Ensure we don't crash if list is smaller than 1000
        const poolSize = Math.min(solutions.length, 1000);
        const pool = solutions.slice(0, poolSize);

        // 2. Generate Date Seed (Local Date to avoid timezone confusion for user? 
        // Or UTC for global consistency? Prompt implied "specific date".
        // Let's use Local Date string YYYYMMDD to match user's "Day".
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateSeedStr = `${year}${month}${day}-${length}`; // e.g. "20241206-5"

        // 3. Simple Hash / RNG Function (MurmurHash3-ish or simple MUL)
        // We just need a deterministic index from the string.
        let h = 0x811c9dc5;
        for (let i = 0; i < dateSeedStr.length; i++) {
            h ^= dateSeedStr.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }

        // 4. Positive Modulo
        const index = ((h >>> 0) % poolSize);

        console.log(`Daily Word Debug: Date=${dateSeedStr}, PoolSize=${poolSize}, Index=${index}, Word=${pool[index]}`);
        return pool[index];
    }
};
