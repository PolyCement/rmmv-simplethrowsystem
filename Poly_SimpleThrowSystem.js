/*:
 *
 * @plugindesc Automatically converts tagged items to "Throw" type skills
 *
 * @author PolyCement
 *
 * @param Throw Skill Type ID
 * @type number
 * @min 1
 * @desc The ID of the skill type that throwable items should appear under.
 * @default 1
 *
 * @param Item Count Font Size
 * @type number
 * @min 1
 * @desc The font size used for the item count.
 * @default 28
 *
 * @help
 *
 * ===== PolyCement's Simple Throw System =====
 *
 * NOTE:
 * This script automatically generates skills. If you want other plugins to
 * be able process those skills, keep this near the top of your load order!
 *
 * So you wanted a "Throw" command in your game. You looked around and found
 * that the only way to do this involved creating a new skill for every single
 * throwable item. "Wow, sounds like a lot of work, and it'll sure make a
 * huge mess of my skill list in the editor!" you thought to yourself. Well,
 * that's exactly what this plugin was made for! The Simple Throw System
 * allows you to make any item, weapon or armour throwable without having to
 * create any new skills, and allows custom behaviour to be defined through
 * the item's tags.
 *
 * ===== Throwable Items =====
 *
 * Just put the <Throwable> tag in the notes. That's it!
 *
 * ===== Throwable Equips =====
 *
 * The <Throwable> tag will still work for weapons and armour. However, as
 * equips have no defined damage or effects, you'll find they don't actually
 * do anything. Instead, you'll need to add attributes manually, as
 * described in the next section.
 *
 * ===== Advanced Throwables =====
 *
 * The Simple Throw System works by taking any item, armour or weapon and
 * converting it to a skill. In some cases, i.e. when an item should have
 * the same effect when thrown as when used, this will function perfectly
 * well. However, often you'll want to change values on the generated
 * skill (adding damage values to equips, for example). To do this, you can
 * use the <Throwable Eval> tag, like so:
 *
 * <Throwable Eval>
 *   code
 *   code
 * </Throwable Eval>
 *
 * After the skill is automatically generated, the code will be run. The
 * generated skill will be available as the "skill" variable, allowing you
 * to alter any of its properties as needed. For example, to add an animation
 * (we'll use animation 5 here) to a piece of throwable armour, add the
 * following to its notes:
 *
 * <Throwable Eval>
 *   skill.animationId = 5;
 * <\Throwable Eval>
 *
 * ===== Compatibility =====
 *
 * This plugin was designed to play nice with other plugins, so hopefully
 * there shouldn't be many compatibility issues.
 *
 * The only plugin that I found this plugin had issues with was Yanfly's
 * Skill Core, which overrides a method and causes item counts to not be
 * displayed in the Throw menu. A compatibility patch is included for this,
 * which should be loaded after Skill Core.
 */

// global var to shove params in so the compatibility patch can access em
// not sure on the capitalisation here tho...
var stsParams = {};

(function() {

    var params = PluginManager.parameters('Poly_SimpleThrowSystem');
    stsParams.throwSkillTypeId = Number(params['Throw Skill Type ID']);
    stsParams.itemCountFontSize = Number(params['Item Count Font Size']);

    // ===== DataManager =====

    var throwSkillsGenerated = false;
    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        if (!_DataManager_isDatabaseLoaded.call(this)) {
            return false;
        }
        if (!throwSkillsGenerated) {
            var newSkillStartIdx = $dataSkills.length;
            // generate throwable item skills
            DataManager.StsGenerateThrowSkills($dataItems);
            DataManager.StsGenerateThrowSkills($dataArmors);
            DataManager.StsGenerateThrowSkills($dataWeapons);
            // process tags for throwable item skills
            for (var idx = newSkillStartIdx; idx < $dataSkills.length; idx++)
                DataManager.StsProcessTags($dataSkills[idx]);
            throwSkillsGenerated = true;
        }
        return true;
    };

    // generates skills from the given array of items
    DataManager.StsGenerateThrowSkills = function(itemList) {
        var regexThrowable = /<\s*Throwable(?:\s*Eval)?\s*>/i;
        for (var idx = 0; idx < itemList.length; idx++) {
            var currentItem = itemList[idx];
            // if a <Throwable> tag is found, create a skill for the item
            if (currentItem && currentItem.note.match(regexThrowable)) {
                if (DataManager.isItem(currentItem))
                    var newThrowItemSkill = DataManager.StsConvertItemToSkill(currentItem);
                else
                    var newThrowItemSkill = DataManager.StsConvertEquipToSkill(currentItem);
                $dataSkills.push(newThrowItemSkill);
                // give the skill to all classes
                for (var classIdx = 0; classIdx < $dataClasses.length; classIdx++) {
                    var currentClass = $dataClasses[classIdx];
                    if (currentClass) {
                        currentClass.learnings.push({'level':1,'note':'','skillId':newThrowItemSkill.id});
                    }
                }
            }
        }
    };

    // processes tags on throwable skills
    DataManager.StsProcessTags = function(skill) {
        var regexEvalStart = /<\s*Throwable\s*Eval\s*>/i;
        var regexEvalStop = /<\s*\/\s*Throwable\s*Eval\s*>/i;
        // read thru the notes for the good stuff
        var noteLines = skill.note.split(/[\r\n]+/);
        var readMode = 'normal';
        var skillEval = '';
        for (var idx = 0; idx < noteLines.length; idx++) {
            var currentLine = noteLines[idx];
            if (currentLine.match(regexEvalStart))
                readMode = 'eval';
            else if (currentLine.match(regexEvalStop))
                readMode = 'normal';
            else if (readMode === 'eval') {
                skillEval += currentLine + '\n';
            }
        }
        // run the user specified code
        try {
            eval(skillEval);
        }
        catch (e) {
            // TODO: some real goddamn error handling
            console.log('EVAL BROKE!');
        }
    };

    // converts an item to a throw skill
    DataManager.StsConvertItemToSkill = function(item) {
        // use the item as a base - many properties are shared anyway
        var newThrowItemSkill = JSON.parse(JSON.stringify(item));
        // strip properties that skills don't have
        delete newThrowItemSkill.consumable;
        delete newThrowItemSkill.itypeId;
        delete newThrowItemSkill.price;
        // add missing fields
        newThrowItemSkill.message1 = ' throws a ' + item.name + '!';
        newThrowItemSkill.message2 = '';
        newThrowItemSkill.mpCost = 0;
        newThrowItemSkill.requiredWtypeId1 = 0;
        newThrowItemSkill.requiredWtypeId2 = 0;
        newThrowItemSkill.stypeId = stsParams.throwSkillTypeId;
        newThrowItemSkill.tpCost = 0;
        // remember the associated item
        // this should be safe? it's either this or i slap a function on here
        newThrowItemSkill.item = item;
        // rewrite a couple fields
        newThrowItemSkill.id = $dataSkills.length;
        newThrowItemSkill.occasion = 1;
        // attempt a rough conversion of scope if necessary
        if (item.scope === 7 || item.scope === 9 || item.scope === 11)
            newThrowItemSkill.scope = 1;
        else if (item.scope === 8 || item.scope === 10)
            newThrowItemSkill.scope = 2;
        return newThrowItemSkill;
    };

    // converts an equip to a throw skill
    DataManager.StsConvertEquipToSkill = function(equip) {
        // again, using the equip as a base
        var newThrowEquipSkill = JSON.parse(JSON.stringify(equip));
        // do armour/weapon specific stuff first to get em lookin the same
        if (DataManager.isWeapon(equip)) {
            delete newThrowEquipSkill.wtypeId;
        }
        else {
            delete newThrowEquipSkill.atypeId;
            newThrowEquipSkill.animationId = 0;
        }
        // strip more stuff
        delete newThrowEquipSkill.params;
        delete newThrowEquipSkill.price;
        delete newThrowEquipSkill.traits;
        // now add everything else that's missing for it to look like a skill
        // TODO: this is a lot... maybe i could do something more clever here (and above)
        newThrowEquipSkill.damage = {'critical':false,'elementId':0,'formula':'0','type':0,'variance':20};
        newThrowEquipSkill.effects = [];
        newThrowEquipSkill.hitType = 0;
        newThrowEquipSkill.message1 = ' throws a ' + equip.name + '!';
        newThrowEquipSkill.message2 = '';
        newThrowEquipSkill.mpCost = 0;
        newThrowEquipSkill.occasion = 1;
        newThrowEquipSkill.repeats = 1;
        newThrowEquipSkill.requiredWtypeId1 = 0;
        newThrowEquipSkill.requiredWtypeId2 = 0;
        newThrowEquipSkill.scope = 1;
        newThrowEquipSkill.speed = 0;
        newThrowEquipSkill.stypeId = stsParams.throwSkillTypeId;
        newThrowEquipSkill.successRate = 100;
        newThrowEquipSkill.tpCost = 0;
        newThrowEquipSkill.tpGain = 0;
        // remember the item
        newThrowEquipSkill.item = equip;
        // adjust id
        newThrowEquipSkill.id = $dataSkills.length;
        return newThrowEquipSkill;
    };
    
    // ===== Game_BattlerBase =====

    // check that the player actually has the item stocked before they throw it
    var _Game_BattlerBase_canPaySkillCost = Game_BattlerBase.prototype.canPaySkillCost;
    Game_BattlerBase.prototype.canPaySkillCost = function(skill) {
        var canPay = _Game_BattlerBase_canPaySkillCost.call(this, skill);
        if (skill.stypeId === stsParams.throwSkillTypeId)
            return canPay && $gameParty.hasItem(skill.item);
        return canPay;
    };

    // remove one of the throwable item from the inventory
    var _Game_BattlerBase_paySkillCost = Game_BattlerBase.prototype.paySkillCost;
    Game_BattlerBase.prototype.paySkillCost = function(skill) {
        _Game_BattlerBase_paySkillCost.call(this, skill);
        if (skill.stypeId === stsParams.throwSkillTypeId)
            $gameParty.loseItem(skill.item, 1);
    };

    // ===== Window_SkillList =====

    // hide skills for which the corresponding item is missing
    var _Window_SkillList_includes = Window_SkillList.prototype.includes;
    Window_SkillList.prototype.includes = function(skill) {
        var skillListIncludes = _Window_SkillList_includes.call(this, skill);
        if (skill.stypeId === stsParams.throwSkillTypeId)
            return skillListIncludes && $gameParty.hasItem(skill.item);
        return skillListIncludes;
    };

    // draw item counts
    var _Window_SkillList_drawSkillCost = Window_SkillList.prototype.drawSkillCost;
    Window_SkillList.prototype.drawSkillCost = function(skill, x, y, width) {
        if (skill.stypeId === stsParams.throwSkillTypeId) { 
            this.contents.fontSize = stsParams.itemCountFontSize;
            // this is yanked right outta Window_ItemList.drawItemNumber()
            this.drawText(':', x, y, width - this.textWidth('00'), 'right');
            this.drawText($gameParty.numItems(skill.item), x, y, width, 'right');
            this.resetFontSettings();
        }
        else
            return _Window_SkillList_drawSkillCost.call(this, skill, x, y, width);
    };
    
    // ===== Window_SkillType =====

    // disable the throw skill menu when viewed outside battle
    // might scrap this, or make it optional, since i can't
    // think of a good way to override the method without overriding
    // other plugins,
    var _Window_SkillType_makeCommandList = Window_SkillType.prototype.makeCommandList;
    Window_SkillType.prototype.makeCommandList = function() {
        if (this._actor) {
            var skillTypes = this._actor.addedSkillTypes();
            skillTypes.sort(function(a, b) {
                return a - b;
            });
            skillTypes.forEach(function(stypeId) {
                var name = $dataSystem.skillTypes[stypeId];
                var enabled = stypeId !== stsParams.throwSkillTypeId;
                this.addCommand(name, 'skill', enabled, stypeId);
            }, this);
        }
    };

})();
