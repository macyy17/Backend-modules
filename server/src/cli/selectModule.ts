import readline from 'node:readline';
import type { ModuleEntry } from '../types.js';

function printChoices(modules: ModuleEntry[], selectedIndex: number): void {
  console.log('');
  console.log('Select module with arrow keys and Enter:');
  modules.forEach((moduleEntry, index) => {
    const prefix = index === selectedIndex ? '>' : ' ';
    console.log(`${prefix} ${moduleEntry.name}`);
  });
}

export function selectModule(modules: ModuleEntry[]): Promise<string> {
  if (modules.length === 1) return Promise.resolve(modules[0].name);
  if (!process.stdin.isTTY || !process.stdout.isTTY) return Promise.resolve(modules[0].name);

  return new Promise((resolve) => {
    let selectedIndex = 0;
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    printChoices(modules, selectedIndex);

    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('keypress', onKeypress);
    };

    const onKeypress = (_character: string, key: readline.Key) => {
      if (key.name === 'up') {
        selectedIndex = selectedIndex === 0 ? modules.length - 1 : selectedIndex - 1;
        printChoices(modules, selectedIndex);
        return;
      }
      if (key.name === 'down') {
        selectedIndex = selectedIndex === modules.length - 1 ? 0 : selectedIndex + 1;
        printChoices(modules, selectedIndex);
        return;
      }
      if (key.name === 'return') {
        const selectedModule = modules[selectedIndex].name;
        cleanup();
        resolve(selectedModule);
        return;
      }
      if (key.ctrl && key.name === 'c') {
        cleanup();
        process.exit(130);
      }
    };

    process.stdin.on('keypress', onKeypress);
  });
}
