console.log("WordService: Script Loaded (Fetch Version)");
window.WordService = class WordService {
    static async getWords(category = 'general', length = 5) {
        // Fetch new JSON data format: words/general/5_letter_words.json
        const path = `./words/${category}/${length}_letter_words.json`;

        try {
            console.log(`WordService: Fetching words from ${path}...`);
            const response = await fetch(path);

            if (!response.ok) {
                console.error(`WordService: Failed to fetch ${path} - ${response.statusText}`);
                return null;
            }

            const data = await response.json();

            // The JSON structure depends on the file.
            // Assumption based on "I pasted the actual words data":
            // It could be an array ["word", ...] or object { solutions: [], allowed: [] }.
            // We will handle both.

            let solutions = [];
            let allowed = [];

            if (Array.isArray(data)) {
                // If it's just a raw list, use it for both.
                solutions = data;
                allowed = data;
            } else {
                // Check possible keys
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
            console.error("WordService: Error parsing word data", error);
            alert("Error loading word data. Check console.");
            return null;
        }
    }

    static getDailySolution(solutions, length) {
        if (!solutions || solutions.length === 0) return "ERROR";
        // Simple daily hash based on epoch days
        const msPerDay = 24 * 60 * 60 * 1000;
        const startTimestamp = new Date('2024-01-01').getTime();
        const now = new Date().getTime();
        const daysSinceEpoch = Math.floor((now - startTimestamp) / msPerDay);

        const index = (daysSinceEpoch + length * 7) % solutions.length;
        return solutions[index];
    }
};
