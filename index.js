#!/usr/bin/env node

import { execSync } from 'child_process';
import readline from 'readline';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import chalk from 'chalk';
import ora from 'ora';

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
  console.log(`${chalk.cyanBright.bold('➤')} ${chalk.whiteBright(step)}`);
}

function successMessage(message) {
  console.log(`${chalk.greenBright.bold('✔')} ${chalk.whiteBright(message)}`);
}

function errorMessage(message) {
  console.error(`${chalk.redBright.bold('✖')} ${chalk.whiteBright(message)}`);
}

// Function to get the latest version of a package
function getLatestVersion(packageName) {
  try {
    return execSync(`npm show ${packageName} version`).toString().trim();
  } catch (error) {
    return 'Unknown';
  }
}

async function createAngularProject(projectName) {
  logStep(`Creating Angular project: ${projectName}`);
  const spinner = ora(chalk.blueBright('Generating Angular project...')).start();

  try {
    execSync(`npx @angular/cli new ${projectName}`, { stdio: 'inherit' });
    spinner.succeed('Angular project created successfully!');
  } catch (error) {
    spinner.fail('Angular project creation failed.');
    throw error;
  }
}

async function installTailwind(projectName) {
  process.chdir(projectName);

  logStep('Installing Tailwind CSS and dependencies');
  const tailwindSpinner = ora(chalk.blueBright('Installing Tailwind CSS...')).start();

  try {
    execSync('npm install -D tailwindcss postcss autoprefixer', { stdio: 'inherit' });
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

async function main() {
  console.log(chalk.magentaBright.bold('\n🚀 Angular + Tailwind CSS Project Creator 🚀\n'));

  // Get the latest versions of Angular CLI and TailwindCSS
  const angularVersion = getLatestVersion('@angular/cli');
  const tailwindVersion = getLatestVersion('tailwindcss');

  console.log(chalk.cyanBright(`🔹 Using Angular CLI version: ${chalk.whiteBright.bold(angularVersion)}`));
  console.log(chalk.cyanBright(`🔹 Using TailwindCSS version: ${chalk.whiteBright.bold(tailwindVersion)}\n`));

  try {
    const projectName = await prompt(chalk.yellowBright('Enter the name of your new Angular project: '));

    await createAngularProject(projectName);
    await installTailwind(projectName);

    rl.close();
    console.log(chalk.greenBright.bold('\n🎉 Project setup complete! Happy coding! 🚀\n'));
    console.log(chalk.greenBright.bold(`\nRun:\n\t🚀 cd ${projectName}\n\t🚀 ng serve\n`));
  } catch (error) {
    errorMessage(`Something went wrong: ${error.message}`);
    rl.close();
  }
}

main();
