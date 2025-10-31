// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Zite - Confidential Donation Pool.
 * @notice Private donations with Zama FHEVM.
 */

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract ConfidentialDonation is SepoliaConfig {
    enum Disclosure {
        AfterEnd,
        AfterEndAndGoal,
        Never
    }

    struct Round {
        address owner;
        address payable beneficiary;
        uint64 goalEthWei64;
        uint64 startAt; // unix seconds
        uint64 endAt; // unix seconds
        Disclosure policy;
        // metadata
        string title;
        string description;
        // public escrowed ETH (verifiable) for payout
        uint256 escrow;
        uint256 raised;
        bool paidOut;
        // encrypted totals
        euint64 encTotal;
        // once policy is met, we flip this and allow public decrypt for encTotal
        bool totalPublicUnlocked;
    }

    // round management
    mapping(bytes32 => Round) private _rounds;
    mapping(bytes32 => bool) private _exists;
    bytes32[] private _roundIds; // allow simple listing
    mapping(address => bytes32[]) private _byOwner;

    // roundId => user => encrypted subtotal (euint64)
    mapping(bytes32 => mapping(address => euint64)) private _userSubtotal;

    event RoundCreated(
        bytes32 indexed roundId,
        address indexed owner,
        address indexed beneficiary,
        uint64 startAt,
        uint64 endAt,
        Disclosure policy,
        uint64 goalWei,
        string title,
        string description
    );
    event Donated(bytes32 indexed roundId, address indexed donor, uint256 amountWei);
    event TotalPublicUnlocked(bytes32 indexed roundId);
    event Payout(bytes32 indexed roundId, address indexed to, uint256 amountWei);

    modifier onlyOwner(bytes32 roundId) {
        require(msg.sender == _rounds[roundId].owner, "not round owner");
        _;
    }

    function exists(bytes32 roundId) public view returns (bool) {
        return _exists[roundId];
    }

    function getAllRoundIds() external view returns (bytes32[] memory) {
        return _roundIds;
    }

    function getRound(
        bytes32 roundId
    )
        external
        view
        returns (
            address owner,
            address beneficiary,
            uint64 goalEthWei64,
            uint64 startAt,
            uint64 endAt,
            Disclosure policy,
            uint256 escrow,
            uint256 raised,
            bool paidOut,
            bool totalPublicUnlocked,
            string memory title,
            string memory description
        )
    {
        Round storage r = _rounds[roundId];
        return (
            r.owner,
            r.beneficiary,
            r.goalEthWei64,
            r.startAt,
            r.endAt,
            r.policy,
            r.escrow,
            r.raised,
            r.paidOut,
            r.totalPublicUnlocked,
            r.title,
            r.description
        );
    }

    function getTotalHandle(bytes32 roundId) external view returns (euint64) {
        return _rounds[roundId].encTotal; // ZeroHash => treat as 0 in UI
    }

    function getMyTotal(bytes32 roundId) external view returns (euint64) {
        return _userSubtotal[roundId][msg.sender];
    }

    /// @notice Create a round. roundId is supplied by frontend (keccak256(slug)).
    function createRound(
        bytes32 roundId,
        address payable beneficiary,
        uint64 goalEthWei64,
        uint64 startAt,
        uint64 endAt,
        Disclosure policy,
        string calldata title,
        string calldata description
    ) external {
        require(!_exists[roundId], "exists");
        require(beneficiary != address(0), "bad beneficiary");
        require(endAt > startAt && endAt > block.timestamp, "bad time");

        Round storage r = _rounds[roundId];
        r.owner = msg.sender;
        r.beneficiary = beneficiary;
        r.goalEthWei64 = goalEthWei64;
        r.startAt = startAt;
        r.endAt = endAt;
        r.policy = policy;
        r.title = title;
        r.description = description;
        r.escrow = 0;
        r.raised = 0;
        r.paidOut = false;
        r.encTotal = FHE.asEuint64(0);
        r.totalPublicUnlocked = false;

        _exists[roundId] = true;
        _roundIds.push(roundId);
        _byOwner[msg.sender].push(roundId);

        FHE.allowThis(r.encTotal); // contract can re-serve handle

        emit RoundCreated(roundId, msg.sender, beneficiary, startAt, endAt, policy, goalEthWei64, title, description);
    }

    function donate(bytes32 roundId, externalEuint64 amount, bytes calldata proof) external payable {
        Round storage r = _rounds[roundId];
        require(_exists[roundId], "round not found");
        require(block.timestamp >= r.startAt, "not started");
        require(block.timestamp <= r.endAt, "ended");

        euint64 delta = FHE.fromExternal(amount, proof);

        euint64 newTotal = FHE.add(r.encTotal, delta);
        r.encTotal = newTotal;

        euint64 currentUser = _userSubtotal[roundId][msg.sender];
        euint64 newUser = FHE.add(currentUser, delta);
        _userSubtotal[roundId][msg.sender] = newUser;

        FHE.allowThis(newTotal);
        FHE.allowThis(newUser);
        FHE.allow(newUser, msg.sender);

        r.escrow += msg.value;
        r.raised += msg.value;

        emit Donated(roundId, msg.sender, msg.value);
    }

    function maybeMakeTotalPublic(bytes32 roundId) external onlyOwner(roundId) {
        Round storage r = _rounds[roundId];
        require(!r.totalPublicUnlocked, "already public");

        bool ended = block.timestamp > r.endAt;
        bool goalMet = r.escrow >= uint256(r.goalEthWei64);

        if (r.policy == Disclosure.AfterEnd) {
            require(ended, "policy: after end");
        } else if (r.policy == Disclosure.AfterEndAndGoal) {
            require(ended && goalMet, "policy: after end & goal");
        } else if (r.policy == Disclosure.Never) {
            revert("policy: never");
        }

        r.totalPublicUnlocked = true;

        // mark as publicly decryptable (convention: address(0))
        FHE.allow(r.encTotal, address(0));

        emit TotalPublicUnlocked(roundId);
    }

    function payout(bytes32 roundId) external onlyOwner(roundId) {
        Round storage r = _rounds[roundId];
        require(block.timestamp > r.endAt, "not ended");
        uint256 amount = r.escrow;
        r.escrow = 0;
        r.paidOut = true;
        (bool ok, ) = r.beneficiary.call{value: amount}("");
        require(ok, "transfer failed");
        emit Payout(roundId, r.beneficiary, amount);
    }
}
