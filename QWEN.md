# Claude Cowork Project Context

## Project Overview

Claude Cowork is a **desktop AI assistant** that serves as a native desktop application for Claude Code, providing visual feedback and enhanced session management capabilities. It's built as an Electron application with React frontend and provides a real AI collaboration partner for programming, file management, and any task that can be described in natural language.

The application is fully compatible with Claude Code's configuration, meaning it reuses the existing `~/.claude/settings.json` file for API keys, models, and other configurations.

## Architecture

| Component | Technology |
|-----------|------------|
| Framework | Electron 39 |
| Frontend | React 19, Tailwind CSS 4 |
| State Management | Zustand |
| Database | better-sqlite3 (WAL mode) |
| AI | @anthropic-ai/claude-agent-sdk |
| Build | Vite, electron-builder |

## Key Features

- **AI Collaboration Partner**: Write and edit code, manage files, run commands, answer questions about codebases
- **Session Management**: Create sessions with custom working directories, resume conversations, maintain local session history
- **Real-Time Streaming Output**: Token-by-token streaming with Markdown rendering and syntax-highlighted code
- **Tool Permission Control**: Explicit approval for sensitive actions with interactive decision panels
- **Visual Feedback**: Unlike Claude Code's terminal interface, provides visual insights into Claude's reasoning process

## Project Structure

```
src/
├── electron/           # Electron main process code
│   ├── libs/           # Utility libraries
│   ├── main.ts         # Main Electron process entry point
│   ├── preload.cts     # Preload script for renderer process
│   └── ...
├── ui/                 # React frontend code
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── render/         # Rendering utilities
│   ├── store/          # Zustand stores
│   ├── App.tsx         # Main application component
│   └── ...
```

## Building and Running

### Prerequisites
- [Bun](https://bun.sh/) or Node.js 18+
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated

### Development Commands

```bash
# Install dependencies
bun install

# Run in development mode (with hot reload)
bun run dev

# Type checking / build
bun run build

# Build for specific platforms
bun run dist:mac    # macOS
bun run dist:win    # Windows
bun run dist:linux  # Linux
```

### Production Builds

The application uses electron-builder to create platform-specific installers:
- macOS: DMG format
- Linux: AppImage format
- Windows: Portable and MSI installers

## Development Conventions

- **TypeScript**: Strict mode with path aliases (`@/*` maps to `./src/*`)
- **React**: Modern hooks-based components with Zustand for state management
- **Tailwind CSS**: Utility-first styling approach
- **ESLint**: Standard linting with React hooks and refresh plugins
- **Vite**: Fast development server and build tool

## Key Configuration Files

- `package.json`: Dependencies and scripts
- `vite.config.ts`: Vite build configuration
- `electron-builder.json`: Packaging configuration
- `tsconfig.json`: TypeScript configuration (references app and node configs)
- `eslint.config.js`: ESLint rules and configuration

## IPC Communication

The application uses Electron's IPC mechanism to communicate between the main and renderer processes:
- Preload script provides a secure bridge between renderer and main process
- Custom IPC handlers for system resource monitoring, file operations, and Claude agent events
- Typed interfaces defined in `types.d.ts` for consistent communication

## Database Integration

- Uses better-sqlite3 for local session storage
- Stores conversation history, session metadata, and user preferences
- WAL (Write-Ahead Logging) mode enabled for better concurrency

## Testing and Quality Assurance

- TypeScript strict mode for type safety
- ESLint with React hooks plugin for code quality
- Vite for fast development builds and testing
- Component-based architecture enables modular testing

## Environment and Setup

The application expects Claude Code to be properly configured with API keys and settings in `~/.claude/settings.json`. This configuration is reused by Claude Cowork, ensuring consistency between the terminal and desktop experiences.