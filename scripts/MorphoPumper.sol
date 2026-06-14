// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMorpho {
    struct MarketParams {
        address loanToken;
        address collateralToken;
        address oracle;
        address irm;
        uint256 lltv;
    }
    function supply(MarketParams memory marketParams, uint256 assets, uint256 shares, address onBehalf, bytes memory data) external returns (uint256, uint256);
    function supplyCollateral(MarketParams memory marketParams, uint256 assets, address onBehalf, bytes memory data) external;
    function borrow(MarketParams memory marketParams, uint256 assets, uint256 shares, address onBehalf, address receiver) external returns (uint256, uint256);
}

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract MorphoPumper {
    address public constant MORPHO_BLUE = 0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb;
    address public constant USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    address public constant WETH = 0x4200000000000000000000000000000000000006;
    address public constant ADAPTIVE_CURVE_IRM = 0x46415998764C29aB2a25CbeA6254146D50D22687;

    /**
     * @notice Supplies USDC, Supplies WETH Collateral, and Borrows USDC in ONE click!
     * @param oracle The MockOracle address you created in MorphoSetup
     * @param usdcSupplyAmount Amount of USDC to supply to the market
     * @param wethCollateralAmount Amount of WETH to use as collateral
     * @param usdcBorrowAmount Amount of USDC to borrow to pump the APY
     */
    function masterPump(
        address oracle,
        uint256 usdcSupplyAmount,
        uint256 wethCollateralAmount,
        uint256 usdcBorrowAmount
    ) external {
        IMorpho.MarketParams memory params = IMorpho.MarketParams({
            loanToken: USDC,
            collateralToken: WETH,
            oracle: oracle, 
            irm: ADAPTIVE_CURVE_IRM,
            lltv: 860000000000000000 
        });

        // 1. Pull USDC & WETH from you
        IERC20(USDC).transferFrom(msg.sender, address(this), usdcSupplyAmount);
        IERC20(WETH).transferFrom(msg.sender, address(this), wethCollateralAmount);
        
        // 2. Approve Morpho
        IERC20(USDC).approve(MORPHO_BLUE, usdcSupplyAmount);
        IERC20(WETH).approve(MORPHO_BLUE, wethCollateralAmount);
        
        // 3. Supply USDC (so there is liquidity to borrow!)
        IMorpho(MORPHO_BLUE).supply(params, usdcSupplyAmount, 0, msg.sender, "");

        // 4. Supply WETH as collateral
        IMorpho(MORPHO_BLUE).supplyCollateral(params, wethCollateralAmount, address(this), "");
        
        // 5. Borrow USDC (This generates the massive APY!)
        IMorpho(MORPHO_BLUE).borrow(params, usdcBorrowAmount, 0, address(this), msg.sender);
    }
}
