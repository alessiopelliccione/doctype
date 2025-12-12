# Usage Instructions for sintesi-monorepo-root

## Overview

The `sintesi-monorepo-root` project provides a command-line interface (CLI) and library functionalities that facilitate documentation generation and project management. This guide outlines how to effectively use the CLI commands and the library features available in this project.

## Getting Started

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 14 or higher)
- [pnpm](https://pnpm.js.org/) (version 8.15.5 or higher)

### Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/your-repo/sintesi-monorepo-root.git
cd sintesi-monorepo-root
pnpm install
```

## CLI Usage

The CLI provides several commands to manage your project. Below are the available commands and their usage:

### 1. Check Documentation Drift

Verifies that documentation is in sync with code by detecting signature drift.

```bash
npx sintesi check [options]
```

#### Options

- `--verbose`: Enable detailed output (default: `false`)
- `--strict`: Exit with error code on drift (default: `true`)
- `--smart`: Use AI to detect high-level drift (default: `true`)
- `--base <branch>`: Base branch for smart check comparison (default: `origin/main`)

#### Example

```bash
# Basic check
npx sintesi check

# Check with verbose output
npx sintesi check --verbose

# Check without failing on drift (for CI warnings)
npx sintesi check --no-strict
```

### 2. Generate Changesets

Generates changesets from code changes using AI.

```bash
npx sintesi changeset [options]
```

#### Options

- `--base-branch <branch>`: Base branch to compare against (default: `main`)
- `--staged-only`: Only analyze staged changes (default: `false`)
- `--package-name <name>`: Package name for the changeset (auto-detected from package.json if not specified)
- `--output-dir <path>`: Output directory for changeset (default: `.changeset`)
- `--skip-ai`: Skip AI processing (default: `false`)
- `--verbose`: Enable detailed output (default: `false`)

#### Example

```bash
# Generate changesets with verbose output
npx sintesi changeset --verbose
```

### 3. Generate Documentation

Generates comprehensive documentation site structure.

```bash
npx sintesi documentation [options]
```

#### Options

- `--output-dir <path>`: Output directory (default: `docs`)
- `--verbose`: Enable detailed output (default: `false`)

#### Example

```bash
# Generate documentation with default settings
npx sintesi documentation

# Generate documentation with custom output directory
npx sintesi documentation --output-dir ./custom-docs
```

### 4. Generate README

Generates a README.md based on project context.

```bash
npx sintesi readme [options]
```

#### Options

- `--output <path>`: Output file path (default: `README.md`)
- `--force`: Overwrite existing file (default: `false`)
- `--verbose`: Enable verbose logging (default: `false`)

#### Example

```bash
# Generate README with default settings
npx sintesi readme

# Generate README and overwrite existing file
npx sintesi readme --force
```

## Library Usage

The project also exposes library functionalities that can be used programmatically. Below is a brief overview of the key exports.

### Key Exports

- **Logger**: A utility for logging messages with different severity levels.
- **createAgentFromEnv**: Function to create an AI agent using environment variables for configuration.
- **getProjectContext**: Function to retrieve the current project context, including the file structure and package.json data.

### Example Usage

Here’s an example of how to use the library in your own scripts:

```javascript
import { Logger, createAgentFromEnv, getProjectContext } from '@sintesi/core';

const logger = new Logger(true);
const context = getProjectContext(process.cwd());

logger.info('Project context:', context);
```

## Conclusion

The `sintesi-monorepo-root` project provides powerful tools for managing and documenting your codebase. By leveraging the CLI commands and library functionalities, you can streamline your development process and ensure comprehensive documentation. For further assistance, refer to the project's GitHub repository or contact the maintainers.
