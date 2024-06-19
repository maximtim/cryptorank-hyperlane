// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0;

import {TokenRouter} from "../token/libs/TokenRouter.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

contract CryptorankNative is TokenRouter {
    error InsufficientPayment(uint256 fee, uint256 value);
    error AmountExceeded(uint256 limit, uint256 amount);

    event Deposit(address indexed sender, uint256 amount);
    event ReferralBridge(string referral, address sender, uint256 amount);

    uint256 public constant DECIMALS_UNIT = 10 ** 18;

    /// @notice Fee per 1 token (with decimals)
    uint256 public bridgeFee;
    uint256 public bridgeLimit;

    constructor(address _mailbox) TokenRouter(_mailbox) {}

    function initialize(
        address _owner,
        uint256 _bridgeFee,
        uint256 _bridgeLimit
    ) public initializer {
        _MailboxClient_initialize(address(0), address(0), _owner);
        bridgeFee = _bridgeFee;
        bridgeLimit = _bridgeLimit;
    }

    function transferRemote(
        uint32 _destination,
        bytes32 _recipient,
        uint256 _amount,
        string calldata _referral
    ) public payable virtual returns (bytes32 messageId) {
        emit ReferralBridge(_referral, msg.sender, _amount);
        return _transferRemoteNative(_destination, _recipient, _amount);
    }

    function transferRemote(
        uint32 _destination,
        bytes32 _recipient,
        uint256 _amount
    ) public payable virtual override returns (bytes32 messageId) {
        return _transferRemoteNative(_destination, _recipient, _amount);
    }

    function _transferRemoteNative(
        uint32 _destination,
        bytes32 _recipient,
        uint256 _amount
    ) private returns (bytes32 messageId) {
        uint256 totalFee_ = (bridgeFee * _amount) / DECIMALS_UNIT;
        uint256 required = _amount + totalFee_;

        if (_amount > bridgeLimit) revert AmountExceeded(bridgeLimit, _amount);
        if (msg.value < required)
            revert InsufficientPayment(required, msg.value);

        uint256 gasPayment = msg.value - required;

        return
            _transferRemote(
                _destination,
                _recipient,
                _amount,
                gasPayment,
                bytes(""),
                address(0)
            );
    }

    function withdraw() public onlyOwner {
        (bool success, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(success);
    }

    function balanceOf(
        address _account
    ) external view override returns (uint256) {
        return _account.balance;
    }

    /**
     * @inheritdoc TokenRouter
     * @dev No-op because native amount is transferred in `msg.value`
     * @dev Compiler will not include this in the bytecode.
     */
    function _transferFromSender(
        uint256
    ) internal pure override returns (bytes memory) {
        return bytes(""); // no metadata
    }

    /**
     * @dev Sends `_amount` of native token to `_recipient` balance.
     * @inheritdoc TokenRouter
     */
    function _transferTo(
        address _recipient,
        uint256 _amount,
        bytes calldata // no metadata
    ) internal virtual override {
        Address.sendValue(payable(_recipient), _amount);
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }
}
