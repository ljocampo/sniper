import requests
from bs4 import BeautifulSoup

url  = 'https://www.facebook.com/marketplace/item/646847852665253'

response = requests.get(url)
soup = BeautifulSoup(response.text, 'html.parser')
print(soup)
txt_disponible = soup.find(text="El artículo ya no está disponible")
print(txt_disponible)
if(txt_disponible):
  print('found!')
else:
  print('not found!')