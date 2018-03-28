## Hub Testing CLI
`testhub` is a command line tool to help test Event Hub sending and receiving.

### Usage
When simply executing `testhub`, you will be greeted with a help page. `help` can be called on each command.
```bash
 testhub --help
testhub [command]

Commands:
  testhub receive  Sends messages to an eventhub.
  testhub send     Sends messages to an eventhub.

Options:
  --version       Show version number                                  [boolean]
  -h, --help      Show help                                            [boolean]
  -c, --conn-str  EventHub connection string.                           [string]
  -n, --hub       Name of the EventHub.                      [string] [required]
  -a, --address   Address URI to the EventHub entity.                   [string]
  -k, --key-name  SAS key-name for the EventHub.                        [string]
  -v, --key       SAS key for the key-name.                             [string]
```

#### Send
Send with a connection string.
```bash
$ testhub send -c yourConnectionString
```
Send will by default send 1 messages of 256 bytes.
```bash
$ testhub send -a yourNamespace -n yourHub -k yourKeyName -v yourKey
```

You can specify more messages by using `-b` and `-s`.
```bash
$ testhub send --conn-str yourConnectionString -b 100 -s 100
```

#### Receive
Use a connection string to receive messages.
```bash
$ testhub receive -c yourConnectionString
```

Listen for messages on all partitions of a given Event Hub.
```bash
$ testhub receive -a yourNamespace -n yourHub -k yourKeyName -v yourKey
```

#### Debug
If you would like to see more in-depth information about what is happening, `export DEBUG=azure*` or `export DEBUG=azure*,rhea*`.
