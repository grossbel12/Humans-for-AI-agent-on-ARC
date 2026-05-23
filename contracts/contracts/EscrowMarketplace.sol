// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract EscrowMarketplace is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum TaskStatus {
        Open,
        InProgress,
        ProofSubmitted,
        Completed,
        Disputed,
        Cancelled,
        AutoReleased
    }

    struct Task {
        uint256 id;
        address employer;
        address executor;
        uint256 amount;
        uint256 deadline;
        TaskStatus status;
        bytes32 taskHash;
        bytes32 proofHash;
        uint256 createdAt;
        uint256 completedAt;
    }

    IERC20 public immutable usdc;
    address public feeRecipient;
    uint256 public protocolFeeBps = 500;
    uint256 public nextTaskId = 1;

    mapping(uint256 => Task) public tasks;
    mapping(address => uint256) public reputation;

    event TaskCreated(uint256 indexed taskId, address indexed employer, address indexed executor, uint256 amount, uint256 deadline, bytes32 taskHash);
    event TaskAccepted(uint256 indexed taskId, address indexed executor);
    event ProofSubmitted(uint256 indexed taskId, bytes32 proofHash);
    event TaskCompleted(uint256 indexed taskId, uint256 executorAmount, uint256 feeAmount);
    event DisputeOpened(uint256 indexed taskId);
    event DisputeResolved(uint256 indexed taskId, bool favorExecutor);
    event TaskCancelled(uint256 indexed taskId);
    event TaskAutoReleased(uint256 indexed taskId);
    event FeeRecipientUpdated(address indexed feeRecipient);
    event ProtocolFeeUpdated(uint256 protocolFeeBps);

    error InvalidAddress();
    error InvalidAmount();
    error InvalidDeadline();
    error InvalidStatus();
    error NotEmployer();
    error NotExecutor();
    error TooEarly();

    constructor(address usdc_, address feeRecipient_) Ownable(msg.sender) {
        if (usdc_ == address(0) || feeRecipient_ == address(0)) revert InvalidAddress();
        usdc = IERC20(usdc_);
        feeRecipient = feeRecipient_;
    }

    function createTask(address executor, uint256 amount, uint256 deadline, bytes32 taskHash)
        external
        nonReentrant
        returns (uint256 taskId)
    {
        if (executor == address(0) || executor == msg.sender) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (deadline < block.timestamp + 1 hours) revert InvalidDeadline();

        taskId = nextTaskId++;
        tasks[taskId] = Task({
            id: taskId,
            employer: msg.sender,
            executor: executor,
            amount: amount,
            deadline: deadline,
            status: TaskStatus.Open,
            taskHash: taskHash,
            proofHash: bytes32(0),
            createdAt: block.timestamp,
            completedAt: 0
        });

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        emit TaskCreated(taskId, msg.sender, executor, amount, deadline, taskHash);
    }

    function acceptTask(uint256 taskId) external {
        Task storage task = tasks[taskId];
        if (task.status != TaskStatus.Open) revert InvalidStatus();
        if (msg.sender != task.executor) revert NotExecutor();
        task.status = TaskStatus.InProgress;
        emit TaskAccepted(taskId, msg.sender);
    }

    function submitProof(uint256 taskId, bytes32 proofHash) external {
        Task storage task = tasks[taskId];
        if (task.status != TaskStatus.InProgress) revert InvalidStatus();
        if (msg.sender != task.executor) revert NotExecutor();
        task.proofHash = proofHash;
        task.status = TaskStatus.ProofSubmitted;
        emit ProofSubmitted(taskId, proofHash);
    }

    function confirmCompletion(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.status != TaskStatus.ProofSubmitted) revert InvalidStatus();
        if (msg.sender != task.employer) revert NotEmployer();
        _payExecutor(taskId, task);
        emit TaskCompleted(taskId, _executorAmount(task.amount), _feeAmount(task.amount));
    }

    function openDispute(uint256 taskId) external {
        Task storage task = tasks[taskId];
        if (task.status != TaskStatus.ProofSubmitted) revert InvalidStatus();
        if (msg.sender != task.employer) revert NotEmployer();
        task.status = TaskStatus.Disputed;
        emit DisputeOpened(taskId);
    }

    function resolveDispute(uint256 taskId, bool favorExecutor) external onlyOwner nonReentrant {
        Task storage task = tasks[taskId];
        if (task.status != TaskStatus.Disputed) revert InvalidStatus();
        task.completedAt = block.timestamp;
        if (favorExecutor) {
            task.status = TaskStatus.Completed;
            _transferSplit(task.executor, task.amount);
            reputation[task.executor] += 10;
        } else {
            task.status = TaskStatus.Cancelled;
            usdc.safeTransfer(task.employer, task.amount);
        }
        emit DisputeResolved(taskId, favorExecutor);
    }

    function autoRelease(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.status != TaskStatus.ProofSubmitted) revert InvalidStatus();
        if (block.timestamp < task.deadline + 24 hours) revert TooEarly();
        _payExecutor(taskId, task);
        task.status = TaskStatus.AutoReleased;
        emit TaskAutoReleased(taskId);
    }

    function cancelOpenTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.status != TaskStatus.Open) revert InvalidStatus();
        if (msg.sender != task.employer) revert NotEmployer();
        task.status = TaskStatus.Cancelled;
        task.completedAt = block.timestamp;
        usdc.safeTransfer(task.employer, task.amount);
        emit TaskCancelled(taskId);
    }

    function setFeeRecipient(address nextFeeRecipient) external onlyOwner {
        if (nextFeeRecipient == address(0)) revert InvalidAddress();
        feeRecipient = nextFeeRecipient;
        emit FeeRecipientUpdated(nextFeeRecipient);
    }

    function setProtocolFeeBps(uint256 nextFeeBps) external onlyOwner {
        require(nextFeeBps <= 1_000, "fee too high");
        protocolFeeBps = nextFeeBps;
        emit ProtocolFeeUpdated(nextFeeBps);
    }

    function _payExecutor(uint256, Task storage task) internal {
        task.status = TaskStatus.Completed;
        task.completedAt = block.timestamp;
        reputation[task.executor] += 10;
        _transferSplit(task.executor, task.amount);
    }

    function _transferSplit(address executor, uint256 amount) internal {
        uint256 fee = _feeAmount(amount);
        uint256 payout = amount - fee;
        usdc.safeTransfer(executor, payout);
        usdc.safeTransfer(feeRecipient, fee);
    }

    function _feeAmount(uint256 amount) internal view returns (uint256) {
        return (amount * protocolFeeBps) / 10_000;
    }

    function _executorAmount(uint256 amount) internal view returns (uint256) {
        return amount - _feeAmount(amount);
    }
}
