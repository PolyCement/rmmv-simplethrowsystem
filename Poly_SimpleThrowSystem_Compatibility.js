/*:
 *
 * @plugindesc Compatibility patch: PolyCement's STS + Yanfly's Skill Core
 *
 * @author PolyCement
 *
 * @help
 * 
 * Put Poly_SimpleThrowSystem near the top of your load order, before
 * YEP_SkillCore. Then put this patch (Poly_SimpleThrowSystem_Compatibility)
 * after YEP_SkillCore. Item counts should now display correctly!
 */

(function() {

    // draw ammo counts
    var _Window_SkillList_drawSkillCost = Window_SkillList.prototype.drawSkillCost;
    Window_SkillList.prototype.drawSkillCost = function(skill, x, y, width) {
        if (skill.stypeId === stsParams.throwSkillTypeId) { 
            this.contents.fontSize = stsParams.itemCountFontSize;
            this.drawText(':', x, y, width - this.textWidth('00'), 'right');
            this.drawText($gameParty.numItems(skill.item), x, y, width, 'right');
            this.resetFontSettings();
        }
        else
            return _Window_SkillList_drawSkillCost.call(this, skill, x, y, width);
    };

})();
