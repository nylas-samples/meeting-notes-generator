#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const { Configuration, OpenAIApi } = require('openai');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Parse command-line arguments
const argv = yargs(hideBin(process.argv))
  .option('input', {
    alias: 'i',
    description: 'Path to the meeting transcript JSON file',
    type: 'string',
    demandOption: true
  })
  .option('output', {
    alias: 'o',
    description: 'Path to save the generated meeting summary',
    type: 'string',
    demandOption: true
  })
  .help()
  .argv;

// Initialize OpenAI configuration
const initializeOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY environment variable is required');
    console.error('Add it to your .env file or set it in your environment');
    process.exit(1);
  }

  const configuration = new Configuration({ apiKey });
  return new OpenAIApi(configuration);
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get user selection from a list of options
const getUserSelection = async (options, message) => {
  return new Promise((resolve) => {
    console.log(message);
    options.forEach((option, index) => {
      console.log(`${index + 1}. ${option}`);
    });
    
    rl.question('Enter your selection (number): ', (answer) => {
      const selection = parseInt(answer.trim(), 10);
      if (isNaN(selection) || selection < 1 || selection > options.length) {
        console.log('Invalid selection. Please try again.');
        resolve(getUserSelection(options, message));
      } else {
        resolve(options[selection - 1]);
      }
    });
  });
};

// Get available templates from templates directory
const getAvailableTemplates = async () => {
  try {
    const templatesDir = path.join(__dirname, 'templates');
    const files = await fs.readdir(templatesDir);
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => file.replace('.md', ''));
  } catch (error) {
    console.error('Error reading templates directory:', error);
    process.exit(1);
  }
};

// Read and parse the transcript file
const readTranscript = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading transcript file: ${error.message}`);
    process.exit(1);
  }
};

// Extract transcript content for analysis
const extractTranscriptContent = (transcriptData) => {
  try {
    // Handle case where the data has transcript_content property
    if (Array.isArray(transcriptData) && transcriptData.length > 0 && transcriptData[0].transcript_content) {
      const firstItem = transcriptData[0];
      
      // Extract participants
      const speakers = new Set();
      firstItem.transcript_content.forEach(item => {
        if (item.speaker && item.speaker !== 'Speaker C') {
          speakers.add(item.speaker);
        }
      });
      
      // Extract meeting date
      const meetingDate = new Date(firstItem.created_at).toLocaleDateString();
      
      // Create a dialogue string from the transcript
      const dialogue = firstItem.transcript_content
        .map(item => `${item.speaker}: ${item.text}`)
        .join('\n');
      
      return {
        dialogue,
        participants: Array.from(speakers),
        date: meetingDate
      };
    }
    
    // Handle other formats if needed
    console.error('Unrecognized transcript format');
    process.exit(1);
  } catch (error) {
    console.error(`Error extracting transcript content: ${error.message}`);
    process.exit(1);
  }
};

// Generate AI prompt for meeting analysis
const generateAIPrompt = (transcriptContent) => {
  return `
You are an AI assistant that summarizes meeting transcripts. 
Analyze the following meeting transcript between ${transcriptContent.participants.join(' and ')} 
and generate the following sections:

1. Check-in: Brief summary of how participants were feeling or what they mentioned at the start of the meeting
2. Progress Updates: Summary of any project updates or progress reports mentioned during the meeting
3. Discussion Topics: Main points discussed during the meeting, organized by topic
4. Action Items: Specific tasks that participants agreed to do, with assignees if mentioned
5. Next Steps: What participants agreed would happen after the meeting
6. Feedback: Any feedback that was exchanged during the meeting
7. Additional Notes: Any other important information that doesn't fit into the above categories

Meeting Transcript:
${transcriptContent.dialogue}
`;
};

// Call OpenAI API to process the transcript
const callOpenAI = async (prompt) => {
  try {
    const openai = initializeOpenAI();
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes meeting transcripts in a concise and organized way."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error calling OpenAI API:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
};

// Read the template file
const readTemplate = async (templateName) => {
  try {
    const templatePath = path.join(__dirname, 'templates', `${templateName}.md`);
    return await fs.readFile(templatePath, 'utf8');
  } catch (error) {
    console.error(`Error reading template file: ${error.message}`);
    process.exit(1);
  }
};

// Format the AI response using the selected template
const formatSummary = (template, aiResponse, transcriptContent) => {
  try {
    let summary = template;

    // Replace date and participants
    summary = summary.replace('{date}', transcriptContent.date);
    
    if (transcriptContent.participants.length >= 1) {
      summary = summary.replace('{participant1}', transcriptContent.participants[0]);
    }
    
    if (transcriptContent.participants.length >= 2) {
      summary = summary.replace('{participant2}', transcriptContent.participants[1]);
    }

    // Extract sections from AI response
    const sections = {
      check_in: '',
      progress_updates: '',
      discussion_topics: '',
      action_items: '',
      next_steps: '',
      feedback: '',
      additional_notes: ''
    };

    // Simple parsing of AI response sections
    const lines = aiResponse.split('\n');
    let currentSection = '';

    for (const line of lines) {
      if (line.toLowerCase().includes('check-in:')) {
        currentSection = 'check_in';
        continue;
      } else if (line.toLowerCase().includes('progress updates:')) {
        currentSection = 'progress_updates';
        continue;
      } else if (line.toLowerCase().includes('discussion topics:')) {
        currentSection = 'discussion_topics';
        continue;
      } else if (line.toLowerCase().includes('action items:')) {
        currentSection = 'action_items';
        continue;
      } else if (line.toLowerCase().includes('next steps:')) {
        currentSection = 'next_steps';
        continue;
      } else if (line.toLowerCase().includes('feedback:')) {
        currentSection = 'feedback';
        continue;
      } else if (line.toLowerCase().includes('additional notes:') || line.toLowerCase().includes('notes:')) {
        currentSection = 'additional_notes';
        continue;
      }

      if (currentSection && line.trim()) {
        sections[currentSection] += line + '\n';
      }
    }

    // Replace template placeholders with content
    Object.entries(sections).forEach(([key, value]) => {
      summary = summary.replace(`{${key}}`, value.trim());
    });

    return summary;
  } catch (error) {
    console.error(`Error formatting summary: ${error.message}`);
    process.exit(1);
  }
};

// Save the formatted summary to the output file
const saveSummary = async (outputPath, summary) => {
  try {
    const directory = path.dirname(outputPath);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(outputPath, summary, 'utf8');
    console.log(`Meeting summary successfully saved to ${outputPath}`);
  } catch (error) {
    console.error(`Error saving meeting summary: ${error.message}`);
    process.exit(1);
  }
};

// Main function to run the script
const main = async () => {
  try {
    // Get available templates
    const templates = await getAvailableTemplates();
    if (templates.length === 0) {
      console.error('No templates found in the templates directory');
      process.exit(1);
    }

    // Let user select a template
    const selectedTemplate = await getUserSelection(
      templates,
      'Please select a template to use:'
    );

    // Read and parse the transcript
    const transcriptData = await readTranscript(argv.input);
    const transcriptContent = extractTranscriptContent(transcriptData);

    // Generate AI prompt and call OpenAI API
    const prompt = generateAIPrompt(transcriptContent);
    const aiResponse = await callOpenAI(prompt);

    // Format the summary using the template
    const templateContent = await readTemplate(selectedTemplate);
    const formattedSummary = formatSummary(templateContent, aiResponse, transcriptContent);

    // Save the summary
    await saveSummary(argv.output, formattedSummary);
    
    rl.close();
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main();