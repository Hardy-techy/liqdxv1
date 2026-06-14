// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IMorpho {
    struct MarketParams {
        address loanToken;
        address collateralToken;
        address oracle;
        address irm;
        uint256 lltv;
    }
    function supply(MarketParams memory marketParams, uint256 assets, uint256 shares, address onBehalf, bytes memory data) external returns (uint256, uint256);
    function withdraw(MarketParams memory marketParams, uint256 assets, uint256 shares, address onBehalf, address receiver) external returns (uint256, uint256);
    function createMarket(MarketParams memory marketParams) external;
}

contract MockOracle {
    function price() external pure returns (uint256) {
        return 6000 * 10**36; 
    }
}

/**
 * @title PrivateMorphoVault
 * @dev Simple whitelist-protected vault that funnels deposits directly into an isolated Morpho Blue market.
 */
contract PrivateMorphoVault {
    address public owner;
    mapping(address => bool) public isWhitelisted;

    IERC20 public asset;
    IMorpho public morpho;
    IMorpho.MarketParams public marketParams;
    address public mockOracle;

    // Simple shares mapping
    mapping(address => uint256) public shares;
    uint256 public totalShares;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyWhitelisted() {
        require(isWhitelisted[msg.sender], "Not whitelisted");
        _;
    }

    constructor(address _asset, address _morpho, address _weth, address _irm, uint256 _lltv) {
        owner = msg.sender;
        asset = IERC20(_asset);
        morpho = IMorpho(_morpho);

        mockOracle = address(new MockOracle());

        marketParams = IMorpho.MarketParams({
            loanToken: _asset,
            collateralToken: _weth,
            oracle: mockOracle,
            irm: _irm,
            lltv: _lltv
        });

        // Initialize market
        morpho.createMarket(marketParams);

        // Infinite approve Morpho
        asset.approve(_morpho, type(uint256).max);
    }

    function addToWhitelist(address user) external onlyOwner {
        isWhitelisted[user] = true;
    }

    function deposit(uint256 assets, address receiver) external onlyWhitelisted returns (uint256 newShares) {
        require(assets > 0, "Zero deposit");
        
        // Pull assets from user
        require(asset.transferFrom(msg.sender, address(this), assets), "Transfer failed");

        // Calculate shares to mint
        // Note: For a real vault, you'd check the exact totalAssets via Morpho's position
        // Since we are isolating the market and just wrapping it, we can just proxy 1:1 if it's the only supplier
        // To be accurate, we just supply to Morpho and see how many Morpho shares we got.
        (uint256 suppliedAssets, uint256 suppliedShares) = morpho.supply(marketParams, assets, 0, address(this), "");
        
        // Mint Vault shares directly equal to Morpho shares
        newShares = suppliedShares;
        shares[receiver] += newShares;
        totalShares += newShares;
    }

    function withdraw(uint256 withdrawShares, address receiver) external onlyWhitelisted returns (uint256 assetsReturned) {
        require(withdrawShares > 0 && shares[msg.sender] >= withdrawShares, "Invalid shares");
        
        shares[msg.sender] -= withdrawShares;
        totalShares -= withdrawShares;

        // Withdraw from Morpho using shares
        (assetsReturned, ) = morpho.withdraw(marketParams, 0, withdrawShares, address(this), receiver);
    }

    function withdrawAssets(uint256 assetsToWithdraw, address receiver) external onlyWhitelisted returns (uint256 sharesBurned) {
        require(assetsToWithdraw > 0, "Invalid assets");
        
        // Withdraw from Morpho using assets
        (, sharesBurned) = morpho.withdraw(marketParams, assetsToWithdraw, 0, address(this), receiver);
        
        require(shares[msg.sender] >= sharesBurned, "Insufficient shares");
        shares[msg.sender] -= sharesBurned;
        totalShares -= sharesBurned;
    }
}
