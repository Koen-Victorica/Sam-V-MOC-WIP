"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const readline = __importStar(require("readline"));
const openai_1 = __importDefault(require("openai"));
// API keys for various services: SerpAPI, Firecrawl, OpenAI
const SERPAPI_KEY = "3b45be119fba604dc5baafdc91659c026b582a6ea4922834bc4f0736971780a9";
const FIRECRAWL_API_KEY = "fc-15918a39ffbc4634842972480176d54d";
const OPENAI_API_KEY = "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";
// Validate if all API keys are present
if (!SERPAPI_KEY || !FIRECRAWL_API_KEY || !OPENAI_API_KEY) {
    console.error("One or more API keys are missing");
    process.exit(1);
}
// Function to search for company information using SerpAPI
function searchWithSerpAPI(company) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Searching for company: ${company} with SerpAPI`);
        try {
            const response = yield axios_1.default.get('https://serpapi.com/search', {
                params: {
                    q: `is "${company}" a woman-owned or minority-owned or veteran-owned small business`,
                    api_key: SERPAPI_KEY,
                }
            });
            console.log(`SerpAPI response for ${company}:`, response.data);
            // Return the list of URLs from SerpAPI's response
            return response.data.organic_results.map((result) => result.link);
        }
        catch (error) {
            console.error(`Error fetching data from SerpAPI for ${company}:`, error);
            return [];
        }
    });
}
// Function to scrape data from list of URLs using Firecrawl
function scrapeWithFirecrawl(urls) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        console.log(`Scraping data from URLs: ${urls}`);
        const results = [];
        const timeoutDuration = 120000; // Timeout set to 2 minutes (120000ms)
        const waitForDuration = 3000; // Reduced wait time to 3 seconds (3000ms)
        for (const url of urls) {
            if (results.length >= 3)
                break; // Stop if we already have 3 scraped results
            try {
                const payload = JSON.stringify({
                    url: url,
                    pageOptions: {
                        headers: {},
                        includeHtml: true,
                        includeRawHtml: true,
                        onlyIncludeTags: [],
                        onlyMainContent: true,
                        removeTags: [],
                        replaceAllPathsWithAbsolutePaths: true,
                        screenshot: true,
                        waitFor: waitForDuration // Reduced wait time
                    },
                    extractorOptions: {
                        mode: 'markdown',
                        extractionPrompt: "",
                        extractionSchema: {}
                    },
                    timeout: timeoutDuration // Increased timeout
                });
                console.log(`Sending request to Firecrawl with payload:`, payload);
                const response = yield axios_1.default.post('https://api.firecrawl.dev/v0/scrape', payload, {
                    headers: {
                        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log(`Firecrawl response for ${url}:`, response.data);
                results.push(response.data.data);
            }
            catch (error) {
                if (axios_1.default.isAxiosError(error)) {
                    console.error(`Axios error for URL ${url}:`, {
                        message: error.message,
                        status: (_a = error.response) === null || _a === void 0 ? void 0 : _a.status,
                        statusText: (_b = error.response) === null || _b === void 0 ? void 0 : _b.statusText,
                        data: (_c = error.response) === null || _c === void 0 ? void 0 : _c.data,
                    });
                }
                else {
                    console.error(`Non-Axios error for URL ${url}:`, error);
                }
                console.warn(`Skipping URL ${url} due to error.`);
            }
        }
        return results;
    });
}
// Function to interact with OpenAI's GPT model
function chatWithGPT(userInput) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const client = new openai_1.default({
            apiKey: OPENAI_API_KEY,
        });
        const params = {
            messages: [{ role: 'user', content: userInput }],
            model: 'gpt-3.5-turbo',
        };
        console.log(`Sending the following request to GPT: ${userInput}`);
        try {
            const chatCompletion = yield client.chat.completions.create(params);
            const responseMessageContent = (_a = chatCompletion.choices[0].message) === null || _a === void 0 ? void 0 : _a.content;
            if (responseMessageContent !== null && responseMessageContent !== undefined) {
                return responseMessageContent;
            }
            else {
                return "No response found.";
            }
        }
        catch (error) {
            console.error(`Error from OpenAI API: ${error}`);
            return `An error occurred: ${error instanceof Error ? error.message : String(error)}`;
        }
    });
}
// Main function to process companies from the input file
function processCompanies() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        const fileStream = fs.createReadStream('test.txt');
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });
        const lines = [];
        try {
            // Read each line (company name) from the file
            for (var _d = true, rl_1 = __asyncValues(rl), rl_1_1; rl_1_1 = yield rl_1.next(), _a = rl_1_1.done, !_a; _d = true) {
                _c = rl_1_1.value;
                _d = false;
                const line = _c;
                console.log(`Processing company: ${line}`);
                try {
                    // Obtain URLs using SerpAPI
                    const urls = yield searchWithSerpAPI(line);
                    console.log(`URLs found for ${line}:`, urls);
                    if (urls.length === 0) {
                        console.warn(`No URLs found for ${line}`);
                        lines.push(`${line};No data found`);
                        continue;
                    }
                    // Scrape data from the obtained URLs
                    let data = [];
                    let attempts = 0;
                    while (data.length < 3 && attempts < urls.length) {
                        const newData = yield scrapeWithFirecrawl(urls.slice(attempts, attempts + 3));
                        data = data.concat(newData.filter(d => d !== ''));
                        attempts += 3;
                    }
                    console.log(`Scraped data for ${line}:`, data);
                    if (data.length < 3) {
                        console.warn(`Not enough data scraped for ${line}`);
                        lines.push(`${line};Not enough data scraped`);
                        continue;
                    }
                    // Ensure data is stringified properly
                    const formattedData = data.map((d, index) => `Data from URL ${index + 1}:\n${JSON.stringify(d, null, 2)}`).join("\n\n");
                    const userInput = `Analyze the following data to determine if it is a woman-owned or minority-owned or veteran-owned small business:\n${formattedData}`;
                    // Log the formatted data before sending it to GPT
                    console.log(`Formatted Data for GPT Analysis:\n${formattedData}`);
                    console.log(`Sending the following request to GPT for company ${line}: ${userInput}`);
                    // Analyze the data with GPT
                    const analysis = yield chatWithGPT(userInput);
                    console.log(`GPT Analysis for ${line}:`, analysis);
                    lines.push(`${line};${analysis}`);
                }
                catch (error) {
                    if (error instanceof Error) {
                        console.error(`Error processing ${line}: ${error.message}`);
                        lines.push(`${line};Error occurred: ${error.message}`);
                    }
                    else {
                        console.error(`Error processing ${line}: ${JSON.stringify(error)}`);
                        lines.push(`${line};Unknown error occurred`);
                    }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = rl_1.return)) yield _b.call(rl_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        console.log(`Writing results to companies_output.txt`);
        fs.writeFileSync('companies_output.txt', lines.join('\n'));
    });
}
// Execute the main function
processCompanies().catch(console.error);
