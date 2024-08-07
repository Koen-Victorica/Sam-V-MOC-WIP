import axios from 'axios';
import * as fs from 'fs';
import * as readline from 'readline';
import OpenAI from 'openai';

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
async function searchWithSerpAPI(company: string): Promise<string[]> {
  console.log(`Searching for company: ${company} with SerpAPI`);

  try {
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        q: `is "${company}" a woman-owned or minority-owned or veteran-owned small business`,
        api_key: SERPAPI_KEY,
      }
    });
    console.log(`SerpAPI response for ${company}:`, response.data);

    // Return the list of URLs from SerpAPI's response
    return response.data.organic_results.map((result: any) => result.link);
  } catch (error) {
    console.error(`Error fetching data from SerpAPI for ${company}:`, error);
    return [];
  }
}

// Function to scrape data from list of URLs using Firecrawl
async function scrapeWithFirecrawl(urls: string[]): Promise<string[]> {
  console.log(`Scraping data from URLs: ${urls}`);
  const results: string[] = [];

  const timeoutDuration = 120000;  // Timeout set to 2 minutes (120000ms)
  const waitForDuration = 3000;    // Reduced wait time to 3 seconds (3000ms)

  for (const url of urls) {
    if (results.length >= 3) break; // Stop if we already have 3 scraped results

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
          waitFor: waitForDuration  // Reduced wait time
        },
        extractorOptions: {
          mode: 'markdown',
          extractionPrompt: "",
          extractionSchema: {}
        },
        timeout: timeoutDuration  // Increased timeout
      });

      console.log(`Sending request to Firecrawl with payload:`, payload);

      const response = await axios.post('https://api.firecrawl.dev/v0/scrape', payload, {
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`Firecrawl response for ${url}:`, response.data);

      results.push(response.data.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`Axios error for URL ${url}:`, {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
      } else {
        console.error(`Non-Axios error for URL ${url}:`, error);
      }
      console.warn(`Skipping URL ${url} due to error.`);
    }
  }

  return results;
}

// Function to interact with OpenAI's GPT model
async function chatWithGPT(userInput: string): Promise<string> {
  const client = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

  const params: OpenAI.Chat.ChatCompletionCreateParams = {
    messages: [{ role: 'user', content: userInput }],
    model: 'gpt-3.5-turbo',
  };

  console.log(`Sending the following request to GPT: ${userInput}`);

  try {
    const chatCompletion = await client.chat.completions.create(params);
    const responseMessageContent = chatCompletion.choices[0].message?.content;

    if (responseMessageContent !== null && responseMessageContent !== undefined) {
      return responseMessageContent;
    } else {
      return "No response found.";
    }

  } catch (error) {
    console.error(`Error from OpenAI API: ${error}`);
    return `An error occurred: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// Main function to process companies from the input file
async function processCompanies() {
  const fileStream = fs.createReadStream('test.txt');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const lines: string[] = [];
  
  // Read each line (company name) from the file
  for await (const line of rl) {
    console.log(`Processing company: ${line}`);
    try {
      // Obtain URLs using SerpAPI
      const urls = await searchWithSerpAPI(line);
      console.log(`URLs found for ${line}:`, urls);

      if (urls.length === 0) {
        console.warn(`No URLs found for ${line}`);
        lines.push(`${line};No data found`);
        continue;
      }

      // Scrape data from the obtained URLs
      let data: string[] = [];
      let attempts = 0;

      while (data.length < 3 && attempts < urls.length) {
        const newData = await scrapeWithFirecrawl(urls.slice(attempts, attempts + 3));
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
      const analysis = await chatWithGPT(userInput);
      console.log(`GPT Analysis for ${line}:`, analysis);

      lines.push(`${line};${analysis}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error processing ${line}: ${error.message}`);
        lines.push(`${line};Error occurred: ${error.message}`);
      } else {
        console.error(`Error processing ${line}: ${JSON.stringify(error)}`);
        lines.push(`${line};Unknown error occurred`);
      }
    }
  }

  console.log(`Writing results to companies_output.txt`);
  fs.writeFileSync('companies_output.txt', lines.join('\n'));
}

// Execute the main function
processCompanies().catch(console.error);