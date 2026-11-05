/* RJ's Tree Care: the site's look follows the calendar.
   Loaded in <head> on every page, before the stylesheet, so <html data-season="...">
   is set before anything paints:
     Sep-Nov   fall     (css/fall.css: autumn colors, falling leaves)
     Dec       holiday  (css/seasons.css: red, green and gold, light snow)
     Jan-Feb   winter   (css/seasons.css: icy blue, light snow)
     Mar-May   spring   (css/seasons.css: fresh green and blossom)
     Jun-Aug   summer   (the plain green site, no extra styles)
   Preview any season with ?season=holiday (or fall, winter, spring, summer). */
(function () {
  var pick = /[?&]season=(fall|holiday|winter|spring|summer)\b/.exec(window.location.search);
  var m = new Date().getMonth() + 1;
  var season = pick ? pick[1]
    : m >= 9 && m <= 11 ? 'fall'
    : m === 12 ? 'holiday'
    : m <= 2 ? 'winter'
    : m <= 5 ? 'spring'
    : 'summer';
  document.documentElement.setAttribute('data-season', season);
})();
