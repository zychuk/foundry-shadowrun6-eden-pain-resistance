# Shadowrun 6 Eden — Pain Resistance (Foundry VTT)

Adds the **Pain Resistance** power to the **Shadowrun 6 Eden** system. https://github.com/yjeroen/foundry-shadowrun6-eden

For each level, the wound modifiers on the Physical and Stun Condition Monitors move one box further down. At level 1, the -1 penalty starts at 4 filled boxes instead of 3. Negative values move the penalties earlier instead.

## Installation

Paste the link below into **Add-on Modules → Install Module → Manifest URL**:

```
https://github.com/zychuk/foundry-shadowrun6-eden-pain-resistance/releases/latest/download/module.json
```

## Usage

- Enable the module in **Manage Modules**.
- Give the power (or a quality) an Active Effect with key `system.painResistance`, mode **Add**, and the level as the value.
- Negative values (e.g. `-1`) move the penalties earlier: at -1, the -1 penalty starts at 2 filled boxes.
