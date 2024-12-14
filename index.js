#!/usr/bin/env node

import { execSync } from 'child_process';
import readline from 'readline';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import gradient from 'gradient-string';

// Move these constants to the top of the file, right after the imports
const ANGULAR_COLORS = ['#DD0031', '#C3002F', '#B4002D']; // Angular reds
const TAILWIND_COLORS = ['#38BDF8', '#0EA5E9', '#0369A1']; // Tailwind blues
const SYSTEM_COLORS = ['#00C853', '#2196F3', '#3D5AFE']; // Green to Blue gradient for system messages

// Get the current directory (needed for ES Module compatibility)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function logStep(step) {
  console.log(`${gradient(ANGULAR_COLORS)('➤')} ${chalk.whiteBright(step)}`);
}

function successMessage(message) {
  console.log(`${gradient(TAILWIND_COLORS)('✔')} ${chalk.whiteBright(message)}`);
}

function errorMessage(message) {
  console.error(`${gradient(ANGULAR_COLORS)('✖')} ${chalk.whiteBright(message)}`);
}

// Function to get the latest version of a package
function getLatestVersion(packageName) {
  try {
    return execSync(`npm show ${packageName} version`).toString().trim();
  } catch (error) {
    return 'Unknown';
  }
}

// Add this helper function after getLatestVersion
async function promptForVersion(latestVersion, packageName) {
  const useLatest = await prompt(
    gradient(SYSTEM_COLORS)(`Use latest ${packageName} (${latestVersion})? [Y/n] `)
  );
  
  if (useLatest.toLowerCase() === 'n') {
    const version = await prompt(
      gradient(SYSTEM_COLORS)(`Enter desired ${packageName} version: `)
    );
    return version.trim();
  }
  return latestVersion;
}

// Update the createAngularProject function to accept a version
async function createAngularProject(projectName, angularVersion) {
  logStep(`Creating Angular project: ${projectName} with Angular CLI v${angularVersion}`);
  const spinner = ora(chalk.blueBright('Generating Angular project...')).start();

  try {
    execSync(`npx @angular/cli@${angularVersion} new ${projectName}`, { stdio: 'inherit' });
    spinner.succeed('Angular project created successfully!');
  } catch (error) {
    spinner.fail('Angular project creation failed.');
    throw error;
  }
}

async function installTailwind(projectName, tailwindVersion) {
  process.chdir(projectName);

  logStep('Installing Tailwind CSS and dependencies');
  const tailwindSpinner = ora(chalk.blueBright('Installing Tailwind CSS...')).start();

  try {
    execSync(`npm install -D tailwindcss@${tailwindVersion} postcss autoprefixer`, { stdio: 'inherit' });
    tailwindSpinner.succeed('Tailwind CSS installed successfully!');
  } catch (error) {
    tailwindSpinner.fail('Tailwind CSS installation failed.');
    throw error;
  }

  logStep('Initializing Tailwind CSS');
  execSync('npx tailwindcss init', { stdio: 'inherit' });
  successMessage('Tailwind configuration initialized!');

  logStep('Configuring Tailwind CSS');
  let config = fs.readFileSync('tailwind.config.js', 'utf-8');
  config = config.replace("content: []", `content: ["./src/**/*.{html,ts}"]`);
  fs.writeFileSync('tailwind.config.js', config);
  successMessage('Tailwind config updated successfully!');

  // Detect stylesheet extension
  const stylesDir = path.join('src');
  const styleFile = fs.readdirSync(stylesDir).find(file => file.startsWith('styles.'));
  const styleExt = styleFile.split('.').pop();

  logStep(`Adding Tailwind directives to styles.${styleExt}`);
  const tailwindDirectives = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n';
  fs.writeFileSync(`src/styles.${styleExt}`, tailwindDirectives);
  successMessage(`Tailwind directives added to styles.${styleExt}!`);

  logStep('Updating app.component.html with starter template');
  const templatePath = path.join(__dirname, 'template.html');
  const templateContent = fs.readFileSync(templatePath, 'utf-8');
  fs.writeFileSync('src/app/app.component.html', templateContent);
  successMessage('app.component.html updated with the TailwindCSS starter template!');
}

// Update the main function
async function main() {
  // Get the latest versions
  const latestAngularVersion = getLatestVersion('@angular/cli');
  const latestTailwindVersion = getLatestVersion('tailwindcss');

  try {
    // First ask for project name
    const projectName = await prompt(
      gradient(ANGULAR_COLORS)('Angular') + 
      chalk.white(' + ') + 
      gradient(TAILWIND_COLORS)('TailwindCSS') + 
      gradient.cristal(' Project Creator: ') + 
      chalk.white('project name? ')
    );

    // Then ask about versions
    const angularVersion = await promptForVersion(latestAngularVersion, 'Angular CLI');
    const tailwindVersion = await promptForVersion(latestTailwindVersion, 'TailwindCSS');

    // Show selected configuration
    console.log('\n' + gradient(SYSTEM_COLORS)('Project Configuration:'));
    console.log(gradient(ANGULAR_COLORS)(`➤ Angular CLI: v${angularVersion}`));
    console.log(gradient(TAILWIND_COLORS)(`➤ TailwindCSS: v${tailwindVersion}\n`));

    await createAngularProject(projectName, angularVersion);
    await installTailwind(projectName, tailwindVersion);

    rl.close();
    console.log(gradient(SYSTEM_COLORS)('\nProject setup complete!\n'));
    console.log(gradient(SYSTEM_COLORS)(`To get started:\n  cd ${projectName}\n  ng serve\n`));
  } catch (error) {
    errorMessage(`Something went wrong: ${error.message}`);
    rl.close();
  }
}

main();
