import { Contract } from "@ethersproject/contracts";
import { addresses, abis } from "@project/contracts";

  // Need to know address of pact
export async function getRoles(provider, pactAddress) {
  // Currently pact address is only gettable by host
  // TODO: Possibly expose a way to get pact address on BTGateway
  const pact = new Contract(pactAddress, abis.Pact.abi, provider);
  console.log('pact', pact)
  let roles;
  let host;
  try{
    roles = await pact.getParticipants();
    console.log('roles', roles)
    host = await pact.getHost();
    console.log('roles', roles)
    console.log('host', host);
  } catch(e) {
    console.log(e);
  }
}

export async function getMyPact(provider) {
  const gateway = new Contract(addresses.BetterTogetherGateway.address, abis.BetterTogetherGateway.abi, provider);
  const signer = provider.getSigner();
  try {
    const pactAddress = await gateway.connect(signer).getMyPact();
    console.log('Pact Address', pactAddress);
    return pactAddress;
  } catch(e) {
    console.log(e);
    return null;
  }
}

// TODO: Create invite code function to pass in
export async function createPact(provider, inviteCode) {
  return new Promise( async (resolve, reject) => {
    const signer = provider.getSigner();
    const gateway = new Contract(addresses.BetterTogetherGateway.address, abis.BetterTogetherGateway.abi, provider);
    let subscriber;
    try {
      await gateway.connect(signer).createPact(inviteCode);
      subscriber = gateway.on("PactJoined", (host, pactAddress, event)=> {
        console.log(`${host} created pact with pact id: ${pactAddress}`);
        console.log(event);
        resolve(pactAddress);
        subscriber.off("PactJoined")
      })
    } catch (e) {
      reject(e);
    }
  })
}

export async function getPactState(provider, pactAddress) {
  return new Promise( async (resolve, reject) => {
    const pact = new Contract(pactAddress, abis.Pact.abi, provider);
    try {
      const pactState = await pact.state();
      resolve(pactState);
    } catch(e) {
      reject(e);
    }
  })
}

// TODO: return conditions after they are set
export async function setConditions(provider, pactAddress, minPledge, totalMiles, endDate, daysPerCheck ) {
  const signer = provider.getSigner();
  const pact = new Contract(pactAddress, abis.Pact.abi, provider);
  try {
    await pact.connect(signer).setConditions(minPledge, totalMiles, endDate, daysPerCheck);
    // const conditions = await pact.getConditions();
    // console.log(conditions[0].toNumber(), conditions[1].toNumber(), new Date(conditions[2].toNumber()).toLocaleString(), conditions[3].toNumber())
  } catch(e) {
    console.log(e);
  }
}

// It is now from gateway.connect also emits pact address
export async function joinPact(provider, hostAddress, inviteCode) {
  const gateway = new Contract(addresses.BetterTogetherGateway.address, abis.BetterTogetherGateway.abi, provider);
  const signer = provider.getSigner();

  try {
    await gateway.connect(signer).joinPact(hostAddress, inviteCode);
    gateway.on("PactJoined", (from, pactAddress )=> {
      console.log(`${from} joined pact ${pactAddress}`);
    })
  } catch(e) {
    console.log(e);
  }

}

export async function getConditions(provider, pactAddress) {
  const pact = new Contract(pactAddress, abis.Pact.abi, provider);
  const host = await pact.getHost();
  console.log('host', host);

  try {
    const conditions = await pact.getConditions();
    const parsedConditions = [conditions[0].toNumber(), conditions[1].toNumber(), conditions[2].toNumber(), new Date(conditions[2].toNumber()).toLocaleString(), conditions[3].toNumber()];
    return parsedConditions;
  } catch (e) {
    console.log(e);
  }
}





export async function startPact(provider, pactAddress){
  const pact = new Contract(pactAddress, abis.Pact.abi, provider);
  const signer = provider.getSigner();
  try {
    await pact.connect(signer).startPact();
    console.log("started pact")
  } catch (e) {
    console.log(e);
  }
}