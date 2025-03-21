import axios from 'axios';

class DiceService {

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
    
        this.sendRollResultsToServer(
            results.map(r => r.symbol), totalSum, success, skillName, footer,
            character.artUrl, targetNumber, character.name
        );
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
            r.roll = 0;
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
            r.roll = 0;
        }
        });
    }

    static calculateTotalSum(results, isTwiceWeary) {
        return results.reduce((sum, r) => {
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
        await axios.post('http://localhost:3000/send-message', {
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
