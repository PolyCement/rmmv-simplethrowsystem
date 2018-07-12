# Simple Throw System

So you wanted a "Throw" command in your game. You looked around and found
that the only way to do this involved creating a new skill for every single
throwable item. "Wow, sounds like a lot of work, and it'll sure make a
huge mess of my skill list in the editor!" you thought to yourself. Well,
that's exactly what this plugin was made for! The Simple Throw System
allows you to make any item, weapon or armour throwable without having to
create any new skills, and allows custom behaviour to be defined through
the item's tags.

## Throwable Items

Just put the `<Throwable>` tag in the notes. That's it!

## Throwable Equips

The `<Throwable>` tag will still work for weapons and armour. However, as
equips have no defined damage or effects, you'll find they don't actually
do anything. Instead, you'll need to add attributes manually, as
described in the next section.

## Advanced Throwables

The Simple Throw System works by taking any item, armour or weapon and
converting it to a skill. In some cases, i.e. when an item should have
the same effect when thrown as when used, this will function perfectly
well. However, often you'll want to change values on the generated
skill (adding damage values to equips, for example). To do this, you can
use the `<Throwable Eval>` tag, like so:

```
<Throwable Eval>
  code
  code
</Throwable Eval>
```

After the skill is automatically generated, the code will be run. The
generated skill will be available as the "skill" variable, allowing you
to alter any of its properties as needed. For example, to add an animation
(we'll use animation 5 here) to a piece of throwable armour, add the
following to its notes:

```
<Throwable Eval>
  skill.animationId = 5;
<\Throwable Eval>
```

## Installation

Copy the files to your RPG Maker MV project's js/plugins folder, then
activate Poly_SimpleThrowSystem in the plugin manager.

**NOTE:** This script automatically generates skills. If you want other plugins to
be able process those skills, keep this near the top of your load order!

## Compatibility

This plugin was designed to play nice with other plugins, so hopefully
there shouldn't be many compatibility issues.

The only plugin that I found this plugin had issues with was Yanfly's
Skill Core, which overrides a method and causes item counts to not be
displayed in the Throw menu. A compatibility patch is included for this,
which should be loaded after Skill Core.
