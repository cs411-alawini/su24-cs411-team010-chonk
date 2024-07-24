import os
from bs4 import BeautifulSoup
from collections import defaultdict
import csv
import multiprocessing
import time

def extract_maps_info(soup):
    maps_info = []
    map_items = soup.find_all("div", class_="vm-stats-gamesnav-item")
    #print(f"Found {len(map_items)} map items")

    if len(map_items) == 0:
        map_items = soup.find_all("div", class_="vm-stats-game mod-active")
        #print(f"Found {len(map_items)} map items")


    for item in map_items:
        game_id = item.get("data-game-id")
        if len(map_items) == 1:
            map_name_div = item.find("div", class_= "map").find("div")
        else:
            map_name_div = item.find("div")
        if game_id and map_name_div:
            map_name = map_name_div.get_text(strip=True)
            if map_name[0].isalpha() == False:
                map_name = map_name[1:]
            if map_name != "N/A" and map_name != "TBD":
                maps_info.append({"game_id": game_id, "map_name": map_name})
                #print(f"Extracted map info - Game ID: {game_id}, Map Name: {map_name}")
        #else:
            #@maps_info.append({"game_id": "all", "map_name": "All Maps"})
            #print(f"Other - All maps")

    return maps_info



def process_table(table_html, game_id, winningteam, scoreinfo):
    #print(scoreinfo)
    soup = BeautifulSoup(table_html, 'html.parser')
    table = soup.find('table')
    headers = ['player_id' ,'agent', 'rating', 'average_combat_score', 'kills', 'deaths', 'assists', 'kills_deaths', 'kill_assist_trade_survive_ratio', 'average_damage_per_round', 'headshot_ratio', 'first_kills', 'first_deaths', 'side'] 

    rows = []
    for row in table.find_all('tr'): #each player
        cells = row.find_all('td')
        if len(cells) < len(headers):
            continue
        
        base_data = defaultdict()
        base_data['game_id'] = game_id
        p = cells[0].find("div", {"class": "text-of"})
        base_data['player_id'] = p.get_text(strip = True)
        base_data['team'] =  p.findNext('div').get_text(strip = True).upper()
        base_data['won'] =  base_data['team'] == winningteam
        agent = cells[1].find("img")
    #print(headers)
        #print(base_data)
        if agent == None:
            return []
        base_data['agent'] = agent.get("title")
        #print(base_data)
        # Initialize dictionaries to hold side-specific data
        data_t = base_data.copy()
        data_ct = base_data.copy()

        for i, cell in enumerate(cells[:-1]): #last row is a repeat
            spans = cell.find_all('span', class_=lambda x: x and 'side' in x)
            for span in spans:
                if 'mod-both' in span['class']:
                    continue
                side = 't' if 'mod-t' in span['class'] else 'ct' if 'mod-ct' in span['class'] else None
                if side:
                    stat_name = headers[i] if headers[i] else f'stat_{i}'
                    if side == 't':
                        data_t[stat_name] = span.get_text(strip=True)
                    elif side == 'ct':
                        data_ct[stat_name] = span.get_text(strip=True)
        
        # Only add rows if the side-specific data has been populated
        if data_t != base_data and data_t['average_combat_score'] != '':
            data_t['side'] = 't'
            data_t['tier'] = 21
            data_t['rounds_won'] = scoreinfo[f'{data_t['team']}t']
            rows.append(data_t)
        if data_ct != base_data and data_ct['average_combat_score'] != '':
            data_ct['side'] = 'ct'
            data_ct['tier'] = 21
            data_ct['rounds_won'] = scoreinfo[f'{data_t['team']}c']
            rows.append(data_ct)
        
    
    return rows

def extract_tables_for_game(soup, gameid, teaminfo):
    #print(f"Extracting tables for game ID: {gameid}, map name: {map_name}")
    game_div = soup.find("div", {"class": "vm-stats-game", "data-game-id": str(gameid)})
    
    if not game_div:
        #print(f"Game div not found for game ID: {gameid}")
        return []

    #print(f"Found game div for game ID: {gameid}")

    tables_data = []
    tables = game_div.find_all_next("table", {"class": "wf-table-inset mod-overview"}, limit=2)

    if not tables:
        #print(f"No tables found for game ID: {gameid}")
        return []

    #print(f"Found {len(tables)} tables for game ID: {gameid}")

    for table in tables:
        now = soup.find("div", {"class": "vm-stats-game", "data-game-id": str(gameid)})
        team_1 = now.find("div", {"class": "team"})
        
        scoreinfo = {}

        team_2 = now.find("div", {"class": "team mod-right"})
        
        if not team_1 or not team_2:
            print("FFFFFFFFF")
        team2_name = team_2.find("div", {"class" : "team-name"}).get_text(strip=True)
        team1_name = team_1.find("div", {"class" : "team-name"}).get_text(strip=True)
        if not team_2.find("span", {"class" : "mod-ct"}) or not team_1.find("span", {"class" : "mod-ct"}):
            return []
        if team1_name not in teaminfo or team2_name not in  teaminfo:
            return []
        
        scoreinfo[f'{teaminfo[team2_name]}c'] = team_2.find("span", {"class" : "mod-ct"}).get_text(strip=True)
        scoreinfo[f'{teaminfo[team2_name]}t'] = team_2.find("span", {"class" : "mod-t"}).get_text(strip=True)
        scoreinfo[f'{teaminfo[team1_name]}c'] = team_1.find("span", {"class" : "mod-ct"}).get_text(strip=True)
        scoreinfo[f'{teaminfo[team1_name]}t'] = team_1.find("span", {"class" : "mod-t"}).get_text(strip=True)

        winner = team2_name
        if team_1.find("div", {"class": "score mod-win"}):
            winner = team1_name
        
        table_html = str(table)
        df = process_table(table_html, gameid, teaminfo[winner],scoreinfo)
        if (len(df)) == 10:
            #print(df)
            tables_data.extend(df)

    return tables_data




def extract_team_info(soup):
    team_elements = soup.select('.match-header-link')
    short = soup.find("div", {"class" : "vlr-rounds"})
    if not short:
        return
    #print(short)
    teams_info = {}
    img_to_team = {} #cut out the ones where there is no unique logo bc how else am I suppose to match lmmfao
    teamlist = []
    for link in team_elements:
        img = link.select_one('img').get("src")
        team = link.select_one('.wf-title-med').get_text(strip=True)
        img_to_team[img] = team
        teamlist.append(team)
    for img in img_to_team:
        parent = short.find("img", {"src" : img})
        if not parent or not parent.parent:
            print("no")
        else:
            teams_info[img_to_team[img]] = parent.parent.get_text(strip=True).upper()
    if len(teams_info) != 2:
        return
    #print(teams_info)
    return teams_info



def do(start, end, idxfile):
    all_player_data = []
    all_game_table_data = []
    for x in range (start, end+1):
        #print(f"./downloadpgs/{x}.html")
        with open(f"./downloadpgs/{x}.html") as fp:
            soup = BeautifulSoup(fp, 'html.parser')
            

            date_info = soup.find("div", class_="moment-tz-convert")
            if date_info != None:
                maps_info = extract_maps_info(soup)
                team_info = extract_team_info(soup)
                if team_info and maps_info:
                    for map_info in maps_info:
                        gameid = map_info["game_id"]
                        map_name = map_info["map_name"]
                        tables_data = extract_tables_for_game(soup, gameid, team_info)
                        all_player_data.extend(tables_data)
                        all_game_table_data.extend([{"game_id":gameid,"map_name": map_name,"date_info":date_info.get("data-utc-ts")}])
    with open(f'{idxfile}player.csv', 'w', newline='') as csvfile:    
        spamwriter = csv.DictWriter(csvfile, [ 'game_id', 'player_id','team' ,'won','agent', 'rating', 'average_combat_score', 'kills', 'deaths', 'assists', 'kills_deaths', 'kill_assist_trade_survive_ratio', 'average_damage_per_round', 'headshot_ratio', 'first_kills', 'first_deaths', 'side','tier', 'rounds_won'])
        spamwriter.writeheader()
        spamwriter.writerows(all_player_data)

    with open(f'{idxfile}games.csv', 'w', newline='') as csvfile:
        spamwriter = csv.DictWriter(csvfile,['game_id', 'map_name', 'date_info'])
        spamwriter.writeheader()
        spamwriter.writerows(all_game_table_data)



start_time = time.time()
t1 = multiprocessing.Process(target=do, args=(0, 4166,1,))
t2 = multiprocessing.Process(target=do, args=(4167,8332,2,))
t3 = multiprocessing.Process(target=do, args=(8333, 12498,3,))
t4 = multiprocessing.Process(target=do, args=(12498, 16664,4,))
t5 = multiprocessing.Process(target=do, args=(16665, 20830,5,))
t6 = multiprocessing.Process(target=do, args=(20831, 24999,6,))


t1.start()
t2.start()
t3.start()
t4.start()
t5.start()
t6.start()

t1.join()
t2.join()
t3.join()
t4.join()
t5.join()
t6.join()

print("--- %s seconds ---" % (time.time() - start_time))

# start_time = time.time()
# do(0, 60)
# print("--- %s seconds ---" % (time.time() - start_time))