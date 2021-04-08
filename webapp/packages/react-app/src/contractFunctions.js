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
    // console.log('Pact Address', pactAddress);
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
    try {
      gateway.once("PactJoined", (host, pactAddress, event)=> {
        console.log(`${host} created pact with pact id: ${pactAddress}`);
        console.log(event);
        gateway.removeAllListeners();
        resolve(pactAddress);
      })
      await gateway.connect(signer).createPact(inviteCode)
    } catch (e) {
      reject(e);
    }
  })
}

// It is now from gateway.connect also emits pact address
export async function joinPact(provider, hostAddress, inviteCode) {
  return new Promise( async (resolve, reject) =>{
    const gateway = new Contract(addresses.BetterTogetherGateway.address, abis.BetterTogetherGateway.abi, provider);
    const signer = provider.getSigner();
    try {
      gateway.on("PactJoined", (from, pactAddress, event )=> {
        console.log(`${from} joined pact ${pactAddress}`);
        console.log(event);
        gateway.removeAllListeners();
        resolve(pactAddress);
      })
      const tx = await gateway.connect(signer).joinPact(hostAddress, inviteCode);
    } catch(e) {
      reject(e);
    }
  })
}

export async function getPactState(provider, pactAddress) {
    const pact = new Contract(pactAddress, abis.Pact.abi, provider);
    const signer = provider.getSigner();
    try {
      const pactState = await pact.connect(signer).state();
      console.log('pact state', pactState)
      const host = await pact.connect(signer).getHost();
      console.log('pact host', host);
      return [host, pactState];
    } catch(e) {
      console.log(e);
    }
}


// TODO: return conditions after they are set
export async function setConditions(provider, pactAddress, minPledge, totalMiles, endDate, daysPerCheck ) {
  const signer = provider.getSigner();
  const pact = new Contract(pactAddress, abis.Pact.abi, provider);
  try {
    const tx = await pact.connect(signer).setConditions(minPledge, totalMiles, endDate, daysPerCheck);
    const receipt = await tx.wait();
    return receipt;
  } catch(e) {
    console.log(e);
  }
}

export async function getConditions(provider, pactAddress) {
  const pact = new Contract(pactAddress, abis.Pact.abi, provider);

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
    const tx = await pact.connect(signer).startPact();
    const receipt = await tx.wait();
    console.log("started pact", receipt)
    return 1;
  } catch (e) {
    console.log(e);
  }
}