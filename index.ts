import * as stream from "stream";
import { promisify } from "util";
import * as fs from "fs";
import got from "got";
import prompts from "prompts";
import commandExistsSync from "command-exists";
import execa from "execa";
import * as properties from "java-properties";
const pipeline = promisify(stream.pipeline);
import { join } from "path";
import { cursorTo } from "readline";
import { hide, show } from "cli-cursor";
(async () => {
  const answer = await prompts([
    {
      name: "eula",
      message:
        "By selecting this option, you agree to the Mojang EULA, readable at https://minecraft.net/en-us/eula. ",
      type: "confirm",
    },
    {
      type: "text",
      name: "folder",
      message:
        "Setup the folder in this folder (it will overwrite existing files):",
      initial: "minecraft-server",
    },
    {
      type: "select",
      name: "software",
      message: "What kind of server do you want to run?",
      choices: [
        {
          selected: true,
          title: "Vanilla 1.16.4 (no plugins)",
          value: { type: "vanilla", version: "1.16.4" },
        },
        {
          title: "Paper 1.16.4 (has plugins)",
          value: { type: "paper", version: "1.16.4" },
        },
      ],
    },
  ]);
  const folder: string = answer.folder;

  if (!answer.eula) {
    console.log(
      "You have not agreed to the EULA. The server will still be installed, but won't start without the EULA accepted. Edit " +
        folder +
        "/eula.txt to accept later."
    );
  }
  if (!fs.existsSync(join(process.cwd(), folder))) {
    fs.mkdirSync(join(process.cwd(), folder));
  }
  console.log("Downloading server...");
  switch (answer.software.type) {
    case "vanilla":
      await pipeline(
        got.stream(
          "https://launcher.mojang.com/v1/objects/35139deedbd5182953cf1caa23835da59ca3d7cd/server.jar"
        ),
        fs.createWriteStream(join(process.cwd(), folder, "server.jar"))
      );
      break;

    case "paper":
      await pipeline(
        got.stream(
          "https://papermc.io/api/v2/projects/paper/versions/1.16.4/builds/348/downloads/paper-1.16.4-348.jar"
        ),
        fs.createWriteStream(join(process.cwd(), folder, "server.jar"))
      );
      break;
  }
  console.log("Downloaded server!");
  if (!commandExistsSync("java")) {
    if (process.platform === "win32") {
      console.log("You do not have Java installed. Exiting...");
      process.exit(1);
    } else {
      console.log("You do not have Java installed.");
      console.log("Install using SDKMAN!:");
      console.log(" $ curl -s 'https://get.sdkman.io' | bash");
      console.log(" $ source '$HOME/.sdkman/bin/sdkman-init.sh'");
      console.log(" $ sdk install java");

      process.exit(1);
    }
  }
  let start = Date.now();
  console.clear();
  hide();
  cursorTo(process.stdout, 0, 2);

  const timer = setInterval(() => {
    const delta = Date.now() - start;
    process.stdout.write(delta / 1000 + "s since start" + " ".repeat(10));
    cursorTo(process.stdout, 0, 2);
    process.stdout;
  });
  execa(
    `java`,
    [
      `-Xmx1024M`,
      `-Xms1024M`,
      `-jar`,
      `${join(process.cwd(), folder, "server.jar")}`,
      `nogui`,
    ],
    { cwd: join(process.cwd(), folder), timeout: 20000 }
  ).finally(async () => {
    clearInterval(timer);
    show();

    const serverProps = properties.of(
      join(process.cwd(), folder, "server.properties")
    );
    const { maxPlayers, motd, pvp } = await prompts([
      {
        type: "number",
        name: "maxPlayers",
        message: "How many players should be allowed into the game?",
        initial: 20,
      },
      { type: "text", name: "motd", message: "The server message of the day?" },
      {
        type: "confirm",
        name: "pvp",
        message: "Should player-versus-player combat be enabled?",
        initial: true,
      },
    ]);
    serverProps.set("pvp", pvp.toString());
    serverProps.set("motd", motd);
    serverProps.set("max-players", maxPlayers);
    let string = "";
    Object.keys(serverProps.objs).forEach((key) => {
      string += `${key}=${serverProps.objs[key]}\n`;
    });

    fs.writeFileSync(join(process.cwd(), folder, "server.properties"), string);
    if (answer.eula) {
      fs.writeFileSync(
        join(process.cwd(), folder, "eula.txt"),
        `#By changing the setting below to TRUE you are indicating your agreement to our EULA (https://account.mojang.com/documents/minecraft_eula).
  eula=true`
      );
    }
    if (process.platform === "win32") {
      fs.writeFileSync(
        join(process.cwd(), folder, "start.bat"),
        `@echo off
  java -Xmx1024M -Xms1024M -jar ${join(
    process.cwd(),
    folder,
    "server.jar"
  )} nogui`
      );
    } else {
      fs.writeFileSync(
        join(process.cwd(), folder, "start.sh"),
        `#!/bin/sh
  java -Xmx1024M -Xms1024M -jar ${join(
    process.cwd(),
    folder,
    "server.jar"
  )} nogui`
      );
      fs.chmodSync(join(process.cwd(), folder, "start.sh"), "0755");
    }
    console.log(
      `Server installed! Run start.${
        process.platform === "win32" ? "bat" : "sh"
      } to start the server.`
    );
  });
})();
