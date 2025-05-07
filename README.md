# Nylas Meeting Notes Generator

A Node.js script that generates meeting summaries from transcripts using OpenAI API.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Set your OpenAI API key:
   - Copy the example environment file:
     ```
     cp .env.example .env
     ```
   - Edit the `.env` file and add your OpenAI API key

## Usage

Run the script with the following command:

```
node meeting_notes_generator.js --input ./meetingTranscript/meeting-transcript.json --output ./meetingSummary/1-on-1-Summary.md
```

Or using the npm script:

```
npm start -- --input ./meetingTranscript/meeting-transcript.json --output ./meetingSummary/1-on-1-Summary.md
```

### Parameters

- `--input` (or `-i`): Path to the meeting transcript JSON file
- `--output` (or `-o`): Path to save the generated meeting summary

## Templates

The script uses templates from the `templates` directory. You'll be prompted to select a template when running the script.

To add a new template:
1. Create a Markdown file in the `templates` directory (e.g., `team-meeting.md`)
2. Use placeholders like `{date}`, `{participant1}`, `{check_in}`, etc. that will be replaced with content

## Transcript Format

The script expects JSON files with a specific format. See the example in `meetingTranscript/1-on-1-meeting-transcript.json`.