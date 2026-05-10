import { RPGMakerDebugBridge } from "../dist/rpgmaker/debug-bridge.js";

const bridge = new RPGMakerDebugBridge(9001);
bridge.start();

console.log("✓ Debug Bridge HTTP server running on port 9001");
console.log("Waiting for game connection...");

let lastConnected = false;
setInterval(() => {
  const now = bridge.connected;
  if (now !== lastConnected) {
    lastConnected = now;
    if (now) console.log("✓ Game connected!");
    else console.log("✗ Game disconnected");
  }
}, 2000);

process.on("SIGINT", () => {
  bridge.stop();
  process.exit();
});
