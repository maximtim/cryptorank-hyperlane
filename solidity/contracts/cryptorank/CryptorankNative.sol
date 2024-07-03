// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0;

import {TokenRouter} from "../token/libs/TokenRouter.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {TokenMessage} from "../token/libs/TokenMessage.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// возможно стоит переименовать, тк функционал был расширен
// НЕ поддерживает разные курсы
contract CryptorankNative is TokenRouter {
    using SafeERC20 for IERC20;

    struct RouteConfig {
        // можно посжимать через struct packing
        uint256 minAmount; // мин. сумма бриджа
        uint256 maxAmount; // макс. сумма бриджа
        uint256 minCommission; // мин. комиссия за бридж
        uint256 maxCommission; // макс. комиссия за бридж
        uint256 stepFirst; // см. график
        uint256 stepCommission;
        uint256 stepAmount;
        uint256 decimalsUnitSrc; // 10**decimals токена в этой сети
        uint256 decimalsUnitDst; // 10**decimals токена в сети назначения
    }
    error NoTokenRoute();
    error AmountTooLow();
    error AmountTooHigh(); // можно добавить аргументы

    event Deposit(address indexed sender, uint256 amount);
    event ReferralBridge(string referral, address sender, uint256 amount); // можно добавить tokenSrc и tokenDst

    // address(0) = native token
    mapping(address tokenSrc => mapping(uint32 destChainId => mapping(address tokenDst => RouteConfig)))
        public tokenRoutes;

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
            // мб доставать decimals динамически
        }
    }

    function transferRemote(
        uint32 _destination,
        address _tokenSrc,
        address _tokenDst,
        bytes32 _recipient,
        uint256 _amount,
        string calldata _referral
    ) public payable returns (bytes32 messageId) {
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

    // оверрайднул эту функцию, чтобы все публичные функции бриджа брали комиссию (в базовой этого нет)
    // собирался ее убрать. для этого надо убрать эту функцию из TokenRouter, и поправить остальные его контракты-наследники
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

    // функция из абстрактного базового класса, можно ее выпилить, убрав из базового
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
     * @dev Sends `_amount` of token to `_recipient` balance.
     * @inheritdoc TokenRouter
     */
    function _transferTo(
        address _recipient,
        uint256 _amount,
        bytes calldata metadata // адрес токена хранится здесь
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
        // скопировал в мемори, тк будут использоваться все значения
        RouteConfig memory routeConfig_ = tokenRoutes[_tokenSrc][_destination][
            _tokenDst
        ];

        // проверка на существование конфига для данного роута (мб изменить)
        if (routeConfig_.decimalsUnitSrc == 0) revert NoTokenRoute();

        // возможно стоит добавить больше ограничений
        if (_amount > routeConfig_.maxAmount) revert AmountTooHigh();
        if (_amount < routeConfig_.minAmount) revert AmountTooLow();

        uint256 commission_ = _calcCommission(_amount, routeConfig_);
        uint256 nativeCommission_ = 0;

        // комиссию берем с того токена, который бриджится (иначе придется переводить по курсу)
        if (_tokenSrc == address(0)) {
            nativeCommission_ = _amount + commission_;
        } else {
            IERC20(_tokenSrc).safeTransferFrom(
                msg.sender,
                address(this),
                _amount + commission_
            );
        }

        messageId = _dispatch(
            _destination,
            _msgValue - nativeCommission_,
            TokenMessage.format(
                _recipient,
                (_amount * routeConfig_.decimalsUnitDst) /
                    routeConfig_.decimalsUnitSrc, // учитываем разные decimals у токенов
                abi.encodePacked(_tokenDst) // токен в сети назначения. чтобы не усложнять логику, засунул его в метаданные сообщения
            )
        );

        emit SentTransferRemote(_destination, _recipient, _amount);
    }

    function _calcCommission(
        uint256 _amount,
        RouteConfig memory _routeConfig
    ) private pure returns (uint256 commission_) {
        if (_amount < _routeConfig.stepFirst) return _routeConfig.minCommission;

        // не хватает проверки на 0, и мб других проверок
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
