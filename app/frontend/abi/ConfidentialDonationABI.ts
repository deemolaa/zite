
/*
  This file is auto-generated.
  By commands: 'npx hardhat deploy' or 'npx hardhat node'
*/
export const ConfidentialDonationABI = {
  "abi": [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "roundId",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "donor",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountWei",
          "type": "uint256"
        }
      ],
      "name": "Donated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "roundId",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountWei",
          "type": "uint256"
        }
      ],
      "name": "Payout",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "roundId",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "beneficiary",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint64",
          "name": "startAt",
          "type": "uint64"
        },
        {
          "indexed": false,
          "internalType": "uint64",
          "name": "endAt",
          "type": "uint64"
        },
        {
          "indexed": false,
          "internalType": "enum ConfidentialDonation.Disclosure",
          "name": "policy",
          "type": "uint8"
        },
        {
          "indexed": false,
          "internalType": "uint64",
          "name": "goalWei",
          "type": "uint64"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "description",
          "type": "string"
        }
      ],
      "name": "RoundCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "roundId",
          "type": "bytes32"
        }
      ],
      "name": "TotalPublicUnlocked",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "roundId",
          "type": "bytes32"
        },
        {
          "internalType": "address payable",
          "name": "beneficiary",
          "type": "address"
        },
        {
          "internalType": "uint64",
          "name": "goalEthWei64",
          "type": "uint64"
        },
        {
          "internalType": "uint64",
          "name": "startAt",
          "type": "uint64"
        },
        {
          "internalType": "uint64",
          "name": "endAt",
          "type": "uint64"
        },
        {
          "internalType": "enum ConfidentialDonation.Disclosure",
          "name": "policy",
          "type": "uint8"
        },
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "description",
          "type": "string"
        }
      ],
      "name": "createRound",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "roundId",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint64",
          "name": "amount",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "proof",
          "type": "bytes"
        }
      ],
      "name": "donate",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "roundId",
          "type": "bytes32"
        }
      ],
      "name": "exists",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getAllRoundIds",
      "outputs": [
        {
          "internalType": "bytes32[]",
          "name": "",
          "type": "bytes32[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "roundId",
          "type": "bytes32"
        }
      ],
      "name": "getMyTotal",
      "outputs": [
        {
          "internalType": "euint64",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "roundId",
          "type": "bytes32"
        }
      ],
      "name": "getRound",
      "outputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "beneficiary",
          "type": "address"
        },
        {
          "internalType": "uint64",
          "name": "goalEthWei64",
          "type": "uint64"
        },
        {
          "internalType": "uint64",
          "name": "startAt",
          "type": "uint64"
        },
        {
          "internalType": "uint64",
          "name": "endAt",
          "type": "uint64"
        },
        {
          "internalType": "enum ConfidentialDonation.Disclosure",
          "name": "policy",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "escrow",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "totalPublicUnlocked",
          "type": "bool"
        },
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "description",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "roundId",
          "type": "bytes32"
        }
      ],
      "name": "getTotalHandle",
      "outputs": [
        {
          "internalType": "euint64",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "roundId",
          "type": "bytes32"
        }
      ],
      "name": "maybeMakeTotalPublic",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "roundId",
          "type": "bytes32"
        }
      ],
      "name": "payout",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "protocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    }
  ]
} as const;

