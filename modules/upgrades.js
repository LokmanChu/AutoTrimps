//MODULES["upgrades"] = {};
var upgradeList = ['Miners', 'Scientists', 'Coordination', 'Speedminer', 'Speedlumber', 'Speedfarming', 'Speedscience', 'Speedexplorer', 'Megaminer', 'Megalumber', 'Megafarming', 'Megascience', 'Efficiency', 'TrainTacular', 'Trainers', 'Explorers', 'Blockmaster', 'Battle', 'Bloodlust', 'Bounty', 'Egg', 'Anger', 'Formations', 'Dominance', 'Barrier', 'UberHut', 'UberHouse', 'UberMansion', 'UberHotel', 'UberResort', 'Trapstorm', 'Gigastation', 'Shieldblock', 'Potency', 'Magmamancers', 'Gymystic'];
var buyCoords = true;
var lastAmalSpamCell = -1;

//Buys all available non-equip upgrades listed in var upgradeList
function buyUpgrades(coordsOnly) {
    if (getPageSetting('BuyUpgradesNew') != 2){ //skip this calculation if AT isnt allowed to buy coords
        var popArmyRatio = trimpsRealMax/game.resources.trimps.getCurrentSend();
        buyCoords = true;
        
        if((getPageSetting('AutoStance')==1) && getPageSetting('DelayCoordsForWind')){
            if(!allowBuyingCoords){ //only buy coords if autostance1 allows it
                if(game.upgrades.Coordination.done < maxCoords)
                    buyCoords = true;
                else
                    buyCoords = false;

                var stackSpire = (game.global.world == 500) && ((getPageSetting('StackSpire4') == 1 && game.global.challengeActive == "Daily") || getPageSetting('StackSpire4') == 2) && (game.global.spireDeaths <= 5) && (game.global.challengeActive ? typeof game.global.dailyChallenge.bogged === 'undefined' : true);
                if (((isActiveSpireAT() || PRaidingActive) && !stackSpire) || game.global.world == getPageSetting('VoidMaps') || BWRaidNowLogic()) //always want all coords for active spires and void maps
                    buyCoords = true;
            }
        }

        if(AutoMapsCoordOverride) //we dont want to farm maps for damage when we have unspent coordinations, so allow automaps to override AS
            buyCoords = true;
        
        if(game.global.runningChallengeSquared)
            buyCoords = true;
        
        if(popArmyRatio < 1350){ //we're dangerously close to losing amalgamator
            var coordinationMult = 1+0.25*Math.pow(0.98, game.portal.Coordinated.level);
            var currentSendAfter = game.resources.trimps.getCurrentSend()*coordinationMult;
            var popArmyRatioAfter = trimpsRealMax/currentSendAfter;
            
            // if a goal is set, don't buy coords iff we have exactly as many amals as the goal
            if (popArmyRatioAfter <= 1001 && (getPageSetting('TillWeHaveAmalg') > 0 ?
                    game.jobs.Amalgamator.owned == getPageSetting('TillWeHaveAmalg') : game.jobs.Amalgamator.owned > 0) {
                var cellNum = (game.global.mapsActive) ? game.global.lastClearedMapCell + 1 : game.global.lastClearedCell + 1;
                if(lastAmalSpamCell != cellNum){
                    lastAmalSpamCell = cellNum;
                    debug("Skipping coordination to preserve Amalgamator!", "other");
                }
                buyCoords = false;
            }
        }
        
        var dontBuyStartZ = getPageSetting('NoCoordBuyStartZ');
        var expectedSpireRows = Math.floor((game.global.world - 1 - 100) / 100) * 10; //-1 to handle cases when we're in a spire
        var actualSpireRows = game.global.spireRows;
        var spiresSuccessfullyDoneFlag = actualSpireRows >= expectedSpireRows;

        if(dontBuyStartZ === game.global.world + 1)
            buyCoords = true;
        else if (dontBuyStartZ >= 0 && game.global.world > dontBuyStartZ && getPageSetting('TillWeHaveAmalg') > 0 && spiresSuccessfullyDoneFlag) { //if dontBuyStartZ is set and we've passed it, and also did not fail a spire
            if (game.jobs.Amalgamator.owned < getPageSetting('TillWeHaveAmalg'))
                buyCoords = false;
        }
        
        if (game.global.challengeActive === "Trapper") //no amalgamators in trapper
            buyCoords = true;
    }
    
    for (var upgrade in upgradeList) {
        upgrade = upgradeList[upgrade];
        var gameUpgrade = game.upgrades[upgrade];
        var available = (gameUpgrade.allowed > gameUpgrade.done && canAffordTwoLevel(gameUpgrade));
        if (upgrade == 'Coordination' && (getPageSetting('BuyUpgradesNew') == 2 || !canAffordCoordinationTrimps())) continue;
        if (upgrade == 'Shieldblock' && !getPageSetting('BuyShieldblock')) continue;
        if (upgrade == 'Gigastation' && (game.global.lastWarp ? game.buildings.Warpstation.owned < (Math.floor(game.upgrades.Gigastation.done * getPageSetting('DeltaGigastation')) + getPageSetting('FirstGigastation')) : game.buildings.Warpstation.owned < getPageSetting('FirstGigastation'))) continue;
        //skip bloodlust during scientist challenges and while we have autofight enabled.
        if (upgrade == 'Bloodlust' && game.global.challengeActive == 'Scientist') continue;

        if (!available) continue;
        if (game.upgrades.Scientists.done < game.upgrades.Scientists.allowed && upgrade != 'Scientists' && upgrade != 'Miners') continue;
        
        if (upgrade == 'Coordination'){
            if(buyCoords)
                buyUpgrade(upgrade, true, true);
            else
                continue;
        }
        else{
            buyUpgrade(upgrade, true, true);
            if(upgrade == "Battle") buildWorldArray(); //purchasing battle upgrade creates world grid, so add it
        }
        debug('Upgraded ' + upgrade, "upgrades", "*upload2");
    }
}
