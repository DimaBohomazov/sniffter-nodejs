import net from 'net';
import yargs from 'yargs';

const argv = yargs(process.argv)
  .option('ports', {
    alias: 'p',
    description: 'Ports range. Format: <start_port>-<end_port>. Example: 0-65535',
  })
  .option('host', {
    alias: 'h',
    description: 'Host name. Example: 127.0.0.1; google.net',
    type: 'string',
  })
  .option('socket-timeout', {
    alias: 'st',
    description: 'Time for socket life(ms). Default 300. ',
    type: 'number',
  })
  .help()
  .demandOption(['host']).argv;

const MIN_PORT = 0;
const MAX_PORT = 65535;

const initialState = {
  host: '127.0.0.1',
  minPort: MIN_PORT,
  maxPort: MAX_PORT,
  options: {
    socketTimeout: 300,
  },
};

const scan = async (portFrom, portTo) => {
  console.log(`Scanning ports from ${portFrom} to ${portTo} on host ${initialState.host}`);
  const result = [];
  for (let port = portFrom; port <= portTo; port++) {
    const status = await connect(port, initialState.host);
    status && result.push(port);
  }
  return result;
};

const connect = async (port, host) => {
  const socket = net.connect(port, host).setTimeout(initialState.options.socketTimeout);
  return await handleSocketEvents(socket);
};

const handleSocketEvents = (socket) => {
  return new Promise((resolve) => {
    socket.on('connect', () => {
      onConnect(socket);
      resolve(true);
    });
    socket.on('error', (error) => {
      onError(error, socket);
      resolve(false);
    });
    socket.on('timeout', () => {
      onTimeout(socket);
      resolve(false);
    });
  });
};

const onConnect = (socket) => {
  process.stdout.write('.');
  socket.destroy();
};
const onError = (error, socket) => {
  console.log(error.code, error.address);
  process.stdout.write('!');
  socket.destroy();
};
const onTimeout = (socket) => {
  process.stdout.write('_');
  socket.destroy();
};

const portsToRange = (ports) => ports.split('-').map((port) => Number(port));
const validatePort = (port) => Number.isFinite(port) && port >= MIN_PORT && port <= MAX_PORT;

const validateArgs = (argv) => {
  const { ports, host, socketTimeout } = argv;

  if (typeof host === 'string') {
    initialState.host = host;
  } else {
    throw new Error(`Invalid host: ${host}`);
  }

  if (ports) {
    if (typeof ports === 'string' && ports.match(/^[0-9]{1,5}\-[0-9]{1,5}$/)) {
      const [minPort, maxPort] = portsToRange(ports);
      if (minPort > maxPort || [minPort, maxPort].some((p) => validatePort(p) === false)) {
        throw new Error(`Invalid port range: ${minPort} to ${maxPort}`);
      } else {
        initialState.minPort = minPort;
        initialState.maxPort = maxPort;
      }
    } else {
      throw new Error('Invalid port range! Expected 0-65535');
    }
  }

  if (socketTimeout) {
    if (socketTimeout > 0) {
      initialState.options.socketTimeout = socketTimeout;
    } else {
      throw new Error('Invalid socket-timeout! Expected: socketTimeout has type Number, socketTimeout > 0');
    }
  }
};

const run = async (state = initialState) => {
  validateArgs(argv);

  const result = await scan(state.minPort, state.maxPort);

  process.stdout.write('\n');
  process.stdout.write(`${result.length ? result.join() : 0} ${result.length === 1 ? 'port' : 'ports'} are opened`);
  process.exit(0);
};

run();
