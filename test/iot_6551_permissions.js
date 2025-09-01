const { expect } = require("chai");
const { ethers } = require("hardhat");

// Tests: register device to NFT; enforce only owner/TBA can write; ownership transfer updates permissions.
describe("IoTData + 6551 permissions", function(){
  it("enforces owner/TBA permissions and respects ownership transfer", async function(){
    const [owner, user, attacker] = await ethers.getSigners();

    // Deploy IoTData
    const IoTData = await ethers.getContractFactory("IoTData");
    const iot = await IoTData.connect(owner).deploy();
    await iot.waitForDeployment();

    // Deploy minimal 6551 suite
    const Registry = await ethers.getContractFactory("ERC6551Registry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();

    const Account = await ethers.getContractFactory("ERC6551Account");
    const impl = await Account.deploy();
    await impl.waitForDeployment();

    const MyNFT = await ethers.getContractFactory("MyNFT");
    const nft = await MyNFT.connect(owner).deploy(await registry.getAddress(), await impl.getAddress());
    await nft.waitForDeployment();

    // Mint NFT to owner, fetch TBA
    const mintTx = await nft.mint(owner.address);
    const rcpt = await mintTx.wait();
    const ev = rcpt.logs.map(l => { try { return nft.interface.parseLog(l); } catch { return null; } }).filter(Boolean).find(e => e.name === "NFTMinted");
    const tokenId = ev.args[1];
    const account = ev.args[2];

    const deviceId = `device-${tokenId}`;
    // Register device binding
    await (await iot.registerDevice(deviceId, await nft.getAddress(), tokenId, account)).wait();

    // Attacker cannot write
    await expect(iot.connect(attacker).storeReading(deviceId, "{}", 1)).to.be.revertedWith("Unauthorized");

    // Owner can write
    await expect(iot.connect(owner).storeReading(deviceId, "{\"ok\":1}", 2)).to.not.be.reverted;

    // TBA can write: call execute() into IoTData
    const accountC = await ethers.getContractAt("ERC6551Account", account, owner);
    const iotIface = new ethers.Interface(["function storeReading(string,string,uint256) returns (uint256)"]);
    const data = iotIface.encodeFunctionData("storeReading", [deviceId, "{\"via\":\"tba\"}", 3]);
    await expect(accountC.execute(await iot.getAddress(), 0, data)).to.not.be.reverted;

    // Transfer NFT to user, now owner changes
    await (await nft.connect(owner)["transferFrom(address,address,uint256)"](owner.address, user.address, tokenId)).wait();
  // Old owner can no longer write (neither current owner nor bound account)
  await expect(iot.connect(owner).storeReading(deviceId, "{}", 4)).to.be.revertedWith("Unauthorized");
    // New owner can write
    await expect(iot.connect(user).storeReading(deviceId, "{}", 5)).to.not.be.reverted;
  });
});
