import json
import datetime
import re
import requests

today = datetime.date.today()
#first = today.replace(day=1)
lastMonth = today - datetime.timedelta(days=25)
print(lastMonth.strftime("%Y-%m-%d"))


with open('db/listings.json') as f:
  listings = json.load(f)

new_listings = []
for listing in listings:
  unavailable = False
  if not listing['nah']:
    print('Reading:', listing['link'])
    response = requests.get(listing['link'])
    for resp in response.history:
      if resp.status_code == 302:
        unavailable = True
    if (listing['date'] < lastMonth.strftime("%Y-%m-%d") and listing['title'].lower().find('dep') == -1 and listing['title'].lower().find('casa') == -1 and listing['title'].lower().find('terreno') == -1 and listing['nah'] == False) or unavailable or listing['city'] != 'Nuestra Señora de La Paz':
      print(listing['date'], listing['nah'])
      listing['nah'] = True # Removing
  new_listings.append(listing)

with open('db/listings.json', 'w') as json_file:
  json.dump(new_listings, json_file)