// const net = require('net');
import net from 'net';
import yargs from 'yargs';

const argv = yargs(process.argv)
  .option('ports', {
    alias: 'p',
    description: 'Ports range. Format: <start_port>-<end_port>. Example: 0-65535',
    type: 'string',
  })
  .option('host', {
    alias: 'h',
    description: 'Host name. Example: 127.0.0.1; google.com',
    type: 'string',
  })
  .option('socket-timeout', {
    alias: 'st',
    description: 'Time for socket life(ms). Default 300. ',
    type: 'number',
  })
  .help()
  .demandOption(['host']).argv;

class PortChecker {
  static MIN_PORT = 0;
  static MAX_PORT = 65535;
  static options = { socketTimeout: 300 };

  constructor() {
    this.host = '127.0.0.1';
    this.minPort = PortChecker.MIN_PORT;
    this.maxPort = PortChecker.MAX_PORT;
    this.socketTimeout = PortChecker.options.socketTimeout;
  }
  async run(args) {
    this.validateArgs(args);

    const result = await this.scan(this.minPort, this.maxPort);

    process.stdout.write('\n');
    process.stdout.write(`${result.length ? result.join() : 0} ${result.length === 1 ? 'port' : 'ports'} are opened`);
    process.exit(0);
  }
  async scan(portFrom = this.minPort, portTo = this.maxPort) {
    console.log(`Scanning ports from ${portFrom} to ${portTo} on host ${this.host}`);

    const result = [];

    for (let port = portFrom; port <= portTo; port++) {
      const status = await this.connect(port, this.host);
      if (status) {
        result.push(port);
      }
    }
    return result;
  }

  async connect(port, host) {
    const socket = net.connect(port, host).setTimeout(this.socketTimeout);

    return await this.handleSocketEvents(socket, port);
  }

  handleSocketEvents(socket) {
    return new Promise((resolve) => {
      socket.on('connect', () => {
        this.onConnect(socket);
        resolve(true);
      });

      socket.on('error', (error) => {
        this.onError(error, socket);
        resolve(false);
      });

      socket.on('timeout', () => {
        this.onTimeout(socket);
        resolve(false);
      });
    });
  }

  onConnect(socket) {
    process.stdout.write('.');
    socket.destroy();
  }

  onError(error, socket) {
    console.log(error.code, error.address);
    process.stdout.write('!');
    socket.destroy();
  }

  onTimeout(socket) {
    process.stdout.write('_');
    socket.destroy();
  }

  validateArgs(args) {
    console.log('AAAAA', args);
    const { ports, host, socketTimeout } = args;
    if (typeof host === 'string') {
      this.host = host;
    } else {
      throw new Error(`Invalid host: ${host}`);
    }

    if (ports) {
      if (typeof ports === 'string' && ports.match(/^[0-9]{1,5}\-[0-9]{1,5}$/)) {
        const [minPort, maxPort] = PortChecker.portsToRange(ports);
        if (minPort > maxPort || [minPort, maxPort].some((p) => PortChecker.validatePort(p) === false)) {
          throw new Error(`Invalid port range: ${minPort} to ${maxPort}`);
        } else {
          this.minPort = minPort;
          this.maxPort = maxPort;
        }
      } else {
        throw new Error('Invalid port range! Expected 0-65535');
      }
    }

    if (socketTimeout) {
      if (socketTimeout > 0) {
        this.socketTimeout = socketTimeout;
      } else {
        throw new Error('Invalid socket-timeout! Expected: socketTimeout has type Number, socketTimeout > 0');
      }
    }
  }

  static validatePort = (port) => Number.isFinite(port) && port >= PortChecker.MIN_PORT && port <= PortChecker.MAX_PORT;
  static portsToRange = (ports) => ports.split('-').map((port) => Number(port));
}

const portChecker = new PortChecker();

portChecker.run(argv);
