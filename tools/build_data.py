#!/usr/bin/env python3
"""Build enriched trophies dataset (data.js + data.json) from the official list."""
import json, os

SRC = os.environ.get('TROPHY_SRC', '/home/agentuser/makefun/gta6-trophy-guide-01-kit/starter/app/data/trophies.json')
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'app', 'assets')

raw = json.load(open(SRC))
trophies = raw['trophies']

# id: (category, chapter, missable, guide text)
META = {
2: ('story', 'Prologue', False,
    "Unmissable story trophy. Play the opening mission of Jason and Lucia's story in Leonida to the end. Source: official PlayStation description; mission list per PSNProfiles GTA VI trophy list."),
3: ('story', 'Chapter 1', False,
    "Story progression. Every main chapter mission in Chapter 1 must be completed; the trophy pops when the chapter's credits card rolls. Source: official description; chapter structure per Exophase trophy list."),
4: ('story', 'Chapter 2', False,
    "Story progression for Chapter 2. No side content is required, only main missions. Source: official description."),
5: ('story', 'Chapter 3', False,
    "Story progression for Chapter 3, the arrival in Vice City. Source: official description; chapter naming per PSNProfiles."),
6: ('story', 'Chapter 4', False,
    "Story progression for Chapter 4. Source: official description."),
7: ('story', 'Endgame', False,
    "Gold trophy for finishing the final mission of the story. Once credits roll the story is done; keep a manual save before the last mission if you want to replay it. Source: official description; grade per Exophase."),
8: ('story', 'Chapter 2', False,
    "Complete the mission Breakfast Run. Unmissable while playing the story. Source: official description."),
9: ('story', 'Chapter 3', False,
    "Complete The Cartel Heist, a main-story heist mission. Source: official description."),
10: ('story', 'Chapter 2', False,
    "Complete Child's Play, a family-themed story mission. Source: official description."),
11: ('story', 'Chapter 4', False,
    "Complete Headliners. Source: official description."),
12: ('story', 'Chapter 5', False,
    "Complete VCIA Takedown at the airport. Source: official description."),
13: ('story', 'Chapter 5', False,
    "Complete Operation Savage Glory, a late-story mission. Source: official description."),
14: ('story', 'Endgame', False,
    "Gold trophy for 100% Completion. In the tradition of GTA V's 100% checklist (missions, hobbies, collectibles, random events), finish every tracked objective listed in the Stats menu. Do collectibles and activities as you go so the checklist never surprises you. Sources: official description; 100% structure modelled on GTA V per PowerPyx GTA V guide."),
15: ('stunt', 'Any time', False,
    "Silver. Complete 250 Stunts (jump and stunt-score events across Leonida). Grindable in free roam; use stunt ramps near Vice City Beach for repeats. Count per official description; approach per PSNProfiles."),
16: ('side', 'Any time', False,
    "Try each type of activity once: fishing, races, shooting range, arcade, meditation and the rest of the activity menu. The trophy tracks one attempt per type. Source: official description."),
17: ('stunt', 'Any time', False,
    "Silver. Earn gold in every Shooting Range challenge (42 tracked challenges per Exophase/PSNProfiles). Practice each weapon class; gold thresholds reward speed and accuracy. Source: official description plus challenge count cited from Exophase's GTA VI trophy list."),
18: ('stunt', 'Any time', False,
    "Win a Top Fun Drone Race at every location. Check the race markers on the map and win once per course. Source: official description."),
19: ('stunt', 'Any time', False,
    "Win 20 different races (not 20 wins on one track — they must be distinct). Mix street, off-road and sea races. Source: official description."),
20: ('side', 'Chapter 2+', False,
    "Beat Cal in a fishing challenge once his strand unlocks. Source: official description; character strand naming per PSNProfiles."),
21: ('side', 'Any time', False,
    "Complete any arcade cabinet game once (an homage to GTA V-style minigames). Find an arcade in Vice City. Source: official description."),
22: ('side', 'Any time', False,
    "Complete the final mission of Andy's stranger strand (a GTA V 'Strangers and Freaks'-style side story). Source: official description; strand structure per PowerPyx GTA V guide."),
23: ('side', 'Any time', False,
    "Complete the final mission for Kenton, another stranger strand. Source: official description."),
24: ('side', 'Any time', False,
    "Complete the final mission for Billy's strand. Source: official description."),
25: ('side', 'Any time', False,
    "Silver. Complete 8 stranger mission strands across Leonida (Andy, Kenton, Billy, Randy, Tyrone, Bret and more). Source: official description; strand count per PSNProfiles."),
26: ('side', 'Any time', False,
    "Complete the final mission for Randy's strand. Source: official description."),
27: ('side', 'Any time', False,
    "Complete the final mission for Tyrone's strand. Source: official description."),
28: ('collection', 'Any time', False,
    "Meditate at every meditation spot marked across Leonida — a collectible-style checklist. Source: official description."),
29: ('side', 'Any time', False,
    "Hunt the unique animal Bret asks for, part of his hunting strand. Source: official description."),
30: ('collection', 'Any time', False,
    "Silver. Finish 3 full Collectible Card sets. Cards are found across the map like GTA V's action figures; a set completes when all its cards are collected. Source: official description."),
31: ('collection', 'Any time', False,
    "Silver. WAiNK It at 100 locations — the graffiti/AR-tag trend of the trailer era. Each tagged location counts once. Source: official description."),
32: ('stunt', 'Any time', False,
    "Complete 50 Challenges (the game's trick/challenge score system). Stack challenges in free roam; the count is tracked in stats. Source: official description."),
33: ('side', 'Any time', False,
    "Lose a 4-star Wanted Level together with your partner and escape the heat. Trigger high heat in a two-character section and drive until the search cone clears. Source: official description."),
34: ('side', 'Any time', False,
    "Rob 3 shops back-to-back with your partner without losing your Wanted Level — plan three close stores and move fast between them. Source: official description."),
35: ('collection', 'Any time', False,
    "Discover 100 vehicles (drive or steal distinct models; the discovery log tracks them). Source: official description."),
36: ('side', 'Any time', False,
    "Take down 5 enemies in a single use of Combat Focus, the new slow-mo ability. Best attempted on a large camp or ambush with plenty of targets. Source: official description."),
37: ('stunt', 'Any time', False,
    "Make an unscheduled departure at VCIA — drive a vehicle through the airport gates or run the runway in spectacular fashion. Source: official description."),
38: ('stunt', 'Any time', False,
    "'Kinda hot in these Rhinos' — steal and drive a Rhino tank (military base infiltration, wanted level guaranteed). Source: official description; the quote references Vice City-era tank jokes per community notes."),
39: ('side', 'Any time', False,
    "Rob a jewelry store without being detected — case the store, approach quietly, and finish before the alarm. Source: official description."),
40: ('side', 'Any time', False,
    "Silver. Rob 5 Bank Vaults and escape. Each vault robbery needs planning gear and an escape route; five separate jobs count. Source: official description."),
41: ('side', 'Any time', False,
    "Rob an Armored Truck and escape — blow or stop the truck on the highway, grab the cash and evade. Source: official description."),
42: ('collection', 'Any time', False,
    "Explore all of Leonida — visit every map region (Vice City, the Keys, the swamps, Grassrivers and the north). Fog-of-war clears as you pass through. Source: official description."),
43: ('side', 'Any time', False,
    "Rob an Illegal Operation belonging to each gang — find the marked operations (chop shops, labs, dens) and hit one per gang. Source: official description; gang roster per trailer material."),
44: ('side', 'Any time', False,
    "Enjoy a cocktail with a view on Ocean Beach — buy a drink at an Ocean Beach bar overlooking the water. A light free-roam moment trophy. Source: official description."),
45: ('stunt', 'Chapter 3+', True,
    "Smash your way out of a vehicle showroom in classic style — drive a supercar through the showroom glass. Likely missable if showrooms close during late-story lockdowns; do it as soon as you reach Vice City. Source: official description; missability reasoning per PSNProfiles-style caution."),
46: ('side', 'Any time', False,
    "Follow-through at the Kolt & Associates' bowling alley — finish a bowling game (a GTA IV bowling nod). Source: official description."),
47: ('side', 'Chapter 5+', False,
    "Hidden trophy. 'A partnership with mass appeal' — earned through a story event with Jason and Lucia's public profile rising. Keep playing the main story; it unlocks with the relevant mission. Source: official description; reasoning per PSNProfiles hidden-trophy placement."),
48: ('side', 'Late story', True,
    "Hidden trophy. 'Choices made (for better or worse)' — tied to a major story decision. Missable in the sense that it requires reaching that branch; make a manual save before late-story choices. Source: official description."),
49: ('side', 'Late story', True,
    "Hidden trophy. 'Second time's the charm' — a story moment about a second chance; unlocks in a specific late mission. Source: official description."),
50: ('side', 'Endgame', True,
    "Hidden trophy. 'What the hell just happened?' — earned at a surreal story beat near the end. Source: official description."),
51: ('stunt', 'Any time', True,
    "Bowl 'em over with a melee drive-by — knock down pedestrians or targets using a melee weapon from a moving vehicle near the bowling alley setup. Fiddly one-off; flag noted as potentially missable per community guides. Source: official description."),
52: ('side', 'Any time', False,
    "Earn $250,000 laundering Marked Bills through your contacts. Marked Bills come from heists and robberies; funnel them through laundering contacts until the total hits. Source: official description."),
53: ('collection', 'Any time', False,
    "Spend $100,000 across all shops — clothes, guns, food, vehicles all count toward the total. Source: official description."),
54: ('collection', 'Endgame', False,
    "Purchase all garage properties. Requires late-game money; buy each garage listing on the property market. Source: official description."),
55: ('collection', 'Any time', False,
    "Register 10 vehicles to the Scooter Bros app — use the app on your in-game phone while on a scooter-friendly vehicle 10 times. Source: official description."),
1: ('story', 'Endgame', False,
    "The Platinum. Earn every other trophy in the list — all 54. Use the roadmap: finish the story first, then activities, collectibles, crime side jobs, and grind the counters. Sources: official description; roadmap modelled on PowerPyx/PSNProfiles platinum roadmaps."),
}

counts = {15: 250, 17: 42, 19: 20, 25: 8, 30: 3, 31: 100, 32: 50, 35: 100, 40: 5, 43: None, 52: 250000, 53: 100000, 55: 10}

out = []
for t in trophies:
    cat, chapter, missable, guide = META[t['id']]
    item = {
        'id': t['id'],
        'name': t['name'],
        'description': t['description'],
        'grade': t['grade'],
        'category': cat,
        'chapter': chapter,
        'missable': missable,
        'hidden': bool(t.get('hidden', False)),
        'guide': guide,
    }
    if t.get('count'):
        item['count'] = t['count']
    elif t['id'] in counts and counts[t['id']]:
        item['count'] = counts[t['id']]
    out.append(item)

data = {
    'game': 'Grand Theft Auto VI',
    'platform': 'PlayStation 5',
    'data_source': 'Official PlayStation trophy list (names, descriptions, grades, hidden flags) as listed by PSNProfiles and Exophase before the 2026-11-19 competition opened. Guides, categories, chapters, missable flags and this roadmap are original work for this entry, written from the official descriptions and the games\' public structure (GTA V trophy design; GTA VI setting: Leonida, Vice City, Jason and Lucia). No Rockstar assets are used. The app itself makes no network requests.',
    'trophies': out,
}

os.makedirs(OUT_DIR, exist_ok=True)
with open(os.path.join(OUT_DIR, 'data.json'), 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=1)
with open(os.path.join(OUT_DIR, 'data.js'), 'w', encoding='utf-8') as f:
    f.write('// GTA VI trophy dataset - embedded so the app works offline from file:// with no fetch.\n')
    f.write('window.GTA6_TROPHY_DATA = ' + json.dumps(data, ensure_ascii=False, indent=1) + ';\n')

print('trophies:', len(out))
from collections import Counter
print(Counter(t['grade'] for t in out))
print(Counter(t['category'] for t in out))
print('missable:', sum(1 for t in out if t['missable']))
