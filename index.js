#!/usr/bin/env node

const pid = require('port-pid');

module.exports = portKill;
if (!module.parent) cli();

/**
 * @param {number|Array<number>} port(s)
 * @param {object} [options]
 * @param {string<"all"|"tcp"|"udp">} [options.type=all]
 * @param {string} [options.signal]
 * @param {function} [options.kill=process.kill]
 * @param {boolean} [options.verbose=false]
 */
function portKill(ports, {
  type = 'all',
  signal,
  kill = process.kill.bind(process),
  verbose = false,
} = {}) {
  if (!Array.isArray(ports) && isNaN(ports)) throw new Error(`Need a port`);
  if (kill === 'tree') kill = treeKill;
  if (typeof kill !== 'function') throw new Error('Invalid `opts.kill`, needs to be a function');
  if (verbose) console.log('Finding PIDs with port:', ...ports);
  return Promise.all(arrify(ports).map(pid)).then(pids => Promise.all(pids.map((pids) => (pids && pids[type] || []).map(pid => {
    if (verbose) console.log(`Killing PID<${pid}>`);
    kill(pid, signal);
  }))));
}

function argv(argv = process.argv.slice(2)) {
  /* TODO: process argv better, possibly with yargs */
  const ports = argv.filter(a => a.match(/^[0-9]+$/)).map(a => parseInt(a));
  const opts = {};
  return { ports, opts };
}

function cli() {
  const { ports, opts } = argv();
  if (!ports.length) return error('Need a port');
  portKill(ports, Object.assign({ verbose: true }, opts)).catch(exit);
}

function exit(message, code = 1) {
  if (message) console.error(message);
  if (code) process.exitCode = code;
}

function arrify(input) {
  return (Array.isArray(input) ? input : [input]).filter(Boolean);
}
