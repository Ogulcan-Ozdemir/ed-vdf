# EARLY-DECRYPTABLE VERIFIABLE DELAY FUNCTIONS (ED-VDF)

## Abstract
The contributions we intend to make to the VDF protocol in this study focus on the design, verification, and implementation of a new VDF protocol that both guarantees the time lock mechanism requirements defined by VDF and provides the ability to open the time lock in a controlled manner by authorised individuals before the target time. We named this new behaviour in the VDF scheme Early Decryptable Verifiable Delay Functions (ED-VDF). Use cases of the ED-VDF scheme include real-world applications such as declassification of secret information, legal testaments and auction systems.

> For further information please read thesis pdf in repository.

## IMPLEMENTATION

We use the Ethereum Decentralized Applications (DApps) structure to implement our ED-VDF protocol design. DApps is a blueprint for applications built on Ethereum smart contracts. We chose the DApp Hardhat infrastructure to scaffold ED-VDF experimental works. Hardhat provide a convenient development environment. We use Solidity Smart Contract Language to write ED-VDF Smart Contract. Application structure is divided into 4 modules: Artifacts, Contracts, Scripts and Tests

* **Artifacts**: Contains compiled contracts and their build information.
* **Contracts**: Holds contracts written with Solidity programming language.
* **Scripts**: Embody code that provides a bridge between ethereum virtual machine (EVM) and application code that manages interaction, transaction and listening events on VDF smart contract at EVM.
* **Test**: Enclose unit, functional and attack scenario tests for implementation.

## How To Run

In order to run this project you should install. Nodejs version 14 and upper and appropriate docker environment to your machine. After download repository you can use npm run scripts to use functionalities such as;

* `npm run test` to quickly verify all functionalities.
* `npm run simulate:node` to spin up new local Ethereum Blockchain instance.
* `npm run simulate:network` to run basic ED-VDF scenario in Ethereum network .
* `npm run simulate:protocol:withEth` to run basic ED-VDF scenario with Ethereum Blockchain instance.
* `npm run simulate:protocol:withoutEth` to run basic ED-VDF scenario without Ethereum Blockchain instance.

### TODOS:
* Sample Dockerfile is written and full containerization is continuing.
