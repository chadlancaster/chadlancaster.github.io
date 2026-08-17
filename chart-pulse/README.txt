CHART PULSE IMAGES
==================

WEEKLY COVER (the card artwork on The Wire)
  Save the square Instagram cover here, named to match the edition slug:
    chart-pulse/sa-2026-06-05.jpg      <- this week's SA cover
    chart-pulse/ng-2026-06-05.jpg      <- Nigeria, when it starts

  Then set it on the edition in src/_data/chartPulse.json:
    "cover": "/chart-pulse/sa-2026-06-05.jpg"

ARTIST PROFILE IMAGES (the round avatars in the Top 10)
  Square crops work best (they get masked to a circle):
    chart-pulse/artists/drake.jpg
    chart-pulse/artists/feza.jpg

  Then set it on that entry in src/_data/chartPulse.json:
    "image": "/chart-pulse/artists/drake.jpg"

Until a file exists, the card falls back to a CSS cover and the rows fall
back to grey placeholder circles with the artist's initials.
