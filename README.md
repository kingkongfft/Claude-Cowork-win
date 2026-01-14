[简体中文](README_ZH.md)

# Claude Cowork (Windows)

🪟 **Windows-optimized fork** of Claude Cowork - A desktop AI assistant for programming, file management, and any task you can describe.

This repository is specifically tailored for **Windows users** with easy-to-use scripts and pre-built executables.

It is **fully compatible with the exact same configuration as Claude Code**, which means you can run it with **any Anthropic-compatible large language model**.

> Not just a GUI.  
> A real AI collaboration partner.  
> No need to learn the Claude Agent SDK — just create tasks and choose execution paths.

An example of organizing a local folder:


https://github.com/user-attachments/assets/8ce58c8b-4024-4c01-82ee-f8d8ed6d4bba


---

## ✨ Why Claude Cowork?

Claude Code is powerful — but it **only runs in the terminal**.

That means:
- ❌ No visual feedback for complex tasks
- ❌ Hard to track multiple sessions
- ❌ Tool outputs are inconvenient to inspect

**Agent Cowork solves these problems:**

- 🖥️ Runs as a **native desktop application**
- 🤖 Acts as your **AI collaboration partner** for any task
- 🔁 Reuses your **existing `~/.claude/settings.json`**
- 🧠 **100% compatible** with Claude Code

If Claude Code works on your machine —  
**Agent Cowork works too.**

---

## 🚀 Quick Start

Before using Agent Cowork, make sure Claude Code is installed and properly configured.

### Option 1: Download a Release (Recommended)

👉 [Go to Releases](https://github.com/kingkongfft/Claude-Cowork-win/releases)

**Windows Downloads:**
- **Agent Cowork Setup x.x.x.exe** - Installer (Recommended) - Installs the app to your system
- **Agent Cowork x.x.x.exe** - Portable version - Run without installation

After downloading:
1. Run the installer or portable exe
2. The app will start automatically
3. Click "New Session" to start working with AI

---

### Option 2: Quick Run from Source (Windows)

#### Prerequisites

- Node.js 18+
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated

```bash
# Clone the repository
git clone https://github.com/kingkongfft/Claude-Cowork-win.git
cd Claude-Cowork-win

# Quick run with one command (Recommended for Windows)
# Option 1: Using the batch script (double-click or run in cmd)
run-windows.bat

# Option 2: Using PowerShell script
.\run-windows.ps1
```

The scripts will automatically:
- Install dependencies (if needed)
- Transpile Electron code (if needed)
- Rebuild native modules (on first run)
- Start the Vite dev server
- Launch the Electron app

---

### Option 3: Manual Setup

```bash
# Install dependencies
npm install

# Terminal 1: Start Vite dev server
npm run dev:react

# Terminal 2: Transpile and run Electron
npm run transpile:electron
npx cross-env NODE_ENV=development electron .

# Note: On first run, you may need to rebuild native modules for Electron
npx electron-rebuild
```

---

### Build Production Executables

```bash
# Build Windows exe (installer + portable)
npx tsc --project src/electron/tsconfig.json
npm run build
npx electron-builder --win --x64
```

Output files in `dist/` folder:
- `Agent Cowork Setup x.x.x.exe` - NSIS installer
- `Agent Cowork x.x.x.exe` - Portable exe

---

## 🧠 Core Capabilities

### 🤖 AI Collaboration Partner — Not Just a GUI

Agent Cowork is your AI partner that can:

* **Write and edit code** — in any programming language
* **Manage files** — create, move, and organize
* **Run commands** — build, test, deploy
* **Answer questions** — about your codebase
* **Do anything** — as long as you can describe it in natural language

---

### 📂 Session Management

* Create sessions with **custom working directories**
* Resume any previous conversation
* Complete local session history (stored in SQLite)
* Safe deletion and automatic persistence

---

### 🎯 Real-Time Streaming Output

* **Token-by-token streaming output**
* View Claude’s reasoning process
* Markdown rendering with syntax-highlighted code
* Visualized tool calls with status indicators

---

### 🔐 Tool Permission Control

* Explicit approval required for sensitive actions
* Allow or deny per tool
* Interactive decision panels
* Full control over what Claude is allowed to do

---

## 🔁 Fully Compatible with Claude Code

Agent Cowork **shares configuration with Claude Code**.

It directly reuses:

text
~/.claude/settings.json


This means:

* Same API keys
* Same base URL
* Same models
* Same behavior

> Configure Claude Code once — use it everywhere.

---

## 🧩 Architecture Overview

| Layer            | Technology                     |
| ---------------- | ------------------------------ |
| Framework        | Electron 39                    |
| Frontend         | React 19, Tailwind CSS 4       |
| State Management | Zustand                        |
| Database         | better-sqlite3 (WAL mode)      |
| AI               | @anthropic-ai/claude-agent-sdk |
| Build            | Vite, electron-builder         |

---

## 🛠 Development

```bash
# Start development server (hot reload)
bun run dev

# For Windows or npm users:
# Terminal 1:
npm run dev:react
# Terminal 2:
npm run transpile:electron && npx cross-env NODE_ENV=development electron .

# Type checking / build
bun run build
# Or with npm:
npm run build
```

---

## 🗺 Roadmap

Planned features:

* GUI-based configuration for models and API keys
* 🚧 More features coming soon

---

## 🤝 Contributing

Pull requests are welcome.

1. Fork this repository
2. Create your feature branch
3. Commit your changes
4. Open a Pull Request

---

## ⭐ Final Words

If you’ve ever wanted:

* A persistent desktop AI collaboration partner
* Visual insight into how Claude works
* Convenient session management across projects

This project is built for you.

👉 **If it helps you, please give it a Star.**

---

## License

MIT



