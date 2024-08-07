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
const SERPAPI_KEY = "3b45be119fba604dc5baafdc91659c026b582a6ea4922834bc4f0736971780a9";
const FIRECRAWL_API_KEY = "fc-15918a39ffbc4634842972480176d54d";
const OPENAI_API_KEY = "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";
if (!SERPAPI_KEY || !FIRECRAWL_API_KEY || !OPENAI_API_KEY) {
    console.error("One or more API keys are missing");
    process.exit(1);
}
function searchWithSerpAPI(company) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield axios_1.default.get('https://serpapi.com/search', {
            params: {
                q: "is \"" + company + "\" a woman-owned or minority-owned or veteran-owned small business",
                api_key: SERPAPI_KEY,
            }
        });
        // Adjust this part based on SerpAPI response structure
        return response.data.organic_results.map((result) => result.link);
    });
}
function scrapeWithFirecrawl(urls) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield axios_1.default.post('https://api.firecrawl.dev/scrape', {
            urls: urls,
        }, {
            headers: {
                'Authorization': `Bearer FIRECRAWL_API_KEY`
            }
        });
        // Adjust this part based on Firecrawl response structure
        return response.data.data;
    });
}
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
            for (var _d = true, rl_1 = __asyncValues(rl), rl_1_1; rl_1_1 = yield rl_1.next(), _a = rl_1_1.done, !_a; _d = true) {
                _c = rl_1_1.value;
                _d = false;
                const line = _c;
                console.log(`Processing company: ${line}`);
                try {
                    const urls = yield searchWithSerpAPI(line);
                    if (urls.length === 0) {
                        console.warn(`No URLs found for ${line}`);
                        lines.push(`${line};No data found`);
                        continue;
                    }
                    const data = yield scrapeWithFirecrawl(urls);
                    //const analysis = await processWithGPT(data);
                    //lines.push(`${line};${analysis}`);
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
        fs.writeFileSync('companies_output.txt', lines.join('\n'));
    });
}
processCompanies().catch(console.error);
