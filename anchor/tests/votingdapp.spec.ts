import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {PublicKey} from '@solana/web3.js'
import {Voting} from '../target/types/voting'
import { BankrunProvider } from 'anchor-bankrun';
import { startAnchor } from 'solana-bankrun';


const IDL = require('../target/idl/voting.json'); 

const votingAddress = new PublicKey("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");


describe('Voting', () => {
  let context;
  let provider;
  let votingProgram: anchor.Program<Voting>;

  beforeAll(async () => {
    context = await startAnchor("", [{name: "voting", programId: votingAddress}], []);
    provider = new BankrunProvider(context);

    votingProgram = new Program<Voting> (
      IDL,
      provider,
    );

  });


  it('Initialize Poll', async () => {
    context = await startAnchor("", [{name: "voting", programId: votingAddress}], []);
    provider = new BankrunProvider(context);

    votingProgram = new Program<Voting> (
      IDL,
      provider,
  );
  
  await votingProgram.methods.initializePoll(
    new anchor.BN(1),
    "What is the best type of peanut butter?",
    new anchor.BN(0),
    new anchor.BN(1821246480),
  ).rpc();

  const [pollAddress] = PublicKey.findProgramAddressSync(
    [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
    votingAddress,
  )

  const poll = await votingProgram.account.poll.fetch(pollAddress);
  console.log(poll);

  expect(poll.pollId.toNumber()).toEqual(1);
  expect(poll.description).toEqual("What is the best type of peanut butter?");
  expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());

  });

  it("initialize candidate", async () => {
    await votingProgram.methods.initializeCandidate(
      "Dog",
      new anchor.BN(1),
    ).rpc();
    await votingProgram.methods.initializeCandidate(
      "Cat",
      new anchor.BN(1),
    ).rpc();

    const [aAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Cat")],
      votingAddress,
    );

    const aCandidate = await votingProgram.account.candidate.fetch(aAddress);
    console.log(aCandidate);
    expect(aCandidate.candidateVotes.toNumber()).toEqual(0);

    const [bAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Dog")],
      votingAddress,
    );

    const bCandidate = await votingProgram.account.candidate.fetch(bAddress);
    console.log(bCandidate);
    expect(bCandidate.candidateVotes.toNumber()).toEqual(0);
    

  });

  it("vote", async () => {
    await votingProgram.methods.vote(
      "Cat",
      new anchor.BN(1)
    ).rpc();

    const [aAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Cat")],
      votingAddress,
    );
    const aCandidate = await votingProgram.account.candidate.fetch(aAddress);
    console.log(aCandidate);
    expect(aCandidate.candidateVotes.toNumber()).toEqual(1);
  });

  
});

