// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockOracle
 * @dev Hardcodes a price so we can borrow on testnet without Chainlink
 */
contract MockOracle {
    // Morpho expects the price of 1 unit of collateral in terms of 1 unit of loan token, scaled by 1e36
    // E.g., 1 WETH = 6000 USDC -> 6000 * 1e36
    function price() external pure returns (uint256) {
        return 6000 * 10**36; 
    }
}

interface IMorpho {
    struct MarketParams {
        address loanToken;
        address collateralToken;
        address oracle;
        address irm;
        uint256 lltv;
    }
    function createMarket(MarketParams memory marketParams) external;
    function supply(MarketParams memory marketParams, uint256 assets, uint256 shares, address onBehalf, bytes memory data) external returns (uint256, uint256);
    function supplyCollateral(MarketParams memory marketParams, uint256 assets, address onBehalf, bytes memory data) external;
    function borrow(MarketParams memory marketParams, uint256 assets, uint256 shares, address onBehalf, address receiver) external returns (uint256, uint256);
}

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

interface IVaultV2Factory {
    function createVault(
        address initialOwner,
        address asset,
        string memory name,
        string memory symbol
    ) external returns (address vault);
}

contract MorphoSetup {
    address public constant MORPHO_BLUE = 0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb;
    address public constant VAULT_V2_FACTORY = 0xE3a2CEbca662d99D0F279aF13a6bb8c9825D2ea0;
    
    address public constant USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    address public constant WETH = 0x4200000000000000000000000000000000000006;
    address public constant ADAPTIVE_CURVE_IRM = 0x46415998764C29aB2a25CbeA6254146D50D22687;
    
    address public mockOracle;
    address public newVault;
    bytes32 public newMarketId;

    IMorpho.MarketParams public params;

    function setupMarketAndVault() external {
        // 1. Deploy our fake oracle
        mockOracle = address(new MockOracle());

        // 2. Set up Market Params with 86% LLTV so borrowing is allowed!
        params = IMorpho.MarketParams({
            loanToken: USDC,
            collateralToken: WETH,
            oracle: mockOracle, 
            irm: ADAPTIVE_CURVE_IRM,
            lltv: 860000000000000000 // 86% LLTV (Whitelisted in Morpho)
        });

        // 3. Create Market on Morpho Blue
        IMorpho(MORPHO_BLUE).createMarket(params);
        
        newMarketId = keccak256(
            abi.encode(params.loanToken, params.collateralToken, params.oracle, params.irm, params.lltv)
        );

        // 4. Create Vault on the Vault V2 Factory (Using low-level call so it doesn't revert the market creation if it fails)
        (bool success, bytes memory returnData) = VAULT_V2_FACTORY.call(
            abi.encodeWithSignature("createVault(address,address,string,string)", msg.sender, USDC, "Arc Testnet Vault", "arcUSDC")
        );
        
        if (success && returnData.length > 0) {
            newVault = abi.decode(returnData, (address));
        } else {
            // Try MetaMorpho signature just in case
            (success, returnData) = VAULT_V2_FACTORY.call(
                abi.encodeWithSignature("createMetaMorpho(address,uint256,address,string,string,bytes32)", msg.sender, 0, USDC, "Arc Testnet Vault", "arcUSDC", bytes32(0))
            );
            if (success && returnData.length > 0) {
                newVault = abi.decode(returnData, (address));
            }
        }
    }

    /**
     * @notice ARTIFICIALLY PUMP THE APY
     * @dev Pulls WETH from you, supplies it as collateral, and borrows USDC to generate APY!
     * @param wethCollateralAmount Amount of WETH to use as collateral
     * @param usdcBorrowAmount Amount of USDC to borrow
     */
    function pumpAPY(uint256 wethCollateralAmount, uint256 usdcBorrowAmount) external {
        // 1. Pull WETH from you (You must approve this contract first!)
        IERC20(WETH).transferFrom(msg.sender, address(this), wethCollateralAmount);
        
        // 2. Approve Morpho to spend the WETH
        IERC20(WETH).approve(MORPHO_BLUE, wethCollateralAmount);
        
        // 3. Supply the WETH as collateral to Morpho
        IMorpho(MORPHO_BLUE).supplyCollateral(params, wethCollateralAmount, address(this), "");
        
        // 4. Borrow USDC from the market! (This generates the APY!)
        IMorpho(MORPHO_BLUE).borrow(params, usdcBorrowAmount, 0, address(this), msg.sender);
    }
}
