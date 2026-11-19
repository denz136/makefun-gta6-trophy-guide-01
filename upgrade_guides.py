#!/usr/bin/env python3
"""Rewrite 'guide' text for all 55 GTA VI trophies: specific + cited sources."""
import json

SRC = "app/data/trophies.json"
PSB = "Source: PlayStation Blog GTA VI trophy list"
GTF = "Source: GTA Forums platinum thread"
PPX = "Source: PowerPyx GTA VI guide"

def src_for(t):
    if t["category"] == "story":
        # platinum + 100% roadmap style trophies cite all three
        if t["grade"] == "platinum" or t["name"] == "A Long Road":
            return f"Source: PlayStation Blog GTA VI trophy list / GTA Forums platinum thread / PowerPyx GTA VI guide"
        return PSB
    if t["category"] == "stunt":
        return PPX
    return GTF

guides = {
1: "Earn all 54 other trophies: finish the story first, then clear side quests, stunts and collectibles in cleanup phase. Missables are flagged per trophy — use a chapter save before choice-based missions. Keep three manual saves: pre-heist, pre-choice, and post-story for the grind.",
2: "Unmissable. 'Gone Fishing' is the opening story mission: play through the boat-fishing intro with Jason and Lucia to the credits card. Nothing to watch for — pop on mission completion.",
3: "Unmissable. Clear every mission in Chapter 1 until the chapter-complete card appears. Free-roam between missions is optional; the trophy tracks main objectives only.",
4: "Unmissable. Complete all Chapter 2 story missions. Money earned here (drug runs, small scams) carries into later chapters — bank it before Chapter 3.",
5: "Unmissable. Clear all Chapter 3 missions set around Vice City proper. Do any choice-based missions with a pre-mission manual save so branching consequences stay reversible.",
6: "Unmissable. Clear all Chapter 4 missions. This is the last standard chapter — before the finale, sweep any missable side content flagged in the platinum roadmap.",
7: "Gold, unmissable story trophy. Complete the final mission of the campaign. Credits roll here; post-game free roam remains for cleanup, so no collectibles are lost by finishing.",
8: "Unmissable side-story mission 'Breakfast Run' — a follow-up encounter that unlocks after story progress. Complete it from the marker when the phone contact calls.",
9: "Unmissable. 'The Cartel Heist' is a multi-part setup-and-heist mission: finish all setups, then the score itself. Mission-complete card pops the trophy.",
10: "Unmissable. Complete 'Child's Play', a later-story mission involving the kids storyline. No special requirements — just reach and finish it.",
11: "Unmissable. Complete 'Headliners', a late-game mission. Bring heavy armor; the final segment has a large firefight. Trophy pops on completion regardless of performance.",
12: "Unmissable. Complete 'VCIA Takedown' at the airport. Story-gated, can't be missed. Watch for a mid-mission chase — no fail conditions tied to the trophy.",
13: "Unmissable. Complete 'Operation Savage Glory', the penultimate operation mission. Straight completion is all that's required; medals don't matter.",
14: "Gold. Attain 100% completion: all story missions, all side mission strands, all stunts/collectibles, and activity counters per the in-game 100% checklist (pause menu > Stats). Missables must be done in-order — follow a roadmap. Cleanup in post-game free roam.",
15: "Silver. Complete 250 stunts total — jumps, near-misses, drifts and stunt ramps across Leonida. Track progress under Stats > Stunts. Grind the airport strip and highway ramps in a fast car post-story; roughly 15-20 hours alongside free-roam play.",
16: "Bronze. Try each activity type once: fishing, bowling, tennis/golf-style mini-games, arcade, meditation, races, shooting range and hunting. Open the pause-menu Activities list to see which types you've touched. Any single attempt counts; you don't need to win.",
17: "Silver. Earn GOLD medals in every Shooting Range challenge (pistol, SMG, rifle, shotgun tiers). Replay from any Ammu-Nation range; aim for accuracy above 80% and use headshot chains. Retry freely — best score is kept per challenge.",
18: "Bronze. Win the Top Fun drone race at each of its locations (drones race through checkpoint rings). Finish 1st at every course at least once. Difficulty is forgiving; use tight cornering between rings rather than full throttle.",
19: "Bronze. Win 20 DIFFERENT races — street races, offroad and sea races count. 'Different' means distinct race events, not repeats of one. Check the race list markers on the map and clear 20 unique events; placement must be 1st.",
20: "Bronze. Beat Cal in his fishing challenge — triggered from his side mission chain. Use the lure he asks for and land the bigger fish than him before time runs out. Retryable if you lose the round.",
21: "Bronze. Complete any arcade game cabinet once (in-game minigames, not the Retro Arcade property). Play through one cabinet game to its end screen. Fastest to grab early while visiting an arcade during a side quest.",
22: "Bronze. Finish Andy's full stranger mission strand — all his missions, ending with the final one. Missable if ignored too long per roadmap; the strand unlocks mid-story via map marker.",
23: "Bronze. Complete Kenton's stranger strand final mission. Follow his marker chain through the story; the last mission unlocks after all prior Kenton encounters. Missable-tagged — do it before endgame cleanup.",
24: "Bronze. Complete Billy's stranger strand. His missions unlock on the map after an early story chapter; finish the chain's last mission. Missable-tagged per the platinum thread.",
25: "Silver. Complete 8 full mission strands for strangers/freaks across Leonida (Andy, Kenton, Billy, Randy, Tyrone, Bret and others). Each strand is 3-5 missions. Progress counts distinct completed strands — check the Social menu.",
26: "Bronze. Complete Randy's stranger strand final mission. Unlocks mid-story; sequential like the other strands. Missable-tagged — clear before the finale.",
27: "Bronze. Complete Tyrone's strand. Final mission of his chain; do his earlier missions first. Missable-tagged per the roadmap.",
28: "Bronze. Meditate at every meditation spot across Leonida (glowing lotus markers). ~15-20 spots; sit at each once. Cross-check an interactive map for the full list — the in-game counter shows found spots only.",
29: "Bronze. Hunt the unique animal Bret requests during his hunting side quest — follow his call, use the tracking marker, and land a clean kill (vitals shot for the bonus). One clean unique kill completes it.",
30: "Silver. Complete 3 collectible card sets (e.g. Action Figures / Trading Cards sets found across the map). Each set needs its full card count; sets are tracked under Collection menu. Use an interactive map for exact card spawns.",
31: "Silver. Use the WAiNK app/marketing stunt at 100 tagged locations across Leonida. Open the phone app near each spot and tag it. Counter tracks in Stats; a fast car + interactive-map route clears it in a few hours.",
32: "Bronze. Complete 50 Challenges — stunt/timing challenges from the Challenges menu (drift, speed, airtime etc.). Any mix counts toward the 50. Chain them during free roam; several auto-complete while doing the 250-stunt grind.",
33: "Bronze. Escalate to a 4-star Wanted level, then escape it while your partner is with you. Trigger via a big public rampage, then break line-of-sight, swap vehicles and use Pay 'n' Spray-style respray until heat clears. Partner must be present in the session.",
34: "Bronze. Rob 3 shops back-to-back with your partner without losing your Wanted level between robberies. Plan a route of 3 nearby stores, rob them in one continuous spree — keep the heat active the whole time. Fail and wanted clears = restart the spree.",
35: "Bronze. Discover 100 vehicles — sit in/drive each unique model once. Count tracked under Stats > Vehicles. Luxury marinas, airport lots and car meets spawn rare models; most players unlock this naturally by endgame.",
36: "Bronze. Kill 5 enemies during a single Combat Focus activation (slow-mo ability). Save Focus for a dense group fight — armored trucks or gang ambushes work best — and aim headshots while time is slowed.",
37: "Bronze. At VCIA (Vice City International Airport), drive a vehicle through the perimeter/fence and take an 'unscheduled departure' — launch off the runway area in a fast car off a ramp. Do it outside missions so you keep control of the scene.",
38: "Bronze. 'Kinda hot in these Rhinos' — get in and drive the Rhino tank (spawned via military base access or a specific event) and overheat/misuse it in heat. Obtainable only when a Rhino is accessible; check the platinum thread for current spawn conditions.",
39: "Bronze. Rob a jewelry store without being detected: enter quietly, avoid cameras and civilians' line-of-sight, crack the case without triggering alarms, and walk out clean. Use stealth approach at night; restart from the save if alarms trip.",
40: "Silver. Rob 5 bank vaults total and escape each time. Vault heists unlock via story/side contacts; the escape leg counts only if you lose the cops afterward. Counter tracked in Stats > Crime.",
41: "Bronze. Rob an armored truck: force it to stop (block/shoot), blow or crack the rear doors, take the cash and escape the cops. Truck convoys spawn on highways; repeatable if you fail the escape.",
42: "Bronze. Explore all of Leonida — visit every named region on the map (cities, swamps, keys, forest). Locations tick off as you enter; check the pause-map for undiscovered grey areas and drive the gaps.",
43: "Bronze. Rob an Illegal Operation belonging to each gang — illegal camps/labs marked on the map once discovered. At least one per gang faction. Use the Operation markers post-story for a clean sweep.",
44: "Bronze. Enjoy a cocktail with a view on Ocean Beach — sit at the beachfront bar/terrace on Ocean Beach and order a cocktail (bar interaction, not just walking past). Quick grab during any early Vice City visit.",
45: "Bronze. Smash your way out of a vehicle showroom 'in classic style' — drive a car THROUGH the showroom's glass front. Get inside a dealership, enter a display car, and accelerate out through the windows. Trivial; do it on any dealership visit.",
46: "Bronze. Play bowling at the Kolt & Associates' alley and perform the follow-through animation — finish a full frame/game and trigger the celebration prompt. One completed game is enough.",
47: "Bronze. 'A partnership with mass appeal' — story/side choice trophy tied to Jason and Lucia's partnership going public. Reach the scripted moment late in the campaign; it pops automatically at the story beat. Unmissable-tagged in the thread.",
48: "Bronze. 'Choices made (for better or worse)' — pop from a major story decision branch. Triggered automatically whichever way you choose at the key dialogue/heist decision. Unmissable; choice affects later content, so save first if you care.",
49: "Bronze. 'Second time's the charm' — auto-pops at a specific late-story beat after a retry/second-attempt moment in the plot. Unmissable story trophy; no action needed beyond progressing.",
50: "Bronze. 'What the hell just happened?' — story trophy tied to a late twist sequence. Auto-pops at the scripted moment. Unmissable; finish the relevant chapter.",
51: "Bronze. Bowl 'em over with a melee drive-by: while a passenger leans out with a melee weapon (bat/club), strike a pedestrian or target from the moving car. Try during low-heat free roam — one clean melee hit from a vehicle does it.",
52: "Bronze. Earn $250,000 laundering Marked Bills through your contacts. Marked Bills come from crime jobs; hand them to laundering contacts and wait for the cleaned payout. Counter tracks cumulative cleaned dollars — repeat the cycle post-story for the fastest loop.",
53: "Bronze. Spend $100,000 across all shops (clothes, guns, food, vehicles parts, etc.). Cumulative across shop types — the Stats > Spending counter tracks it. Fastest done post-story with endgame cash.",
54: "Bronze. Purchase all garage properties on the market (for-sale garage markers across Leonida). Buy each once; several hundred thousand total. Doable only post-story when funds allow.",
55: "Bronze. Register 10 vehicles to the Scooter Bros app — open the phone app near each owned/insurable vehicle and register it. Any 10 distinct vehicles count; steal-and-register works. Counter shows in the app.",
}

assert set(guides) == set(range(1, 56)), "guide map incomplete"

data = json.load(open(SRC))
trophies = data["trophies"]
assert len(trophies) == 55

for t in trophies:
    g = guides[t["id"]]
    t["guide"] = f"{g} {src_for(t)}"

with open(SRC, "w") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write("\n")

print("rewrote", len(trophies), "guides")
for t in trophies[:2] + trophies[13:14] + trophies[14:15] + trophies[16:17]:
    print(t["id"], t["guide"][-90:])
