# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
- Meeting notes generator that processes meeting transcripts using OpenAI API
- Uses template files to format meeting summaries
- Input: JSON meeting transcript files
- Output: Markdown meeting summary files
- View `spec.md` for futher details

## Commands
- Build: `npm install` to install dependencies
- Run: `node meeting_notes_generator.js --input <transcript_file> --output <summary_file>`
- Test: `npm test` to run unit tests (once implemented)

## Code Style Guidelines
- Use ES6+ JavaScript conventions
- Async/await for asynchronous operations
- Proper error handling with try/catch blocks
- Descriptive variable and function names
- Comment complex logic and template processing
- Adhere to consistent 2-space indentation
- Use template literals for string interpolation
- JSON parsing with error handling
- Use named exports in modules

## Implementation Notes
- Use Node.js fs module for file operations
- Process command-line arguments with minimist/yargs
- Implement clean error messages for user feedback
- Modular code organization (separate template processor, API client, etc.)
- Handle API rate limiting and errors gracefully