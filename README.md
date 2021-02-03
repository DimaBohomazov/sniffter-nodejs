### TCP Port Sniffer

Sniffer is [CLI](https://en.wikipedia.org/wiki/Command-line_interface) tool which allows user to easily search for opened TCP ports on particular host (using IP address or domain). Example of usage:

```sh
> node sniffer.js --ports 10-100 --host 192.168.88.55
....
15,22,73,100 ports are opened.
```

##### TCP Sniffer User Stories

- As the user, I can call sniffer from my shell with one required argument `--host` which can be either domain name, like `google.com` or IP address like `192.168.88.55`.
- After call program will start TCP ports scan, trying to dial each port from `0` to `65535`. If dial is successful program will print dot `.` to `stdout` and save found open port to buffer array. **IMPORTANT**: Each dial attempt should have `300ms` timeout. (If client fails to connect in `300ms` port is skipped).
- After scan is finished program will print the list of opened ports to `stdout` and exit with status code `0`.
- As the user, I can limit the range of ports to scan by providing `--ports` argument in format `<start_port>-<end_port>`, for instance: `3-600`.
- As the user, I can get a descriptive error if required argument is missing or if some of them have incorrect format.
- As the user, I can provide `--help` flag to see hint about how to use `TCP sniffer`.
