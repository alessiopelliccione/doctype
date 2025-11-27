import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

/**
 * Configuration for sidebar generation
 */
interface SidebarConfig {
  /** Root directory where documentation files are located */
  docsRoot: string;
  /** Output path for the generated sidebar configuration */
  outputPath: string;
  /** File patterns to ignore during scanning */
  ignorePatterns: string[];
  /** Whether to sort items by numerical prefix */
  sortByPrefix: boolean;
}

/**
 * Represents a single item in the sidebar
 */
interface SidebarItem {
  /** Display text for the sidebar item */
  text: string;
  /** Link path (relative to site root) */
  link: string;
}

/**
 * Represents a group of sidebar items
 */
interface SidebarGroup {
  /** Group title */
  text: string;
  /** Items within this group */
  items: SidebarItem[];
  /** Whether the group should be collapsed by default */
  collapsed?: boolean;
}

/**
 * Complete sidebar structure (array of groups for unified sidebar)
 */
type SidebarStructure = SidebarGroup[];

/**
 * Default configuration for sidebar generation
 */
const DEFAULT_CONFIG: SidebarConfig = {
  docsRoot: path.resolve(process.cwd(), 'docs'),
  outputPath: path.resolve(process.cwd(), 'docs/.vitepress/sidebar-auto.ts'),
  ignorePatterns: ['index.md', 'README.md', 'node_modules/**', '.vitepress/**', 'scripts/**'],
  sortByPrefix: true,
};

/**
 * Extracts numerical prefix from a filename for sorting purposes
 * @param filename - The filename to extract prefix from
 * @returns The numerical prefix or Infinity if not found
 * @example
 * extractNumericPrefix('01. Introduction') // returns 1
 * extractNumericPrefix('Introduction') // returns Infinity
 */
function extractNumericPrefix(filename: string): number {
  const match = filename.match(/^(\d+)\./);
  return match ? parseInt(match[1], 10) : Infinity;
}

/**
 * Converts a filename to a human-readable title
 * @param filename - The filename to convert
 * @returns A cleaned-up title
 * @example
 * fileToTitle('01. getting-started.md') // returns 'getting-started'
 * fileToTitle('advanced-topics.md') // returns 'advanced-topics'
 */
function fileToTitle(filename: string): string {
  return path.basename(filename, '.md').replace(/^(\d+\.\s*)/, '');
}

/**
 * Capitalizes the first letter of a string
 * @param str - The string to capitalize
 * @returns The capitalized string
 */
function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a directory name to a human-readable group title
 * @param dirName - The directory name
 * @returns A formatted group title
 * @example
 * dirToGroupTitle('getting-started') // returns 'Getting Started'
 * dirToGroupTitle('api') // returns 'Api'
 */
function dirToGroupTitle(dirName: string): string {
  if (!dirName) return 'General';

  // Replace hyphens and underscores with spaces, then capitalize each word
  return dirName
    .split(/[-_]/)
    .map(capitalize)
    .join(' ');
}

/**
 * Sorts sidebar items by numerical prefix if present
 * @param items - Array of sidebar items to sort
 * @param sortByPrefix - Whether to enable prefix-based sorting
 * @returns Sorted array of sidebar items
 */
function sortSidebarItems(items: SidebarItem[], sortByPrefix: boolean): SidebarItem[] {
  if (!sortByPrefix) return items;

  return [...items].sort((a, b) => {
    const prefixA = extractNumericPrefix(a.text);
    const prefixB = extractNumericPrefix(b.text);

    // If both have numeric prefixes, sort by them
    if (prefixA !== Infinity && prefixB !== Infinity) {
      return prefixA - prefixB;
    }

    // If only one has a prefix, it comes first
    if (prefixA !== Infinity) return -1;
    if (prefixB !== Infinity) return 1;

    // Otherwise, sort alphabetically
    return a.text.localeCompare(b.text);
  });
}

/**
 * Validates that a directory exists and is accessible
 * @param dirPath - The directory path to validate
 * @throws Error if directory doesn't exist or isn't accessible
 */
function validateDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory does not exist: ${dirPath}`);
  }

  const stats = fs.statSync(dirPath);
  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${dirPath}`);
  }
}

/**
 * Ensures that a directory exists, creating it if necessary
 * @param dirPath - The directory path to ensure
 */
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Generates the sidebar structure from markdown files
 * @param config - Configuration options for sidebar generation
 * @returns The generated sidebar structure
 */
function buildSidebarStructure(config: SidebarConfig): SidebarStructure {
  validateDirectory(config.docsRoot);

  const files = globSync('**/*.md', {
    cwd: config.docsRoot,
    ignore: config.ignorePatterns,
  });

  if (files.length === 0) {
    console.warn(`⚠️  No markdown files found in ${config.docsRoot}`);
  }

  // Use a map to group files by directory
  const groupsMap = new Map<string, SidebarGroup>();

  files.forEach((file) => {
    const parts = file.split(path.sep);
    const directory = parts.length > 1 ? parts[0] : '';
    const fileName = parts[parts.length - 1];

    // Link path relative to site root (e.g., '/guide/install')
    const filePath = '/' + file.replace(/\.md$/, '');

    // Initialize group if it doesn't exist
    if (!groupsMap.has(directory)) {
      groupsMap.set(directory, {
        text: dirToGroupTitle(directory),
        items: [],
        collapsed: false, // Keep groups expanded by default
      });
    }

    // Add the file as an item to the corresponding group
    const group = groupsMap.get(directory)!;
    group.items.push({
      text: fileToTitle(fileName),
      link: filePath,
    });
  });

  // Convert map to array and sort items in each group
  const sidebar: SidebarStructure = Array.from(groupsMap.values());

  sidebar.forEach((group) => {
    group.items = sortSidebarItems(group.items, config.sortByPrefix);
  });

  // Sort groups alphabetically by text (except "General" which should be first)
  sidebar.sort((a, b) => {
    if (a.text === 'General') return -1;
    if (b.text === 'General') return 1;
    return a.text.localeCompare(b.text);
  });

  return sidebar;
}

/**
 * Writes the sidebar structure to a TypeScript file
 * @param sidebar - The sidebar structure to write
 * @param outputPath - The file path to write to
 */
function writeSidebarFile(sidebar: SidebarStructure, outputPath: string): void {
  const content = `// This file is auto-generated by generateSidebar.ts
// DO NOT EDIT MANUALLY - your changes will be overwritten!

import type { DefaultTheme } from 'vitepress';

export const autoSidebar: DefaultTheme.Sidebar = ${JSON.stringify(sidebar, null, 2)};
`;

  const outputDir = path.dirname(outputPath);
  ensureDirectoryExists(outputDir);

  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`✅ Sidebar configuration generated successfully: ${outputPath}`);
  console.log(`📄 Total groups: ${sidebar.length}`);

  const totalItems = sidebar.reduce((sum, group) => sum + group.items.length, 0);
  console.log(`📝 Total items: ${totalItems}`);
}

/**
 * Main function to generate the sidebar configuration
 * @param customConfig - Optional custom configuration to override defaults
 */
export function generateSidebar(customConfig?: Partial<SidebarConfig>): void {
  try {
    const config: SidebarConfig = {
      ...DEFAULT_CONFIG,
      ...customConfig,
    };

    console.log('🔍 Scanning for markdown files...');
    const sidebar = buildSidebarStructure(config);

    console.log('💾 Writing sidebar configuration...');
    writeSidebarFile(sidebar, config.outputPath);

    console.log('✨ Sidebar generation completed successfully!');
  } catch (error) {
    console.error('❌ Error generating sidebar:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.stack) {
        console.error(`\nStack trace:\n${error.stack}`);
      }
    } else {
      console.error(`   ${String(error)}`);
    }
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  generateSidebar();
}
