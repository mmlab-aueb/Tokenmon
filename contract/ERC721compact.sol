// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

/**
 * @dev A standard for detecting smart contract interfaces.
 * See: https://eips.ethereum.org/EIPS/eip-165.
 */
interface ERC165
{

    /**
     * @dev Checks if the smart contract includes a specific interface.
     * @notice This function uses less than 30,000 gas.
     * @param _interfaceID The interface identifier, as specified in ERC-165.
     * @return True if _interfaceID is supported, false otherwise.
     */
    function supportsInterface( bytes4 _interfaceID ) external view returns (bool);

}

/**
 * @dev Implementation of standard for detect smart contract interfaces.
 */
contract SupportsInterface is ERC165 {

    /**
     * @dev Mapping of supported intefraces.
     * @notice You must not set element 0xffffffff to true.
     */
    mapping(bytes4 => bool) internal supportedInterfaces;

    /**
     * @dev Contract constructor.
     */
    constructor() public
    {
        supportedInterfaces[0x01ffc9a7] = true; // ERC165
    }

    /**
     * @dev Function to check which interfaces are suported by this contract.
     * @param _interfaceID Id of the interface.
     * @return True if _interfaceID is supported, false otherwise.
     */
    function supportsInterface(bytes4 _interfaceID) external override view returns (bool)
    {
        return supportedInterfaces[_interfaceID];
    }

}

// checks if an address is a contract
library Address {

    function isContract(address account) internal view returns (bool) {
        // According to EIP-1052, 0x0 is the value returned for not-yet created accounts
        // and 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470 is returned
        // for accounts without code, i.e. `keccak256('')`
        bytes32 codehash;
        bytes32 accountHash = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;
        // solhint-disable-next-line no-inline-assembly
        assembly { codehash := extcodehash(account) }
        return (codehash != 0x0 && codehash != accountHash);
    }

}

library SafeMath {

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
           return 0;
       }

        uint256 c = a * b;
        assert(c / a == b);
        return c;
    }

    function div (uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0);
        uint256 c = a / b;
        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        assert(b <= a);
        uint256 c = a - b;
        return c;
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }

}

contract ERC721Token is SupportsInterface{

    constructor() public {

        supportedInterfaces[0x80ac58cd] = true; // ERC721 Interface

    }

    using SafeMath for uint256;
    using Address for address;

    // a mapping from token id to the owner address
    mapping (uint256 => address) internal idToOwner;

    // a mapping from token id to the approved address
    mapping (uint256 => address) internal idToApproval;

    // a mapping from owner address to count of his token
    mapping (address => uint256) private ownerToTokenCount;

    // a mapping from owner addresses to mapping of operator addresses
    mapping (address => mapping (address => bool)) internal ownerToOperators;

    // Magic value of a smart contract that can receive ERC721 tokens
    // Equals to `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
    bytes4 internal constant MAGIC_ON_ERC721_RECEIVED = 0x150b7a02;


    // emits when ownership of a token changes
    event Transfer(
        address indexed _from,
        address indexed _to,
        uint256 indexed _tokenId
    );

    // emits when approved address for a token is changed
    event Approval(
       address indexed _owner,
       address indexed _approved,
       uint256 indexed _tokenId
    );

    // emits when an operator is enabled or disabled for an owner
   // event ApprovalForAll(
    //    address indexed _owner,
     //   address indexed _operator,
     //   bool _approved
    //);

    //checks that msg.sender is allowed to transfer NFT
    modifier canTransfer(uint256 _tokenId) {
        address tokenOwner = idToOwner[_tokenId];
        require( tokenOwner == msg.sender || idToApproval[_tokenId] == msg.sender
            || ownerToOperators[tokenOwner][msg.sender]);
        _;
    }

    //checks that token id is valid token
    modifier validToken(uint256 _tokenId) {
        require(idToOwner[_tokenId] != address(0));
        _;
    }

    // counts all tokens assigned to an owner
    function balanceOf(address owner) external view returns (uint256){
        require(owner != address(0));
        return ownerToTokenCount[owner];
    }

    // finds the owner of a token
    function ownerOf(uint256 _tokenId) external view returns (address) {
        address owner = idToOwner[_tokenId];
        //require(owner != address(0));
        return owner;
    }

    // transfers the ownership of a token from one address to another
    //function safeTransferFrom(address _from, address _to, uint256 _tokenId) external payable;

    // transfers the ownership of a token from one address to another
    // the caller is responsible to confirm that _to is capable of receiving tokens or else the token may be permanently lost
    function transferFrom(address _from, address _to, uint256 _tokenId) external payable canTransfer(_tokenId) validToken(_tokenId) {
        address tokenOwner = idToOwner[_tokenId];
        require(tokenOwner == _from);
        require(_to != address(0));

        //clear approval for token
        if (idToApproval[_tokenId] != address(0))
        {
            delete idToApproval[_tokenId];
        }

        //remove token from old owner
        ownerToTokenCount[_from] = ownerToTokenCount[_from] - 1;
        delete idToOwner[_tokenId];

        //add token to new owner
        require(idToOwner[_tokenId] == address(0));
        idToOwner[_tokenId] = _to;
        ownerToTokenCount[_to] = ownerToTokenCount[_to].add(1);

        emit Transfer(_from, _to, _tokenId);
    }

    //mints a new token
    function mint(address _to, uint256 _tokenId) internal {
        require(_to != address(0));
        require(idToOwner[_tokenId] == address(0));

        //add token
        idToOwner[_tokenId] = _to;
        ownerToTokenCount[_to] = ownerToTokenCount[_to].add(1);

        emit Transfer(address(0), _to, _tokenId);
    }

    //burns a token
    function burn(uint256 _tokenId) internal virtual validToken(_tokenId) {
        address tokenOwner = idToOwner[_tokenId];

        //clear approval
        if (idToApproval[_tokenId] != address(0))
        {
            delete idToApproval[_tokenId];
        }

        //remove token from old owner
        ownerToTokenCount[tokenOwner] = ownerToTokenCount[tokenOwner] - 1;
        delete idToOwner[_tokenId];

        emit Transfer(tokenOwner, address(0), _tokenId);
    }

    // sets the approved address for a token
    function approve(address _approved, uint256 _tokenId) external {
        address tokenOwner = idToOwner[_tokenId];
        require(_approved != tokenOwner);

        require(msg.sender == tokenOwner);

        idToApproval[_tokenId] = _approved;
        emit Approval(tokenOwner, _approved, _tokenId);
    }

    // enable or disable approval for an operator to manage all of 'msg.sender tokens
    //function setApprovalForAll(address _operator, bool _approved) external;

    // returns the approved address for a token
     function getApproved(uint256 _tokenId) external view returns (address) {
       
        return idToApproval[_tokenId];
    }

    // returns if an address is an authorized operator for another address
    //function isApprovedForAll(address _owner, address _operator) external view returns (bool);

}

contract ERC721Metadata is ERC721Token {

    string internal tokenName;
    string internal tokenSymbol;
    address private contractOwner;

    //mapping from token id to metadata uri
    mapping (uint256 => string) internal idToUri;

    constructor (string memory name, string memory symbol) public {
        tokenName = name;
        tokenSymbol = symbol;
        contractOwner = msg.sender;
        supportedInterfaces[0x5b5e139f] = true; //ERC721Metadata Interface
    }

    function getName() external view returns (string memory) {
       return tokenName;
    }

    function getSymbol() external view returns (string memory ) {
        return tokenSymbol;
    }

    function setTokenUri (uint256 _tokenId, string memory _uri) internal validToken(_tokenId) {
        idToUri[_tokenId] = _uri;
    }

    function getTokenURI(uint256 _tokenId) external view validToken(_tokenId) returns (string memory) {
        return idToUri[_tokenId];
    }

    function burn (uint256 _tokenId) internal override {
        super.burn(_tokenId);
        if (bytes(idToUri[_tokenId]).length !=0) {
            delete idToUri[_tokenId];
        }
    }
	
	function burn1 (uint256 _tokenId) external {
        require(msg.sender == contractOwner);
        burn(_tokenId);
    }
    
    function mint (address _to, uint256 _tokenId, string memory uri) public  {
        require(msg.sender == contractOwner);
        super.mint(_to, _tokenId);
        setTokenUri(_tokenId, uri);
    }
}
