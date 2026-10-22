// Angine de Poitrine — 2027 international tour agenda.
// Verified against the band's official Laylo listing on October 22, 2026.
// Festival ranges are retained when no individual performance day is announced.
// Dates and ticket availability may change.
//
// Stops are listed in chronological order. The UFO visits them in this order.

export const TOUR_SOURCE = 'https://laylo.com/anginedepoitrine/m/hewSLX';
const rsvp = (slug) => `${TOUR_SOURCE}/${slug}`;

export const TOUR = [
  // Australia
  { dates: 'Mar 4', city: 'Melbourne', country: 'Australia', venue: 'Forum Melbourne', lat: -37.8136, lon: 144.9631, rsvpUrl: rsvp('383Wip') },
  { dates: 'Mar 6', city: 'Meredith', country: 'Australia', venue: 'Golden Plains', lat: -37.8436, lon: 144.0767, ticketUrl: 'https://aunty.goldenplains.com.au/ticket-info/' },
  { dates: 'Mar 7', city: 'North Adelaide', country: 'Australia', venue: 'WOMADelaide', lat: -34.9083, lon: 138.5919, ticketUrl: 'https://www.womadelaide.com.au/tickets' },
  { dates: 'Mar 9', city: 'Sydney', country: 'Australia', venue: 'Enmore Theatre', lat: -33.8688, lon: 151.2093, rsvpUrl: rsvp('RpSOE7') },

  // South America
  { dates: 'Mar 13', city: 'Buenos Aires', country: 'Argentina', venue: 'Lollapalooza Argentina', lat: -34.6037, lon: -58.3816, ticketUrl: 'https://www.allaccess.com.ar/event/lollapalooza-2027' },
  { dates: 'Mar 14', city: 'Santiago', country: 'Chile', venue: 'Lollapalooza Chile', lat: -33.4489, lon: -70.6693, ticketUrl: 'https://www.ticketmaster.cl/event/lollapalooza-chile-2027' },
  { dates: 'Mar 19', city: 'São Paulo', country: 'Brazil', venue: 'Lollapalooza Brasil', lat: -23.5505, lon: -46.6333, ticketUrl: 'https://www.lollapaloozabr.com/ingressos#lolla-day' },
  { dates: 'Mar 21', city: 'Bogotá', country: 'Colombia', venue: 'Estéreo Picnic', lat: 4.711, lon: -74.0721, ticketUrl: 'https://www.festivalestereopicnic.com/' },

  // Canada (spring)
  { dates: 'Mar 28', city: 'Calgary', country: 'Canada', venue: 'Grey Eagle Event Centre', lat: 51.0447, lon: -114.0719, rsvpUrl: rsvp('jrkYOW') },
  { dates: 'Mar 29', city: 'Calgary', country: 'Canada', venue: 'Grey Eagle Event Centre', lat: 51.0447, lon: -114.0719, rsvpUrl: rsvp('zWIQQj') },
  { dates: 'Mar 31', city: 'Ottawa', country: 'Canada', venue: 'History Ottawa', lat: 45.4215, lon: -75.6972, rsvpUrl: rsvp('nW0x37') },
  { dates: 'Apr 1', city: 'Ottawa', country: 'Canada', venue: 'History Ottawa', lat: 45.4215, lon: -75.6972, rsvpUrl: rsvp('Ne15uD') },
  { dates: 'Apr 6', city: 'Winnipeg', country: 'Canada', venue: 'Burton Cummings Theatre', lat: 49.8951, lon: -97.1384, rsvpUrl: rsvp('Ov4VE7') },
  { dates: 'Apr 7', city: 'Winnipeg', country: 'Canada', venue: 'Burton Cummings Theatre', lat: 49.8951, lon: -97.1384, rsvpUrl: rsvp('SHZjjV') },

  // United States
  { dates: 'May 2', city: 'Washington, DC', country: 'USA', venue: 'The Anthem', lat: 38.9072, lon: -77.0369, rsvpUrl: rsvp('aoN7Wf') },
  { dates: 'May 3', city: 'Boston', country: 'USA', venue: 'MGM Music Hall at Fenway', lat: 42.3601, lon: -71.0589, rsvpUrl: rsvp('OqQCjG') },
  { dates: 'May 5', city: 'Pittsburgh', country: 'USA', venue: 'Stage AE', lat: 40.4406, lon: -79.9959, rsvpUrl: rsvp('xwDw8y') },
  { dates: 'May 6', city: 'Royal Oak (Detroit)', country: 'USA', venue: 'Royal Oak Music Theatre', lat: 42.4895, lon: -83.1446, rsvpUrl: rsvp('7Oj5n8') },
  { dates: 'May 7', city: 'Columbus', country: 'USA', venue: 'KEMBA Live!', lat: 39.9612, lon: -82.9988, rsvpUrl: rsvp('7Wq4V4') },
  { dates: 'May 8', city: 'Nashville', country: 'USA', venue: 'The Truth', lat: 36.1627, lon: -86.7816, rsvpUrl: rsvp('UWOvHN') },
  { dates: 'May 10', city: 'Dallas', country: 'USA', venue: 'The Bomb Factory', lat: 32.7767, lon: -96.797, rsvpUrl: rsvp('wyAmIn') },
  { dates: 'May 11', city: 'Austin', country: 'USA', venue: 'Moody Amphitheater at Waterloo Park', lat: 30.2672, lon: -97.7431, rsvpUrl: rsvp('HX26ip') },
  { dates: 'May 15', city: 'Denver', country: 'USA', venue: 'Mission Ballroom', lat: 39.7392, lon: -104.9903, rsvpUrl: rsvp('BYBXGU') },

  // Europe
  { dates: 'Jun 3–5', city: 'Barcelona', country: 'Spain', venue: 'Primavera Sound', lat: 41.3874, lon: 2.1686, ticketUrl: 'https://www.primaverasound.com/en/tickets?e=primavera-sound-barcelona-2027-03-05-jun-2027' },
  { dates: 'Jun 5', city: 'Paris', country: 'France', venue: 'We Love Green', lat: 48.8566, lon: 2.3522, ticketUrl: 'https://www.welovegreen.fr/billetterie/' },
  { dates: 'Jun 12', city: 'Neuchâtel', country: 'Switzerland', venue: "Festi'neuch", lat: 46.9896, lon: 6.9293, ticketUrl: 'https://festineuch.ch/' },
  { dates: 'Jun 14', city: 'Milan', country: 'Italy', venue: 'Magnolia Estivo', lat: 45.4642, lon: 9.19, rsvpUrl: rsvp('MYfb8L') },
  { dates: 'Jun 18–20', city: 'Scheeßel', country: 'Germany', venue: 'Hurricane Festival', lat: 53.1694, lon: 9.4836, ticketUrl: 'https://hurricane.de/' },
  { dates: 'Jun 18–20', city: 'Neuhausen ob Eck', country: 'Germany', venue: 'Southside Festival', lat: 47.9744, lon: 8.9203, ticketUrl: 'https://www.ticket-onlineshop.com/ols/southside/' },

  // United Kingdom
  { dates: 'Jun 24', city: 'Halifax', country: 'UK', venue: 'The Piece Hall', lat: 53.7248, lon: -1.8575, rsvpUrl: rsvp('Klpzj9') },
  { dates: 'Jun 28', city: 'London', country: 'UK', venue: 'O2 Academy Brixton', lat: 51.4613, lon: -0.1156, rsvpUrl: rsvp('IbClFc') },
  { dates: 'Jun 29', city: 'London', country: 'UK', venue: 'O2 Academy Brixton', lat: 51.4613, lon: -0.1156, rsvpUrl: rsvp('7Ap6N6') },

  // Canada (summer)
  { dates: 'Jul 18', city: 'Toronto', country: 'Canada', venue: 'RBC Amphitheatre', lat: 43.6532, lon: -79.3832, rsvpUrl: rsvp('IVnI81') },
  { dates: 'Jul 30', city: 'Saguenay', country: 'Canada', venue: 'Zone Portuaire', lat: 48.4284, lon: -71.0685, ticketUrl: 'https://lepointdevente.com/billets/ap270730/laylofan' },
];
