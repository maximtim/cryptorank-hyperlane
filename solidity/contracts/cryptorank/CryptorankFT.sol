// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0;

import {TokenRouter} from "../token/libs/TokenRouter.sol";

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract CryptorankFT is ERC20Upgradeable, TokenRouter {
    error InsufficientPayment(uint256 fee, uint256 value);

    event ReferralMint(string referral, address sender, uint256 amount);
    event ReferralBridge(string referral, address sender, uint256 amount);

    uint8 private immutable _decimals;

    /// @notice Fee per 1 token (with decimals)
    uint256 public mintFee;
    uint256 public bridgeFee;
    mapping(address => bool) public visited;

    constructor(uint8 __decimals, address _mailbox) TokenRouter(_mailbox) {
        _decimals = __decimals;
    }

    /**
     * @notice Initializes the Hyperlane router, ERC20 metadata, and mints initial supply to owner.
     * @param _initialSupply The initial supply of the token.
     * @param _name The name of the token.
     * @param _symbol The symbol of the token.
     */
    function initialize(
        uint256 _initialSupply,
        string memory _name,
        string memory _symbol,
        uint256 _mintFee,
        uint256 _bridgeFee,
        address _owner
    ) external initializer {
        // Initialize ERC20 metadata
        _MailboxClient_initialize(address(0), address(0), _owner);
        __ERC20_init(_name, _symbol);
        mintFee = _mintFee;
        bridgeFee = _bridgeFee;

        _mint(_owner, _initialSupply);
    }

    function setFees(uint256 _mintFee, uint256 _bridgeFee) external onlyOwner {
        mintFee = _mintFee;
        bridgeFee = _bridgeFee;
    }

    function mint(string calldata _referral, uint256 _amount) external payable {
        uint256 totalFee_ = (mintFee * _amount) / _decimals;
        if (msg.value < totalFee_)
            revert InsufficientPayment(totalFee_, msg.value);

        _mint(msg.sender, _amount);
        emit ReferralMint(_referral, msg.sender, _amount);
    }

    /**
     * @notice Transfers `_amount` of tokens to `_recipient` on `_destination` domain.
     * @dev Delegates transfer logic to `_transferFromSender` implementation.
     * @dev Emits `SentTransferRemote` event on the origin chain.
     * @param _destination The identifier of the destination chain.
     * @param _recipient The address of the recipient on the destination chain.
     * @param _amount The amount of tokens to be sent to the remote recipient.
     * @param _referral Referral which brought sender for operation
     * @return messageId The identifier of the dispatched message.
     */
    function transferRemote(
        uint32 _destination,
        bytes32 _recipient,
        uint256 _amount,
        string calldata _referral
    ) external payable virtual returns (bytes32 messageId) {
        emit ReferralBridge(_referral, msg.sender, _amount);
        return
            _transferRemote(
                _destination,
                _recipient,
                _amount,
                msg.value - bridgeFee,
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

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function balanceOf(
        address _account
    )
        public
        view
        virtual
        override(TokenRouter, ERC20Upgradeable)
        returns (uint256)
    {
        return ERC20Upgradeable.balanceOf(_account);
    }

    function _mint(
        address _account,
        uint256 _amount
    ) internal virtual override {
        if (visited[_account] == false) visited[_account] = true;
        super._mint(_account, _amount);
    }

    /**
     * @dev Burns `_amount` of token from `msg.sender` balance.
     * @inheritdoc TokenRouter
     */
    function _transferFromSender(
        uint256 _amount
    ) internal override returns (bytes memory) {
        _burn(msg.sender, _amount);
        return bytes(""); // no metadata
    }

    /**
     * @dev Mints `_amount` of token to `_recipient` balance.
     * @inheritdoc TokenRouter
     */
    function _transferTo(
        address _recipient,
        uint256 _amount,
        bytes calldata // no metadata
    ) internal virtual override {
        _mint(_recipient, _amount);
    }
}
