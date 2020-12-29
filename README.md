# mcsetup

A setup script for Minecraft servers, since setting them up is pretty annoying and confusing.

## Setup

You need to have Node.js installed.

### Linux

To run it, paste this in a bash shell:

```sh
curl -s https://pastebin.com/raw/74ddmCAD -o serverSetup.js && node serverSetup.js && rm serverSetup.js
```

### Windows

Open CMD and run:

```cmd
curl -s https://pastebin.com/raw/74ddmCAD -o serverSetup.js && node serverSetup.js && rm serverSetup.js
```

## Building

Don't like the idea of running a minified script from Pastebin? (me neither)
To build the code (might work on windows?), run `npm install` and `npm run build`.
The result is in `dist/minified.js`.
You can run that and get the same result as with the Pastebin script.
