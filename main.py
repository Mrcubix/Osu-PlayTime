import json
import os
import requests
from time import sleep
import asyncio

old_time = 0
time_passed = 0
interval = .3
Timings = [old_time, time_passed]
data = None

async def getTimePassed(Timings):
    old_time, time_passed = Timings[0], Timings[1]
    bm, state = None, None
    with requests.post("http://localhost:24050/json") as r:
        json = r.json()
        if "error" not in json:
            state = json["menu"]["state"]
            bm = json["menu"]["bm"]
            current_time = json["menu"]["bm"]["time"]["current"]
            if current_time > 0 and current_time - old_time > 0 and state == 2:
                time_passed += current_time - old_time
                old_time = current_time
            if current_time < 0:
                old_time = 0
            return [old_time,time_passed], state, bm
    return Timings,state,bm

async def SaveToFile(Timings, bm):
    title = bm["metadata"]["artist"] + " - " + bm["metadata"]["title"]
    title = "'{}'".format(title).replace("'", "")
    difficulty = bm["metadata"]["difficulty"]
    if os.path.exists(__file__.split("main.py")[0]+"log.json"):
        if os.path.getsize("log.json") != 0:
            with open("log.json", "r") as f:
                data = json.load(f)
            if title in data:
                if bm["metadata"]["difficulty"] in data[title]:
                    data[title][difficulty] = data[title][difficulty] + Timings[1]
                else:
                    data[title][difficulty] = Timings[1]
            else:
                data[title] = {difficulty: Timings[1]}
            with open("log.json", "w") as f:
                f.write(json.dumps(data))
        else:
            with open("log.json", "w") as f:
                json.dump({title: {difficulty: Timings[1]}}, f)
    else:
        with open("log.json", "w") as f:
            json.dump({title: {difficulty: Timings[1]}}, f)
    print("data write")

running = True
while running:
    Timings, state, bm = asyncio.run(getTimePassed(Timings))
    if state != 2 and Timings[1] != 0:
        asyncio.run(SaveToFile(Timings, bm))
        Timings[1] = 0
    sleep(interval)
    
