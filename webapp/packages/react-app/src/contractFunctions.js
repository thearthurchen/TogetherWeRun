import { Contract } from "@ethersproject/contracts";
import { addresses, abis } from "@project/contracts";
import { ethers } from "ethers";
import ChainlinkAbi from "@project/contracts/src/abis/chainlink.json";

// Need to know address of pact
// export async function getRoles(provider, pactAddress) {
//   // Currently pact address is only gettable by host
//   // TODO: Possibly expose a way to get pact address on BTGateway
//   const pact = new Contract(pactAddress, abis.Pact.abi, provider);
//   console.log('pact', pact)
//   let roles;
//   let host;
//   try{
//     roles = await pact.getParticipants();
//     console.log('roles', roles)
//     host = await pact.getHost();
//     console.log('roles', roles)
//     console.log('host', host);
//   } catch(e) {
//     console.log(e);
//   }
// }

const KOVAN_LINK_ADDRESS = "0xa36085F69e2889c224210F603D836748e7dC0088";

export async function getMyPact(provider) {
  const gateway = new Contract(
    addresses.BetterTogetherGateway.address,
    abis.BetterTogetherGateway.abi,
    provider
  );
  const signer = provider.getSigner();
  try {
    const pactAddress = await gateway.connect(signer).getMyPact();
    // console.log('Pact Address', pactAddress);
    return pactAddress;
  } catch (e) {
    const {
      data: { message },
    } = e;
    console.log(message);
    return null;
  }
}

// TODO: Create invite code function to pass in
async function _createPact(signer, gateway) {
  return new Promise(async (resolve, reject) => {
    gateway.on("PactJoined", (host, pactAddress, event) => {
      console.log(`${host} created pact with pact id: ${pactAddress}`);
      gateway.removeAllListeners();
      resolve(pactAddress);
    });
  });
}

async function _connectEscrow(signer, gateway, factory) {
  return new Promise(async (resolve, reject) => {
    factory.on("RefundEscrowCreated", async (hostAddress) => {
      console.log(`Refund escrow created for ${hostAddress}`);
      if (hostAddress === (await signer.getAddress())) {
        await gateway.connect(signer).connectEscrow();
        resolve();
        factory.removeAllListeners();
      }
    });
  });
}
export async function createPact(provider, inviteCode) {
  return new Promise(async (resolve, reject) => {
    const signer = provider.getSigner();
    const gateway = new Contract(
      addresses.BetterTogetherGateway.address,
      abis.BetterTogetherGateway.abi,
      provider
    );
    const factory = new Contract(
      addresses.EscrowFactory.address,
      abis.EscrowFactoryAbi.abi,
      provider
    );
    try {
      const [address] = await Promise.all([
        _createPact(signer, gateway),
        _connectEscrow(signer, gateway, factory),
        gateway.connect(signer).createPact(inviteCode),
      ]);
      console.log(address);
      resolve(address);
    } catch (e) {
      reject(e);
    }
  });
}

// It is now from gateway.connect also emits pact address
export async function joinPact(provider, hostAddress, inviteCode) {
  console.log(hostAddress);
  console.log(inviteCode);
  return new Promise(async (resolve, reject) => {
    const gateway = new Contract(
      addresses.BetterTogetherGateway.address,
      abis.BetterTogetherGateway.abi,
      provider
    );
    const signer = provider.getSigner();
    try {
      gateway.on("PactJoined", (from, pactAddress, event) => {
        console.log(`${from} joined pact ${pactAddress}`);
        console.log(event);
        gateway.removeAllListeners();
        resolve(pactAddress);
      });
      await gateway.connect(signer).joinPact(hostAddress, inviteCode);
    } catch (e) {
      console.log(e);
      reject(e);
    }
  });
}

export async function getPactState(provider, pactAddress) {
  const pact = new Contract(pactAddress, abis.Pact.abi, provider);
  const signer = provider.getSigner();
  try {
    const pactState = await pact.connect(signer).state();
    const hostAddress = await pact.connect(signer).getHost();
    console.log(`Pact state ${pactState} Host ${hostAddress}`);
    return { hostAddress, pactState };
  } catch (e) {
    console.log(e);
  }
}

export async function getParticipants(provider, pactAddress) {
  const pact = new Contract(pactAddress, abis.Pact.abi, provider);
  const signer = provider.getSigner();
  try {
    const participants = await pact.connect(signer).getParticipants();
    console.log(`Participants ${participants}`);
    return participants;
  } catch (e) {
    console.log(e);
  }
}

export async function setConditions(
  provider,
  pactAddress,
  minPledge,
  totalMiles,
  endDate,
  daysPerCheck
) {
  const signer = provider.getSigner();
  const pact = new Contract(pactAddress, abis.Pact.abi, provider);
  try {
    const tx = await pact
      .connect(signer)
      .setConditions(minPledge, totalMiles, endDate, daysPerCheck);
    return await tx.wait();
  } catch (e) {
    console.log(e);
  }
}

export async function getConditions(provider, pactAddress) {
  const pact = new Contract(pactAddress, abis.Pact.abi, provider);

  try {
    const conditions = await pact.getConditions();
    // (minPledge, totalMiles, endDateUtc, daysPerCheck)
    const [minPledge, totalMiles, endDateUtc, daysPerCheck] = conditions;
    return {
      minPledge,
      totalMiles,
      endDateUtc,
      daysPerCheck,
    };
  } catch (e) {
    console.log(e);
  }
}

export async function startPact(provider, pactAddress) {
  const pact = new Contract(pactAddress, abis.Pact.abi, provider);
  const signer = provider.getSigner();
  try {
    const tx = await pact.connect(signer).startPact();
    return await tx.wait();
  } catch (e) {
    console.log(e);
  }
}

export async function makePledge(pledgeAmount, provider, pactAddress) {
  return new Promise(async (resolve, reject) => {
    const pact = new Contract(pactAddress, abis.Pact.abi, provider);
    const signer = provider.getSigner();
    try {
      pact.on("Deposited", (sender, value) => {
        console.log(`${sender} sent ${value}`);
        pact.removeAllListeners();
        resolve(value);
      });
      await pact
        .connect(signer)
        .makePledge({ value: ethers.utils.parseEther(pledgeAmount) });
    } catch (e) {
      reject(e);
    }
  });
}

export async function getProgress(provider, pactAddress) {
  const pact = new Contract(pactAddress, abis.Pact.abi, provider);
  const signer = provider.getSigner();
  try {
    const participants = await pact.connect(signer).getParticipants();
    const progressMap = {};
    const pledgeMap = {};
    await Promise.all(
      participants.map(async (friend) => {
        const [progress, pledge] = await pact
          .connect(friend)
          .getProgress(friend);
        console.log(progress);
        console.log(pledge);
        progressMap[friend] = progress;
        pledgeMap[friend] = pledge;
      })
    );
    return { progress: progressMap, pledges: pledgeMap };
  } catch (e) {
    console.log(e);
  }
}

export async function updateProgress(provider, pactAddress) {
  const pact = new Contract(pactAddress, abis.Pact.abi, provider);
  const signer = provider.getSigner();
  try {
    pact.on("ProgressUpdated", (user, progress) => {
      console.log(user, progress);
    });
    await pact.connect(signer).updateProgress();
  } catch (e) {
    console.log(e);
  }
}

export async function fundLink(provider, pactAddress) {
  const LINK = new Contract(KOVAN_LINK_ADDRESS, abis.Link, provider);
  const signer = provider.getSigner();
  try {
    await LINK.connect(signer).approve(
      pactAddress,
      ethers.utils.parseEther("10.0")
    );
    await LINK.connect(signer).transfer(
      pactAddress,
      ethers.utils.parseEther("10.0")
    );
    console.log("Transferred some link");
  } catch (e) {
    console.log(e);
  }
}

export async function balanceOfLink(provider, pactAddress) {
  const LINK = new Contract(KOVAN_LINK_ADDRESS, abis.Link, provider);
  const signer = provider.getSigner();
  return await LINK.connect(signer).balanceOf(pactAddress);
}

export async function withdrawFromEscrow(provider, pactAddress, signedInAddress) {
  const pact = new Contract(pactAddress, abis.Pact.abi, provider)
  const signer = provider.getSigner();
  try {
    await pact.withdraw(signedInAddress);
  } catch (e) {
    console.log(e);
  }
}
