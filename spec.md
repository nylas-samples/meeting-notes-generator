Generate a script in Node.js that will allow the user to run the following command:

`node meeting_notes_generator.js --input ./meetingTranscript/meeting-transcript.json --output ./meetingSummary/1-on-1-Summary.md`

To generate a meeting summary that will take the template meeting format from `templates` folder and the meeting transcript from `meetingTranscript` to output a meeting Summary into `meetingSummary` using OpenAI API.

So the script will:

1. Read the --input argument
2. Provide options to the user to select which template they like to use from the options listed (i.e. 1-on-1, Team Meeting, Project Meeting, Sales Call) using the templates from `./templates` folder
3. Extract the transcript content
4. Generate LLM prompts to analyze the transcript
5. Call the OpenAI API to process the transcript
5. Format the response into meeting notes using the specified template
6. Save the formatted notes to --output argument