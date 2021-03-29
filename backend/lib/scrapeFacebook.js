require('isomorphic-fetch');
const db = require('diskdb');
const fs = require('fs');

db.connect(
  './db',
  ['listings', 'searches']
);

function delay(ms, count, total) {
  console.log(count,'/',total,' - Waiting:',ms,'ms');
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeFacebook(query = 'Leather Chair') {
  console.log('************* ', query);
  const variables = {
    count: 24,
    params: {
      bqf: { callsite: 'COMMERCE_MKTPLACE_WWW', query },
      browse_request_params: {
        filter_location_id: 'lapaz',
        filter_price_lower_bound: 0,
        filter_price_upper_bound: 214748364700,
      },
      custom_request_params: {
        surface: 'SEARCH',
        search_vertical: 'C2C',
      },
    },
  };

  const res = await fetch('https://www.facebook.com/api/graphql/', {
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'cookie': 'datr=MnG5Xli4BFnYMjaiu1dGjTOX; sb=HLS5XjCi6PyoJw4FnCzOM-cG; c_user=539414074; xs=15%3ACnmBswIiGEiwTQ%3A2%3A1589228607%3A12251%3A1240; m_pixel_ratio=1; x-referer=eyJyIjoiL21hcmtldHBsYWNlLz9yZWY9Ym9va21hcmtzJmFwcF9pZD0xNjA2ODU0MTMyOTMyOTU1IiwiaCI6Ii9tYXJrZXRwbGFjZS8%2FcmVmPWJvb2ttYXJrcyZhcHBfaWQ9MTYwNjg1NDEzMjkzMjk1NSIsInMiOiJtIn0%3D; spin=r.1002416706_b.trunk_t.1595631406_s.1_v.2_; fr=18l6VCogh0SbkEOjs.AWWQg_XCuOM4Gs_Kna9m0-VeI-c.BeuXEy.t5.AAA.0.0.BfG2cv.AWX8m6uV; presence=EDvF3EtimeF1595633226EuserFA2539414074A2EstateFDt3F_5bDiFA2user_3a667981130A2EoF1EfF1CAcDiFA2user_3a581055611A2EoF2EfF2C_5dElm3FnullEutc3F1595633226494G595633226518CEchF_7bCC; act=1595633250557%2F4; wd=944x950'
    },
    body: `variables=${JSON.stringify(variables)}&doc_id=3606579059424582&fb_dtsg=AQFQ-aTUAfRl:AQE5k73_qy4A`,
    method: 'POST',
    mode: 'cors',
  });
  const { data } = await res.json();

  //console.log(JSON.stringify(data, undefined, 2));
  // fs.writeFile("fbscrap.json", JSON.stringify(data, undefined, 2), function(err) {
  //   if (err) {
  //       console.log(err);
  //   }
  // });
  // Pagination Cursor - doesn't seem to work if I pass it above
  // console.log(data.marketplace_search.feed_units.page_info);

  const items = data.marketplace_search.feed_units.edges.map(
    ({
      node: {
        listing: item
      }
    }) => {
      if (item && item.id) {
        return console.log('###', item.id ,item.marketplace_listing_title.replace(/(?:\r\n|\r|\n)/g, '')) || {
          title: item.marketplace_listing_title,
          link: `https://www.facebook.com/marketplace/item/${item.id}`,
          price: item.formatted_price.text.replace('$', '').replace('Bs.', '').replace('GRATIS', 'Contactar al vendedor'),
          date: item.creation_time ? new Date(item.creation_time * 1000) : new Date().toISOString(),
          image: item.primary_listing_photo ? item.primary_listing_photo.image.uri : 'https://gradientjoy.com/200',
          city: item.location.reverse_geocode.city,
          adId: item.id,
          nah: false,
          from: 'facebook'
        }
      }
    }
    //console.log(item.marketplace_listing_title)
  );

  // save to DB
  console.log('items: ',items.length,' @ ',new Date());
  if (items) {
    items.forEach(item => {
      if (item && item.adId) {
        // see if we already have it
        const existingItem = db.listings.findOne({ adId: item.adId });
        if (existingItem) {
          //console.log(`Item ${item.adId} already in DB`);
          return;
        }
        const geg = db.listings.save(item);
        console.log(`Saved: ${geg._id} ${item.adId}`);
      }
    });
  }
  return items;
}

async function scrapeFacebookListings() {
  const searches = db.searches.find();
  let i=0;
  const scrapeSearches = searches.map(async search => {
    await scrapeFacebook(search.name);
    await delay(5000, ++i, searches.length);
  });
  const allData = await Promise.all(scrapeSearches);
  return 'Facebook Search Finished';
}

module.exports = scrapeFacebookListings;
