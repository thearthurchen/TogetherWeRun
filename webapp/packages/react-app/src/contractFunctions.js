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

export async function myPact(provider) {
  const gateway = new Contract(addresses.BetterTogetherGateway.address, abis.BetterTogetherGateway.abi, provider);
  const signer = provider.getSigner();
  try {
    const resp = await gateway.connect(signer).getMyPact();
    console.log('Pact Address', resp);

  } catch(e) {
    console.log(e);
  }
}

// TODO: Create invite code function to pass in
export async function createPact(provider, inviteCode) {
  return new Promise( async (resolve, reject)=> {
    const signer = provider.getSigner();
    const gateway = new Contract(addresses.BetterTogetherGateway.address, abis.BetterTogetherGateway.abi, provider);
    let subscriber;
    try {
      await gateway.connect(signer).createPact(inviteCode);
      subscriber = gateway.on("PactJoined", (host, pactAddress, event)=> {
        console.log(`${host} created pact with pact id: ${pactAddress}`);
        console.log(event);
        resolve(pactAddress);
        subscriber.unsubscribe();
      })
    } catch (e) {
      reject(e);
    }
  })

}

export async function setConditions(provider, pactAddress, minPledge, endDate, daysPerCheck ) {
  const signer = provider.getSigner();
  const pact = new Contract(pactAddress, abis.Pact.abi, provider);
  try {
    await pact.connect(signer).setConditions(minPledge, endDate, daysPerCheck);
    const conditions = await pact.getConditions();
    console.log(conditions[0].toNumber(), new Date(conditions[1].toNumber()).toLocaleString(), conditions[2].toNumber())
  } catch(e) {
    console.log(e);
  }
}

// It is now from gateway.connect also emits pact address
export async function joinPact(provider, hostAddress, inviteCode) {
  const gateway = new Contract(addresses.BetterTogetherGateway.address, abis.BetterTogetherGateway.abi, provider);
  const signer = provider.getSigner();

  try {
    // joinPact(hostAddress, inviteCode)
    await gateway.connect(signer).joinPact(hostAddress, inviteCode);
    gateway.on("PactJoined", (from, )=> {
      console.log(`${from} joined pact and sent ${value}`);
    })
  } catch(e) {
    console.log(e);
  }

}
