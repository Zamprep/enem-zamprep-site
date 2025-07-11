// This is a Cloudflare Pages Function.
// The file should be at /api/generate-problem.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// A one-time script to run to create your D1 table.
// You can run this using `wrangler d1 execute <DATABASE_NAME> --file=./schema.sql`
// CREATE TABLE questions ( id SERIAL PRIMARY KEY, question_text TEXT NOT NULL, correct_answers JSON NOT NULL, distractor_answers JSON NOT NULL, difficulty_level INTEGER NOT NULL, approved BOOLEAN DEFAULT FALSE, times_used INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP );

/**
 * The main function that handles requests.
 * @param {Request} request The incoming request.
 * @param {object} env Environment variables and bindings.
 * @param {object} ctx The execution context.
 * @returns {Response}
 */
export default {
    async fetch(request, env, ctx) {
        // Basic security: only allow POST requests
        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
        }

        const { level = 1 } = await request.json();

        // 1. Try to fetch an approved question from the D1 database
        try {
            const stmt = env.DB.prepare(
                `SELECT id, question_text, correct_answers, distractor_answers 
                 FROM questions 
                 WHERE approved = 1 AND difficulty_level = ?1
                 ORDER BY times_used ASC, RANDOM() 
                 LIMIT 1`
            ).bind(level);
            const { results } = await stmt.all();

            if (results && results.length > 0) {
                const question = results[0];
                // Asynchronously update the usage count, don't make the user wait
                ctx.waitUntil(env.DB.prepare("UPDATE questions SET times_used = times_used + 1 WHERE id = ?1").bind(question.id).run());

                const responseData = {
                    question: question.question_text,
                    answers: {
                        correct: JSON.parse(question.correct_answers),
                        distractors: JSON.parse(question.distractor_answers)
                    }
                };
                return new Response(JSON.stringify(responseData), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
        } catch (dbError) {
            console.error("D1 Database Error:", dbError);
            // Don't stop; proceed to generate a new question.
        }

        // 2. If no question found in DB, call Gemini to generate a new one
        try {
            const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            let difficulty;
            if (level >= 7) difficulty = "very challenging";
            else if (level >= 4) difficulty = "moderately difficult";
            else difficulty = "simple and straightforward";

            const prompt = `Generate a JSON object for a math problem for a student preparing for the ENEM exam in Brazil. The problem should be ${difficulty}. The problem should be a quadratic equation in the format "ax^2 + bx + c = 0". The roots of the equation must be integers. The JSON object must have the following structure: { "question": "The equation string", "answers": { "correct": [root1, root2], "distractors": [plausible_wrong_root1, plausible_wrong_root2] } } Ensure the distractors are plausible, for example, by having the wrong sign. Do not include any text or markdown formatting outside of the JSON object itself.`;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const problemData = JSON.parse(response.text());

            // 3. Save the newly generated question to the D1 database
            const insertStmt = env.DB.prepare(
                `INSERT INTO questions (question_text, correct_answers, distractor_answers, difficulty_level) VALUES (?1, ?2, ?3, ?4)`
            ).bind(
                problemData.question,
                JSON.stringify(problemData.answers.correct),
                JSON.stringify(problemData.answers.distractors),
                level
            );
            ctx.waitUntil(insertStmt.run());

            return new Response(JSON.stringify(problemData), { status: 200, headers: { 'Content-Type': 'application/json' } });

        } catch (apiError) {
            console.error("Error calling Gemini API:", apiError);
            return new Response(JSON.stringify({ error: "Failed to generate a problem." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }
};