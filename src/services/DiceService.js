import axios from 'axios';

class DiceService {

    static latestRollResult = null;

    static makeSkillCheck(skill, character, targetNumber) {
        const dice = this.prepareDicePool(skill);
        const results = this.rollDice(dice);
    
        if (character.states.twiceMiserable && 
            this.checkAndHandleAutoFailForTwiceMiserable(results, skill.isFavored, skill.name, character, targetNumber)) {
            return;
        }
    
        const skillModifier = this.handleFavoredAndIllFavored(results, skill);
        const skillName = skill.name + skillModifier;
    
        const totalSum = this.calculateTotalSum(results, character.states.twiceWeary);
        const success = this.determineSuccess(totalSum, targetNumber);
        const footer = this.generateFooter(character.conditions, character.states);
        
        // Mark max value dice (12 for d12, 6 for d6)
        results.forEach(r => {
            r.isMaxValue = (r.die === 12 && r.roll === 12) || (r.die === 6 && r.roll === 6);
            r.dropped = r.roll === 0; // Any dice with roll=0 were dropped by favored/ill-favored logic
        });

        // Create enhanced roll result object
        const rollResult = {
            characterName: character.name,
            // Original full skill name with modifier for backwards compatibility
            skillName: skillName,
            // New separate field for just the skill name without modifier
            baseSkillName: skill.name,
            total: totalSum,
            targetNumber: targetNumber,
            success: success,
            // Original symbols for backward compatibility
            diceSymbols: results.map(r => r.symbol),
            // Enhanced structured data for in-app display
            diceResults: results.map(r => ({
                type: r.die,       // 12 or 6
                value: r.roll,     // The actual number rolled (0 for dropped dice)
                symbol: r.symbol,  // Original symbol
                isMaxValue: (r.die === 12 && r.roll === 12) || (r.die === 6 && r.roll === 6),
                emoji: this.getDiceEmoji(r.die, r.roll === 0 ? r.originalRoll : r.roll),
                dropped: r.roll === 0, // Was this die dropped by favored/ill-favored logic
                displayValue: r.roll === 0 ? r.originalRoll : r.roll, // Use original value for display
                class: `df-d${r.die}-${r.roll === 0 ? r.originalRoll : r.roll}` // For dicefont
            })),
            favoredStatus: skill.isFavored ? 'favored' : (skill.isIllFavored ? 'ill-favored' : null),
            footer: footer,
            timestamp: Date.now()
        };
        
        // Store latest roll
        this.latestRollResult = rollResult;
    
        // Send to Discord as before
        this.sendRollResultsToServer(
            results.map(r => r.symbol), totalSum, success, skillName, footer,
            character.artUrls[0], targetNumber, character.name
        );
        
        return rollResult;
    }
    
    static getDiceEmoji(dieType, value) {
        if (dieType === 12) {
            if (value === 12) return '🌞';
            if (value === 11) return '💀';
        } else if (dieType === 6 && value === 6) {
            return '✨';
        }
        return null;
    }
    
    static getLatestRoll() {
        return this.latestRollResult;
    }

    static prepareDicePool(skill) {
        const dice = [{ sides: 12 }];

        if (skill.isFavored || skill.isIllFavored) {
        dice.push({ sides: 12 });
        }

        let totalD6 = skill.ranks + skill.diceMod;
        if (totalD6 < 0) totalD6 = 0;

        for (let i = 0; i < totalD6; i++) {
        dice.push({ sides: 6 });
        }

        return dice;
    }

    static rollDice(dice) {
        return dice.map(die => {
        const roll = Math.floor(Math.random() * die.sides) + 1;
        let symbol;
        if (die.sides === 12) {
            if (roll === 12) {
            symbol = '⭓12🌞';
            } else if (roll === 11) {
            symbol = '⭓11💀';
            } else {
            symbol = `⭓${roll}`;
            }
        } else if (die.sides === 6 && roll === 6) {
            symbol = `◽️6✨`;
        } else {
            symbol = `◽️${roll}`;
        }

        return { die: die.sides, roll: roll, symbol: symbol };
        });
    }

    static checkAndHandleAutoFailForTwiceMiserable(results, isFavored, skillName, character, targetNumber) {
        const d12Rolls = results.filter(r => r.die === 12).map(r => r.roll);
        const autoFail = isFavored 
            ? d12Rolls.filter(roll => roll === 11).length === 2 
            : d12Rolls.includes(11);
    
        if (autoFail) {
            this.sendRollResultsToServer(
                results.map(r => r.symbol), 
                0, 
                false, 
                skillName, 
                this.generateFooter(character.conditions, character.states),
                character.artUrl, 
                targetNumber, 
                character.name
            );
        }
    
        return autoFail;
    }

    static handleFavoredAndIllFavored(results, skill) {
        if (!(skill.isFavored && skill.isIllFavored)) {
            if (skill.isFavored) {
                this.handleFavored(results);
                return " (favored)";
            }
            if (skill.isIllFavored) {
                this.handleIllFavored(results);
                return " (ill-favored)";
            }
        }
        return ""; // No modification needed
    }
    

    static handleFavored(results) {
        const d12Results = results.filter(r => r.die === 12);
        const d12Rolls = d12Results.map(r => r.roll);
    
        const highestD12Roll = d12Rolls.reduce((max, roll) => {
            if (roll === 11) return max;
            return max === 11 || roll > max ? roll : max;
        }, 11);
    
        let keptOne = false;
        d12Results.forEach(r => {
            if (r.roll === highestD12Roll && !keptOne) {
                keptOne = true;
            } else {
                r.originalRoll = r.roll; // Preserve the original roll
                r.roll = 0; // Mark as not contributing to total
            }
        });
    }
    
    static handleIllFavored(results) {
        const d12Results = results.filter(r => r.die === 12);
        const d12Rolls = d12Results.map(r => r.roll);
    
        const lowestD12Roll = d12Rolls.includes(11) ? 11 : Math.min(...d12Rolls);
    
        let keptOne = false;
        d12Results.forEach(r => {
            if (r.roll === lowestD12Roll && !keptOne) {
                keptOne = true;
            } else {
                r.originalRoll = r.roll; // Preserve the original roll
                r.roll = 0; // Mark as not contributing to total
            }
        });
    }

    static calculateTotalSum(results, isTwiceWeary) {
        return results.reduce((sum, r) => {
            // If it's a d12 with value 11, treat it as 0
            if (r.die === 12 && r.roll === 11) {
                return sum;
            }
            
            // If dice were dropped due to favored/ill-favored (roll = 0), don't add
            if (r.roll === 0) {
                return sum;
            }
            
            // Apply twice weary rule (d6 rolls of 1-3 don't count)
            if (r.die === 6 && r.roll <= 3 && isTwiceWeary) {
                return sum;
            }
            
            return sum + r.roll;
        }, 0);
    }

    static determineSuccess(totalSum, targetNumber) {
        return totalSum >= targetNumber;
    }

    static generateFooter(conditions, states) {
        const footerText = [];

        Object.keys(conditions).forEach(condition => {
        if (conditions[condition]) {
            footerText.push(condition.charAt(0).toUpperCase() + condition.slice(1));
        }
        });

        const formattedStateNames = {
        twiceWeary: "Twice Weary",
        twiceMiserable: "Twice Miserable",
        twiceHelpless: "Twice Helpless",
        };

        Object.keys(states).forEach(state => {
        if (states[state]) {
            footerText.push(formattedStateNames[state] || state.charAt(0).toUpperCase() + state.slice(1));
        }
        });

        return footerText.join(", ") || "";
    }

    static async sendRollResultsToServer(rollResults, totalSum, success, skillName, footer, image, targetNumber, characterName) {
        try {
        await axios.post('http://localhost:3000/send-discord-message', {
            rollResults,
            total: totalSum,
            targetNumber,
            name: characterName || "Unnamed Character",
            skill: skillName,
            success,
            footer,
            image
        });
        } catch (error) {
        console.error('Error sending roll:', error);
        alert('Failed to send roll. Check your connection or server.');
        }
    }
}

export default DiceService;
