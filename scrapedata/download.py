import re
from datetime import datetime, timezone
import time

from collections import defaultdict

import requests
from selectolax.parser import HTMLParser


def vlr_match_results_in_depth(startpg, endpg):
    headers = {"User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:52.0) Gecko/20100101 Firefox/52.0",}
    with requests.Session() as session:
        pgcount = startpg
        session.headers.update(headers)
        params= {'page': str(pgcount)}
        url = "https://www.vlr.gg/matches/results"
        result = []

        resp = session.get(url, params=params)
        html = HTMLParser(resp.text)
        status = resp.status_code
        if status != 200:
            raise Exception("API response: {}".format(status))
        while status == 200:
            print(params)
            if not html.css("a.wf-module-item"):
                break
            if endpg and endpg < pgcount:
                break
            for item in html.css("a.wf-module-item"):
                url_path = item.attributes["href"]

                result.append(url_path)
        
            pgcount +=1
            params['page'] = str(pgcount)
            print(params)
            resp = session.get(url, params=params)
            html = HTMLParser(resp.text)
            status = resp.status_code
            time.sleep(0.1)
        
        for idx, game in enumerate(result):
            resp = session.get(f"https://www.vlr.gg{game}", headers=headers)
            print(f"https://www.vlr.gg{game}")
            with open(f"./downloadpgs/{idx}.html", "w") as curr:
                curr.write(resp.text)
            time.sleep(0.3)
            

vlr_match_results_in_depth(1, 500)
print("done!")