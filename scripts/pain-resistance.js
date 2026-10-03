/**
 * SR6 Eden: Pain Resistance
 *
 * "For each level of this power, the negative modifiers from damage move one box farther
 *  down the Condition Monitor." Works for both the Stun and Physical Condition Monitors.
 *
 * Target with an Active Effect:  key system.painResistance, mode Add, value = level.
 *   +1  -> the -1 triggers at 4 filled boxes instead of 3 (and so on)
 *   -1  -> the -1 triggers at 2 filled boxes instead of 3 (and so on)
 *
 * Nothing in the system files is changed: the module wraps two system methods at runtime
 * and relabels the existing monitor boxes, so it survives system updates.
 */

const SYSTEM_ID = "shadowrun6-eden";
const LOG = "SR6 Pain Resistance |";

/** Pain Resistance level of an actor (0 when not set) */
function getShift(actor) {
    return Math.trunc(Number(actor?.system?.painResistance) || 0);
}

/**
 * The penalty label of box i (1-based) on a monitor with `boxes` boxes, moved by `shift`.
 * Mirrors the system's own labelling: every 3rd box, plus the (partial) last row on the last box.
 */
function boxLabel(i, boxes, shift) {
    if (i === boxes) {
        const last = Math.ceil(Math.max(0, boxes - shift) / 3);
        return last > 0 ? `-${last}` : null;
    }
    const n = i - shift;
    return (n > 0 && n % 3 === 0) ? `-${n / 3}` : null;
}

/** Wound modifier + base data patches on the system's Actor class */
function patchActor() {
    const proto = CONFIG.Actor.documentClass?.prototype;
    const original = proto?._getWoundModifierPerMonitor;
    if (typeof original !== "function") {
        console.warn(`${LOG} _getWoundModifierPerMonitor not found, wound modifiers are not shifted.`);
        return;
    }
    // If the system ever supports Pain Resistance natively (or is patched manually), step aside
    // instead of shifting the penalties twice
    if (original.toString().includes("painResistance")) {
        console.warn(`${LOG} The system already handles painResistance, the module's wound modifier patch is not needed.`);
        return;
    }

    // Shift the monitor before handing it to the system's own formula:
    // the first `shift` boxes are "free" (or, if negative, extra boxes count as already filled)
    proto._getWoundModifierPerMonitor = function (monitor) {
        const shift = getShift(this);
        if (!shift || !monitor) return original.call(this, monitor);

        const max = Number(monitor.max) || 0;
        const dmg = Number(monitor.dmg) || 0;
        const shiftedMax = max - shift;
        if (dmg <= 0 || shiftedMax <= 0) return 0;

        const shiftedDmg = Math.max(0, dmg - shift);
        return original.call(this, { ...monitor, max: shiftedMax, dmg: shiftedDmg, value: shiftedMax - shiftedDmg });
    };

    // Reset the value every data preparation so "Add" effects never stack up over time
    const originalBase = proto.prepareBaseData;
    proto.prepareBaseData = function (...args) {
        const result = originalBase?.apply(this, args);
        if (this.system && typeof this.system === "object") this.system.painResistance = 0;
        return result;
    };

    console.log(`${LOG} Wound modifier patch active.`);
}

/** Move the -1/-2/-3 labels on the existing Physical and Stun monitor boxes (no boxes are added) */
function relabelMonitors(app, html) {
    const shift = getShift(app.actor);
    if (!shift) return;

    const root = app.element?.[0] ?? app.element ?? html?.[0] ?? html;
    for (const id of ["barPhyBoxes", "barStunBoxes"]) {
        const bar = root?.querySelector?.(`#${id}`);
        if (!bar) continue;
        const boxes = Array.from(bar.children).filter(el => el.classList.contains("monitorBox"));
        boxes.forEach((box, index) => {
            const textNode = box.firstElementChild ?? box;
            textNode.textContent = boxLabel(index + 1, boxes.length, shift) ?? "\u00A0";
        });
    }
}

Hooks.once("setup", () => {
    if (game.system.id !== SYSTEM_ID) return;
    patchActor();
    Hooks.on("renderActorSheet", relabelMonitors);

    // Registered here (after the system's init) so it runs after the system rebuilds CONFIG.SR6 on ready
    Hooks.once("ready", () => {
        const options = CONFIG.SR6?.ACTIVE_EFFECT_OPTIONS;
        if (options) options.system_painResistance = game.i18n.localize("SR6PAINRES.EffectOption");
    });
});
