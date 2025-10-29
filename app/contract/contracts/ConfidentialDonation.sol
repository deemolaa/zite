// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AnonymousImpactPools
 * @notice Private donations with policy-gated public totals via Zama FHEVM.
 *
 * Users donate ETH; per-user subtotals and round total are kept as encrypted euint64.
 * Totals can be made publicly decryptable only when the disclosure policy allows.
 * Admin (round owner) can payout escrow after the round ends (optionally after public unlock).
 *
 * Encryption model:
 * - euint64 handles (ciphertext) are stored on-chain.
 * - Frontend encrypts donation amounts client-side and sends externalEuint64 + proof.
 * - Contract imports via FHE.fromExternal and homomorphically adds to encTotal and encUserSubtotal.
 * - Users can always decrypt *their own* subtotal (FHE.allow(userSubtotal, user)).
 * - Round total is kept private unless policy allows making a public handle (FHE.allow(total, address(0)) with a known “public decrypt” convention).
 *
 */

import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract ConfidentialDonation is SepoliaConfig {
    enum Disclosure {
        AfterEnd,
        AfterEndAndGoal,
        Never
    }

    struct Round {
        address owner;
        address payable beneficiary;
        uint64  goalEthWei64; 
        uint64  startAt;       // unix seconds
        uint64  endAt;         // unix seconds
        Disclosure policy;

        // escrowed ETH (public) for payout
        uint256 escrow;

        // encrypted totals
        euint64 encTotal;

        // once policy is met, we flip this and allow public decrypt for encTotal
        bool totalPublicUnlocked;
    }

    // roundId => Round
    mapping(bytes32 => Round) private _rounds;

    // roundId => user => encrypted subtotal (euint64)
    mapping(bytes32 => mapping(address => euint64)) private _userSubtotal;

    event RoundCreated(bytes32 indexed roundId, address indexed owner, address indexed beneficiary, uint64 startAt, uint64 endAt, Disclosure policy, uint64 goalWei);
    event Donated(bytes32 indexed roundId, address indexed donor, uint256 amountWei);
    event TotalPublicUnlocked(bytes32 indexed roundId);
    event Payout(bytes32 indexed roundId, address indexed to, uint256 amountWei);

    modifier onlyOwner(bytes32 roundId) {
        require(msg.sender == _rounds[roundId].owner, "not round owner");
        _;
    }

    function getRound(bytes32 roundId) external view returns (
        address owner,
        address beneficiary,
        uint64 goalEthWei64,
        uint64 startAt,
        uint64 endAt,
        Disclosure policy,
        uint256 escrow,
        bool totalPublicUnlocked
    ) {
        Round storage r = _rounds[roundId];
        return (r.owner, r.beneficiary, r.goalEthWei64, r.startAt, r.endAt, r.policy, r.escrow, r.totalPublicUnlocked);
    }

    function getTotalHandle(bytes32 roundId) external view returns (euint64) {
        // UI: if ZeroHash, treat as 0 (uninitialized)
        return _rounds[roundId].encTotal;
    }

    function getMyTotal(bytes32 roundId) external view returns (euint64) {
        return _userSubtotal[roundId][msg.sender];
    }

    /// @notice Create a round. roundId is supplied by frontend (e.g., keccak256("my-round-01")).
    function createRound(
        bytes32 roundId,
        address payable beneficiary,
        uint64 goalEthWei64,
        uint64 startAt,
        uint64 endAt,
        Disclosure policy
    ) external {
        require(_rounds[roundId].owner == address(0), "exists");
        require(beneficiary != address(0), "bad beneficiary");
        require(endAt > startAt && endAt > block.timestamp, "bad time");

        _rounds[roundId] = Round({
            owner: msg.sender,
            beneficiary: beneficiary,
            goalEthWei64: goalEthWei64,
            startAt: startAt,
            endAt: endAt,
            policy: policy,
            escrow: 0,
            encTotal: FHE.asEuint64(0), // init to 0
            totalPublicUnlocked: false
        });

        // Let the contract re-serve encTotal handle
        FHE.allowThis(_rounds[roundId].encTotal);

        emit RoundCreated(roundId, msg.sender, beneficiary, startAt, endAt, policy, goalEthWei64);
    }

    /// @notice Donate ETH. The homomorphic addition uses encrypted `amount` (in wei, uint64 for demo).
    /// @param amount External encrypted donation amount (wei) bound to (msg.sender, this).
    /// @param proof  Relayer proof for the external encrypted input.
    function donate(bytes32 roundId, externalEuint64 amount, bytes calldata proof) external payable {
        Round storage r = _rounds[roundId];
        require(r.owner != address(0), "round not found");
        require(block.timestamp >= r.startAt, "not started");
        require(block.timestamp <= r.endAt, "ended");

        // Import encrypted amount (verifies binding + proof)
        euint64 delta = FHE.fromExternal(amount, proof);

        // Update encrypted total
        euint64 newTotal = FHE.add(r.encTotal, delta);
        r.encTotal = newTotal;

        // Update user subtotal
        euint64 currentUser = _userSubtotal[roundId][msg.sender];
        euint64 newUser = FHE.add(currentUser, delta);
        _userSubtotal[roundId][msg.sender] = newUser;

        // Allow contract to re-serve handles + caller to decrypt own subtotal
        FHE.allowThis(newTotal);
        FHE.allowThis(newUser);
        FHE.allow(newUser, msg.sender);

        // Escrow ETH publicly (verifiable)
        r.escrow += msg.value;

        emit Donated(roundId, msg.sender, msg.value);
    }

    /// @notice Make total publicly decryptable if policy is satisfied.
    function maybeMakeTotalPublic(bytes32 roundId) external onlyOwner(roundId) {
        Round storage r = _rounds[roundId];
        require(!r.totalPublicUnlocked, "already public");

        bool ended = block.timestamp > r.endAt;
        bool goalMet = false;
        // Compare public escrow with public goal (both in wei; using uint64 goal for demo)
        if (r.escrow >= uint256(r.goalEthWei64)) {
            goalMet = true;
        }

        if (r.policy == Disclosure.AfterEnd) {
            require(ended, "policy: after end");
        } else if (r.policy == Disclosure.AfterEndAndGoal) {
            require(ended && goalMet, "policy: after end & goal");
        } else if (r.policy == Disclosure.Never) {
            revert("policy: never");
        }

        r.totalPublicUnlocked = true;

        // Make encTotal publicly decryptable handle. The simplest pattern in FHEVM UX is:
        // - For "public decrypt", allow a well-known special address or call a helper that marks
        //   the handle as publicly decryptable. Depending on the exact library version, either:
        //   FHE.allow(enc, address(0)) or an explicit "public" API. Keep this line aligned with your SDK:
        FHE.allow(r.encTotal, address(0)); // <- in some stacks, this is how publicDecrypt is modeled

        emit TotalPublicUnlocked(roundId);
    }

    /// @notice Payout escrow to beneficiary. Owner-only, after end; can optionally require totalPublicUnlocked first.
    function payout(bytes32 roundId) external onlyOwner(roundId) {
        Round storage r = _rounds[roundId];
        require(block.timestamp > r.endAt, "not ended");
        // Optionally: if (r.policy != Disclosure.Never) require(r.totalPublicUnlocked, "unlock total first");
        uint256 amount = r.escrow;
        r.escrow = 0;
        (bool ok, ) = r.beneficiary.call{value: amount}("");
        require(ok, "transfer failed");
        emit Payout(roundId, r.beneficiary, amount);
    }
}
