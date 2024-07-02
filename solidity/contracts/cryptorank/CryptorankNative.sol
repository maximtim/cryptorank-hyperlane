// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0;

import {TokenRouter} from "../token/libs/TokenRouter.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {TokenMessage} from "../token/libs/TokenMessage.sol";
import {TypeCasts} from "../libs/TypeCasts.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract CryptorankNative is TokenRouter {
    using SafeERC20 for IERC20;

    struct RouteConfig {
        uint256 minAmount;
        uint256 maxAmount;
        uint256 minCommission;
        uint256 maxCommission;
        uint256 stepFirst;
        uint256 stepCommission;
        uint256 stepAmount;
        uint256 decimalsUnit;
    }
    error NoTokenRoute();
    error AmountTooLow();
    error AmountTooHigh();

    event Deposit(address indexed sender, uint256 amount);
    event ReferralBridge(string referral, address sender, uint256 amount);

    mapping(address => mapping(uint32 => mapping(address => RouteConfig))) tokenRoutes;

    constructor(address _mailbox) TokenRouter(_mailbox) {}

    function initialize(address _owner) public initializer {
        _MailboxClient_initialize(address(0), address(0), _owner);
    }

    function setRouteConfigs(
        address[] calldata _tokensSrc,
        address[] calldata _tokensDst,
        uint32[] calldata _destinations,
        RouteConfig[] calldata _routeConfigs
    ) external onlyOwner {
        uint256 length_ = _tokensSrc.length;
        for (uint256 i = 0; i < length_; i++) {
            tokenRoutes[_tokensSrc[i]][_destinations[i]][
                _tokensDst[i]
            ] = _routeConfigs[i];
        }
    }

    function transferRemote(
        uint32 _destination,
        address _tokenSrc,
        address _tokenDst,
        bytes32 _recipient,
        uint256 _amount,
        string calldata _referral
    ) public payable virtual returns (bytes32 messageId) {
        emit ReferralBridge(_referral, msg.sender, _amount);
        return
            _transferRemoteInternal(
                _destination,
                _tokenSrc,
                _tokenDst,
                _recipient,
                _amount,
                msg.value
            );
    }

    function transferRemote(
        uint32 _destination,
        bytes32 _recipient,
        uint256 _amount
    ) public payable virtual override returns (bytes32 messageId) {
        return
            _transferRemoteInternal(
                _destination,
                address(0),
                address(0),
                _recipient,
                _amount,
                msg.value
            );
    }

    function withdraw(uint256 _amount, address _token) public onlyOwner {
        _transferTo(msg.sender, _amount, _token);
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
        bytes calldata metadata
    ) internal virtual override {
        _transferTo(_recipient, _amount, address(uint160(bytes20(metadata))));
    }

    function _transferTo(
        address _recipient,
        uint256 _amount,
        address _token
    ) internal {
        if (_token == address(0)) {
            Address.sendValue(payable(_recipient), _amount);
        } else {
            IERC20(_token).safeTransfer(_recipient, _amount);
        }
    }

    /**
     * @notice Transfers `_amount` token to `_recipient` on `_destination` domain.
     * @dev Delegates transfer logic to `_transferFromSender` implementation.
     * @dev The metadata is the token metadata, and is DIFFERENT than the hook metadata.
     * @dev Emits `SentTransferRemote` event on the origin chain.
     * @param _destination The identifier of the destination chain.
     * @param _recipient The address of the recipient on the destination chain.
     * @param _amount The amount or identifier of tokens to be sent to the remote recipient.
     * @param _msgValue The amount of native token to pay for interchain gas.
     * @return messageId The identifier of the dispatched message.
     */
    function _transferRemoteInternal(
        uint32 _destination,
        address _tokenSrc,
        address _tokenDst,
        bytes32 _recipient,
        uint256 _amount,
        uint256 _msgValue
    ) internal returns (bytes32 messageId) {
        RouteConfig memory routeConfig_ = tokenRoutes[_tokenSrc][_destination][
            _tokenDst
        ];

        if (routeConfig_.decimalsUnit == 0) revert NoTokenRoute();
        if (_amount < routeConfig_.minAmount) revert AmountTooLow();
        if (_amount > routeConfig_.maxAmount) revert AmountTooHigh();

        uint256 commission_ = _calcCommission(_amount, routeConfig_);
        uint256 nativeCommission = 0;

        if (_tokenSrc == address(0)) {
            nativeCommission = _amount + commission_;
        } else {
            IERC20(_tokenSrc).safeTransferFrom(
                msg.sender,
                address(this),
                _amount + commission_
            );
        }

        messageId = _dispatch(
            _destination,
            _msgValue - nativeCommission,
            TokenMessage.format(
                _recipient,
                _amount,
                abi.encodePacked(_tokenDst)
            )
        );

        emit SentTransferRemote(_destination, _recipient, _amount);
    }

    function _calcCommission(
        uint256 _amount,
        RouteConfig memory _routeConfig
    ) private pure returns (uint256 commission_) {
        if (_amount < _routeConfig.stepFirst) return _routeConfig.minCommission;

        commission_ =
            ((_amount - _routeConfig.stepFirst) / _routeConfig.stepAmount + 1) *
            _routeConfig.stepCommission +
            _routeConfig.minCommission;

        if (commission_ > _routeConfig.maxCommission)
            return _routeConfig.maxCommission;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }
}
