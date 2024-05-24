// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0;

import {TokenRouter} from "../token/libs/TokenRouter.sol";

import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";

contract CryptorankNFT is ERC721EnumerableUpgradeable, TokenRouter {
    error InsufficientPayment(uint256 fee, uint256 value);

    event ReferralMint(string referral, address sender, uint256 count);
    event ReferralBridge(string referral, address sender);

    string public baseUri;
    uint256 public fee;
    uint256 public nextMintId;

    mapping(uint256 => uint256) visited; // 0x164 = 356

    constructor(address _mailbox) TokenRouter(_mailbox) {}

    function initialize(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        uint256 chainId_,
        uint256 fee_,
        address owner_
    ) external initializer {
        _MailboxClient_initialize(address(0), address(0), owner_);
        __ERC721_init(name_, symbol_);
        fee = fee_;
        baseUri = baseURI_;

        uint256 id = chainId_ * 10 ** 7 + 1;
        nextMintId = id + 1;
        _safeMint(owner_, id);
    }

    function setBaseUri(string calldata baseUri_) external onlyOwner {
        baseUri = baseUri_;
    }

    function setFee(uint256 fee_) external onlyOwner {
        fee = fee_;
    }

    function mint(string calldata referral) external payable {
        if (msg.value < fee) revert InsufficientPayment(fee, msg.value);

        uint newId = nextMintId;
        nextMintId++;

        _safeMint(msg.sender, newId);
        emit ReferralMint(referral, msg.sender, 1);
    }

    function mintBatch(
        uint256 count,
        string calldata referral
    ) external payable {
        uint256 totalFee = fee * count;
        if (msg.value < totalFee)
            revert InsufficientPayment(totalFee, msg.value);

        uint newId = nextMintId;

        for (uint i = 0; i < count; i++) {
            _safeMint(msg.sender, newId + i);
        }

        nextMintId += count;
        emit ReferralMint(referral, msg.sender, count);
    }

    function withdraw() public onlyOwner {
        (bool success, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(success);
    }

    function balanceOf(
        address _account
    )
        public
        view
        virtual
        override(TokenRouter, ERC721Upgradeable, IERC721Upgradeable)
        returns (uint256)
    {
        return ERC721Upgradeable.balanceOf(_account);
    }

    /**
     * @notice Transfers `_amountOrId` token to `_recipient` on `_destination` domain.
     * @dev Delegates transfer logic to `_transferFromSender` implementation.
     * @dev Emits `SentTransferRemote` event on the origin chain.
     * @param _destination The identifier of the destination chain.
     * @param _recipient The address of the recipient on the destination chain.
     * @param _amountOrId The amount or identifier of tokens to be sent to the remote recipient.
     * @param _referral Referral which brought sender for operation
     * @return messageId The identifier of the dispatched message.
     */
    function transferRemote(
        uint32 _destination,
        bytes32 _recipient,
        uint256 _amountOrId,
        string calldata _referral
    ) external payable virtual returns (bytes32 messageId) {
        emit ReferralBridge(_referral, msg.sender);
        return
            _transferRemote(
                _destination,
                _recipient,
                _amountOrId,
                msg.value,
                bytes(""),
                address(0)
            );
    }

    /**
     * @dev Asserts `msg.sender` is owner and burns `_tokenId`.
     * @inheritdoc TokenRouter
     */
    function _transferFromSender(
        uint256 _tokenId
    ) internal virtual override returns (bytes memory) {
        require(ownerOf(_tokenId) == msg.sender, "!owner");
        _burn(_tokenId);
        return bytes(""); // no metadata
    }

    /**
     * @dev Mints `_tokenId` to `_recipient`.
     * @inheritdoc TokenRouter
     */
    function _transferTo(
        address _recipient,
        uint256 _tokenId,
        bytes calldata // no metadata
    ) internal virtual override {
        _safeMint(_recipient, _tokenId);
    }

    function _safeMint(address to, uint256 tokenId) internal override {
        visited[tokenId]++;
        super._safeMint(to, tokenId, "");
    }

    function _baseURI() internal view override returns (string memory) {
        return baseUri;
    }
}
