#!/usr/bin/env node

const os = require('os');
const { execSync } = require('child_process');

const isWin = os.platform() === 'win32';

module.exports = portKill;
if (!module.parent) cli();

/**
 * @param {number|Array<number>} port(s)
 * @param {object} [options]
 * @param {string} [options.signal]
 * @param {boolean} [options.verbose=false]
 */
function portKill(ports, {
  signal,
  verbose = false,
} = {}) {
  if (!Array.isArray(ports) && isNaN(ports)) throw new Error(`Need a port`);
  if (verbose) console.log('Finding PIDs with port:', ...ports);
  return Promise.all(arrify(ports).map(pid)).then(pids => flat(pids).map(pid => {
    if (verbose) console.log(`Killing PID<${pid}>`);
    try {
      process.kill(pid, signal);
    } catch (error) {
      console.error(error);
    }
  }));
}

function argv(argv = process.argv.slice(2)) {
  /* TODO: process argv better, possibly with yargs */
  const ports = argv.filter(a => a.match(/^[0-9]+$/)).map(a => parseInt(a));
  const opts = {};
  return { ports, opts };
}

function cli() {
  const { ports, opts } = argv();
  if (!ports.length) return exit('Need a port');
  portKill(ports, Object.assign({ verbose: true }, opts)).then(portsKilled => {
    if (portsKilled.length) console.log(`${portsKilled.length} processes killed`);
    else console.log('No processes found');
  }).catch(exit);
}

function exit(message, code = 1) {
  if (message) console.error(message);
  if (code) process.exitCode = code;
}

function arrify(input) {
  return (Array.isArray(input) ? input : [input]).filter(Boolean);
}

function flat(arr) {
  return arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flat(val)) : acc.concat(val), []);
}

function pid(port) {
  try {
    const command = (isWin
      ? 'netstat.exe -ano | findstr.exe :'
      : 'lsof -i :') + port;
    const output = execSync(command, { encoding: 'utf8' }).trim().split(/[\n\r]+/g).map(s => s.trim()).filter(Boolean).map(line => line.split(/[ ]+/g));
    const pids = output.map(line => isWin ? line.pop() : (line.shift(), line.shift()));
    return Array.from(new Set(pids));
  } catch (error) {
    return [];
  }
}
