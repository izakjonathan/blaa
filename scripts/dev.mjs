import { spawn } from 'node:child_process';
const args = process.argv.slice(2).filter((arg, index, list) => arg !== '--strictPort' && arg !== '--host' && list[index - 1] !== '--host');
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '0.0.0.0', ...args], { stdio: 'inherit' });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
child.on('exit', code => process.exit(code ?? 1));
